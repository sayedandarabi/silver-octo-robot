import "dotenv/config";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required.");
const requireSeed = process.argv.includes("--require-seed");
const businessId = process.env.FINMAX_SEED_BUSINESS_ID ?? "demo-business";
const connection = await mysql.createConnection(url);
const requiredTables = ["users", "businesses", "customers", "products", "warehouses", "inventoryMovements", "chartAccounts", "journalEntries", "journalLines", "customerLedger", "auditLogs", "messageLogs", "backupRuns"];

try {
  await connection.query("SELECT 1 AS ok");
  const [rows] = await connection.query<{ table_name: string }[]>(
    "SELECT TABLE_NAME AS table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  const existing = new Set(rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !existing.has(table));
  if (missing.length) throw new Error(`Missing migrated tables: ${missing.join(", ")}`);

  const [[business]] = await connection.query<any[]>("SELECT COUNT(*) AS count FROM businesses WHERE id = ?", [businessId]);
  const [[products]] = await connection.query<any[]>("SELECT COUNT(*) AS count FROM products WHERE businessId = ?", [businessId]);
  const [[customers]] = await connection.query<any[]>("SELECT COUNT(*) AS count FROM customers WHERE businessId = ?", [businessId]);
  const [[journalLines]] = await connection.query<any[]>("SELECT COUNT(*) AS count FROM journalLines WHERE businessId = ?", [businessId]);

  if (requireSeed && Number(business.count) === 0) throw new Error(`Seed business not found: ${businessId}`);
  console.log(JSON.stringify({ ok: true, database: "reachable", requiredTables: requiredTables.length, missingTables: [], seed: { business: Number(business.count), products: Number(products.count), customers: Number(customers.count), journalLines: Number(journalLines.count) } }, null, 2));
} finally {
  await connection.end();
}
