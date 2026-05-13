import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTypeEnum = pgEnum("activity_type", [
  "proposal_created",
  "vote_cast",
  "proposal_executed",
  "proposal_defeated",
  "delegation_changed",
  "comment_added",
]);

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: activityTypeEnum("type").notNull(),
  actor: text("actor").notNull(),
  actorEns: text("actor_ens"),
  description: text("description").notNull(),
  proposalId: integer("proposal_id"),
  proposalTitle: text("proposal_title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, createdAt: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
