import { Router, type IRouter } from "express";
import { db, treasuryTransactionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import {
  GetTreasuryResponse,
  ListTreasuryTransactionsResponse,
} from "@workspace/api-zod";
import { serializeRows } from "../utils/serialize.js";

const router: IRouter = Router();

router.get("/treasury", async (_req, res): Promise<void> => {
  const treasury = {
    totalValueUsd: 12_847_293,
    ethBalance: 3240.5,
    tokenBalance: 4_500_000,
    stablecoinBalance: 2_100_000,
    changePercent24h: 2.4,
    allocations: [
      { asset: "ETH", amount: 3240.5, valueUsd: 7_245_000, percent: 56.4 },
      { asset: "GOV Token", amount: 4_500_000, valueUsd: 3_402_293, percent: 26.5 },
      { asset: "USDC", amount: 2_100_000, valueUsd: 2_100_000, percent: 16.3 },
      { asset: "Other", amount: 0, valueUsd: 100_000, percent: 0.8 },
    ],
  };

  res.json(GetTreasuryResponse.parse(treasury));
});

router.get("/treasury/transactions", async (_req, res): Promise<void> => {
  const txs = await db.select().from(treasuryTransactionsTable).orderBy(desc(treasuryTransactionsTable.createdAt)).limit(50);
  res.json(ListTreasuryTransactionsResponse.parse(serializeRows(txs)));
});

export default router;
