import { Router, type IRouter } from "express";
import { db, proposalsTable, membersTable, votesTable } from "@workspace/db";
import { count, sql } from "drizzle-orm";
import {
  GetAnalyticsSummaryResponse,
  GetVotingHistoryResponse,
  GetTokenDistributionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const [proposalStats] = await db.select({
    total: count(),
  }).from(proposalsTable);

  const [activeCount] = await db.select({ count: count() }).from(proposalsTable).where(sql`status = 'active'`);
  const [memberCount] = await db.select({ count: count() }).from(membersTable);
  const [voteCount] = await db.select({ count: count() }).from(votesTable);

  const summary = {
    totalProposals: proposalStats?.total ?? 0,
    activeProposals: activeCount?.count ?? 0,
    totalMembers: memberCount?.count ?? 0,
    totalVotesCast: voteCount?.count ?? 0,
    averageParticipation: 67.3,
    successRate: 78.5,
    totalTokensCirculating: 10_000_000,
    treasuryValueUsd: 12_847_293,
  };

  res.json(GetAnalyticsSummaryResponse.parse(summary));
});

router.get("/analytics/voting-history", async (_req, res): Promise<void> => {
  const history = [
    { month: "Nov 2024", participation: 45.2, proposalsCreated: 3, proposalsPassed: 2 },
    { month: "Dec 2024", participation: 52.8, proposalsCreated: 4, proposalsPassed: 3 },
    { month: "Jan 2025", participation: 61.4, proposalsCreated: 5, proposalsPassed: 4 },
    { month: "Feb 2025", participation: 58.9, proposalsCreated: 3, proposalsPassed: 2 },
    { month: "Mar 2025", participation: 69.3, proposalsCreated: 6, proposalsPassed: 5 },
    { month: "Apr 2025", participation: 74.1, proposalsCreated: 4, proposalsPassed: 3 },
    { month: "May 2025", participation: 67.3, proposalsCreated: 5, proposalsPassed: 4 },
  ];

  res.json(GetVotingHistoryResponse.parse(history));
});

router.get("/analytics/token-distribution", async (_req, res): Promise<void> => {
  const distribution = [
    { label: "Top 10 Holders", percent: 38.4, amount: 3_840_000 },
    { label: "Protocol Treasury", percent: 22.1, amount: 2_210_000 },
    { label: "Community", percent: 18.7, amount: 1_870_000 },
    { label: "Core Team", percent: 12.3, amount: 1_230_000 },
    { label: "Ecosystem Fund", percent: 5.8, amount: 580_000 },
    { label: "Others", percent: 2.7, amount: 270_000 },
  ];

  res.json(GetTokenDistributionResponse.parse(distribution));
});

export default router;
