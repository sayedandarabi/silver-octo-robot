import { z } from "zod";

export const businessIdSchema = z.string().min(1).max(64);
export const moneySchema = z.object({ amount: z.string().regex(/^\d+$/, "amount must be an integer string"), currency: z.string().min(3).max(4) });
export const saleCreateSchema = z.object({ businessId: businessIdSchema, documentNo: z.string().min(1).max(64), customerId: z.string().nullable(), lines: z.array(z.object({ description: z.string().min(1), quantity: z.string().regex(/^\d+$/), unitPrice: moneySchema, discountPercent: z.string().regex(/^\d+$/) })).min(1), taxPercent: z.string().regex(/^\d+$/), paid: z.string().regex(/^\d+$/) });
export const expenseCreateSchema = z.object({ businessId: businessIdSchema, category: z.string().min(1).max(64), title: z.string().min(1).max(160), amount: moneySchema, note: z.string().max(500).default("") });
export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
