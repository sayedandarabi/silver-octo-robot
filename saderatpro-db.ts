import { and, asc, desc, eq } from "drizzle-orm";
import { auditLogs, branches, businessMembers, businesses, chartAccounts, checks, currencies, customerLedger, customers, exchangeRates, installmentPlans, installments, inventoryLots, inventoryMovements, invoiceSettings, journalEntries, journalLines, partnerTransactions, partners, productBarcodes, productCategories, products, purchaseExpenses, purchaseLines, purchases, saleLines, salePayments, sales, suppliers, taxRates, units, warehouses } from "../drizzle/schema";
import { getDb } from "./db";

export const requireDb = async () => { const db = await getDb(); if (!db) throw new Error("database_unavailable"); return db; };

export async function assertBusinessOwner(openId: string, businessId: string) {
  const db = await requireDb(); const rows = await db.select({ id: businesses.id }).from(businesses).where(and(eq(businesses.id, businessId), eq(businesses.ownerOpenId, openId))).limit(1); if (!rows[0]) throw new Error("business_forbidden"); return rows[0];
}

export async function assertBusinessAccess(openId: string, businessId: string) {
  const db = await requireDb();
  const owner = await db.select({ id: businesses.id }).from(businesses).where(and(eq(businesses.id, businessId), eq(businesses.ownerOpenId, openId))).limit(1);
  if (owner[0]) return owner[0];
  const member = await db.select({ id: businessMembers.id }).from(businessMembers).where(and(eq(businessMembers.businessId, businessId), eq(businessMembers.openId, openId), eq(businessMembers.active, 1))).limit(1);
  if (!member[0]) throw new Error("business_forbidden");
  return member[0];
}

export async function ensureBusiness(ownerOpenId: string, businessId: string, name: string, baseCurrency = "AFN") { const db = await requireDb(); await db.insert(businesses).values({ id: businessId, ownerOpenId, name, baseCurrency }).onDuplicateKeyUpdate({ set: { name, baseCurrency, updatedAt: new Date() } }); return (await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1))[0]; }
export async function listCustomers(businessId: string) { const db = await requireDb(); return db.select().from(customers).where(eq(customers.businessId, businessId)).orderBy(asc(customers.name)); }
export async function createCustomer(input: typeof customers.$inferInsert) { const db = await requireDb(); await db.insert(customers).values(input); return input; }
export async function createCustomerWithOpening(input: typeof customers.$inferInsert, opening: typeof customerLedger.$inferInsert | null) { const db = await requireDb(); await db.transaction(async (tx) => { await tx.insert(customers).values(input); if (opening && opening.amount > 0n) await tx.insert(customerLedger).values(opening); }); return input; }
export async function listProducts(businessId: string) { const db = await requireDb(); return db.select().from(products).where(eq(products.businessId, businessId)).orderBy(asc(products.name)); }
export async function listWarehouses(businessId: string) { const db = await requireDb(); return db.select().from(warehouses).where(eq(warehouses.businessId, businessId)).orderBy(asc(warehouses.name)); }
export async function listInventoryMovements(businessId: string) { const db = await requireDb(); return db.select().from(inventoryMovements).where(eq(inventoryMovements.businessId, businessId)).orderBy(desc(inventoryMovements.createdAt)); }
export async function createInventoryMovement(input: typeof inventoryMovements.$inferInsert) { const db = await requireDb(); await db.insert(inventoryMovements).values(input); return input; }
export async function createInventoryMovementAtomic(input: typeof inventoryMovements.$inferInsert) { const db = await requireDb(); await db.transaction(async (tx) => { await tx.insert(inventoryMovements).values(input); }); return input; }
export async function createJournalEntry(input: { entry: typeof journalEntries.$inferInsert; lines: Array<typeof journalLines.$inferInsert> }) { const db = await requireDb(); await db.transaction(async (tx) => { await tx.insert(journalEntries).values(input.entry); await tx.insert(journalLines).values(input.lines); }); return input; }
export async function listJournalEntries(businessId: string) { const db = await requireDb(); const entries = await db.select().from(journalEntries).where(eq(journalEntries.businessId, businessId)).orderBy(desc(journalEntries.postedAt)); const lines = await db.select().from(journalLines).where(eq(journalLines.businessId, businessId)); return entries.map((entry) => ({ ...entry, lines: lines.filter((line) => line.entryId === entry.id) })); }
export async function ensureChartOfAccounts(businessId: string, accounts: Array<typeof chartAccounts.$inferInsert>) { const db = await requireDb(); for (const account of accounts) await db.insert(chartAccounts).values(account).onDuplicateKeyUpdate({ set: { name: account.name, accountClass: account.accountClass, normal: account.normal } }); }

export async function listCategories(businessId: string) { const db = await requireDb(); return db.select().from(productCategories).where(eq(productCategories.businessId, businessId)).orderBy(asc(productCategories.name)); }
export async function createCategory(input: typeof productCategories.$inferInsert) { const db = await requireDb(); await db.insert(productCategories).values(input); return input; }
export async function listUnits(businessId: string) { const db = await requireDb(); return db.select().from(units).where(eq(units.businessId, businessId)).orderBy(asc(units.name)); }
export async function createUnit(input: typeof units.$inferInsert) { const db = await requireDb(); await db.insert(units).values(input); return input; }
export async function listSuppliers(businessId: string) { const db = await requireDb(); return db.select().from(suppliers).where(eq(suppliers.businessId, businessId)).orderBy(asc(suppliers.name)); }
export async function createSupplier(input: typeof suppliers.$inferInsert) { const db = await requireDb(); await db.insert(suppliers).values(input); return input; }
export async function listBranches(businessId: string) { const db = await requireDb(); return db.select().from(branches).where(eq(branches.businessId, businessId)).orderBy(asc(branches.name)); }
export async function createBranch(input: typeof branches.$inferInsert) { const db = await requireDb(); await db.insert(branches).values(input); return input; }
export async function createBarcode(input: typeof productBarcodes.$inferInsert) { const db = await requireDb(); await db.insert(productBarcodes).values(input); return input; }
export async function listCurrencies(businessId: string) { const db = await requireDb(); return db.select().from(currencies).where(eq(currencies.businessId, businessId)).orderBy(asc(currencies.code)); }
export async function createCurrency(input: typeof currencies.$inferInsert) { const db = await requireDb(); await db.insert(currencies).values(input); return input; }
export async function listExchangeRates(businessId: string) { const db = await requireDb(); return db.select().from(exchangeRates).where(eq(exchangeRates.businessId, businessId)).orderBy(desc(exchangeRates.effectiveAt)); }
export async function createExchangeRate(input: typeof exchangeRates.$inferInsert) { const db = await requireDb(); await db.insert(exchangeRates).values(input); return input; }
export async function listTaxRates(businessId: string) { const db = await requireDb(); return db.select().from(taxRates).where(eq(taxRates.businessId, businessId)).orderBy(asc(taxRates.name)); }
export async function createTaxRate(input: typeof taxRates.$inferInsert) { const db = await requireDb(); await db.insert(taxRates).values(input); return input; }
export async function getInvoiceSettings(businessId: string) { const db = await requireDb(); return (await db.select().from(invoiceSettings).where(eq(invoiceSettings.businessId, businessId)).limit(1))[0] ?? null; }
export async function upsertInvoiceSettings(input: typeof invoiceSettings.$inferInsert) { const db = await requireDb(); await db.insert(invoiceSettings).values(input).onDuplicateKeyUpdate({ set: { title: input.title, logoPath: input.logoPath, headerText: input.headerText, footerText: input.footerText, paperWidth: input.paperWidth, showSku: input.showSku, showUnit: input.showUnit, showDiscount: input.showDiscount, showTax: input.showTax, showCustomerPhone: input.showCustomerPhone, columnOrder: input.columnOrder, updatedAt: new Date() } }); return getInvoiceSettings(input.businessId); }

export async function createPurchaseAtomic(input: { purchase: typeof purchases.$inferInsert; lines: Array<typeof purchaseLines.$inferInsert>; expenses: Array<typeof purchaseExpenses.$inferInsert>; lots?: Array<typeof inventoryLots.$inferInsert>; movements?: Array<typeof inventoryMovements.$inferInsert>; journal?: { entry: typeof journalEntries.$inferInsert; lines: Array<typeof journalLines.$inferInsert> } }) {
  const db = await requireDb();
  await db.transaction(async (tx) => { await tx.insert(purchases).values(input.purchase); await tx.insert(purchaseLines).values(input.lines); if (input.expenses.length) await tx.insert(purchaseExpenses).values(input.expenses); if (input.lots?.length) await tx.insert(inventoryLots).values(input.lots); if (input.movements?.length) await tx.insert(inventoryMovements).values(input.movements); if (input.journal) { await tx.insert(journalEntries).values(input.journal.entry); await tx.insert(journalLines).values(input.journal.lines); } });
  return input;
}
export async function listPurchases(businessId: string) { const db = await requireDb(); return db.select().from(purchases).where(eq(purchases.businessId, businessId)).orderBy(desc(purchases.purchasedAt)); }

export async function createMember(input: typeof businessMembers.$inferInsert) { const db = await requireDb(); await db.insert(businessMembers).values(input).onDuplicateKeyUpdate({ set: { role: input.role, active: input.active } }); return input; }
export async function listMembers(businessId: string) { const db = await requireDb(); return db.select().from(businessMembers).where(eq(businessMembers.businessId, businessId)).orderBy(asc(businessMembers.openId)); }
export async function appendAuditLog(input: typeof auditLogs.$inferInsert) { const db = await requireDb(); await db.insert(auditLogs).values(input); return input; }
export async function listAuditLogs(businessId: string) { const db = await requireDb(); return db.select().from(auditLogs).where(eq(auditLogs.businessId, businessId)).orderBy(desc(auditLogs.createdAt)).limit(200); }

export async function listInventoryLots(businessId: string, productId: string, warehouseId: string) { const db = await requireDb(); return db.select().from(inventoryLots).where(and(eq(inventoryLots.businessId, businessId), eq(inventoryLots.productId, productId), eq(inventoryLots.warehouseId, warehouseId))).orderBy(asc(inventoryLots.receivedAt)); }
export async function listInventoryCardex(businessId: string, productId: string, warehouseId: string) { const db = await requireDb(); return db.select().from(inventoryMovements).where(and(eq(inventoryMovements.businessId, businessId), eq(inventoryMovements.productId, productId), eq(inventoryMovements.warehouseId, warehouseId))).orderBy(asc(inventoryMovements.createdAt)); }

export async function createPostedSaleAtomic(input: { sale: typeof sales.$inferInsert; lines: Array<typeof saleLines.$inferInsert>; payments: Array<typeof salePayments.$inferInsert>; customerEntry?: typeof customerLedger.$inferInsert | null; movements: Array<typeof inventoryMovements.$inferInsert>; lotUpdates?: Array<{ id: string; remainingQuantity: bigint; unitCost?: bigint }>; journal?: { entry: typeof journalEntries.$inferInsert; lines: Array<typeof journalLines.$inferInsert> } }) {
  const db = await requireDb();
  await db.transaction(async (tx) => { await tx.insert(sales).values(input.sale); await tx.insert(saleLines).values(input.lines); if (input.payments.length) await tx.insert(salePayments).values(input.payments); if (input.customerEntry) await tx.insert(customerLedger).values(input.customerEntry); if (input.movements.length) await tx.insert(inventoryMovements).values(input.movements); for (const update of input.lotUpdates ?? []) await tx.update(inventoryLots).set({ remainingQuantity: update.remainingQuantity, ...(update.unitCost !== undefined ? { unitCost: update.unitCost } : {}) }).where(eq(inventoryLots.id, update.id)); if (input.journal) { await tx.insert(journalEntries).values(input.journal.entry); await tx.insert(journalLines).values(input.journal.lines); } });
  return input;
}
export async function listSales(businessId: string) { const db = await requireDb(); return db.select().from(sales).where(eq(sales.businessId, businessId)).orderBy(desc(sales.soldAt)); }
export async function listSaleLines(businessId: string, saleId: string) { const db = await requireDb(); return db.select().from(saleLines).where(and(eq(saleLines.businessId, businessId), eq(saleLines.saleId, saleId))); }

export async function createInstallmentPlanAtomic(input: { plan: typeof installmentPlans.$inferInsert; rows: Array<typeof installments.$inferInsert> }) { const db = await requireDb(); await db.transaction(async (tx) => { await tx.insert(installmentPlans).values(input.plan); await tx.insert(installments).values(input.rows); }); return input; }
export async function listInstallments(businessId: string) { const db = await requireDb(); return db.select().from(installments).where(eq(installments.businessId, businessId)).orderBy(asc(installments.dueDate)); }
export async function createCheck(input: typeof checks.$inferInsert) { const db = await requireDb(); await db.insert(checks).values(input); return input; }
export async function listChecks(businessId: string) { const db = await requireDb(); return db.select().from(checks).where(eq(checks.businessId, businessId)).orderBy(asc(checks.dueDate)); }
export async function updateCheckStatus(businessId: string, id: string, status: typeof checks.$inferInsert["status"]) { const db = await requireDb(); await db.update(checks).set({ status }).where(and(eq(checks.businessId, businessId), eq(checks.id, id))); return { id, status }; }

export async function listPartners(businessId: string) { const db = await requireDb(); return db.select().from(partners).where(eq(partners.businessId, businessId)).orderBy(asc(partners.name)); }
export async function createPartner(input: typeof partners.$inferInsert) { const db = await requireDb(); await db.insert(partners).values(input); return input; }
export async function createPartnerTransaction(input: typeof partnerTransactions.$inferInsert) { const db = await requireDb(); await db.insert(partnerTransactions).values(input); return input; }
export async function listPartnerTransactions(businessId: string) { const db = await requireDb(); return db.select().from(partnerTransactions).where(eq(partnerTransactions.businessId, businessId)).orderBy(desc(partnerTransactions.createdAt)); }
