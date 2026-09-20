"use client";

import { useEffect, useState } from "react";
import { Bluetooth, Cable, Globe, Printer, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Select, Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import {
  detectCapabilities,
  getBluetoothTransport,
  getUsbTransport,
  loadPrinterConfig,
  savePrinterConfig,
  testPrint,
  type PrinterConfig,
  type TransportAvailability,
} from "@/lib/printing/printer";

const METHODS: Array<{
  value: PrinterConfig["method"];
  label: string;
  description: string;
  icon: typeof Cable;
}> = [
  {
    value: "direct",
    label: "Direct Print",
    description: "USB cable or WiFi/LAN printer connected to this device",
    icon: Cable,
  },
  {
    value: "bluetooth",
    label: "Bluetooth Printer",
    description: "Portable thermal printer paired over Bluetooth",
    icon: Bluetooth,
  },
  {
    value: "browser",
    label: "System Print Dialog",
    description: "Choose a printer each time — works with any installed printer",
    icon: Globe,
  },
];

export function PrinterSettings() {
  const { push } = useToast();
  const [config, setConfig] = useState<PrinterConfig>(loadPrinterConfig);
  const [caps, setCaps] = useState<TransportAvailability | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [pairing, setPairing] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setCaps(detectCapabilities());
  }, []);

  function update(patch: Partial<PrinterConfig>) {
    const next = { ...config, ...patch };
    setConfig(next);
    savePrinterConfig(next);
  }

  async function pair() {
    setPairing(true);
    try {
      const name =
        config.method === "bluetooth"
          ? await getBluetoothTransport().connect()
          : await getUsbTransport().connect();
      setDeviceName(name);
      update({ deviceName: name });
      push(`Connected to ${name}`);
    } catch (err) {
      push(err instanceof Error ? err.message : "Pairing failed", "error");
    } finally {
      setPairing(false);
    }
  }

  async function runTest() {
    setTesting(true);
    const result = await testPrint(config);
    setTesting(false);
    if (result.ok) {
      push(`Test sent via ${result.via}`);
    } else {
      push(result.error ?? "Test print failed", "error");
    }
  }

  const methodSupported =
    config.method === "browser" ||
    (config.method === "direct" && (caps?.webusb || config.bridgeUrl.length > 0)) ||
    (config.method === "bluetooth" && (caps?.webbluetooth || caps?.rawbt));

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card className="flex flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold text-text-primary">Print method</h3>
        <p className="text-xs text-text-tertiary">
          Choose how receipts print. The right driver is picked automatically for your device.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {METHODS.map((m) => {
            const Icon = m.icon;
            const active = config.method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => update({ method: m.value })}
                className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                  active ? "border-primary-500 bg-primary-50" : "border-border hover:border-primary-300"
                }`}
              >
                <Icon className={`mt-0.5 size-5 shrink-0 ${active ? "text-primary-600" : "text-text-tertiary"}`} />
                <span>
                  <span className={`block text-sm font-medium ${active ? "text-primary-700" : "text-text-primary"}`}>
                    {m.label}
                  </span>
                  <span className="block text-xs text-text-tertiary">{m.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {config.method !== "browser" && (
        <Card className="flex flex-col gap-3 p-4">
          <h3 className="text-sm font-semibold text-text-primary">Printer</h3>

          {caps && (
            <div className="flex items-center gap-2 text-xs">
              {methodSupported ? (
                <>
                  <CheckCircle2 className="size-4 text-success-600" />
                  <span className="text-text-secondary">
                    {config.method === "direct"
                      ? caps.webusb
                        ? "USB printing available on this device"
                        : "Will print via your network bridge"
                      : caps.rawbt
                        ? "Will print through the rawBT app on this Android device"
                        : "Bluetooth printing available on this device"}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-warning-600" />
                  <span className="text-text-secondary">
                    {config.method === "direct"
                      ? "USB printing needs Chrome or Edge — or set a bridge URL below"
                      : caps.isIOS
                        ? "iOS doesn't support web Bluetooth — use System Print Dialog instead"
                        : "Bluetooth printing needs Chrome or Edge, or the rawBT app on Android"}
                  </span>
                </>
              )}
            </div>
          )}

          {config.method === "bluetooth" && !caps?.rawbt && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={pair} loading={pairing}>
                <Bluetooth className="size-4" />
                {deviceName || config.deviceName ? `Paired: ${deviceName ?? config.deviceName}` : "Pair printer"}
              </Button>
            </div>
          )}

          {config.method === "direct" && caps?.webusb && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={pair} loading={pairing}>
                <Cable className="size-4" />
                {deviceName || config.deviceName ? `Connected: ${deviceName ?? config.deviceName}` : "Connect USB printer"}
              </Button>
            </div>
          )}

          {config.method === "direct" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Network bridge URL <span className="text-text-tertiary">(optional — for WiFi/LAN printers)</span>
              </label>
              <Input
                value={config.bridgeUrl}
                onChange={(e) => update({ bridgeUrl: e.target.value })}
                placeholder="http://localhost:9100/print"
              />
              <p className="mt-1 text-xs text-text-tertiary">
                Point this at a print agent on your network that forwards jobs to the printer.
              </p>
            </div>
          )}

          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Paper width</label>
            <Select
              value={String(config.paperWidth)}
              onChange={(e) => update({ paperWidth: Number(e.target.value) as 58 | 80 })}
            >
              <option value="80">80mm (standard)</option>
              <option value="58">58mm (portable)</option>
            </Select>
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        <Button type="button" onClick={runTest} loading={testing}>
          <Printer className="size-4" />
          Test print
        </Button>
      </div>
    </div>
  );
}
