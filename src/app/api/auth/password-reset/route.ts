import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { appOrigin, isProduction } from "@/lib/env";
import { rateLimit, clientKey } from "@/lib/rate-limit";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const requestSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action as string;

  if (action === "request") {
    const rl = rateLimit(clientKey(req, "reset-request"), { limit: 5, windowMs: 15 * 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return ok to avoid email enumeration
    const response: { ok: true; resetUrl?: string } = { ok: true };

    if (user) {
      const raw = randomBytes(32).toString("hex");
      const token = tokenHash(raw);
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } });
      await prisma.verificationToken.create({
        data: {
          identifier: `reset:${email}`,
          token,
          expires,
        },
      });

      const resetUrl = `${appOrigin()}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;
      await sendEmail({
        to: email,
        subject: "Reset your Cohesive password",
        text: `Reset your password: ${resetUrl}\nThis link expires in 1 hour.`,
      });

      if (!isProduction()) {
        response.resetUrl = resetUrl;
      }
    }

    return NextResponse.json(response);
  }

  if (action === "reset") {
    const rl = rateLimit(clientKey(req, "reset-confirm"), { limit: 10, windowMs: 15 * 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reset payload" }, { status: 400 });
    }

    const email = String(body.email || "")
      .toLowerCase()
      .trim();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const token = tokenHash(parsed.data.token);
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (
      !record ||
      record.identifier !== `reset:${email}` ||
      record.expires.getTime() < Date.now()
    ) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const passwordHash = await hash(parsed.data.password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
