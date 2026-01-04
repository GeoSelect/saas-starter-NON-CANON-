import { NextResponse } from "next/server";
import { unauthorized, notFound } from "@/lib/api/error-responses";

export async function GET(_req: Request, { params }: { params: Promise<{ report_id: string }> }) {
  const { report_id } = await params;
  const accountId = _req.headers.get("x-account-id");
  if (!accountId) return unauthorized();

  if (!process.env.POSTGRES_URL) {
    return NextResponse.json(
      {
        report: null,
        meta: { stubbed: true },
      },
      { status: 200 }
    );
  }

  try {
    const { db } = await import("@/lib/db/drizzle");
    const { reports } = await import("@/lib/db/schema");
    const rows = await db.select().from(reports).where(reports.id.eq(report_id));
    const report = rows[0];
    if (!report || report.accountId !== accountId) {
      return notFound();
    }
    return NextResponse.json({ report }, { status: 200 });
  } catch (err) {
    console.warn("[report/get] failed", err);
    return notFound();
  }
}
