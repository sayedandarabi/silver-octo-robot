import { describe, expect, it } from "vitest";
import { money } from "../lib/saderatpro-engine";
import { calculateProductionCost, decryptBackup, encryptBackup, productionJournal, reportPdf, reportXlsx, scaleRecipe } from "../lib/saderatpro-phase3-engine";

describe("SaderatPro Phase 3 engine", () => {
  it("scales a recipe and calculates exact production cost", () => {
    const lines = [{ productId: "flour", quantity: 2n, unit: "kg", unitCost: money(100n, "AFN") }];
    expect(scaleRecipe(lines, 5n, 10n)[0].quantity).toBe(1n);
    const result = calculateProductionCost(lines, 5n, 10n);
    expect(result.totalCost.amount).toBe(100n);
    expect(result.unitCost.amount).toBe(20n);
  });
  it("creates balanced production journal lines", () => {
    const lines = productionJournal(money(700n, "AFN"));
    expect(lines.reduce((sum, row) => sum + row.debit, 0n)).toBe(700n);
    expect(lines.reduce((sum, row) => sum + row.credit, 0n)).toBe(700n);
  });
  it("encrypts and decrypts a business backup with AES-GCM", () => {
    const payload = { businessId: "b1", sales: [{ total: "100" }] };
    const encrypted = encryptBackup(payload, "correct horse battery staple");
    expect(encrypted.envelope.algorithm).toBe("AES-256-GCM");
    expect(decryptBackup(encrypted.envelope, "correct horse battery staple")).toEqual(payload);
    expect(() => decryptBackup(encrypted.envelope, "wrong password")).toThrow();
  });
  it("generates non-empty XLSX and PDF report bytes", async () => {
    const table = { title: "Sales", columns: ["ID", "Amount"], rows: [["s1", "100"]] };
    expect(reportXlsx(table).length).toBeGreaterThan(100);
    expect((await reportPdf(table)).length).toBeGreaterThan(100);
  });
});
