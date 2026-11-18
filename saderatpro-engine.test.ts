import { describe, expect, it } from "vitest";
import { cashBalance, invoiceTotals, money, monthlyPayroll, stockAfterMovement, transferBalances, validateBalanced } from "../lib/saderatpro-engine";

describe("SaderatPro accounting engine", () => {
  it("calculates invoice discount, tax, paid amount and receivable with integer AFN", () => {
    const result = invoiceTotals([{ description: "چای", quantity: 3n, unitPrice: money(1000n), discountPercent: 10n }], 5n, 1000n);
    expect(result.subtotal.amount).toBe(3000n); expect(result.discount.amount).toBe(300n); expect(result.tax.amount).toBe(135n); expect(result.total.amount).toBe(2835n); expect(result.receivable.amount).toBe(1835n);
  });
  it("rejects a payment larger than the invoice total", () => expect(() => invoiceTotals([{ description: "خدمت", quantity: 1n, unitPrice: money(500n), discountPercent: 0n }], 0n, 501n)).toThrow("paid_exceeds_total"));
  it("keeps transfer totals unchanged", () => { const result = transferBalances(money(1000n), money(500n), money(300n)); expect(result.source.amount).toBe(700n); expect(result.target.amount).toBe(800n); expect(result.source.amount + result.target.amount).toBe(1500n); });
  it("calculates a cash account balance", () => expect(cashBalance(money(1000n), [{ type: "IN", amount: money(200n) }, { type: "OUT", amount: money(50n) }]).amount).toBe(1150n));
  it("prevents negative stock without an explicit override", () => expect(() => stockAfterMovement(2n, "OUT", 3n)).toThrow("negative_inventory"));
  it("calculates payroll with configurable tax brackets", () => { const result = monthlyPayroll(money(10000n), money(1000n), money(0n), money(500n), [{ lower: 5000n, upper: null, fixedTax: 0n, marginalRatePercent: 10n }]); expect(result.gross.amount).toBe(11000n); expect(result.tax.amount).toBe(600n); expect(result.net.amount).toBe(9900n); });
  it("accepts a balanced journal and rejects an unbalanced one", () => { expect(validateBalanced([{ accountCode: "1010", debit: money(1000n), credit: money(0n) }, { accountCode: "4000", debit: money(0n), credit: money(1000n) }]).debit.amount).toBe(1000n); expect(() => validateBalanced([{ accountCode: "1010", debit: money(1000n), credit: money(0n) }, { accountCode: "4000", debit: money(0n), credit: money(900n) }])).toThrow("unbalanced_journal"); });
});
