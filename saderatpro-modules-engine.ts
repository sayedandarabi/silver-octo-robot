import { invoiceTotals, money, validateBalanced, type Money } from "./saderatpro-engine";
import type { CustomerLedgerEntry, InventoryMovement, JournalEntry, PurchaseLine, ChartAccount } from "./saderatpro-modules";

export type CostingMethod = "AVERAGE" | "FIFO" | "LIFO";
export type CostLayer = { id: string; quantity: bigint; unitCost: Money; receivedAt: string };
export type CostAllocation = { lotId: string; quantity: bigint; unitCost: Money; totalCost: Money };

export function inventoryBalance(movements: InventoryMovement[], productId: string, warehouseId: string): bigint {
  return movements.filter((m) => m.productId === productId && m.warehouseId === warehouseId).reduce((balance, movement) => balance + (movement.type === "IN" ? movement.quantity : movement.type === "OUT" ? -movement.quantity : movement.quantity - balance), 0n);
}

export function inventoryValue(movements: InventoryMovement[], productId: string, warehouseId: string): Money {
  const relevant = movements.filter((m) => m.productId === productId && m.warehouseId === warehouseId);
  const quantity = inventoryBalance(movements, productId, warehouseId);
  const value = relevant.reduce((sum, movement) => sum + (movement.type === "IN" ? movement.quantity * movement.unitCost.amount : movement.type === "OUT" ? -(movement.quantity * movement.unitCost.amount) : 0n), 0n);
  return money(value < 0n ? 0n : value, relevant[0]?.unitCost.currency ?? "AFN");
}

export function customerBalance(entries: CustomerLedgerEntry[], customerId: string): Money {
  const relevant = entries.filter((entry) => entry.customerId === customerId);
  let balance = 0n; let currency = "AFN";
  for (const entry of relevant) { currency = entry.amount.currency; const debit = entry.type === "INVOICE" || entry.type === "OPENING" ? entry.amount.amount : 0n; const credit = entry.type === "PAYMENT" || entry.type === "RETURN" ? entry.amount.amount : 0n; balance += debit - credit; }
  return money(balance < 0n ? 0n : balance, currency);
}

export function purchaseTotals(lines: PurchaseLine[], paid: bigint): { subtotal: Money; discount: Money; total: Money; paid: Money; payable: Money } {
  const result = invoiceTotals(lines.map((line) => ({ description: line.description, quantity: line.quantity, unitPrice: line.unitCost, discountPercent: line.discountPercent })), 0n, paid);
  return { subtotal: result.subtotal, discount: result.discount, total: result.total, paid: result.paid, payable: result.receivable };
}

export function consumeCostLayers(layers: CostLayer[], quantity: bigint, method: CostingMethod): { allocations: CostAllocation[]; remaining: CostLayer[]; totalCost: Money } {
  if (quantity <= 0n) throw new Error("quantity_required");
  if (layers.length === 0) throw new Error("inventory_lots_required");
  const currency = layers[0].unitCost.currency;
  if (layers.some((layer) => layer.unitCost.currency !== currency || layer.quantity < 0n)) throw new Error("invalid_cost_layer");
  const available = layers.reduce((sum, layer) => sum + layer.quantity, 0n);
  if (available < quantity) throw new Error("negative_inventory");
  if (method === "AVERAGE") {
    const totalValue = layers.reduce((sum, layer) => sum + layer.quantity * layer.unitCost.amount, 0n);
    const average = totalValue / available;
    const remainingQuantity = available - quantity;
    const remaining: CostLayer[] = remainingQuantity > 0n ? [{ id: "average-balance", quantity: remainingQuantity, unitCost: money(totalValue / remainingQuantity, currency), receivedAt: new Date().toISOString() }] : [];
    return { allocations: [{ lotId: "average-cost", quantity, unitCost: money(average, currency), totalCost: money(average * quantity, currency) }], remaining, totalCost: money(average * quantity, currency) };
  }
  const ordered = [...layers].sort((a, b) => (method === "FIFO" ? 1 : -1) * a.receivedAt.localeCompare(b.receivedAt));
  let remainingToConsume = quantity; let cost = 0n;
  const allocations: CostAllocation[] = []; const remainingById = new Map(layers.map((layer) => [layer.id, layer.quantity]));
  for (const layer of ordered) {
    if (remainingToConsume === 0n) break;
    const take = layer.quantity < remainingToConsume ? layer.quantity : remainingToConsume;
    if (take === 0n) continue;
    const totalCost = money(take * layer.unitCost.amount, currency);
    allocations.push({ lotId: layer.id, quantity: take, unitCost: layer.unitCost, totalCost });
    remainingById.set(layer.id, layer.quantity - take); remainingToConsume -= take; cost += totalCost.amount;
  }
  return { allocations, remaining: layers.filter((layer) => (remainingById.get(layer.id) ?? 0n) > 0n).map((layer) => ({ ...layer, quantity: remainingById.get(layer.id) ?? 0n })), totalCost: money(cost, currency) };
}

export function allocatePartnerProfit(profit: Money, partners: Array<{ id: string; shareBasisPoints: bigint }>): Array<{ partnerId: string; amount: Money }> {
  if (profit.amount < 0n) throw new Error("negative_profit");
  const totalShare = partners.reduce((sum, partner) => sum + partner.shareBasisPoints, 0n);
  if (totalShare !== 10000n) throw new Error("partner_shares_must_equal_10000");
  return partners.map((partner) => ({ partnerId: partner.id, amount: money((profit.amount * partner.shareBasisPoints) / 10000n, profit.currency) }));
}

export function trialBalance(entries: JournalEntry[]): Array<{ accountCode: string; debit: Money; credit: Money; balance: Money }> {
  const totals = new Map<string, { debit: bigint; credit: bigint; currency: string }>();
  for (const entry of entries) { validateBalanced(entry.lines); for (const line of entry.lines) { const current = totals.get(line.accountCode) ?? { debit: 0n, credit: 0n, currency: line.debit.currency }; current.debit += line.debit.amount; current.credit += line.credit.amount; totals.set(line.accountCode, current); } }
  return [...totals.entries()].map(([accountCode, total]) => ({ accountCode, debit: money(total.debit, total.currency), credit: money(total.credit, total.currency), balance: money(total.debit >= total.credit ? total.debit - total.credit : total.credit - total.debit, total.currency) }));
}

export function profitLoss(entries: JournalEntry[], accounts: ChartAccount[]): { revenue: Money; expenses: Money; profit: Money } {
  const balances = trialBalance(entries); const accountMap = new Map(accounts.map((account) => [account.code, account])); let revenue = 0n; let expenses = 0n; let currency = "AFN";
  for (const row of balances) { const account = accountMap.get(row.accountCode); if (!account) continue; currency = row.balance.currency; if (account.class === "REVENUE") revenue += row.credit.amount - row.debit.amount; if (account.class === "EXPENSE") expenses += row.debit.amount - row.credit.amount; }
  return { revenue: money(revenue, currency), expenses: money(expenses, currency), profit: money(revenue - expenses, currency) };
}
