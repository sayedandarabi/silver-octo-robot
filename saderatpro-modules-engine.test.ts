import { describe, expect, it } from "vitest";
import { customerBalance, inventoryBalance, inventoryValue, profitLoss, purchaseTotals, trialBalance } from "../lib/saderatpro-modules-engine";
import { chartOfAccounts, seedCustomerLedger, seedInventoryMovements, seedJournalEntries } from "../lib/saderatpro-modules";

describe("SaderatPro accounting, inventory and customer modules", () => {
  it("calculates live inventory quantity and value", () => { expect(inventoryBalance(seedInventoryMovements, "prod-3", "wh-1")).toBe(8n); expect(inventoryValue(seedInventoryMovements, "prod-3", "wh-1").amount).toBe(25600n); });
  it("calculates a customer receivable from invoices and payments", () => expect(customerBalance(seedCustomerLedger, "customer-1").amount).toBe(24500n));
  it("calculates purchase totals and payable", () => { const result = purchaseTotals([{ productId: "prod-1", description: "چای", quantity: 2n, unitCost: { amount: 1000n, currency: "AFN" }, discountPercent: 10n }], 500n); expect(result.total.amount).toBe(1800n); expect(result.payable.amount).toBe(1300n); });
  it("produces a balanced trial balance and profit/loss", () => { const rows = trialBalance(seedJournalEntries); expect(rows.find((row) => row.accountCode === "4000")?.credit.amount).toBe(128500n); const report = profitLoss(seedJournalEntries, chartOfAccounts); expect(report.revenue.amount).toBe(128500n); expect(report.expenses.amount).toBe(22000n); expect(report.profit.amount).toBe(106500n); });
});
