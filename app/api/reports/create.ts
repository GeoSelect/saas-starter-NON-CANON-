import { requireEntitlement } from "@/lib/auth/entitlements";

export async function POST(req: Request) {
  await requireEntitlement("report.create");

  // existing report creation logic
}
