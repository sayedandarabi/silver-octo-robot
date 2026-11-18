import { describe, expect, it } from "vitest";
import { money, purchaseTotals } from "../lib/saderatpro-engine";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("SaderatPro Phase 1 commercial foundation", () => {
  it("computes precise purchase totals including discount, tax, and landed cost", () => {
    const result = purchaseTotals([
      { quantity: 2n, unitCost: money("100", "AFN"), discount: money("10", "AFN"), tax: money("20", "AFN") },
      { quantity: 1n, unitCost: money("50", "AFN"), discount: money("0", "AFN"), tax: money("5", "AFN") },
    ], [money("15", "AFN"), money("5", "AFN")]);
    expect(result.subtotal.amount).toBe(250n);
    expect(result.discount.amount).toBe(10n);
    expect(result.tax.amount).toBe(25n);
    expect(result.landedCost.amount).toBe(20n);
    expect(result.total.amount).toBe(285n);
  });

  it("rejects unauthenticated access to the new catalog, purchase, and audit routes", async () => {
    const ctx = { req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null } as TrpcContext;
    const caller = appRouter.createCaller(ctx).saderatpro;
    await expect(caller.catalog.categories.list({ businessId: "phase1-test" })).rejects.toThrow();
    await expect(caller.purchases.list({ businessId: "phase1-test" })).rejects.toThrow();
    await expect(caller.audit.list({ businessId: "phase1-test" })).rejects.toThrow();
  });
});
