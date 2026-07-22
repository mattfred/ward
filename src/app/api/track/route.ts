import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { track } from "@/lib/analytics";

const schema = z.object({
  name: z.string().min(1).max(80),
  props: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  await track(parsed.data.name, {
    userId: session?.user?.id,
    props: parsed.data.props,
  });
  return NextResponse.json({ ok: true });
}
