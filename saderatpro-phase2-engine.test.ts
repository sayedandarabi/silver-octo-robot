import { describe, expect, it } from "vitest";
import { money } from "../lib/saderatpro-engine";
import { allocatePartnerProfit, consumeCostLayers } from "../lib/saderatpro-modules-engine";

describe("SaderatPro Phase 2 costing", () => {
  const layers = [
    { id: "lot-a", quantity: 5n, unitCost: money("10", "AFN"), receivedAt: "2026-01-01T00:00:00.000Z" },
    { id: "lot-b", quantity: 5n, unitCost: money("20", "AFN"), receivedAt: "2026-01-02T00:00:00.000Z" },
  ];
  it("consumes FIFO layers in receipt order", () => {
    const result = consumeCostLayers(layers, 6n, "FIFO");
    expect(result.totalCost.amount).toBe(70n);
    expect(result.allocations.map((row) => row.lotId)).toEqual(["lot-a", "lot-b"]);
    expect(result.remaining.find((row) => row.id === "lot-b")?.quantity).toBe(4n);
  });
  it("consumes LIFO layers from the newest receipt", () => {
    const result = consumeCostLayers(layers, 6n, "LIFO");
    expect(result.totalCost.amount).toBe(110n);
    expect(result.allocations.map((row) => row.lotId)).toEqual(["lot-b", "lot-a"]);
  });
  it("uses weighted average for the configured average method", () => {
    const result = consumeCostLayers(layers, 4n, "AVERAGE");
    expect(result.totalCost.amount).toBe(60n);
    expect(result.allocations[0].unitCost.amount).toBe(15n);
    expect(result.remaining[0].quantity).toBe(6n);
  });
  it("requires partner shares to add up to 100 percent", () => {
    const result = allocatePartnerProfit(money("1000", "AFN"), [{ id: "p1", shareBasisPoints: 6000n }, { id: "p2", shareBasisPoints: 4000n }]);
    expect(result.map((row) => row.amount.amount)).toEqual([600n, 400n]);
    expect(() => allocatePartnerProfit(money("1000", "AFN"), [{ id: "p1", shareBasisPoints: 5000n }])).toThrow("partner_shares_must_equal_10000");
  });
});
