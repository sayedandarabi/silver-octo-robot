import { createHash, createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";
import { money, type Money } from "./saderatpro-engine";

export type RecipeMaterial = { productId: string; quantity: bigint; unit: string; unitCost: Money };
export type ProductionCost = { materialProductId: string; quantity: bigint; unitCost: Money; totalCost: Money };

export function scaleRecipe(lines: RecipeMaterial[], outputQuantity: bigint, recipeOutputQuantity: bigint): RecipeMaterial[] {
  if (outputQuantity <= 0n || recipeOutputQuantity <= 0n) throw new Error("production_quantity_required");
  return lines.map((line) => ({ ...line, quantity: (line.quantity * outputQuantity + recipeOutputQuantity - 1n) / recipeOutputQuantity }));
}

export function calculateProductionCost(lines: RecipeMaterial[], outputQuantity: bigint, recipeOutputQuantity = 1n, currency = "AFN"): { materials: ProductionCost[]; totalCost: Money; unitCost: Money } {
  const scaled = scaleRecipe(lines, outputQuantity, recipeOutputQuantity);
  const materials = scaled.map((line) => ({ materialProductId: line.productId, quantity: line.quantity, unitCost: line.unitCost, totalCost: money(line.quantity * line.unitCost.amount, line.unitCost.currency) }));
  const total = materials.reduce((sum, line) => sum + line.totalCost.amount, 0n);
  return { materials, totalCost: money(total, currency), unitCost: money(outputQuantity > 0n ? total / outputQuantity : 0n, currency) };
}

export function productionJournal(totalCost: Money) {
  return [
    { accountCode: "1500", debit: totalCost.amount, credit: 0n, currency: totalCost.currency },
    { accountCode: "1400", debit: 0n, credit: totalCost.amount, currency: totalCost.currency },
  ];
}

export type ReportTable = { title: string; columns: string[]; rows: Array<Array<string | number>> };
export function reportXlsx(table: ReportTable): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([table.columns, ...table.rows]);
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function reportPdf(table: ReportTable): Promise<Uint8Array> {
  const doc = await PDFDocument.create(); const page = doc.addPage([842, 595]); const font = await doc.embedFont(StandardFonts.Helvetica); const { width, height } = page.getSize();
  page.drawText(table.title, { x: 40, y: height - 48, size: 18, font, color: rgb(0.06, 0.22, 0.18) });
  const colWidth = Math.max(90, (width - 80) / Math.max(1, table.columns.length)); let y = height - 86;
  table.columns.forEach((column, index) => page.drawText(column.slice(0, 24), { x: 40 + index * colWidth, y, size: 9, font })); y -= 20;
  for (const row of table.rows.slice(0, 28)) { row.forEach((cell, index) => page.drawText(String(cell).slice(0, 24), { x: 40 + index * colWidth, y, size: 8, font })); y -= 16; if (y < 35) break; }
  return doc.save();
}

export function encryptBackup(payload: unknown, password: string) {
  if (password.length < 8) throw new Error("backup_password_too_short");
  const salt = randomBytes(16); const iv = randomBytes(12); const key = pbkdf2Sync(password, salt, 120_000, 32, "sha256"); const cipher = createCipheriv("aes-256-gcm", key, iv); const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]); const tag = cipher.getAuthTag();
  const envelope = { algorithm: "AES-256-GCM", kdf: "PBKDF2-SHA256-120000", salt: salt.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64"), ciphertext: ciphertext.toString("base64") };
  return { envelope, checksum: createHash("sha256").update(JSON.stringify(envelope)).digest("hex") };
}

export function decryptBackup(envelope: ReturnType<typeof encryptBackup>["envelope"], password: string) {
  const key = pbkdf2Sync(password, Buffer.from(envelope.salt, "base64"), 120_000, 32, "sha256"); const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64")); decipher.setAuthTag(Buffer.from(envelope.tag, "base64")); return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, "base64")), decipher.final()]).toString("utf8"));
}
