import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Accept #RGB, #RRGGBB, optional leading #, and common OpenAI quirks. */
function normalizeHex(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!value.startsWith("#")) value = `#${value}`;
  // Strip alpha channel if present (#RRGGBBAA)
  if (/^#[0-9a-fA-F]{8}$/.test(value)) value = value.slice(0, 7);
  if (/^#[0-9a-fA-F]{3}$/.test(value) || /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  return null;
}

const paletteSwatch = z
  .object({
    name: z.string().min(1).max(60),
    hex: z.string().min(1).max(20),
  })
  .transform((swatch, ctx) => {
    const hex = normalizeHex(swatch.hex);
    if (!hex) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid hex for "${swatch.name}": ${swatch.hex}`,
        path: ["hex"],
      });
      return z.NEVER;
    }
    return { name: swatch.name.trim(), hex };
  });

const stringList = (max: number) =>
  z
    .array(z.string())
    .max(max)
    .transform((items) =>
      items.map((s) => s.trim()).filter(Boolean).slice(0, max),
    );

const schema = z.object({
  manifesto: z.string().min(8).max(4000).optional(),
  alwaysRules: stringList(12).optional(),
  neverRules: stringList(12).optional(),
  silhouettes: stringList(8).optional(),
  vibeReferences: stringList(12).optional(),
  palette: z.array(paletteSwatch).min(1).max(12).optional(),
  fabrics: stringList(12).optional(),
  signaturePieces: stringList(12).optional(),
});

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .slice(0, 4)
      .join("; ");
    return NextResponse.json(
      { error: detail || "Invalid style system update" },
      { status: 400 },
    );
  }

  const existing = await prisma.styleSystem.findUnique({ where: { userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "No style system" }, { status: 404 });
  }

  const data: Record<string, string> = {};
  if (parsed.data.manifesto !== undefined) data.manifesto = parsed.data.manifesto;
  if (parsed.data.alwaysRules !== undefined) {
    data.alwaysRules = JSON.stringify(parsed.data.alwaysRules);
  }
  if (parsed.data.neverRules !== undefined) {
    data.neverRules = JSON.stringify(parsed.data.neverRules);
  }
  if (parsed.data.silhouettes !== undefined) {
    data.silhouettes = JSON.stringify(parsed.data.silhouettes);
  }
  if (parsed.data.vibeReferences !== undefined) {
    data.vibeReferences = JSON.stringify(parsed.data.vibeReferences);
  }
  if (parsed.data.palette !== undefined) data.palette = JSON.stringify(parsed.data.palette);
  if (parsed.data.fabrics !== undefined) data.fabrics = JSON.stringify(parsed.data.fabrics);
  if (parsed.data.signaturePieces !== undefined) {
    data.signaturePieces = JSON.stringify(parsed.data.signaturePieces);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await prisma.styleSystem.update({
    where: { userId: user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
