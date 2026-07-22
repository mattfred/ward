import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  currentPassword: z.string().min(8).optional(),
  newPassword: z.string().min(8).max(100).optional(),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    createdAt: user.createdAt,
  });
}

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid account update" }, { status: 400 });
  }

  const data: { name?: string; passwordHash?: string } = {};
  if (parsed.data.name) data.name = parsed.data.name;

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword || !user.passwordHash) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const ok = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    data.passwordHash = await hash(parsed.data.newPassword, 10);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true, plan: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.delete({ where: { id: user.id } });
  return NextResponse.json({ ok: true });
}
