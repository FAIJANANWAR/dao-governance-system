import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  ens: text("ens"),
  avatarUrl: text("avatar_url"),
  votingPower: numeric("voting_power", { precision: 20, scale: 4 }).notNull().default("0"),
  tokenBalance: numeric("token_balance", { precision: 20, scale: 4 }).notNull().default("0"),
  proposalsCreated: integer("proposals_created").notNull().default(0),
  votesCast: integer("votes_cast").notNull().default(0),
  delegatedTo: text("delegated_to"),
  delegatedToEns: text("delegated_to_ens"),
  delegatorsCount: integer("delegators_count").notNull().default(0),
  bio: text("bio"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true, createdAt: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof membersTable.$inferSelect;
