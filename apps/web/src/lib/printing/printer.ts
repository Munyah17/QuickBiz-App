"use client";

import {
  BrowserPrintTransport,
  NetworkBridgeTransport,
  RawBtTransport,
  WebBluetoothTransport,
  WebUsbTransport,
  type PrintTransport,
} from "./transports";
import { buildReceiptEscPos, buildReceiptHtml, type PaperWidth, type ReceiptData } from "./receipt";

// The two choices the user sees. Everything else (which transport, which
// protocol) is decided automatically from the device and browser.
export type PrintMethod = "direct" | "bluetooth" | "browser";

export interface PrinterConfig {
  method: PrintMethod;
  paperWidth: PaperWidth;
  /** Local print-agent URL for WiFi/LAN printers (Direct Print on desktop). */
  bridgeUrl: string;
  /** Name of the last paired device, for display in settings. */
  deviceName?: string;
}

const STORAGE_KEY = "quickbiz.printer";

const DEFAULT_CONFIG: PrinterConfig = {
  method: "browser",
  paperWidth: 80,
  bridgeUrl: "",
};

export function loadPrinterConfig(): PrinterConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<PrinterConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function savePrinterConfig(config: PrinterConfig): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export interface TransportAvailability {
  webusb: boolean;
  webbluetooth: boolean;
  rawbt: boolean;
  isAndroid: boolean;
  isIOS: boolean;
}

export function detectCapabilities(): TransportAvailability {
  if (typeof navigator === "undefined") {
    return { webusb: false, webbluetooth: false, rawbt: false, isAndroid: false, isIOS: false };
  }
  const ua = navigator.userAgent;
  return {
    webusb: new WebUsbTransport().isSupported(),
    webbluetooth: new WebBluetoothTransport().isSupported(),
    rawbt: new RawBtTransport().isSupported(),
    isAndroid: /android/i.test(ua),
    isIOS: /iphone|ipad|ipod/i.test(ua),
  };
}

// Singleton transports keep their paired device across prints — re-pairing a
// Bluetooth printer for every receipt would be unusable.
let usbTransport: WebUsbTransport | null = null;
let bleTransport: WebBluetoothTransport | null = null;

export function getUsbTransport(): WebUsbTransport {
  if (!usbTransport) usbTransport = new WebUsbTransport();
  return usbTransport;
}

export function getBluetoothTransport(): WebBluetoothTransport {
  if (!bleTransport) bleTransport = new WebBluetoothTransport();
  return bleTransport;
}

/**
 * Resolve which transport handles a print for the given config.
 * - "direct": WebUSB if available, else the network bridge if configured,
 *   else browser print as the safe fallback.
 * - "bluetooth": rawBT on Android (classic BT printers), Web Bluetooth
 *   elsewhere (BLE printers), browser print if neither exists.
 * - "browser": always the system print dialog.
 */
function resolveTransport(config: PrinterConfig): PrintTransport | null {
  if (config.method === "direct") {
    const usb = getUsbTransport();
    if (usb.isSupported()) return usb;
    if (config.bridgeUrl) return new NetworkBridgeTransport(config.bridgeUrl);
    return null;
  }
  if (config.method === "bluetooth") {
    const rawbt = new RawBtTransport();
    if (rawbt.isSupported()) return rawbt;
    const ble = getBluetoothTransport();
    if (ble.isSupported()) return ble;
    return null;
  }
  return null;
}

export interface PrintResult {
  ok: boolean;
  /** Which path actually printed — shown in toasts. */
  via: string;
  error?: string;
}

/** Print a receipt using the saved configuration. */
export async function printReceipt(data: ReceiptData, config?: PrinterConfig): Promise<PrintResult> {
  const cfg = config ?? loadPrinterConfig();

  if (cfg.method === "browser") {
    try {
      await new BrowserPrintTransport().printHtml(buildReceiptHtml(data, cfg.paperWidth));
      return { ok: true, via: "System print dialog" };
    } catch (err) {
      return { ok: false, via: "browser", error: err instanceof Error ? err.message : "Print failed" };
    }
  }

  const transport = resolveTransport(cfg);
  if (!transport) {
    // No hardware path — fall back to the system dialog rather than failing.
    try {
      await new BrowserPrintTransport().printHtml(buildReceiptHtml(data, cfg.paperWidth));
      return { ok: true, via: "System print dialog (no printer configured)" };
    } catch (err) {
      return { ok: false, via: "browser", error: err instanceof Error ? err.message : "Print failed" };
    }
  }

  try {
    await transport.print(buildReceiptEscPos(data, cfg.paperWidth));
    return { ok: true, via: transport.label };
  } catch (err) {
    return {
      ok: false,
      via: transport.label,
      error: err instanceof Error ? err.message : "Print failed",
    };
  }
}

/** Build a small test receipt and print it — used by printer settings. */
export async function testPrint(config: PrinterConfig): Promise<PrintResult> {
  return printReceipt(
    {
      orgName: "QuickBiz ERP",
      title: "Test Print",
      receiptNumber: "TEST-001",
      date: new Date().toLocaleString(),
      lines: [
        { description: "Printer test line", quantity: 1, lineTotal: 0 },
        { description: "If you can read this, printing works", quantity: 1, lineTotal: 0 },
      ],
      subtotal: 0,
      total: 0,
      payments: [],
      footer: "Test complete",
    },
    config
  );
}
