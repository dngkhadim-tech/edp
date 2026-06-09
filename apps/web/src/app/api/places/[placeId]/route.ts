import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ placeId: string }> },
) {
  const { placeId } = await params;
  if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': [
        'id',
        'displayName',
        'photos',
        'rating',
        'userRatingCount',
        'editorialSummary',
        'generativeSummary',
        'reviews',
        'regularOpeningHours',
        'currentOpeningHours',
        'location',
        'formattedAddress',
        'websiteUri',
        'internationalPhoneNumber',
        'priceLevel',
        'primaryTypeDisplayName',
      ].join(','),
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: 'Google Places error', details: err }, { status: res.status });
  }

  const data = await res.json();

  const photos = (data.photos ?? []).slice(0, 10).map((p: { name: string; widthPx?: number; heightPx?: number }) => ({
    ...p,
    url: `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=800&key=${API_KEY}`,
  }));

  return NextResponse.json({ ...data, photos });
}
