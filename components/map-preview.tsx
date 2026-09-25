"use client";

import { MapPin } from "lucide-react";

export default function MapPreview({
  lat,
  lon,
  height = 190,
}: {
  lat: number;
  lon: number;
  height?: number;
}) {
  const dLat = 0.0045;
  const dLon = 0.007;
  const bbox = `${(lon - dLon).toFixed(5)}%2C${(lat - dLat).toFixed(5)}%2C${(lon + dLon).toFixed(5)}%2C${(lat + dLat).toFixed(5)}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200"
      style={{ height }}
    >
      <iframe
        title="Location map"
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative -mt-6">
          <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/40 animate-sonar" />
          <MapPin className="relative h-8 w-8 text-brand-600 drop-shadow-lg" fill="#fff" strokeWidth={2} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/70 to-transparent" />
    </div>
  );
}
