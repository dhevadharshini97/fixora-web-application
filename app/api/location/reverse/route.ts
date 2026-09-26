import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Fixora/1.0 civic-care-demo",
          "Accept-Language": "en",
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) throw new Error("Reverse geocoding failed");
    const data = await response.json();
    const address = data.address ?? {};

    const area =
      address.neighbourhood ||
      address.suburb ||
      address.quarter ||
      address.village ||
      address.town ||
      address.city_district ||
      address.city ||
      address.county ||
      "Nearby Area";

    return NextResponse.json({
      area,
      city: address.city || address.town || address.village || address.county || "",
      displayName: data.display_name || area,
    });
  } catch {
    return NextResponse.json(
      { area: "Nearby Area", city: "", displayName: "Nearby Area" },
      { status: 200 }
    );
  }
}
