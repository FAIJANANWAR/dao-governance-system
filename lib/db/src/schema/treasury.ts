import { pgTable, serial, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionTypeEnum = pgEnum("transaction_type", ["inflow", "outflow", "swap"]);

export const treasuryTransactionsTable = pgTable("treasury_transactions", {
  id: serial("id").primaryKey(),
  type: transactionTypeEnum("type").notNull(),
  asset: text("asset").notNull(),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  valueUsd: numeric("value_usd", { precision: 20, scale: 2 }).notNull(),
  address: text("address").notNull(),
  txHash: text("tx_hash").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTreasuryTransactionSchema = createInsertSchema(treasuryTransactionsTable).omit({ id: true, createdAt: true });
export type InsertTreasuryTransaction = z.infer<typeof insertTreasuryTransactionSchema>;
export type TreasuryTransaction = typeof treasuryTransactionsTable.$inferSelect;
