import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { encryptedKeyVaults } from "@/db/schema";

const businessIdSchema = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const querySchema = z.object({ businessId: businessIdSchema });
const vaultSchema = z.object({
  businessId: businessIdSchema,
  ciphertext: z.string().min(1).max(100_000),
  salt: z.string().min(1).max(200),
  iv: z.string().min(1).max(200),
});

async function ownerEmail() {
  const requestHeaders = await headers();
  return requestHeaders.get("oai-authenticated-user-email") || "private-site-owner";
}

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid business" }, { status: 400 });
  try {
    const db = await getDb();
    const [vault] = await db.select().from(encryptedKeyVaults).where(and(
      eq(encryptedKeyVaults.ownerEmail, await ownerEmail()),
      eq(encryptedKeyVaults.businessId, parsed.data.businessId),
    )).limit(1);
    return NextResponse.json(vault ? { ciphertext: vault.ciphertext, salt: vault.salt, iv: vault.iv } : null);
  } catch {
    return NextResponse.json({ error: "Key vault storage is unavailable" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const parsed = vaultSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid encrypted vault" }, { status: 400 });
  try {
    const db = await getDb();
    const owner = await ownerEmail();
    const id = `${owner}:${parsed.data.businessId}`;
    await db.insert(encryptedKeyVaults).values({
      id,
      ownerEmail: owner,
      businessId: parsed.data.businessId,
      ciphertext: parsed.data.ciphertext,
      salt: parsed.data.salt,
      iv: parsed.data.iv,
      updatedAt: new Date().toISOString(),
    }).onConflictDoUpdate({
      target: encryptedKeyVaults.id,
      set: {
        ciphertext: parsed.data.ciphertext,
        salt: parsed.data.salt,
        iv: parsed.data.iv,
        updatedAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Key vault storage is unavailable" }, { status: 503 });
  }
}
