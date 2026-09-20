// Minimal ESC/POS command encoder — covers the command set used by virtually
// all thermal receipt printers (Epson TM series, XPrinter, Star, Munbyn,
// generic 58mm/80mm units, and the printers rawBT drives on Android).

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type EscPosAlign = "left" | "center" | "right";

export class EscPosEncoder {
  private bytes: number[] = [];

  private push(...vals: number[]) {
    this.bytes.push(...vals);
    return this;
  }

  /** ESC @ — reset to power-on state. Always start a job with this. */
  init() {
    return this.push(ESC, 0x40);
  }

  /** ESC a n — 0 left, 1 center, 2 right. */
  align(mode: EscPosAlign) {
    const n = mode === "center" ? 1 : mode === "right" ? 2 : 0;
    return this.push(ESC, 0x61, n);
  }

  /** ESC E n — emphasized (bold) on/off. */
  bold(on: boolean) {
    return this.push(ESC, 0x45, on ? 1 : 0);
  }

  /** ESC - n — underline on/off. */
  underline(on: boolean) {
    return this.push(ESC, 0x2d, on ? 1 : 0);
  }

  /** GS ! n — character size. width/height multipliers 1-8. */
  size(width: number, height: number) {
    const w = Math.min(8, Math.max(1, width)) - 1;
    const h = Math.min(8, Math.max(1, height)) - 1;
    return this.push(GS, 0x21, (w << 4) | h);
  }

  /** Double-strike for extra darkness on cheap printers. */
  doubleStrike(on: boolean) {
    return this.push(ESC, 0x47, on ? 1 : 0);
  }

  /** Raw text — ASCII-encoded. Non-ASCII chars are stripped to '?'. */
  text(value: string) {
    for (const ch of value) {
      const code = ch.charCodeAt(0);
      this.bytes.push(code >= 32 && code < 127 ? code : 0x3f);
    }
    return this;
  }

  /** Text followed by a line feed. */
  line(value = "") {
    return this.text(value).push(LF);
  }

  /** n line feeds. */
  feed(lines = 1) {
    for (let i = 0; i < lines; i++) this.bytes.push(LF);
    return this;
  }

  /** A row of a repeated character (e.g. "-" or "="). */
  rule(char = "-", width = 48) {
    return this.line(char.repeat(width));
  }

  /**
   * Two-column line: left text left-aligned, right text right-aligned,
   * padded to `width` columns. Long left values are truncated.
   */
  columns(left: string, right: string, width = 48) {
    const space = width - right.length;
    const trimmed = left.length > space - 1 ? left.slice(0, space - 1) : left;
    return this.line(trimmed + " ".repeat(Math.max(1, space - trimmed.length)) + right);
  }

  /**
   * GS k — 1D barcode. type 73 = CODE128, 4 = CODE39, 67 = EAN13.
   * data must be ASCII digits/letters per the symbology.
   */
  barcode(data: string, type: 4 | 67 | 73 = 73, height = 60) {
    this.push(GS, 0x68, height); // height
    this.push(GS, 0x77, 2); // module width
    this.push(GS, 0x48, 2); // HRI below
    if (type === 73) {
      // CODE128 needs function form: GS k m n data
      this.push(GS, 0x6b, 73, data.length + 2, 0x7b, 0x42); // {B = code set B
      this.text(data);
    } else {
      this.push(GS, 0x6b, type, data.length);
      this.text(data);
    }
    return this.push(LF);
  }

  /**
   * GS ( k — QR code. Model 2, auto EC level L, module size 4.
   */
  qrCode(data: string, moduleSize = 4) {
    const len = data.length + 3;
    const pL = len & 0xff;
    const pH = (len >> 8) & 0xff;
    // Model
    this.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);
    // Module size
    this.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize);
    // Error correction level L (48)
    this.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 48);
    // Store data
    this.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    this.text(data);
    // Print
    this.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    return this.push(LF);
  }

  /** ESC p — kick cash drawer on pin 2 (RJ-11). */
  openDrawer(pin: 2 | 5 = 2) {
    return this.push(ESC, 0x70, pin === 2 ? 0 : 1, 0x19, 0xfa);
  }

  /** GS V — feed then cut. mode 66 = partial cut with feed. */
  cut(partial = true) {
    return this.feed(3).push(GS, 0x56, partial ? 66 : 65, 0);
  }

  encode(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}
