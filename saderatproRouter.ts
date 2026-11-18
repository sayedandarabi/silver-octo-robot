import { invoiceTotals, money, purchaseTotals, validateBalanced } from "../lib/saderatpro-engine";
import { consumeCostLayers, type CostLayer } from "../lib/saderatpro-modules-engine";
import { calculateProductionCost, decryptBackup, encryptBackup, reportPdf, reportXlsx, productionJournal, scaleRecipe } from "../lib/saderatpro-phase3-engine";
import { backupConfigSchema, backupRunSchema, barcodeCreateSchema, branchCreateSchema, businessCreateSchema, categoryCreateSchema, checkCreateSchema, checkStatusSchema, currencyCreateSchema, customerCreateSchema, dailySummarySendSchema, exchangeRateCreateSchema, idSchema, installmentCreateSchema, inventoryMovementCreateSchema, invoiceSettingsSchema, journalCreateSchema, memberCreateSchema, messageSendSchema, partnerCreateSchema, partnerTransactionSchema, productionPostSchema, recipeCreateSchema, reportExportSchema, purchaseCreateSchema, saleCreateSchema, supplierCreateSchema, taxRateCreateSchema, unitCreateSchema, updateCheckSchema } from "../shared/saderatpro-contracts";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { appendAuditLog, assertBusinessAccess, assertBusinessOwner, createBarcode, createBranch, createCategory, createCheck, createCurrency, createCustomerWithOpening, createExchangeRate, createInstallmentPlanAtomic, createInventoryMovementAtomic, createJournalEntry, createMember, createPartner, createPartnerTransaction, createPostedSaleAtomic, createPurchaseAtomic, createSupplier, createTaxRate, createUnit, ensureBusiness, getInvoiceSettings, listAuditLogs, listBranches, listCategories, listChecks, listCurrencies, listCustomers, listExchangeRates, listInstallments, listInventoryCardex, listInventoryLots, listInventoryMovements, listJournalEntries, listMembers, listPartnerTransactions, listPartners, listPurchases, listSaleLines, listSales, listSuppliers, listTaxRates, listUnits, updateCheckStatus, upsertInvoiceSettings } from "./saderatpro-db";
import { createBackupRun, createMessageLog, createRecipe, finishBackupRun, getBackupConfig, latestUpdate, listBackupRuns, listMessageLogs, listProductionConsumption, listProductionOrders, listRecipes, postProductionAtomic, updateMessageLog, upsertBackupConfig } from "./saderatpro-phase3-db";
import { dailySummary } from "./saderatpro-daily-summary";
import { sendProviderMessage } from "./saderatpro-providers";

const requireOpenId = (ctx: { user: { openId: string } | null }) => { if (!ctx.user?.openId) throw new Error("authenticated_user_required"); return ctx.user.openId; };
const scoped = businessCreateSchema.pick({ businessId: true });

export const saderatproRouter = router({
  calculateInvoice: publicProcedure.input(saleCreateSchema).query(({ input }) => {
    const result = invoiceTotals(input.lines.map((line) => ({ description: line.description, quantity: BigInt(line.quantity), unitPrice: money(line.unitPrice.amount, line.unitPrice.currency), discountPercent: BigInt(line.discountPercent) })), BigInt(input.taxPercent), BigInt(input.paid));
    return { subtotal: result.subtotal.amount.toString(), discount: result.discount.amount.toString(), tax: result.tax.amount.toString(), total: result.total.amount.toString(), paid: result.paid.amount.toString(), receivable: result.receivable.amount.toString(), currency: result.total.currency };
  }),
  business: router({
    ensure: protectedProcedure.input(businessCreateSchema).mutation(({ ctx, input }) => ensureBusiness(requireOpenId(ctx), input.businessId, input.name, input.baseCurrency)),
  }),
  customers: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessOwner(requireOpenId(ctx), input.businessId); return listCustomers(input.businessId); }),
    create: protectedProcedure.input(customerCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessOwner(requireOpenId(ctx), input.businessId); return createCustomerWithOpening({ ...input, openingAmount: BigInt(input.openingAmount), creditLimit: BigInt(input.creditLimit), address: input.address || null }, { id: `${input.id}-opening`, businessId: input.businessId, customerId: input.id, type: "OPENING", amount: BigInt(input.openingAmount), currency: input.currency, reference: "مانده افتتاحیه" }); }),
  }),
  inventory: router({
    listMovements: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessOwner(requireOpenId(ctx), input.businessId); return listInventoryMovements(input.businessId); }),
    createMovement: protectedProcedure.input(inventoryMovementCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessOwner(requireOpenId(ctx), input.businessId); return createInventoryMovementAtomic({ ...input, quantity: BigInt(input.quantity), secondaryQuantity: BigInt(input.secondaryQuantity), unitCost: BigInt(input.unitCost), expiryDate: input.expiryDate, batchNo: input.batchNo }); }),
  }),
  journal: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessOwner(requireOpenId(ctx), input.businessId); return listJournalEntries(input.businessId); }),
    create: protectedProcedure.input(journalCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessOwner(requireOpenId(ctx), input.businessId); const lines = input.lines.map((line) => ({ accountCode: line.accountCode, debit: money(line.debit, input.currency), credit: money(line.credit, input.currency) })); validateBalanced(lines); return createJournalEntry({ entry: { id: input.id, businessId: input.businessId, no: input.no, memo: input.memo }, lines: input.lines.map((line) => ({ id: line.id, businessId: input.businessId, entryId: input.id, accountCode: line.accountCode, debit: BigInt(line.debit), credit: BigInt(line.credit), currency: input.currency })) }); }),
  }),
  catalog: router({
    categories: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listCategories(input.businessId); }),
      create: protectedProcedure.input(categoryCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createCategory(input); }),
    }),
    units: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listUnits(input.businessId); }),
      create: protectedProcedure.input(unitCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createUnit(input); }),
    }),
    suppliers: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listSuppliers(input.businessId); }),
      create: protectedProcedure.input(supplierCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createSupplier({ ...input, openingAmount: BigInt(input.openingAmount), address: input.address || null }); }),
    }),
    branches: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listBranches(input.businessId); }),
      create: protectedProcedure.input(branchCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createBranch({ ...input, address: input.address || null }); }),
    }),
    barcodes: router({
      create: protectedProcedure.input(barcodeCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createBarcode({ ...input, isPrimary: input.isPrimary ? 1 : 0 }); }),
    }),
    currencies: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listCurrencies(input.businessId); }),
      create: protectedProcedure.input(currencyCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createCurrency({ ...input, isBase: input.isBase ? 1 : 0 }); }),
    }),
    exchangeRates: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listExchangeRates(input.businessId); }),
      create: protectedProcedure.input(exchangeRateCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createExchangeRate({ ...input, rateNumerator: BigInt(input.rateNumerator), rateDenominator: BigInt(input.rateDenominator), effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : undefined }); }),
    }),
    taxRates: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listTaxRates(input.businessId); }),
      create: protectedProcedure.input(taxRateCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createTaxRate({ ...input, percentBasisPoints: BigInt(input.percentBasisPoints), active: input.active ? 1 : 0 }); }),
    }),
    invoiceSettings: router({
      get: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return getInvoiceSettings(input.businessId); }),
      upsert: protectedProcedure.input(invoiceSettingsSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return upsertInvoiceSettings({ ...input, headerText: input.headerText || null, footerText: input.footerText || null, showSku: input.showSku ? 1 : 0, showUnit: input.showUnit ? 1 : 0, showDiscount: input.showDiscount ? 1 : 0, showTax: input.showTax ? 1 : 0, showCustomerPhone: input.showCustomerPhone ? 1 : 0, columnOrder: JSON.stringify(input.columnOrder) }); }),
    }),
  }),
  purchases: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listPurchases(input.businessId); }),
    create: protectedProcedure.input(purchaseCreateSchema).mutation(async ({ ctx, input }) => {
      const openId = requireOpenId(ctx); await assertBusinessAccess(openId, input.businessId);
      const currency = input.currency;
      const totals = purchaseTotals(input.lines.map((line) => ({ quantity: BigInt(line.quantity), unitCost: money(line.unitCost, currency), discount: money(line.discount, currency), tax: money(line.tax, currency) })), input.expenses.map((expense) => money(expense.amount, expense.currency)));
      const purchase = { id: input.id, businessId: input.businessId, documentNo: input.documentNo, supplierId: input.supplierId, warehouseId: input.warehouseId, currency, subtotal: totals.subtotal.amount, tax: totals.tax.amount, landedCost: totals.landedCost.amount, total: totals.total.amount, status: input.status, purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : undefined };
      const lines = input.lines.map((line) => ({ ...line, businessId: input.businessId, purchaseId: input.id, quantity: BigInt(line.quantity), secondaryQuantity: BigInt(line.secondaryQuantity), unitCost: BigInt(line.unitCost), discount: BigInt(line.discount), tax: BigInt(line.tax), expiryDate: line.expiryDate }));
      const expenses = input.expenses.map((expense) => ({ ...expense, businessId: input.businessId, purchaseId: input.id, amount: BigInt(expense.amount) }));
      const posting = input.status === "POSTED" && input.warehouseId ? input.lines.map((line) => {
        const rawBase = BigInt(line.quantity) * BigInt(line.unitCost) - BigInt(line.discount);
        const landedShare = totals.subtotal.amount > 0n ? (totals.landedCost.amount * rawBase) / totals.subtotal.amount : 0n;
        const effectiveUnitCost = (rawBase + landedShare) / BigInt(line.quantity);
        return { line, effectiveUnitCost };
      }) : [];
      const lots = posting.map(({ line, effectiveUnitCost }) => ({ id: `lot-${line.id}`, businessId: input.businessId, productId: line.productId, warehouseId: input.warehouseId, purchaseLineId: line.id, batchNo: line.batchNo, expiryDate: line.expiryDate, receivedQuantity: BigInt(line.quantity), remainingQuantity: BigInt(line.quantity), unitCost: effectiveUnitCost, currency, receivedAt: input.purchasedAt ? new Date(input.purchasedAt) : undefined }));
      const movements = posting.map(({ line, effectiveUnitCost }) => ({ id: `movement-${line.id}`, businessId: input.businessId, productId: line.productId, warehouseId: input.warehouseId, type: "IN" as const, quantity: BigInt(line.quantity), secondaryQuantity: BigInt(line.secondaryQuantity), unitCost: effectiveUnitCost, currency, reference: input.documentNo, expiryDate: line.expiryDate, batchNo: line.batchNo }));
      const journal = input.status === "POSTED" ? { entry: { id: `purchase-journal-${input.id}`, businessId: input.businessId, no: `PUR-${input.documentNo}`, memo: `خرید ${input.documentNo}` }, lines: [{ id: `purchase-journal-${input.id}-debit`, businessId: input.businessId, entryId: `purchase-journal-${input.id}`, accountCode: "1400", debit: totals.total.amount, credit: 0n, currency }, { id: `purchase-journal-${input.id}-credit`, businessId: input.businessId, entryId: `purchase-journal-${input.id}`, accountCode: input.supplierId ? "2100" : "1100", debit: 0n, credit: totals.total.amount, currency }] } : undefined;
      const result = await createPurchaseAtomic({ purchase, lines, expenses, lots, movements, journal });
      await appendAuditLog({ id: `${input.id}-created`, businessId: input.businessId, actorOpenId: openId, action: "CREATE", entityType: "PURCHASE", entityId: input.id, payload: JSON.stringify({ documentNo: input.documentNo, total: totals.total.amount.toString() }) });
      return { ...result, totals: { subtotal: totals.subtotal.amount.toString(), discount: totals.discount.amount.toString(), tax: totals.tax.amount.toString(), landedCost: totals.landedCost.amount.toString(), total: totals.total.amount.toString(), currency } };
    }),
  }),
  sales: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listSales(input.businessId); }),
    lines: protectedProcedure.input(scoped.extend({ saleId: idSchema })).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listSaleLines(input.businessId, input.saleId); }),
    create: protectedProcedure.input(saleCreateSchema).mutation(async ({ ctx, input }) => {
      const openId = requireOpenId(ctx); await assertBusinessAccess(openId, input.businessId);
      const totals = invoiceTotals(input.lines.map((line) => ({ description: line.description, quantity: BigInt(line.quantity), unitPrice: money(line.unitPrice.amount, line.unitPrice.currency), discountPercent: BigInt(line.discountPercent) })), BigInt(input.taxPercent), BigInt(input.paid));
      const lineRows: Array<{ id: string; businessId: string; saleId: string; productId: string; quantity: bigint; unitPrice: bigint; discount: bigint; tax: bigint; costOfGoods: bigint; currency: string }> = [];
      const movements: Array<{ id: string; businessId: string; productId: string; warehouseId: string; type: "OUT"; quantity: bigint; secondaryQuantity: bigint; unitCost: bigint; currency: string; reference: string; expiryDate: string | null; batchNo: string }> = [];
      const lotUpdates = new Map<string, { id: string; remainingQuantity: bigint; unitCost?: bigint }>();
      for (const line of input.lines) {
        let costOfGoods = 0n;
        if (line.productId) {
          if (!input.warehouseId) throw new Error("warehouse_required");
          const dbLots = await listInventoryLots(input.businessId, line.productId, input.warehouseId);
          const layers: CostLayer[] = dbLots.map((lot) => ({ id: lot.id, quantity: lot.remainingQuantity, unitCost: money(lot.unitCost, lot.currency), receivedAt: String(lot.receivedAt) }));
          const costing = consumeCostLayers(layers, BigInt(line.quantity), input.costingMethod);
          costOfGoods = costing.totalCost.amount;
          const consumed = BigInt(line.quantity); let left = consumed;
          for (const lot of dbLots) { if (left === 0n) break; const take = lot.remainingQuantity < left ? lot.remainingQuantity : left; if (take > 0n) { lotUpdates.set(lot.id, { id: lot.id, remainingQuantity: lot.remainingQuantity - take }); left -= take; } }
          for (const allocation of costing.allocations) movements.push({ id: `sale-movement-${input.id}-${line.productId}-${movements.length}`, businessId: input.businessId, productId: line.productId, warehouseId: input.warehouseId, type: "OUT", quantity: allocation.quantity, secondaryQuantity: 0n, unitCost: allocation.unitCost.amount, currency: allocation.unitCost.currency, reference: input.documentNo, expiryDate: null, batchNo: allocation.lotId });
        }
        const gross = BigInt(line.quantity) * BigInt(line.unitPrice.amount); const discount = (gross * BigInt(line.discountPercent)) / 100n;
        lineRows.push({ id: `${input.id}-line-${line.productId || lineRows.length}`, businessId: input.businessId, saleId: input.id, productId: line.productId, quantity: BigInt(line.quantity), unitPrice: BigInt(line.unitPrice.amount), discount, tax: 0n, costOfGoods, currency: line.unitPrice.currency });
      }
      const sale = { id: input.id, businessId: input.businessId, documentNo: input.documentNo, customerId: input.customerId || "", warehouseId: input.warehouseId, currency: totals.total.currency, subtotal: totals.subtotal.amount, discount: totals.discount.amount, tax: totals.tax.amount, total: totals.total.amount, paid: totals.paid.amount, receivable: totals.receivable.amount, status: input.status };
      const payments = totals.paid.amount > 0n ? [{ id: `${input.id}-payment`, businessId: input.businessId, saleId: input.id, method: input.paymentMethod, amount: totals.paid.amount, currency: totals.paid.currency, reference: input.documentNo }] : [];
      const customerEntry = input.customerId && totals.receivable.amount > 0n ? { id: `${input.id}-customer`, businessId: input.businessId, customerId: input.customerId, type: "INVOICE" as const, amount: totals.receivable.amount, currency: totals.receivable.currency, reference: input.documentNo } : null;
      const costOfGoods = lineRows.reduce((sum, line) => sum + line.costOfGoods, 0n);
      const journal = input.status === "POSTED" ? { entry: { id: `sale-journal-${input.id}`, businessId: input.businessId, no: `SAL-${input.documentNo}`, memo: `فروش ${input.documentNo}` }, lines: [{ id: `sale-journal-${input.id}-cash`, businessId: input.businessId, entryId: `sale-journal-${input.id}`, accountCode: "1100", debit: totals.paid.amount, credit: 0n, currency: totals.total.currency }, { id: `sale-journal-${input.id}-receivable`, businessId: input.businessId, entryId: `sale-journal-${input.id}`, accountCode: "1200", debit: totals.receivable.amount, credit: 0n, currency: totals.total.currency }, { id: `sale-journal-${input.id}-revenue`, businessId: input.businessId, entryId: `sale-journal-${input.id}`, accountCode: "4100", debit: 0n, credit: totals.total.amount, currency: totals.total.currency }, { id: `sale-journal-${input.id}-cogs`, businessId: input.businessId, entryId: `sale-journal-${input.id}`, accountCode: "5100", debit: costOfGoods, credit: 0n, currency: totals.total.currency }, { id: `sale-journal-${input.id}-inventory`, businessId: input.businessId, entryId: `sale-journal-${input.id}`, accountCode: "1400", debit: 0n, credit: costOfGoods, currency: totals.total.currency }] } : undefined;
      const result = await createPostedSaleAtomic({ sale, lines: lineRows, payments, customerEntry, movements, lotUpdates: [...lotUpdates.values()], journal });
      await appendAuditLog({ id: `${input.id}-created`, businessId: input.businessId, actorOpenId: openId, action: "CREATE", entityType: "SALE", entityId: input.id, payload: JSON.stringify({ total: totals.total.amount.toString(), costingMethod: input.costingMethod }) });
      return { ...result, totals: { subtotal: totals.subtotal.amount.toString(), discount: totals.discount.amount.toString(), tax: totals.tax.amount.toString(), total: totals.total.amount.toString(), paid: totals.paid.amount.toString(), receivable: totals.receivable.amount.toString(), currency: totals.total.currency } };
    }),
  }),
  installments: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listInstallments(input.businessId); }),
    create: protectedProcedure.input(installmentCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); const total = input.installments.reduce((sum, row) => sum + BigInt(row.amount), 0n); if (total !== BigInt(input.totalAmount)) throw new Error("installments_do_not_balance"); return createInstallmentPlanAtomic({ plan: { id: input.id, businessId: input.businessId, saleId: input.saleId, customerId: input.customerId, currency: input.currency, totalAmount: BigInt(input.totalAmount) }, rows: input.installments.map((row) => ({ ...row, businessId: input.businessId, planId: input.id, amount: BigInt(row.amount), dueDate: row.dueDate })) }); }),
  }),
  checks: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listChecks(input.businessId); }),
    create: protectedProcedure.input(checkCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createCheck({ ...input, amount: BigInt(input.amount), dueDate: input.dueDate }); }),
    updateStatus: protectedProcedure.input(checkStatusSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return updateCheckStatus(input.businessId, input.id, input.status); }),
  }),
  partners: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listPartners(input.businessId); }),
    create: protectedProcedure.input(partnerCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createPartner({ ...input, shareBasisPoints: BigInt(input.shareBasisPoints), openingCapital: BigInt(input.openingCapital) }); }),
    addTransaction: protectedProcedure.input(partnerTransactionSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createPartnerTransaction({ ...input, amount: BigInt(input.amount) }); }),
    transactions: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listPartnerTransactions(input.businessId); }),
  }),
  reports: router({
    overview: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); const [salesRows, purchaseRows, installmentRows, checkRows, partnerRows] = await Promise.all([listSales(input.businessId), listPurchases(input.businessId), listInstallments(input.businessId), listChecks(input.businessId), listPartnerTransactions(input.businessId)]); return { salesCount: salesRows.length, purchaseCount: purchaseRows.length, installmentsDue: installmentRows.filter((row) => row.status !== "PAID").length, checksPending: checkRows.filter((row) => row.status === "PENDING").length, partnerTransactions: partnerRows.length, salesTotal: salesRows.reduce((sum, row) => sum + row.total, 0n).toString(), purchasesTotal: purchaseRows.reduce((sum, row) => sum + row.total, 0n).toString() }; }),
  }),
  manufacturing: router({
    recipes: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listRecipes(input.businessId); }),
      create: protectedProcedure.input(recipeCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return createRecipe({ recipe: { id: input.id, businessId: input.businessId, productId: input.productId, name: input.name, outputQuantity: BigInt(input.outputQuantity), unit: input.unit }, lines: input.lines.map((line) => ({ ...line, businessId: input.businessId, recipeId: input.id, quantity: BigInt(line.quantity) })) }); }),
    }),
    orders: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listProductionOrders(input.businessId); }),
      consumption: protectedProcedure.input(scoped.extend({ orderId: idSchema })).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listProductionConsumption(input.businessId, input.orderId); }),
      post: protectedProcedure.input(productionPostSchema).mutation(async ({ ctx, input }) => {
        const openId = requireOpenId(ctx); await assertBusinessAccess(openId, input.businessId); const recipes = await listRecipes(input.businessId); const recipe = recipes.find((row) => row.id === input.recipeId); if (!recipe) throw new Error("recipe_not_found");
        const requiredLines = scaleRecipe(recipe.lines.map((line) => ({ productId: line.materialProductId, quantity: line.quantity, unit: line.unit, unitCost: money(0n, input.currency) })), BigInt(input.actualQuantity), recipe.outputQuantity);
        const consumptions: Array<{ id: string; businessId: string; orderId: string; productId: string; quantity: bigint; unitCost: bigint; currency: string }> = []; const movements: Array<{ id: string; businessId: string; productId: string; warehouseId: string; type: "OUT" | "IN"; quantity: bigint; secondaryQuantity: bigint; unitCost: bigint; currency: string; reference: string; expiryDate: string | null; batchNo: string }> = []; const lotUpdates = new Map<string, { id: string; remainingQuantity: bigint }>(); let totalCost = 0n;
        for (const line of requiredLines) { const lots = await listInventoryLots(input.businessId, line.productId, input.warehouseId); const layers: CostLayer[] = lots.map((lot) => ({ id: lot.id, quantity: lot.remainingQuantity, unitCost: money(lot.unitCost, lot.currency), receivedAt: String(lot.receivedAt) })); const allocation = consumeCostLayers(layers, line.quantity, input.costingMethod); totalCost += allocation.totalCost.amount; consumptions.push({ id: `${input.id}-consumption-${line.productId}`, businessId: input.businessId, orderId: input.id, productId: line.productId, quantity: line.quantity, unitCost: line.quantity > 0n ? allocation.totalCost.amount / line.quantity : 0n, currency: input.currency }); let left = line.quantity; for (const lot of lots) { if (left === 0n) break; const take = lot.remainingQuantity < left ? lot.remainingQuantity : left; if (take > 0n) { lotUpdates.set(lot.id, { id: lot.id, remainingQuantity: lot.remainingQuantity - take }); left -= take; } } for (const part of allocation.allocations) movements.push({ id: `${input.id}-out-${movements.length}`, businessId: input.businessId, productId: line.productId, warehouseId: input.warehouseId, type: "OUT", quantity: part.quantity, secondaryQuantity: 0n, unitCost: part.unitCost.amount, currency: part.unitCost.currency, reference: input.id, expiryDate: null, batchNo: part.lotId }); }
        const unitCost = BigInt(input.actualQuantity) > 0n ? totalCost / BigInt(input.actualQuantity) : 0n; const outputLot = { id: `${input.id}-output-lot`, businessId: input.businessId, productId: recipe.productId, warehouseId: input.warehouseId, purchaseLineId: input.id, batchNo: input.id, expiryDate: null, receivedQuantity: BigInt(input.actualQuantity), remainingQuantity: BigInt(input.actualQuantity), unitCost, currency: input.currency, receivedAt: new Date() }; movements.push({ id: `${input.id}-in`, businessId: input.businessId, productId: recipe.productId, warehouseId: input.warehouseId, type: "IN", quantity: BigInt(input.actualQuantity), secondaryQuantity: 0n, unitCost, currency: input.currency, reference: input.id, expiryDate: null, batchNo: input.id });
        const journalLines = productionJournal(money(totalCost, input.currency)).map((line, index) => ({ id: `${input.id}-journal-line-${index}`, businessId: input.businessId, entryId: `${input.id}-journal`, ...line })); const result = await postProductionAtomic({ order: { id: input.id, businessId: input.businessId, recipeId: input.recipeId, warehouseId: input.warehouseId, plannedQuantity: BigInt(input.plannedQuantity), actualQuantity: BigInt(input.actualQuantity), totalCost, currency: input.currency, status: "POSTED" }, consumptions, outputs: [{ id: `${input.id}-output`, businessId: input.businessId, orderId: input.id, productId: recipe.productId, quantity: BigInt(input.actualQuantity), unitCost, currency: input.currency }], outputLots: [outputLot], movements, lotUpdates: [...lotUpdates.values()], journal: { entry: { id: `${input.id}-journal`, businessId: input.businessId, no: `PROD-${input.id}`, memo: `تولید ${recipe.name}` }, lines: journalLines } }); await appendAuditLog({ id: `${input.id}-audit`, businessId: input.businessId, actorOpenId: openId, action: "POST", entityType: "PRODUCTION", entityId: input.id, payload: JSON.stringify({ totalCost: totalCost.toString(), method: input.costingMethod }) }); return result;
      }),
    }),
  }),
  exports: router({
    report: protectedProcedure.input(reportExportSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); const rows = input.report === "SALES" ? await listSales(input.businessId) : input.report === "PURCHASES" ? await listPurchases(input.businessId) : input.report === "INVENTORY" ? await listInventoryMovements(input.businessId) : input.report === "RECEIVABLES" ? await listCustomers(input.businessId) : await listJournalEntries(input.businessId); const table = { title: input.report, columns: ["ID", "Date", "Amount", "Status"], rows: rows.slice(0, 500).map((row) => [String((row as { id?: string }).id ?? ""), String((row as { createdAt?: Date; soldAt?: Date; purchasedAt?: Date }).createdAt ?? (row as { soldAt?: Date }).soldAt ?? (row as { purchasedAt?: Date }).purchasedAt ?? ""), String((row as { total?: bigint; amount?: bigint }).total ?? (row as { amount?: bigint }).amount ?? ""), String((row as { status?: string }).status ?? "")] ) }; if (input.format === "XLSX") return { filename: `${input.report}.xlsx`, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: reportXlsx(table).toString("base64") }; return { filename: `${input.report}.pdf`, mime: "application/pdf", base64: Buffer.from(await reportPdf(table)).toString("base64") }; }),
  }),
  messages: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listMessageLogs(input.businessId); }),
    send: protectedProcedure.input(messageSendSchema).mutation(async ({ ctx, input }) => { const openId = requireOpenId(ctx); await assertBusinessAccess(openId, input.businessId); const id = `message-${Date.now()}`; await createMessageLog({ id, businessId: input.businessId, channel: input.channel, recipient: input.recipient, template: input.template, status: "PENDING" }); try { const result = await sendProviderMessage({ channel: input.channel, recipient: input.recipient, text: input.text }); await updateMessageLog(id, "SENT", result.providerMessageId); return { id, status: "SENT" }; } catch (error) { await updateMessageLog(id, "FAILED", "", error instanceof Error ? error.message : "delivery_failed"); throw error; } }),
    sendDailySummary: protectedProcedure.input(dailySummarySendSchema).mutation(async ({ ctx, input }) => { const openId = requireOpenId(ctx); await assertBusinessAccess(openId, input.businessId); const date = input.date ?? new Date().toISOString().slice(0, 10); const [salesRows, purchaseRows, customerRows, movementRows] = await Promise.all([listSales(input.businessId), listPurchases(input.businessId), listCustomers(input.businessId), listInventoryMovements(input.businessId)]); const text = dailySummary({ businessName: input.businessId, date, sales: salesRows, purchases: purchaseRows, customers: customerRows, movements: movementRows }); const id = `daily-summary-${input.businessId}-${date}-${input.channel}`; await createMessageLog({ id, businessId: input.businessId, channel: input.channel, recipient: input.recipient, template: "DAILY_SUMMARY", status: "PENDING" }); try { const result = await sendProviderMessage({ channel: input.channel, recipient: input.recipient, text }); await updateMessageLog(id, "SENT", result.providerMessageId); return { id, status: "SENT", text }; } catch (error) { await updateMessageLog(id, "FAILED", "", error instanceof Error ? error.message : "daily_summary_delivery_failed"); throw error; } }),
  }),
  backup: router({
    config: protectedProcedure.input(backupConfigSchema).mutation(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); const encryptedKeyHint = encryptBackup({ businessId: input.businessId, configuredAt: new Date().toISOString() }, input.password).checksum.slice(0, 12); return upsertBackupConfig({ id: `backup-${input.businessId}`, businessId: input.businessId, enabled: input.enabled ? 1 : 0, frequency: input.frequency, destination: input.destination, telegramChatId: input.telegramChatId, encryptedKeyHint }); }),
    getConfig: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return getBackupConfig(input.businessId); }),
    runs: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listBackupRuns(input.businessId); }),
    exportEncrypted: protectedProcedure.input(backupRunSchema).mutation(async ({ ctx, input }) => { const openId = requireOpenId(ctx); await assertBusinessAccess(openId, input.businessId); const runId = `backup-${input.businessId}-${Date.now()}`; await createBackupRun({ id: runId, businessId: input.businessId, destination: input.destination, status: "STARTED" }); try { const payload = { businessId: input.businessId, generatedAt: new Date().toISOString(), sales: await listSales(input.businessId), purchases: await listPurchases(input.businessId), journals: await listJournalEntries(input.businessId) }; const encrypted = encryptBackup(payload, input.password); await finishBackupRun(runId, "COMPLETED", encrypted.checksum); return { runId, checksum: encrypted.checksum, envelope: encrypted.envelope }; } catch (error) { await finishBackupRun(runId, "FAILED", "", error instanceof Error ? error.message : "backup_failed"); throw error; } }),
  }),
  updates: router({ check: publicProcedure.input(updateCheckSchema).query(async ({ input }) => { const latest = await latestUpdate(input.channel); if (!latest) return { updateAvailable: false, currentVersion: input.currentVersion }; return { updateAvailable: latest.version !== input.currentVersion, currentVersion: input.currentVersion, ...latest }; }) }),
  team: router({
    members: router({
      list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listMembers(input.businessId); }),
      create: protectedProcedure.input(memberCreateSchema).mutation(async ({ ctx, input }) => { await assertBusinessOwner(requireOpenId(ctx), input.businessId); return createMember({ ...input, active: 1 }); }),
    }),
  }),
  audit: router({
    list: protectedProcedure.input(scoped).query(async ({ ctx, input }) => { await assertBusinessAccess(requireOpenId(ctx), input.businessId); return listAuditLogs(input.businessId); }),
  }),
});
