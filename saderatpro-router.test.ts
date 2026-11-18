import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("SaderatPro backend contract", () => {
  it("calculates an invoice through the API router without floating-point money", async () => {
    const ctx = { req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null } as TrpcContext;
    const result = await appRouter.createCaller(ctx).saderatpro.calculateInvoice({
      businessId: "demo-business",
      documentNo: "INV-TEST-1",
      customerId: null,
      lines: [{ description: "چای", quantity: "2", unitPrice: { amount: "1000", currency: "AFN" }, discountPercent: "0" }],
      taxPercent: "5",
      paid: "500",
    });
    expect(result).toMatchObject({ subtotal: "2000", tax: "100", total: "2100", paid: "500", receivable: "1600", currency: "AFN" });
  });
  it("protects business-scoped customer routes", async () => {
    const ctx = { req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null } as TrpcContext;
    await expect(appRouter.createCaller(ctx).saderatpro.customers.list({ businessId: "demo-business" })).rejects.toThrow();
  });
});
