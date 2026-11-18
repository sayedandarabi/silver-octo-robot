import { sql } from "drizzle-orm";
import { bigint as mysqlBigint, date, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const businesses = mysqlTable("businesses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  baseCurrency: varchar("baseCurrency", { length: 4 }).default("AFN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const branches = mysqlTable("branches", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const productCategories = mysqlTable("productCategories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const units = mysqlTable("units", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  kind: mysqlEnum("kind", ["COUNT", "WEIGHT", "LENGTH", "VOLUME"]).default("COUNT").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).default("").notNull(),
  address: text("address"),
  group: mysqlEnum("group", ["retail", "wholesale", "company"]).default("retail").notNull(),
  openingAmount: mysqlBigint("openingAmount", { mode: "bigint" }).default(sql`0`).notNull(),
  creditLimit: mysqlBigint("creditLimit", { mode: "bigint" }).default(sql`0`).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 40 }).default("").notNull(),
  address: text("address"),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  openingAmount: mysqlBigint("openingAmount", { mode: "bigint" }).default(sql`0`).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  sku: varchar("sku", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 100 }).default("").notNull(),
  categoryId: varchar("categoryId", { length: 64 }).default("").notNull(),
  unit: varchar("unit", { length: 32 }).default("واحد").notNull(),
  unitId: varchar("unitId", { length: 64 }).default("").notNull(),
  secondaryUnit: varchar("secondaryUnit", { length: 32 }).default("").notNull(),
  secondaryPerPrimary: mysqlBigint("secondaryPerPrimary", { mode: "bigint" }).default(sql`0`).notNull(),
  sellPrice: mysqlBigint("sellPrice", { mode: "bigint" }).default(sql`0`).notNull(),
  minStock: mysqlBigint("minStock", { mode: "bigint" }).default(sql`0`).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productBarcodes = mysqlTable("productBarcodes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }).notNull(),
  barcode: varchar("barcode", { length: 64 }).notNull(),
  isPrimary: int("isPrimary").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const warehouses = mysqlTable("warehouses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  branchName: varchar("branchName", { length: 120 }).default("").notNull(),
  branchId: varchar("branchId", { length: 64 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryMovements = mysqlTable("inventoryMovements", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }).notNull(),
  warehouseId: varchar("warehouseId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["IN", "OUT", "ADJUST"]).notNull(),
  quantity: mysqlBigint("quantity", { mode: "bigint" }).notNull(),
  secondaryQuantity: mysqlBigint("secondaryQuantity", { mode: "bigint" }).default(sql`0`).notNull(),
  unitCost: mysqlBigint("unitCost", { mode: "bigint" }).default(sql`0`).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  reference: varchar("reference", { length: 160 }).default("").notNull(),
  expiryDate: date("expiryDate", { mode: "string" }),
  batchNo: varchar("batchNo", { length: 64 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const currencies = mysqlTable("currencies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  code: varchar("code", { length: 4 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  symbol: varchar("symbol", { length: 8 }).default("").notNull(),
  isBase: int("isBase").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const exchangeRates = mysqlTable("exchangeRates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  fromCurrency: varchar("fromCurrency", { length: 4 }).notNull(),
  toCurrency: varchar("toCurrency", { length: 4 }).notNull(),
  rateNumerator: mysqlBigint("rateNumerator", { mode: "bigint" }).notNull(),
  rateDenominator: mysqlBigint("rateDenominator", { mode: "bigint" }).notNull(),
  effectiveAt: timestamp("effectiveAt").defaultNow().notNull(),
});

export const taxRates = mysqlTable("taxRates", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  percentBasisPoints: mysqlBigint("percentBasisPoints", { mode: "bigint" }).default(sql`0`).notNull(),
  accountCode: varchar("accountCode", { length: 16 }).default("").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const invoiceSettings = mysqlTable("invoiceSettings", {
  businessId: varchar("businessId", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 160 }).default("فاکتور فروش").notNull(),
  logoPath: varchar("logoPath", { length: 512 }).default("").notNull(),
  headerText: text("headerText"),
  footerText: text("footerText"),
  paperWidth: mysqlEnum("paperWidth", ["A4", "THERMAL_58", "THERMAL_80"]).default("A4").notNull(),
  showSku: int("showSku").default(1).notNull(),
  showUnit: int("showUnit").default(1).notNull(),
  showDiscount: int("showDiscount").default(1).notNull(),
  showTax: int("showTax").default(1).notNull(),
  showCustomerPhone: int("showCustomerPhone").default(1).notNull(),
  columnOrder: text("columnOrder"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const purchases = mysqlTable("purchases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  documentNo: varchar("documentNo", { length: 64 }).notNull(),
  supplierId: varchar("supplierId", { length: 64 }).default("").notNull(),
  warehouseId: varchar("warehouseId", { length: 64 }).default("").notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  subtotal: mysqlBigint("subtotal", { mode: "bigint" }).default(sql`0`).notNull(),
  tax: mysqlBigint("tax", { mode: "bigint" }).default(sql`0`).notNull(),
  landedCost: mysqlBigint("landedCost", { mode: "bigint" }).default(sql`0`).notNull(),
  total: mysqlBigint("total", { mode: "bigint" }).default(sql`0`).notNull(),
  status: mysqlEnum("status", ["DRAFT", "POSTED", "VOID"]).default("POSTED").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const purchaseLines = mysqlTable("purchaseLines", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  purchaseId: varchar("purchaseId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }).notNull(),
  quantity: mysqlBigint("quantity", { mode: "bigint" }).notNull(),
  secondaryQuantity: mysqlBigint("secondaryQuantity", { mode: "bigint" }).default(sql`0`).notNull(),
  unitCost: mysqlBigint("unitCost", { mode: "bigint" }).notNull(),
  discount: mysqlBigint("discount", { mode: "bigint" }).default(sql`0`).notNull(),
  tax: mysqlBigint("tax", { mode: "bigint" }).default(sql`0`).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  batchNo: varchar("batchNo", { length: 64 }).default("").notNull(),
  expiryDate: date("expiryDate", { mode: "string" }),
});

export const purchaseExpenses = mysqlTable("purchaseExpenses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  purchaseId: varchar("purchaseId", { length: 64 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  amount: mysqlBigint("amount", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  note: varchar("note", { length: 240 }).default("").notNull(),
});

export const inventoryLots = mysqlTable("inventoryLots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }).notNull(),
  warehouseId: varchar("warehouseId", { length: 64 }).notNull(),
  purchaseLineId: varchar("purchaseLineId", { length: 64 }).default("").notNull(),
  batchNo: varchar("batchNo", { length: 64 }).default("").notNull(),
  expiryDate: date("expiryDate", { mode: "string" }),
  receivedQuantity: mysqlBigint("receivedQuantity", { mode: "bigint" }).notNull(),
  remainingQuantity: mysqlBigint("remainingQuantity", { mode: "bigint" }).notNull(),
  unitCost: mysqlBigint("unitCost", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
});

export const sales = mysqlTable("sales", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  documentNo: varchar("documentNo", { length: 64 }).notNull(),
  customerId: varchar("customerId", { length: 64 }).default("").notNull(),
  warehouseId: varchar("warehouseId", { length: 64 }).default("").notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  subtotal: mysqlBigint("subtotal", { mode: "bigint" }).notNull(),
  discount: mysqlBigint("discount", { mode: "bigint" }).default(sql`0`).notNull(),
  tax: mysqlBigint("tax", { mode: "bigint" }).default(sql`0`).notNull(),
  total: mysqlBigint("total", { mode: "bigint" }).notNull(),
  paid: mysqlBigint("paid", { mode: "bigint" }).default(sql`0`).notNull(),
  receivable: mysqlBigint("receivable", { mode: "bigint" }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "POSTED", "VOID"]).default("POSTED").notNull(),
  soldAt: timestamp("soldAt").defaultNow().notNull(),
});

export const saleLines = mysqlTable("saleLines", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  productId: varchar("productId", { length: 64 }).notNull(),
  quantity: mysqlBigint("quantity", { mode: "bigint" }).notNull(),
  unitPrice: mysqlBigint("unitPrice", { mode: "bigint" }).notNull(),
  discount: mysqlBigint("discount", { mode: "bigint" }).default(sql`0`).notNull(),
  tax: mysqlBigint("tax", { mode: "bigint" }).default(sql`0`).notNull(),
  costOfGoods: mysqlBigint("costOfGoods", { mode: "bigint" }).default(sql`0`).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
});

export const salePayments = mysqlTable("salePayments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  method: mysqlEnum("method", ["CASH", "BANK", "CREDIT", "CHECK"]).default("CASH").notNull(),
  amount: mysqlBigint("amount", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  reference: varchar("reference", { length: 120 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const installmentPlans = mysqlTable("installmentPlans", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  saleId: varchar("saleId", { length: 64 }).notNull(),
  customerId: varchar("customerId", { length: 64 }).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  totalAmount: mysqlBigint("totalAmount", { mode: "bigint" }).notNull(),
  status: mysqlEnum("status", ["ACTIVE", "COMPLETED", "OVERDUE", "CANCELLED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const installments = mysqlTable("installments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  planId: varchar("planId", { length: 64 }).notNull(),
  dueDate: date("dueDate", { mode: "string" }).notNull(),
  amount: mysqlBigint("amount", { mode: "bigint" }).notNull(),
  paidAmount: mysqlBigint("paidAmount", { mode: "bigint" }).default(sql`0`).notNull(),
  status: mysqlEnum("status", ["DUE", "PAID", "OVERDUE", "CANCELLED"]).default("DUE").notNull(),
  paidAt: timestamp("paidAt"),
});

export const checks = mysqlTable("checks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  number: varchar("number", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["RECEIVABLE", "PAYABLE"]).notNull(),
  customerId: varchar("customerId", { length: 64 }).default("").notNull(),
  supplierId: varchar("supplierId", { length: 64 }).default("").notNull(),
  amount: mysqlBigint("amount", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  dueDate: date("dueDate", { mode: "string" }).notNull(),
  status: mysqlEnum("status", ["PENDING", "DEPOSITED", "CLEARED", "BOUNCED", "CANCELLED"]).default("PENDING").notNull(),
  bank: varchar("bank", { length: 120 }).default("").notNull(),
  note: varchar("note", { length: 240 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const partners = mysqlTable("partners", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  shareBasisPoints: mysqlBigint("shareBasisPoints", { mode: "bigint" }).notNull(),
  openingCapital: mysqlBigint("openingCapital", { mode: "bigint" }).default(sql`0`).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const partnerTransactions = mysqlTable("partnerTransactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  partnerId: varchar("partnerId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["CAPITAL", "WITHDRAWAL", "PROFIT_SHARE"]).notNull(),
  amount: mysqlBigint("amount", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  reference: varchar("reference", { length: 160 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recipes = mysqlTable("recipes", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), productId: varchar("productId", { length: 64 }).notNull(), name: varchar("name", { length: 160 }).notNull(), outputQuantity: mysqlBigint("outputQuantity", { mode: "bigint" }).notNull(), unit: varchar("unit", { length: 32 }).notNull(), active: int("active").default(1).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const recipeLines = mysqlTable("recipeLines", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), recipeId: varchar("recipeId", { length: 64 }).notNull(), materialProductId: varchar("materialProductId", { length: 64 }).notNull(), quantity: mysqlBigint("quantity", { mode: "bigint" }).notNull(), unit: varchar("unit", { length: 32 }).notNull(),
});

export const productionOrders = mysqlTable("productionOrders", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), recipeId: varchar("recipeId", { length: 64 }).notNull(), warehouseId: varchar("warehouseId", { length: 64 }).notNull(), plannedQuantity: mysqlBigint("plannedQuantity", { mode: "bigint" }).notNull(), actualQuantity: mysqlBigint("actualQuantity", { mode: "bigint" }).notNull(), totalCost: mysqlBigint("totalCost", { mode: "bigint" }).default(sql`0`).notNull(), currency: varchar("currency", { length: 4 }).default("AFN").notNull(), status: mysqlEnum("status", ["DRAFT", "POSTED", "VOID"]).default("POSTED").notNull(), producedAt: timestamp("producedAt").defaultNow().notNull(),
});

export const productionConsumptions = mysqlTable("productionConsumptions", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), orderId: varchar("orderId", { length: 64 }).notNull(), productId: varchar("productId", { length: 64 }).notNull(), quantity: mysqlBigint("quantity", { mode: "bigint" }).notNull(), unitCost: mysqlBigint("unitCost", { mode: "bigint" }).notNull(), currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
});

export const productionOutputs = mysqlTable("productionOutputs", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), orderId: varchar("orderId", { length: 64 }).notNull(), productId: varchar("productId", { length: 64 }).notNull(), quantity: mysqlBigint("quantity", { mode: "bigint" }).notNull(), unitCost: mysqlBigint("unitCost", { mode: "bigint" }).notNull(), currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
});

export const messageLogs = mysqlTable("messageLogs", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), channel: mysqlEnum("channel", ["TELEGRAM", "WHATSAPP"]).notNull(), recipient: varchar("recipient", { length: 160 }).notNull(), template: varchar("template", { length: 80 }).notNull(), status: mysqlEnum("status", ["PENDING", "SENT", "FAILED"]).default("PENDING").notNull(), providerMessageId: varchar("providerMessageId", { length: 160 }).default("").notNull(), error: varchar("error", { length: 500 }).default("").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const backupConfigs = mysqlTable("backupConfigs", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), enabled: int("enabled").default(0).notNull(), frequency: mysqlEnum("frequency", ["DAILY", "WEEKLY"]).default("DAILY").notNull(), telegramChatId: varchar("telegramChatId", { length: 160 }).default("").notNull(), destination: mysqlEnum("destination", ["TELEGRAM", "STORAGE"]).default("TELEGRAM").notNull(), encryptedKeyHint: varchar("encryptedKeyHint", { length: 80 }).default("").notNull(), updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const backupRuns = mysqlTable("backupRuns", {
  id: varchar("id", { length: 64 }).primaryKey(), businessId: varchar("businessId", { length: 64 }).notNull(), status: mysqlEnum("status", ["STARTED", "COMPLETED", "FAILED"]).default("STARTED").notNull(), destination: varchar("destination", { length: 80 }).notNull(), checksum: varchar("checksum", { length: 128 }).default("").notNull(), error: varchar("error", { length: 500 }).default("").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const updateManifests = mysqlTable("updateManifests", {
  id: varchar("id", { length: 64 }).primaryKey(), channel: mysqlEnum("channel", ["production", "beta"]).default("production").notNull(), version: varchar("version", { length: 32 }).notNull(), minimumSupportedVersion: varchar("minimumSupportedVersion", { length: 32 }).notNull(), manifestUrl: varchar("manifestUrl", { length: 500 }).notNull(), checksum: varchar("checksum", { length: 128 }).notNull(), publishedAt: timestamp("publishedAt").defaultNow().notNull(),
});

export const chartAccounts = mysqlTable("chartAccounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  accountClass: mysqlEnum("accountClass", ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]).notNull(),
  normal: mysqlEnum("normal", ["DEBIT", "CREDIT"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const journalEntries = mysqlTable("journalEntries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  no: varchar("no", { length: 64 }).notNull(),
  memo: varchar("memo", { length: 240 }).notNull(),
  postedAt: timestamp("postedAt").defaultNow().notNull(),
});

export const journalLines = mysqlTable("journalLines", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  entryId: varchar("entryId", { length: 64 }).notNull(),
  accountCode: varchar("accountCode", { length: 16 }).notNull(),
  debit: mysqlBigint("debit", { mode: "bigint" }).default(sql`0`).notNull(),
  credit: mysqlBigint("credit", { mode: "bigint" }).default(sql`0`).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
});

export const customerLedger = mysqlTable("customerLedger", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  customerId: varchar("customerId", { length: 64 }).notNull(),
  type: mysqlEnum("type", ["INVOICE", "PAYMENT", "RETURN", "OPENING"]).notNull(),
  amount: mysqlBigint("amount", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 4 }).default("AFN").notNull(),
  reference: varchar("reference", { length: 160 }).default("").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const businessMembers = mysqlTable("businessMembers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  openId: varchar("openId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["OWNER", "ADMIN", "ACCOUNTANT", "CASHIER", "VIEWER"]).default("VIEWER").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  businessId: varchar("businessId", { length: 64 }).notNull(),
  actorOpenId: varchar("actorOpenId", { length: 64 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: varchar("entityId", { length: 64 }).notNull(),
  payload: text("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type CustomerRecord = typeof customers.$inferSelect;
export type ProductRecord = typeof products.$inferSelect;
export type InventoryMovementRecord = typeof inventoryMovements.$inferSelect;
export type JournalEntryRecord = typeof journalEntries.$inferSelect;
export type SupplierRecord = typeof suppliers.$inferSelect;
export type PurchaseRecord = typeof purchases.$inferSelect;
export type InventoryLotRecord = typeof inventoryLots.$inferSelect;
export type SaleRecord = typeof sales.$inferSelect;
export type InstallmentRecord = typeof installments.$inferSelect;
export type CheckRecord = typeof checks.$inferSelect;
export type PartnerRecord = typeof partners.$inferSelect;
export type RecipeRecord = typeof recipes.$inferSelect;
export type ProductionOrderRecord = typeof productionOrders.$inferSelect;
export type BackupConfigRecord = typeof backupConfigs.$inferSelect;
