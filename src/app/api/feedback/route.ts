import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";

const schema = z.object({
  cohesive: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }

  await prisma.feedback.create({
    data: {
      userId: user.id,
      cohesive: parsed.data.cohesive,
      comment: parsed.data.comment ?? null,
    },
  });

  await track("cohesion_feedback", {
    userId: user.id,
    props: { cohesive: parsed.data.cohesive },
  });

  return NextResponse.json({ ok: true });
}
