import { pgTable, serial, text, integer, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const proposalStatusEnum = pgEnum("proposal_status", ["active", "pending", "executed", "defeated", "queued"]);

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: proposalStatusEnum("status").notNull().default("pending"),
  proposer: text("proposer").notNull(),
  proposerEns: text("proposer_ens"),
  votesFor: numeric("votes_for", { precision: 20, scale: 4 }).notNull().default("0"),
  votesAgainst: numeric("votes_against", { precision: 20, scale: 4 }).notNull().default("0"),
  votesAbstain: numeric("votes_abstain", { precision: 20, scale: 4 }).notNull().default("0"),
  quorumRequired: numeric("quorum_required", { precision: 20, scale: 4 }).notNull().default("100000"),
  quorumReached: boolean("quorum_reached").notNull().default(false),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  executedAt: timestamp("executed_at"),
  actions: text("actions").array().notNull().default([]),
  timelockDelay: integer("timelock_delay"),
  discussionUrl: text("discussion_url"),
  snapshotBlock: integer("snapshot_block"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({ id: true, createdAt: true });
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
