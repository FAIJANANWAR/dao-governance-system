import { Router, type IRouter } from "express";
import { db, activityTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { ListActivityQueryParams, ListActivityResponse } from "@workspace/api-zod";
import { serializeRows } from "../utils/serialize.js";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const parsed = ListActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 20;
  const items = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(limit);
  res.json(ListActivityResponse.parse(serializeRows(items)));
});

export default router;
