import { Router, type IRouter } from "express";
import { eq, ilike, and, or, desc, asc } from "drizzle-orm";
import { db, proposalsTable, votesTable, commentsTable, activityTable } from "@workspace/db";
import {
  ListProposalsQueryParams,
  ListProposalsResponse,
  GetProposalResponse,
  CreateProposalBody,
  CastVoteBody,
  CastVoteResponse,
  ListProposalVotesResponse,
  ListProposalCommentsResponse,
  AddCommentBody,
} from "@workspace/api-zod";
import { serializeRow, serializeRows } from "../utils/serialize.js";

const router: IRouter = Router();

router.get("/proposals", async (req, res): Promise<void> => {
  const parsed = ListProposalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, search, sort } = parsed.data;

  let query = db.select().from(proposalsTable).$dynamic();

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(proposalsTable.status, status as "active" | "pending" | "executed" | "defeated" | "queued"));
  }
  if (search) {
    conditions.push(
      or(
        ilike(proposalsTable.title, `%${search}%`),
        ilike(proposalsTable.description, `%${search}%`)
      )
    );
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  if (sort === "oldest") {
    query = query.orderBy(asc(proposalsTable.createdAt));
  } else if (sort === "ending_soon") {
    query = query.orderBy(asc(proposalsTable.endTime));
  } else {
    query = query.orderBy(desc(proposalsTable.createdAt));
  }

  const proposals = await query;
  res.json(ListProposalsResponse.parse(serializeRows(proposals)));
});

router.post("/proposals", async (req, res): Promise<void> => {
  const parsed = CreateProposalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, actions, votingDuration, discussionUrl, proposer } = parsed.data;
  const durationHours = votingDuration ?? 72;
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  const [proposal] = await db.insert(proposalsTable).values({
    title,
    description,
    status: "active",
    proposer: proposer ?? "0x0000000000000000000000000000000000000000",
    actions: actions ?? [],
    discussionUrl: discussionUrl ?? null,
    startTime,
    endTime,
    quorumRequired: "100000",
  }).returning();

  await db.insert(activityTable).values({
    type: "proposal_created",
    actor: proposal.proposer,
    description: `Created proposal: ${title}`,
    proposalId: proposal.id,
    proposalTitle: title,
  });

  res.status(201).json(GetProposalResponse.parse(serializeRow(proposal)));
});

router.get("/proposals/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const [proposal] = await db.select().from(proposalsTable).where(eq(proposalsTable.id, id));
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  res.json(GetProposalResponse.parse(serializeRow(proposal)));
});

router.post("/proposals/:id/vote", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const parsed = CastVoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [proposal] = await db.select().from(proposalsTable).where(eq(proposalsTable.id, id));
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const { voter, support, weight, reason } = parsed.data;

  const [vote] = await db.insert(votesTable).values({
    proposalId: id,
    voter,
    support,
    weight: String(weight),
    reason: reason ?? null,
  }).returning();

  const weightNum = Number(weight);
  if (support === "for") {
    await db.update(proposalsTable)
      .set({ votesFor: String(Number(proposal.votesFor) + weightNum) })
      .where(eq(proposalsTable.id, id));
  } else if (support === "against") {
    await db.update(proposalsTable)
      .set({ votesAgainst: String(Number(proposal.votesAgainst) + weightNum) })
      .where(eq(proposalsTable.id, id));
  } else {
    await db.update(proposalsTable)
      .set({ votesAbstain: String(Number(proposal.votesAbstain) + weightNum) })
      .where(eq(proposalsTable.id, id));
  }

  const totalVotes = Number(proposal.votesFor) + Number(proposal.votesAgainst) + Number(proposal.votesAbstain) + weightNum;
  if (totalVotes >= Number(proposal.quorumRequired)) {
    await db.update(proposalsTable).set({ quorumReached: true }).where(eq(proposalsTable.id, id));
  }

  await db.insert(activityTable).values({
    type: "vote_cast",
    actor: voter,
    description: `Voted ${support} on proposal: ${proposal.title}`,
    proposalId: id,
    proposalTitle: proposal.title,
  });

  res.json(CastVoteResponse.parse(serializeRow(vote)));
});

router.get("/proposals/:id/votes", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const votes = await db.select().from(votesTable).where(eq(votesTable.proposalId, id)).orderBy(desc(votesTable.createdAt));
  res.json(ListProposalVotesResponse.parse(serializeRows(votes)));
});

router.get("/proposals/:id/comments", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const comments = await db.select().from(commentsTable).where(eq(commentsTable.proposalId, id)).orderBy(asc(commentsTable.createdAt));
  res.json(ListProposalCommentsResponse.parse(serializeRows(comments)));
});

router.post("/proposals/:id/comments", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const parsed = AddCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [proposal] = await db.select().from(proposalsTable).where(eq(proposalsTable.id, id));
  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const [comment] = await db.insert(commentsTable).values({
    proposalId: id,
    author: parsed.data.author,
    content: parsed.data.content,
  }).returning();

  await db.insert(activityTable).values({
    type: "comment_added",
    actor: parsed.data.author,
    description: `Commented on proposal: ${proposal.title}`,
    proposalId: id,
    proposalTitle: proposal.title,
  });

  res.status(201).json(serializeRow(comment));
});

export default router;
