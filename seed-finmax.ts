import "dotenv/config";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required. Load .env before running the seed.");

const businessId = process.env.FINMAX_SEED_BUSINESS_ID ?? "demo-business";
const ownerOpenId = process.env.OWNER_OPEN_ID ?? process.env.FINMAX_SEED_OWNER_OPEN_ID ?? "seed-owner";

const connection = await mysql.createConnection(url);
const sql = async (query: string, values: unknown[] = []) => connection.execute(query, values);
const upsert = async (table: string, values: Record<string, unknown>, updateKeys: string[]) => {
  const keys = Object.keys(values);
  const columns = keys.map((key) => `\`${key}\``).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const updates = updateKeys.map((key) => `\`${key}\`=VALUES(\`${key}\`)`).join(", ");
  await sql(`INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`, keys.map((key) => values[key]));
};

try {
  await connection.beginTransaction();

  await upsert("businesses", { id: businessId, ownerOpenId, name: "Fin MaX Demo", baseCurrency: "AFN" }, ["ownerOpenId", "name", "baseCurrency"]);
  await upsert("businessMembers", { id: `${businessId}-owner`, businessId, openId: ownerOpenId, role: "OWNER", active: 1 }, ["openId", "role", "active"]);
  await upsert("branches", { id: `${businessId}-branch-1`, businessId, name: "شعبه مرکزی", code: "BR-01", address: "کابل" }, ["name", "code", "address"]);
  await upsert("warehouses", { id: "wh-1", businessId, name: "انبار مرکزی", code: "WH-01", branchName: "شعبه مرکزی", branchId: `${businessId}-branch-1` }, ["name", "code", "branchName", "branchId"]);

  const products = [
    { id: "prod-1", businessId, sku: "TEA-204", name: "چای سبز ممتاز", category: "مواد غذایی", unit: "کارتن", sellPrice: "18500", minStock: "10", currency: "AFN" },
    { id: "prod-2", businessId, sku: "OIL-118", name: "روغن آفتابگردان", category: "مواد غذایی", unit: "بوتل", sellPrice: "420", minStock: "24", currency: "AFN" },
    { id: "prod-3", businessId, sku: "RIC-009", name: "برنج باسمتی", category: "مواد غذایی", unit: "کیسه", sellPrice: "3950", minStock: "12", currency: "AFN" },
  ];
  for (const product of products) await upsert("products", product, ["sku", "name", "category", "unit", "sellPrice", "minStock", "currency"]);

  const customers = [
    { id: "customer-1", businessId, name: "شرکت پامیر", phone: "0700 123 456", address: "کابل، شهرنو", group: "company", openingAmount: "0", creditLimit: "250000", currency: "AFN" },
    { id: "customer-2", businessId, name: "مارکیت بهار", phone: "0790 555 210", address: "کابل، کارته چهار", group: "wholesale", openingAmount: "12500", creditLimit: "80000", currency: "AFN" },
  ];
  for (const customer of customers) await upsert("customers", customer, ["name", "phone", "address", "group", "openingAmount", "creditLimit", "currency"]);

  const movements = [
    { id: "stock-1", businessId, productId: "prod-1", warehouseId: "wh-1", type: "IN", quantity: "42", secondaryQuantity: "0", unitCost: "13000", currency: "AFN", reference: "موجودی افتتاحیه", batchNo: "OPEN-01" },
    { id: "stock-2", businessId, productId: "prod-2", warehouseId: "wh-1", type: "IN", quantity: "86", secondaryQuantity: "0", unitCost: "300", currency: "AFN", reference: "موجودی افتتاحیه", batchNo: "OPEN-01" },
    { id: "stock-3", businessId, productId: "prod-3", warehouseId: "wh-1", type: "IN", quantity: "8", secondaryQuantity: "0", unitCost: "3200", currency: "AFN", reference: "موجودی افتتاحیه", batchNo: "OPEN-01" },
  ];
  for (const movement of movements) await upsert("inventoryMovements", movement, ["quantity", "unitCost", "reference", "batchNo"]);

  const accounts = [
    ["1000", "دارایی‌ها", "ASSET", "DEBIT"], ["1010", "صندوق اصلی", "ASSET", "DEBIT"], ["1020", "بانک", "ASSET", "DEBIT"],
    ["1100", "حساب‌های دریافتنی", "ASSET", "DEBIT"], ["1200", "موجودی کالا", "ASSET", "DEBIT"], ["2000", "حساب‌های پرداختنی", "LIABILITY", "CREDIT"],
    ["3000", "سرمایه مالک", "EQUITY", "CREDIT"], ["4000", "درآمد فروش", "REVENUE", "CREDIT"], ["5000", "بهای تمام‌شده فروش", "EXPENSE", "DEBIT"], ["5100", "مصارف عملیاتی", "EXPENSE", "DEBIT"],
  ];
  for (const [code, name, accountClass, normal] of accounts) await upsert("chartAccounts", { id: `${businessId}-account-${code}`, businessId, code, name, accountClass, normal }, ["name", "accountClass", "normal"]);

  await upsert("customerLedger", { id: "ledger-1", businessId, customerId: "customer-1", type: "INVOICE", amount: "84500", currency: "AFN", reference: "INV-1042" }, ["amount", "reference"]);
  await upsert("customerLedger", { id: "ledger-2", businessId, customerId: "customer-1", type: "PAYMENT", amount: "60000", currency: "AFN", reference: "دریافت بانکی" }, ["amount", "reference"]);
  await upsert("customerLedger", { id: "ledger-3", businessId, customerId: "customer-2", type: "OPENING", amount: "12500", currency: "AFN", reference: "مانده افتتاحیه" }, ["amount", "reference"]);

  await upsert("journalEntries", { id: "je-1", businessId, no: "JE-0001", memo: "ثبت فروش نقدی" }, ["no", "memo"]);
  await upsert("journalEntries", { id: "je-2", businessId, no: "JE-0002", memo: "ثبت کرایه دفتر" }, ["no", "memo"]);
  const lines = [
    ["je-line-1", "je-1", "1010", "128500", "0"], ["je-line-2", "je-1", "4000", "0", "128500"],
    ["je-line-3", "je-2", "5100", "22000", "0"], ["je-line-4", "je-2", "1010", "0", "22000"],
  ];
  for (const [id, entryId, accountCode, debit, credit] of lines) await upsert("journalLines", { id, businessId, entryId, accountCode, debit, credit, currency: "AFN" }, ["debit", "credit", "currency"]);

  await connection.commit();
  console.log(JSON.stringify({ ok: true, businessId, ownerOpenId, seeded: { products: products.length, customers: customers.length, movements: movements.length, journalEntries: 2 } }, null, 2));
} catch (error) {
  await connection.rollback();
  console.error("Fin MaX seed failed; transaction rolled back.");
  throw error;
} finally {
  await connection.end();
}
