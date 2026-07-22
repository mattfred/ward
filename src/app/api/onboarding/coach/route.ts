import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { buildFallbackCoach, type CoachResponse } from "@/lib/intake";
import type { StyleProfileInput } from "@/lib/types";
import OpenAI from "openai";

const schema = z.object({
  step: z.string().min(1).max(40),
  profile: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(clientKey(req, `coach:${user.id}`), { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many coach requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coach payload" }, { status: 400 });
  }

  const profile = parsed.data.profile as Partial<StyleProfileInput>;
  const fallback = buildFallbackCoach(profile, parsed.data.step);

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(fallback satisfies CoachResponse);
  }

  try {
    const openai = new OpenAI({ apiKey: key });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are Ward's style intake coach. Return JSON with keys: summary (1-2 sentences), suggestedChips (3-6 short strings the user can tap), clarifyingQuestion (one question or null), fieldHints (object of short tip strings keyed by field). Be concrete, cohesion-first, never shame body or gender. Gender/presentation is optional. Do not invent measurements.",
        },
        {
          role: "user",
          content: JSON.stringify({
            step: parsed.data.step,
            profile,
          }),
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return NextResponse.json(fallback);
    const parsedCoach = JSON.parse(raw) as CoachResponse;
    return NextResponse.json({
      summary: parsedCoach.summary || fallback.summary,
      suggestedChips: parsedCoach.suggestedChips?.length
        ? parsedCoach.suggestedChips.slice(0, 8)
        : fallback.suggestedChips,
      clarifyingQuestion:
        parsedCoach.clarifyingQuestion === undefined
          ? fallback.clarifyingQuestion
          : parsedCoach.clarifyingQuestion,
      fieldHints: { ...fallback.fieldHints, ...(parsedCoach.fieldHints || {}) },
    } satisfies CoachResponse);
  } catch {
    return NextResponse.json(fallback);
  }
}
