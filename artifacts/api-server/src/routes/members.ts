import { Router, type IRouter } from "express";
import { eq, ilike, desc } from "drizzle-orm";
import { db, membersTable, activityTable } from "@workspace/db";
import {
  ListMembersQueryParams,
  ListMembersResponse,
  GetMemberResponse,
  DelegateVotesBody,
  DelegateVotesResponse,
} from "@workspace/api-zod";
import { serializeRow, serializeRows } from "../utils/serialize.js";

const router: IRouter = Router();

router.get("/members", async (req, res): Promise<void> => {
  const parsed = ListMembersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, sort } = parsed.data;

  let query = db.select().from(membersTable).$dynamic();

  if (search) {
    query = query.where(ilike(membersTable.address, `%${search}%`));
  }

  if (sort === "proposals_created") {
    query = query.orderBy(desc(membersTable.proposalsCreated));
  } else if (sort === "votes_cast") {
    query = query.orderBy(desc(membersTable.votesCast));
  } else if (sort === "newest") {
    query = query.orderBy(desc(membersTable.createdAt));
  } else {
    query = query.orderBy(desc(membersTable.votingPower));
  }

  const members = await query;
  res.json(ListMembersResponse.parse(serializeRows(members)));
});

router.get("/members/:address", async (req, res): Promise<void> => {
  const rawAddr = Array.isArray(req.params.address) ? req.params.address[0] : req.params.address;

  const [member] = await db.select().from(membersTable).where(eq(membersTable.address, rawAddr));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.json(GetMemberResponse.parse(serializeRow(member)));
});

router.post("/members/:address/delegate", async (req, res): Promise<void> => {
  const rawAddr = Array.isArray(req.params.address) ? req.params.address[0] : req.params.address;

  const parsed = DelegateVotesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.select().from(membersTable).where(eq(membersTable.address, rawAddr));
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const [updated] = await db.update(membersTable)
    .set({ delegatedTo: parsed.data.delegateTo })
    .where(eq(membersTable.address, rawAddr))
    .returning();

  await db.insert(activityTable).values({
    type: "delegation_changed",
    actor: rawAddr,
    description: `Delegated votes to ${parsed.data.delegateTo}`,
  });

  res.json(DelegateVotesResponse.parse(serializeRow(updated)));
});

export default router;
