export type ReceiptLine = { name: string; quantity: number; unitPrice: number; discountPercent?: number };

export type ReceiptDocument = {
  businessName: string;
  documentNo: string;
  createdAt: string;
  currency: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  footer?: string;
};

export function receiptFromCart(input: { businessName?: string; documentNo: string; currency?: string; lines: ReceiptLine[]; tax: number; discount: number }): ReceiptDocument {
  const subtotal = input.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return { businessName: input.businessName ?? "SaderatPro", documentNo: input.documentNo, createdAt: new Date().toISOString(), currency: input.currency ?? "AFN", lines: input.lines, subtotal, discount: input.discount, tax: input.tax, total: Math.max(0, subtotal - input.discount + input.tax), footer: "تشکر از خرید شما" };
}

function line(text: string, width: number) { return text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text.padEnd(width, " "); }
function money(value: number, currency: string) { return `${Math.round(value).toLocaleString("en-US")} ${currency}`; }

/** ESC/POS payload. Most BLE thermal printers accept UTF-8 for Latin text; Persian glyph shaping/font rasterization is device-specific. */
export function encodeEscPos(receipt: ReceiptDocument, width = 32): Uint8Array {
  const rows = ["\x1b@", "\x1ba\x01", receipt.businessName, "\x1ba\x00", `#${receipt.documentNo}`, new Date(receipt.createdAt).toLocaleString("en-GB"), "-".repeat(width)];
  for (const item of receipt.lines) rows.push(line(`${item.name} x${item.quantity}`, width - 12) + money(item.unitPrice * item.quantity * (1 - (item.discountPercent ?? 0) / 100), receipt.currency).padStart(12, " "));
  rows.push("-".repeat(width), line("Subtotal", width - 12) + money(receipt.subtotal, receipt.currency).padStart(12, " "), line("Discount", width - 12) + money(receipt.discount, receipt.currency).padStart(12, " "), line("Tax", width - 12) + money(receipt.tax, receipt.currency).padStart(12, " "), line("TOTAL", width - 12) + money(receipt.total, receipt.currency).padStart(12, " "), "", receipt.footer ?? "", "\n\n\n", "\x1dV\x00");
  const text = rows.join("\n");
  const bytes = new TextEncoder().encode(text);
  return new Uint8Array([0x1b, 0x40, ...bytes]);
}
