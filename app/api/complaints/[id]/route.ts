import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { complaints } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(complaints)
    .where(eq(complaints.id, Number(id)));
  if (!rows.length)
    return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ complaint: rows[0] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const now = new Date().toISOString();

  try {
    let rows;
    if (action === "support") {
      rows = await db
        .update(complaints)
        .set({ supporters: sql`${complaints.supporters} + 1`, updatedAt: now })
        .where(eq(complaints.id, Number(id)))
        .returning();
    } else if (action === "verify") {
      rows = await db
        .update(complaints)
        .set({ status: "verified", verifiedAt: now, updatedAt: now })
        .where(eq(complaints.id, Number(id)))
        .returning();
    } else if (action === "reopen") {
      rows = await db
        .update(complaints)
        .set({
          status: "reopened",
          reopenCount: sql`${complaints.reopenCount} + 1`,
          escalationLevel: sql`LEAST(${complaints.escalationLevel} + 1, 3)`,
          recurringOfDna: body.dna ?? null,
          deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
          updatedAt: now,
        })
        .where(eq(complaints.id, Number(id)))
        .returning();
    } else if (action === "start") {
      rows = await db
        .update(complaints)
        .set({ status: "in_progress", updatedAt: now })
        .where(eq(complaints.id, Number(id)))
        .returning();
    } else if (action === "resolve") {
      rows = await db
        .update(complaints)
        .set({
          status: "resolved",
          resolvedAt: now,
          updatedAt: now,
          afterPhotoUrl: body.afterPhotoUrl ?? "/images/complaints/road-fixed.jpg",
        })
        .where(eq(complaints.id, Number(id)))
        .returning();
    } else {
      return Response.json({ error: "unknown action" }, { status: 400 });
    }
    if (!rows.length)
      return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ complaint: rows[0] });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
