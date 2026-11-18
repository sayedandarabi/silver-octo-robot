import { describe, expect, it } from "vitest";
import { encodeEscPos, receiptFromCart } from "../lib/receipt";
import { dailySummary } from "../server/saderatpro-daily-summary";
import { sendProviderMessage } from "../server/saderatpro-providers";

describe("Phase 9 printer and provider adapters", () => {
  it("builds one shared receipt document for all print targets", () => {
    const receipt = receiptFromCart({ documentNo: "POS-1", lines: [{ name: "Tea", quantity: 2, unitPrice: 100, discountPercent: 10 }], tax: 18, discount: 20 });
    expect(receipt.subtotal).toBe(200);
    expect(receipt.total).toBe(198);
    expect(encodeEscPos(receipt).length).toBeGreaterThan(20);
  });

  it("formats a server-truth daily summary without floating point money", () => {
    const text = dailySummary({ businessName: "Demo", date: "2026-11-18", sales: [{ total: 1250n }], purchases: [{ total: 400n }], customers: [{ openingAmount: 900n }], movements: [{ quantity: 2n }] });
    expect(text).toContain("1,250 AFN");
    expect(text).toContain("طلب ثبت‌شده مشتریان: 900 AFN");
  });

  it("does not claim provider success when Telegram is not configured", async () => {
    const previous = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    await expect(sendProviderMessage({ channel: "TELEGRAM", recipient: "123", text: "test" })).rejects.toThrow("telegram_not_configured");
    if (previous) process.env.TELEGRAM_BOT_TOKEN = previous;
  });
});
