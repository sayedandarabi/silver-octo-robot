import type { Money } from "./saderatpro-engine";

export type Customer = { id: string; name: string; phone: string; address: string; openingBalance: Money; creditLimit: Money; group: "retail" | "wholesale" | "company" };
export type Supplier = { id: string; name: string; phone: string; openingBalance: Money };
export type InventoryMovement = { id: string; productId: string; warehouseId: string; type: "IN" | "OUT" | "ADJUST"; quantity: bigint; unitCost: Money; reference: string; createdAt: string };
export type PurchaseLine = { productId: string; description: string; quantity: bigint; unitCost: Money; discountPercent: bigint };
export type Purchase = { id: string; no: string; supplierId: string | null; lines: PurchaseLine[]; total: Money; paid: Money; createdAt: string };
export type CustomerLedgerEntry = { id: string; customerId: string; type: "INVOICE" | "PAYMENT" | "RETURN" | "OPENING"; amount: Money; reference: string; createdAt: string };
export type AccountClass = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type ChartAccount = { code: string; name: string; class: AccountClass; normal: "DEBIT" | "CREDIT" };
export type JournalEntry = { id: string; no: string; date: string; memo: string; lines: Array<{ accountCode: string; debit: Money; credit: Money }> };

export const chartOfAccounts: ChartAccount[] = [
  { code: "1000", name: "دارایی‌ها", class: "ASSET", normal: "DEBIT" },
  { code: "1010", name: "صندوق اصلی", class: "ASSET", normal: "DEBIT" },
  { code: "1020", name: "بانک", class: "ASSET", normal: "DEBIT" },
  { code: "1100", name: "حساب‌های دریافتنی", class: "ASSET", normal: "DEBIT" },
  { code: "1200", name: "موجودی کالا", class: "ASSET", normal: "DEBIT" },
  { code: "2000", name: "حساب‌های پرداختنی", class: "LIABILITY", normal: "CREDIT" },
  { code: "3000", name: "سرمایه مالک", class: "EQUITY", normal: "CREDIT" },
  { code: "4000", name: "درآمد فروش", class: "REVENUE", normal: "CREDIT" },
  { code: "5000", name: "بهای تمام‌شده فروش", class: "EXPENSE", normal: "DEBIT" },
  { code: "5100", name: "مصارف عملیاتی", class: "EXPENSE", normal: "DEBIT" },
];

export const seedCustomers: Customer[] = [
  { id: "customer-1", name: "شرکت پامیر", phone: "0700 123 456", address: "کابل، شهرنو", openingBalance: { amount: 0n, currency: "AFN" }, creditLimit: { amount: 250000n, currency: "AFN" }, group: "company" },
  { id: "customer-2", name: "مارکیت بهار", phone: "0790 555 210", address: "کابل، کارته چهار", openingBalance: { amount: 12500n, currency: "AFN" }, creditLimit: { amount: 80000n, currency: "AFN" }, group: "wholesale" },
];

export const seedInventoryMovements: InventoryMovement[] = [
  { id: "stock-1", productId: "prod-1", warehouseId: "wh-1", type: "IN", quantity: 42n, unitCost: { amount: 13000n, currency: "AFN" }, reference: "موجودی افتتاحیه", createdAt: "امروز" },
  { id: "stock-2", productId: "prod-2", warehouseId: "wh-1", type: "IN", quantity: 86n, unitCost: { amount: 300n, currency: "AFN" }, reference: "موجودی افتتاحیه", createdAt: "امروز" },
  { id: "stock-3", productId: "prod-3", warehouseId: "wh-1", type: "IN", quantity: 8n, unitCost: { amount: 3200n, currency: "AFN" }, reference: "موجودی افتتاحیه", createdAt: "امروز" },
];

export const seedCustomerLedger: CustomerLedgerEntry[] = [
  { id: "ledger-1", customerId: "customer-1", type: "INVOICE", amount: { amount: 84500n, currency: "AFN" }, reference: "INV-1042", createdAt: "دیروز" },
  { id: "ledger-2", customerId: "customer-1", type: "PAYMENT", amount: { amount: 60000n, currency: "AFN" }, reference: "دریافت بانکی", createdAt: "دیروز" },
  { id: "ledger-3", customerId: "customer-2", type: "OPENING", amount: { amount: 12500n, currency: "AFN" }, reference: "مانده افتتاحیه", createdAt: "اول ماه" },
];

export const seedJournalEntries: JournalEntry[] = [
  { id: "je-1", no: "JE-0001", date: "امروز", memo: "ثبت فروش نقدی", lines: [{ accountCode: "1010", debit: { amount: 128500n, currency: "AFN" }, credit: { amount: 0n, currency: "AFN" } }, { accountCode: "4000", debit: { amount: 0n, currency: "AFN" }, credit: { amount: 128500n, currency: "AFN" } }] },
  { id: "je-2", no: "JE-0002", date: "امروز", memo: "ثبت کرایه دفتر", lines: [{ accountCode: "5100", debit: { amount: 22000n, currency: "AFN" }, credit: { amount: 0n, currency: "AFN" } }, { accountCode: "1010", debit: { amount: 0n, currency: "AFN" }, credit: { amount: 22000n, currency: "AFN" } }] },
];
