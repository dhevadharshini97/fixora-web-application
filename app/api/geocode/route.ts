import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  if (!lat || !lon) return Response.json({ street: "" });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=17`,
      {
        headers: { "User-Agent": "fixora-civic-app/1.0 (demo)" },
        signal: AbortSignal.timeout(6000),
      }
    );
    const data = await res.json();
    const a = data.address ?? {};
    const parts = [
      a.road || a.pedestrian || a.footway || "",
      a.suburb || a.neighbourhood || a.residential || "",
      a.city || a.town || a.village || a.county || "",
    ].filter(Boolean);
    return Response.json({
      street: parts.slice(0, 2).join(", ") || data.display_name?.split(",").slice(0, 2).join(",") || "",
      city: a.city || a.town || a.village || a.state_district || "",
    });
  } catch {
    return Response.json({ street: "", city: "" });
  }
}
