type Row = { total?: bigint | number | null; amount?: bigint | number | null; openingAmount?: bigint | number | null; quantity?: bigint | number | null; status?: string | null };
const asBigInt = (value: Row["total"] | Row["openingAmount"]) => typeof value === "bigint" ? value : BigInt(value ?? 0);
const afn = (value: bigint) => `${value.toLocaleString("en-US")} AFN`;
export function dailySummary(input: { businessName: string; date: string; sales: Row[]; purchases: Row[]; customers: Row[]; movements: Row[] }) {
  const salesTotal = input.sales.reduce((sum, row) => sum + asBigInt(row.total), 0n); const purchasesTotal = input.purchases.reduce((sum, row) => sum + asBigInt(row.total), 0n); const receivables = input.customers.reduce((sum, row) => sum + asBigInt(row.amount ?? row.openingAmount), 0n); const movementCount = input.movements.length;
  return [`${input.businessName} — خلاصه روزانه`, `تاریخ: ${input.date}`, "", `فروش: ${input.sales.length} فاکتور / ${afn(salesTotal)}`, `خرید: ${input.purchases.length} فاکتور / ${afn(purchasesTotal)}`, `تغییرات انبار: ${movementCount}`, `طلب ثبت‌شده مشتریان: ${afn(receivables)}`, "", "این گزارش از اطلاعات ثبت‌شده سرور تهیه شده است."].join("\n");
}
