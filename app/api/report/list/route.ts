import { NextResponse } from "next/server";
import { z } from "zod";
import { unauthorized } from "@/lib/api/error-responses";

const QuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export async function GET(req: Request) {
  const accountId = req.headers.get("x-account-id");
  if (!accountId) return unauthorized();

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ limit: url.searchParams.get("limit") });
  const limit = parsed.success ? parsed.data.limit ?? 20 : 20;

  if (!process.env.POSTGRES_URL) {
    return NextResponse.json({ reports: [], meta: { count: 0, stubbed: true } }, { status: 200 });
  }

  try {
    const { db } = await import("@/lib/db/drizzle");
    const { reports } = await import("@/lib/db/schema");
    const data = await db
      .select()
      .from(reports)
      .where(reports.accountId.eq(accountId))
      .orderBy(reports.createdAt.desc())
      .limit(limit);

    return NextResponse.json({ reports: data, meta: { count: data.length } }, { status: 200 });
  } catch (err) {
    console.warn("[report/list] failed", err);
    return NextResponse.json({ reports: [], meta: { count: 0, error: true } }, { status: 200 });
  }
}
