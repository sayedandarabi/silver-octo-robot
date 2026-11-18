export type MovementKind = "IN" | "OUT" | "TRANSFER" | "FEE";

export type Sale = { id: string; title: string; amount: number; note: string; createdAt: string };
export type Expense = { id: string; title: string; amount: number; note: string; createdAt: string };
export type MoneyAccount = { id: string; name: string; type: "CASH" | "BANK"; holder: string; balance: number };
export type Movement = { id: string; accountName: string; kind: MovementKind; amount: number; reference: string; createdAt: string };
export type Product = { id: string; name: string; sku: string; category: string; unit: string; price: number; stock: number; minStock: number };
export type Warehouse = { id: string; name: string; branch: string; code: string };
export type Employee = { id: string; name: string; role: string; personnelNo: string; salary: number; tin: string };
export type Invoice = { id: string; no: string; customer: string; total: number; paid: number; status: "پرداخت شده" | "نسیه"; createdAt: string };

export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const nowLabel = () => "همین حالا";
export const afn = (value: number) => `${Math.round(value).toLocaleString("en-US")} AFN`;
export const compactAfn = (value: number) => `${Math.round(value).toLocaleString("en-US")} AFN`;

export const seedSales: Sale[] = [
  { id: "sale-1", title: "فروش نقدی دکان", amount: 128500, note: "فروش روزانه", createdAt: "امروز، ۱۰:۲۵" },
  { id: "sale-2", title: "سفارش شرکت پامیر", amount: 84500, note: "تحویل عمده", createdAt: "دیروز، ۱۶:۴۰" },
];
export const seedExpenses: Expense[] = [
  { id: "expense-1", title: "کرایه دفتر", amount: 22000, note: "ماه جاری", createdAt: "امروز، ۰۹:۱۰" },
  { id: "expense-2", title: "خرید بسته‌بندی", amount: 8400, note: "مصرف فروشگاه", createdAt: "دیروز، ۱۳:۲۰" },
];
export const seedAccounts: MoneyAccount[] = [
  { id: "cash-1", name: "صندوق اصلی", type: "CASH", holder: "مدیریت", balance: 184000 },
  { id: "bank-1", name: "بانک اسلامی", type: "BANK", holder: "حساب تجارتی", balance: 412000 },
];
export const seedMovements: Movement[] = [
  { id: "move-1", accountName: "صندوق اصلی", kind: "IN", amount: 128500, reference: "فروش نقدی دکان", createdAt: "امروز، ۱۰:۲۵" },
  { id: "move-2", accountName: "صندوق اصلی", kind: "OUT", amount: 22000, reference: "کرایه دفتر", createdAt: "امروز، ۰۹:۱۰" },
  { id: "move-3", accountName: "بانک اسلامی", kind: "IN", amount: 84500, reference: "سفارش شرکت پامیر", createdAt: "دیروز، ۱۶:۴۰" },
];
export const seedProducts: Product[] = [
  { id: "prod-1", name: "چای سبز ممتاز", sku: "TEA-204", category: "مواد غذایی", unit: "کارتن", price: 18500, stock: 42, minStock: 10 },
  { id: "prod-2", name: "روغن آفتابگردان", sku: "OIL-118", category: "مواد غذایی", unit: "بوتل", price: 420, stock: 86, minStock: 24 },
  { id: "prod-3", name: "برنج باسمتی", sku: "RIC-009", category: "مواد غذایی", unit: "کیسه", price: 3950, stock: 8, minStock: 12 },
];
export const seedWarehouses: Warehouse[] = [{ id: "wh-1", name: "انبار مرکزی", branch: "شعبه مرکزی", code: "WH-01" }];
export const seedEmployees: Employee[] = [
  { id: "emp-1", name: "احمد رحیمی", role: "مسئول فروش", personnelNo: "EMP-001", salary: 18500, tin: "AF-20481" },
  { id: "emp-2", name: "سمیرا نوری", role: "حسابدار", personnelNo: "EMP-002", salary: 24000, tin: "AF-20482" },
];
export const seedInvoices: Invoice[] = [{ id: "inv-1", no: "INV-1042", customer: "شرکت پامیر", total: 84500, paid: 60000, status: "نسیه", createdAt: "دیروز، ۱۶:۴۰" }];

export const totalSales = (items: Sale[]) => items.reduce((sum, item) => sum + item.amount, 0);
export const totalExpenses = (items: Expense[]) => items.reduce((sum, item) => sum + item.amount, 0);
export const totalBalance = (accounts: MoneyAccount[]) => accounts.reduce((sum, item) => sum + item.balance, 0);
