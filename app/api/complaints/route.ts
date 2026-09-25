import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { complaints } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const openOnly = req.nextUrl.searchParams.get("open") === "1";
    const rows = await db
      .select()
      .from(complaints)
      .orderBy(desc(complaints.reportedAt));
    const filtered = openOnly
      ? rows.filter((r) => r.status !== "resolved" && r.status !== "verified")
      : rows;
    return Response.json({ complaints: filtered });
  } catch (e) {
    return Response.json({ complaints: [], error: String(e) }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slaDays = Number(body.slaDays ?? 7);
    const deadline = new Date(Date.now() + slaDays * 86400000).toISOString();
    const [row] = await db
      .insert(complaints)
      .values({
        citizenName: body.citizenName ?? "Citizen",
        title: String(body.title ?? "Civic problem reported"),
        description: body.description ?? "",
        category: body.category ?? "Other Public Issue",
        severity: body.severity ?? "Medium",
        department: body.department ?? "Ward Office (General)",
        rootCause: body.rootCause ?? "",
        photoUrl: body.photoUrl ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        street: body.street ?? "",
        city: body.city ?? "City",
        status: "assigned",
        problemDna: body.problemDna ?? null,
        recurringOfDna: body.recurringOfDna ?? null,
        supporters: 1,
        slaDays,
        escalationLevel: 0,
        reopenCount: 0,
        deadline,
      })
      .returning();
    return Response.json({ complaint: row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
