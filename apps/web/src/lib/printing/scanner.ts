"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// HID keyboard-wedge scanning — USB and Bluetooth barcode scanners present
// themselves as keyboards: they "type" the code very fast then send Enter.
// This hook buffers keystrokes and fires onScan when a burst ends in Enter.
// Works with every HID scanner on every platform — no drivers needed.
// ---------------------------------------------------------------------------

export interface ScannerOptions {
  /** Max ms between keystrokes to count as one scan burst. Default 50. */
  interKeyMs?: number;
  /** Minimum code length to accept. Default 3. */
  minLength?: number;
  /** Ignore scans while the user is typing in an input/textarea. Default true. */
  ignoreInInputs?: boolean;
}

export function useBarcodeScanner(onScan: (code: string) => void, options?: ScannerOptions) {
  const buffer = useRef("");
  const lastKeyAt = useRef(0);
  const callback = useRef(onScan);
  callback.current = onScan;

  useEffect(() => {
    const interKeyMs = options?.interKeyMs ?? 50;
    const minLength = options?.minLength ?? 3;
    const ignoreInInputs = options?.ignoreInInputs ?? true;

    function onKeyDown(e: KeyboardEvent) {
      if (ignoreInInputs) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
      }

      const now = Date.now();
      // A pause longer than interKeyMs means a human started typing — reset.
      if (now - lastKeyAt.current > interKeyMs) buffer.current = "";
      lastKeyAt.current = now;

      if (e.key === "Enter") {
        const code = buffer.current;
        buffer.current = "";
        if (code.length >= minLength) {
          e.preventDefault();
          callback.current(code);
        }
        return;
      }

      if (e.key.length === 1) {
        buffer.current += e.key;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.interKeyMs, options?.minLength, options?.ignoreInInputs]);
}

// ---------------------------------------------------------------------------
// Camera scanning — the native BarcodeDetector API (Chrome/Edge on desktop
// and Android, Safari 17+). No dependencies. Where unsupported, callers get
// a clear error and can fall back to an HID scanner or manual entry.
// ---------------------------------------------------------------------------

interface DetectedBarcode {
  rawValue: string;
  format: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}

export function isCameraScanSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "BarcodeDetector" in window &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

const SCAN_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "qr_code",
  "data_matrix",
  "itf",
];

/**
 * Scan barcodes from the device camera. Returns a stop() cleanup.
 * Calls onCode for each newly detected code (deduped per session).
 */
export async function startCameraScan(
  video: HTMLVideoElement,
  onCode: (code: string, format: string) => void,
  onError?: (message: string) => void
): Promise<() => void> {
  const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) throw new Error("Camera scanning isn't supported in this browser. Use a USB/Bluetooth scanner or Chrome/Edge.");

  const detector = new Ctor({ formats: SCAN_FORMATS });
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();

  let stopped = false;
  const seen = new Set<string>();

  async function tick() {
    if (stopped) return;
    try {
      const codes = await detector.detect(video);
      for (const c of codes) {
        if (c.rawValue && !seen.has(c.rawValue)) {
          seen.add(c.rawValue);
          onCode(c.rawValue, c.format);
        }
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Scan failed");
    }
    if (!stopped) requestAnimationFrame(() => void tick());
  }
  void tick();

  return () => {
    stopped = true;
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  };
}
