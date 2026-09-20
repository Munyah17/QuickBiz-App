// Printer transports — each takes raw ESC/POS bytes (or HTML for browser
// print) and delivers them to a printer. The PrinterService picks the right
// one based on the user's saved choice of "Direct Print" vs "Bluetooth
// Printer" plus what the current device/browser actually supports.

export interface PrintTransport {
  readonly id: string;
  /** Human-facing label for status/errors. */
  readonly label: string;
  /** Whether this transport can work on the current device/browser. */
  isSupported(): boolean;
  /** Send raw bytes to the printer. Throws with a user-readable message. */
  print(data: Uint8Array): Promise<void>;
}

// ---------------------------------------------------------------------------
// WebUSB — direct USB cable printing from Chrome/Edge on Windows, Mac,
// Android. Covers most USB thermal printers (XPrinter, Epson-compatibles).
// ---------------------------------------------------------------------------

interface USBDeviceLike {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName?: string;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(v: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  releaseInterface(n: number): Promise<void>;
  transferOut(endpoint: number, data: BufferSource): Promise<unknown>;
  configuration: {
    interfaces: Array<{
      alternate: { endpoints: Array<{ direction: string; endpointNumber: number }> };
      interfaceNumber: number;
    }>;
  } | null;
}

interface USBLike {
  requestDevice(opts: { filters: unknown[] }): Promise<USBDeviceLike>;
  getDevices(): Promise<USBDeviceLike[]>;
}

function getUsb(): USBLike | null {
  const nav = navigator as Navigator & { usb?: USBLike };
  return nav.usb ?? null;
}

export class WebUsbTransport implements PrintTransport {
  readonly id = "webusb";
  readonly label = "USB printer";
  private device: USBDeviceLike | null = null;

  isSupported() {
    return typeof navigator !== "undefined" && getUsb() !== null;
  }

  /** Prompt the user to pick a USB printer and remember it. */
  async connect(): Promise<string> {
    const usb = getUsb();
    if (!usb) throw new Error("USB printing is not supported in this browser. Use Chrome or Edge.");
    // Class 7 = printer; empty filters also works but listing the class keeps
    // the picker focused on printers.
    this.device = await usb.requestDevice({ filters: [{ classCode: 7 }] });
    return this.device.productName ?? `USB device ${this.device.vendorId}:${this.device.productId}`;
  }

  private async ensureDevice(): Promise<USBDeviceLike> {
    const usb = getUsb();
    if (!usb) throw new Error("USB printing is not supported in this browser.");
    if (this.device) return this.device;
    const known = await usb.getDevices();
    if (known.length === 0) {
      await this.connect();
      return this.device!;
    }
    this.device = known[0]!;
    return this.device;
  }

  async print(data: Uint8Array): Promise<void> {
    const device = await this.ensureDevice();
    try {
      if (!device.opened) {
        await device.open();
        await device.selectConfiguration(1);
      }
      const iface = device.configuration?.interfaces[0];
      if (!iface) throw new Error("Printer has no usable USB interface.");
      const endpoint = iface.alternate.endpoints.find((e) => e.direction === "out");
      if (!endpoint) throw new Error("Printer has no output endpoint.");
      await device.claimInterface(iface.interfaceNumber);
      // Chunk large jobs — some printers stall on big single transfers.
      const CHUNK = 16 * 1024;
      for (let offset = 0; offset < data.length; offset += CHUNK) {
        // slice() copies into a fresh ArrayBuffer — subarray's ArrayBufferLike
        // backing isn't assignable to BufferSource under TS 5.7+ typings.
        await device.transferOut(endpoint.endpointNumber, data.slice(offset, offset + CHUNK));
      }
      await device.releaseInterface(iface.interfaceNumber);
    } catch (err) {
      try {
        await device.close();
      } catch {
        /* device may already be closed */
      }
      this.device = null;
      throw err instanceof Error ? err : new Error("USB print failed.");
    }
  }
}

// ---------------------------------------------------------------------------
// Web Bluetooth — BLE thermal printers (XPrinter XP-P810, Munbyn, most
// portable units) expose a serial-write characteristic. Chrome/Edge on
// Windows, Mac, Android. NOT supported on iOS Safari.
// ---------------------------------------------------------------------------

// Common ESC/POS BLE service/characteristic UUIDs across vendors.
const BLE_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // common thermal printer service
  "0000ff00-0000-1000-8000-00805f9b34fb", // XPrinter / generic serial
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 style serial modules
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // some POS units
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC transparent transmission
] as const;

const BLE_WRITE_CHARS = [
  "00002af1-0000-1000-8000-00805f9b34fb", // 18F0 service write char
  "0000ff02-0000-1000-8000-00805f9b34fb", // FF00 write
  "0000ffe1-0000-1000-8000-00805f9b34fb", // FFE0 notify/write
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f", // E7810A71 write
  "49535343-8841-43f4-a8d4-ecbe34729bb3", // ISSC write
] as const;

interface BleCharacteristic {
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
  properties: { write: boolean; writeWithoutResponse: boolean };
}

interface BleService {
  getCharacteristics(): Promise<BleCharacteristic[]>;
  getCharacteristic(uuid: string): Promise<BleCharacteristic>;
}

interface BleDevice {
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<{
      getPrimaryServices(): Promise<BleService[]>;
      getPrimaryService(uuid: string): Promise<BleService>;
    }>;
    disconnect(): void;
  };
}

interface BluetoothLike {
  requestDevice(opts: {
    filters?: Array<{ services?: string[]; namePrefix?: string }>;
    optionalServices?: string[];
    acceptAllDevices?: boolean;
  }): Promise<BleDevice>;
}

function getBluetooth(): BluetoothLike | null {
  const nav = navigator as Navigator & { bluetooth?: BluetoothLike };
  return nav.bluetooth ?? null;
}

export class WebBluetoothTransport implements PrintTransport {
  readonly id = "webbluetooth";
  readonly label = "Bluetooth printer";
  private device: BleDevice | null = null;
  private characteristic: BleCharacteristic | null = null;

  isSupported() {
    return typeof navigator !== "undefined" && getBluetooth() !== null;
  }

  /** Pair with a BLE printer and resolve its write characteristic. */
  async connect(): Promise<string> {
    const bt = getBluetooth();
    if (!bt) throw new Error("Bluetooth printing needs Chrome or Edge on Windows, Mac, or Android.");
    this.device = await bt.requestDevice({
      acceptAllDevices: true,
      optionalServices: [...BLE_SERVICES],
    });
    await this.resolveCharacteristic();
    return this.device.name ?? "Bluetooth printer";
  }

  private async resolveCharacteristic(): Promise<void> {
    if (!this.device?.gatt) throw new Error("No Bluetooth device selected.");
    const server = await this.device.gatt.connect();

    // Try known service/characteristic pairs first.
    for (const serviceUuid of BLE_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        for (const charUuid of BLE_WRITE_CHARS) {
          try {
            const ch = await service.getCharacteristic(charUuid);
            if (ch.properties.write || ch.properties.writeWithoutResponse) {
              this.characteristic = ch;
              return;
            }
          } catch {
            /* characteristic not on this service */
          }
        }
        // Fall back to any writable characteristic on the service.
        const chars = await service.getCharacteristics();
        const writable = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
        if (writable) {
          this.characteristic = writable;
          return;
        }
      } catch {
        /* service not present */
      }
    }
    throw new Error("This Bluetooth device doesn't expose a printer service. Is it a thermal printer?");
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      if (!this.device) throw new Error("No Bluetooth printer paired. Open printer settings first.");
      await this.resolveCharacteristic();
    }
    const ch = this.characteristic!;
    // BLE MTU is small — write in 180-byte chunks with a brief pause so the
    // printer's buffer doesn't overflow.
    const CHUNK = 180;
    for (let offset = 0; offset < data.length; offset += CHUNK) {
      const chunk = data.slice(offset, offset + CHUNK);
      if (ch.properties.writeWithoutResponse && ch.writeValueWithoutResponse) {
        await ch.writeValueWithoutResponse(chunk);
      } else {
        await ch.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 20));
    }
  }
}

// ---------------------------------------------------------------------------
// rawBT — Android app that receives ESC/POS via intent URL and prints to any
// paired Bluetooth/USB printer. The standard path for Android POS handhelds
// and phones where Web Bluetooth isn't available or the printer is classic
// Bluetooth (not BLE).
// ---------------------------------------------------------------------------

export class RawBtTransport implements PrintTransport {
  readonly id = "rawbt";
  readonly label = "Bluetooth printer (rawBT)";

  isSupported() {
    if (typeof navigator === "undefined") return false;
    return /android/i.test(navigator.userAgent);
  }

  async print(data: Uint8Array): Promise<void> {
    // rawBT accepts base64 ESC/POS via a custom scheme URL.
    let binary = "";
    for (const b of data) binary += String.fromCharCode(b);
    const b64 = btoa(binary);
    window.location.href = `rawbt:base64,${b64}`;
    // No completion signal — the OS hands off to the rawBT app.
    await new Promise((r) => setTimeout(r, 300));
  }
}

// ---------------------------------------------------------------------------
// Network bridge — for WiFi/Ethernet printers (port 9100) and shared USB
// printers on Windows/Mac. Browsers can't open raw TCP sockets, so this
// POSTs the job to a small local print agent (e.g. QZ Tray, or a simple
// HTTP bridge) running on the machine or LAN.
// ---------------------------------------------------------------------------

export class NetworkBridgeTransport implements PrintTransport {
  readonly id = "network";
  readonly label = "Network printer";

  constructor(private bridgeUrl: string) {}

  isSupported() {
    return this.bridgeUrl.length > 0;
  }

  async print(data: Uint8Array): Promise<void> {
    const res = await fetch(this.bridgeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: data.slice().buffer,
    });
    if (!res.ok) {
      throw new Error(`Print bridge returned ${res.status}. Is the print agent running?`);
    }
  }
}

// ---------------------------------------------------------------------------
// Browser print — the universal fallback. Renders receipt HTML into a hidden
// iframe and calls print(), which on every platform (Windows, Mac, iOS,
// Android) opens the native print dialog with all system printers.
// ---------------------------------------------------------------------------

export class BrowserPrintTransport {
  readonly id = "browser";
  readonly label = "System print dialog";

  isSupported() {
    return typeof window !== "undefined";
  }

  printHtml(html: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      document.body.appendChild(frame);

      const doc = frame.contentDocument;
      if (!doc) {
        frame.remove();
        reject(new Error("Could not create print frame."));
        return;
      }
      doc.open();
      doc.write(html);
      doc.close();

      const cleanup = () => {
        setTimeout(() => frame.remove(), 1000);
        resolve();
      };

      // afterprint fires on desktop; iOS/Android may not fire it, so also
      // resolve on a timeout after calling print().
      frame.contentWindow?.addEventListener("afterprint", cleanup);
      setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          frame.remove();
          reject(new Error("Browser blocked printing."));
          return;
        }
        setTimeout(cleanup, 60_000);
      }, 50);
    });
  }
}
