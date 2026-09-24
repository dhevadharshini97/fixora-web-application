import { NextRequest } from "next/server";
import { db } from "@/db";
import { citizens } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const [row] = await db
      .insert(citizens)
      .values({
        fullName: String(b.fullName ?? "Citizen"),
        age: b.age ? Number(b.age) : null,
        phone: b.phone ?? null,
        email: b.email ?? null,
        address: b.address ?? null,
        city: b.city ?? null,
        language: b.language ?? "en",
        photoUrl: b.photoUrl ?? null,
      })
      .returning();
    return Response.json({ citizen: row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
