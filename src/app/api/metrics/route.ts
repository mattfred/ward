import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFunnelStats } from "@/lib/analytics";
import { isAdminEmail } from "@/lib/env";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getFunnelStats();
  return NextResponse.json(stats);
}
