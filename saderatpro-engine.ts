export type CurrencyCode = "AFN" | "USD" | "EUR" | "PKR" | string;
export type Money = { amount: bigint; currency: CurrencyCode };
export type InvoiceLine = { description: string; quantity: bigint; unitPrice: Money; discountPercent: bigint };
export type InvoiceTotals = { subtotal: Money; discount: Money; tax: Money; total: Money; paid: Money; receivable: Money };
export type PurchaseLine = { quantity: bigint; unitCost: Money; discount: Money; tax: Money };
export type PurchaseTotals = { subtotal: Money; discount: Money; tax: Money; landedCost: Money; total: Money };
export type TaxBracket = { lower: bigint; upper: bigint | null; fixedTax: bigint; marginalRatePercent: bigint };
export type LedgerLine = { accountCode: string; debit: Money; credit: Money; memo?: string };

const sameCurrency = (a: Money, b: Money) => { if (a.currency !== b.currency) throw new Error("currency_mismatch"); };
const nonNegative = (amount: bigint, code = "negative_amount") => { if (amount < 0n) throw new Error(code); };
export const money = (amount: bigint | number | string, currency: CurrencyCode = "AFN"): Money => { const value = typeof amount === "bigint" ? amount : BigInt(amount); nonNegative(value); return { amount: value, currency }; };
export const addMoney = (a: Money, b: Money): Money => { sameCurrency(a, b); return money(a.amount + b.amount, a.currency); };
export const subtractMoney = (a: Money, b: Money): Money => { sameCurrency(a, b); return { amount: a.amount - b.amount, currency: a.currency }; };
export const percentOf = (amount: bigint, percent: bigint): bigint => { nonNegative(amount); if (percent < 0n || percent > 100n) throw new Error("invalid_percent"); return (amount * percent) / 100n; };

export function invoiceTotals(lines: InvoiceLine[], taxPercent: bigint, paid: bigint): InvoiceTotals {
  if (lines.length === 0) throw new Error("invoice_lines_required");
  if (taxPercent < 0n || taxPercent > 100n) throw new Error("invalid_tax_percent");
  nonNegative(paid);
  const currency = lines[0].unitPrice.currency;
  let subtotal = 0n; let discount = 0n;
  for (const line of lines) {
    if (!line.description.trim() || line.quantity <= 0n || line.unitPrice.amount < 0n) throw new Error("invalid_invoice_line");
    if (line.unitPrice.currency !== currency) throw new Error("currency_mismatch");
    const lineSubtotal = line.quantity * line.unitPrice.amount;
    const lineDiscount = percentOf(lineSubtotal, line.discountPercent);
    subtotal += lineSubtotal; discount += lineDiscount;
  }
  const taxable = subtotal - discount;
  const tax = percentOf(taxable, taxPercent);
  const total = taxable + tax;
  if (paid > total) throw new Error("paid_exceeds_total");
  return { subtotal: money(subtotal, currency), discount: money(discount, currency), tax: money(tax, currency), total: money(total, currency), paid: money(paid, currency), receivable: money(total - paid, currency) };
}

export function purchaseTotals(lines: PurchaseLine[], expenses: Money[]): PurchaseTotals {
  if (lines.length === 0) throw new Error("purchase_lines_required");
  const currency = lines[0].unitCost.currency;
  let subtotal = 0n; let discount = 0n; let tax = 0n; let landedCost = 0n;
  for (const line of lines) {
    if (line.quantity <= 0n) throw new Error("invalid_purchase_line");
    sameCurrency(line.unitCost, line.discount); sameCurrency(line.unitCost, line.tax);
    nonNegative(line.unitCost.amount); nonNegative(line.discount.amount); nonNegative(line.tax.amount);
    subtotal += line.quantity * line.unitCost.amount; discount += line.discount.amount; tax += line.tax.amount;
  }
  for (const expense of expenses) { sameCurrency({ amount: 0n, currency }, expense); nonNegative(expense.amount); landedCost += expense.amount; }
  if (discount > subtotal) throw new Error("discount_exceeds_subtotal");
  return { subtotal: money(subtotal, currency), discount: money(discount, currency), tax: money(tax, currency), landedCost: money(landedCost, currency), total: money(subtotal - discount + tax + landedCost, currency) };
}

export function cashBalance(opening: Money, movements: Array<{ type: "IN" | "OUT" | "FEE"; amount: Money }>): Money {
  let balance = opening.amount;
  for (const movement of movements) { sameCurrency(opening, movement.amount); nonNegative(movement.amount.amount); balance += movement.type === "IN" ? movement.amount.amount : -movement.amount.amount; }
  return { amount: balance, currency: opening.currency };
}

export function transferBalances(source: Money, target: Money, amount: Money): { source: Money; target: Money } {
  sameCurrency(source, target); sameCurrency(source, amount); if (amount.amount <= 0n) throw new Error("transfer_amount_required"); if (source.amount < amount.amount) throw new Error("insufficient_balance");
  return { source: money(source.amount - amount.amount, source.currency), target: money(target.amount + amount.amount, target.currency) };
}

export function stockAfterMovement(current: bigint, type: "IN" | "OUT" | "ADJUST", quantity: bigint, allowNegative = false): bigint {
  if (quantity <= 0n) throw new Error("quantity_required");
  const next = type === "IN" ? current + quantity : type === "OUT" ? current - quantity : quantity;
  if (!allowNegative && next < 0n) throw new Error("negative_inventory");
  return next;
}

export function monthlyPayroll(base: Money, allowances: Money, overtime: Money, deductions: Money, brackets: TaxBracket[] = []): { gross: Money; tax: Money; deductions: Money; net: Money } {
  [allowances, overtime, deductions].forEach((value) => sameCurrency(base, value));
  [base.amount, allowances.amount, overtime.amount, deductions.amount].forEach((value) => nonNegative(value));
  const gross = base.amount + allowances.amount + overtime.amount;
  const bracket = [...brackets].sort((a, b) => Number(a.lower - b.lower)).reverse().find((item) => gross > item.lower);
  const tax = bracket ? bracket.fixedTax + ((gross - bracket.lower) * bracket.marginalRatePercent) / 100n : 0n;
  const net = gross - tax - deductions.amount;
  return { gross: money(gross, base.currency), tax: money(tax, base.currency), deductions: money(deductions.amount, base.currency), net: money(net < 0n ? 0n : net, base.currency) };
}

export function validateBalanced(lines: LedgerLine[]): { debit: Money; credit: Money } {
  if (lines.length === 0) throw new Error("journal_lines_required");
  const currency = lines[0].debit.currency; let debit = 0n; let credit = 0n;
  for (const line of lines) { sameCurrency(line.debit, line.credit); sameCurrency(line.debit, { amount: 0n, currency }); nonNegative(line.debit.amount); nonNegative(line.credit.amount); debit += line.debit.amount; credit += line.credit.amount; }
  if (debit === 0n || debit !== credit) throw new Error("unbalanced_journal");
  return { debit: money(debit, currency), credit: money(credit, currency) };
}

export const serializeMoney = (value: Money) => ({ amount: value.amount.toString(), currency: value.currency });
