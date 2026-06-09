import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.photos',
  'places.rating',
  'places.userRatingCount',
  'places.primaryTypeDisplayName',
  'places.regularOpeningHours',
  'places.currentOpeningHours',
  'places.location',
  'places.formattedAddress',
  'places.businessStatus',
  'places.priceLevel',
].join(',');

const TYPE_MAP: Record<string, string[]> = {
  RESTAURANT: ['restaurant'],
  BAR: ['bar', 'night_club'],
  CAFE: ['cafe', 'coffee_shop'],
  HOTEL: ['hotel', 'lodging'],
  TOURIST_SPOT: ['tourist_attraction', 'museum', 'art_gallery'],
  '': ['restaurant', 'bar', 'cafe', 'night_club'],
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const type = searchParams.get('type') ?? '';
  const radius = Number(searchParams.get('radius') ?? '1500');

  if (!lat || !lng) return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
  if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  const includedTypes = TYPE_MAP[type] ?? TYPE_MAP[''];

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: Number(lat), longitude: Number(lng) },
          radius,
        },
      },
    }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[places/nearby] Google API error', res.status, JSON.stringify(err));
    return NextResponse.json({ error: 'Google Places error', details: err }, { status: res.status });
  }

  const data = await res.json();

  type RawPlace = { photos?: Array<{ name: string }> } & Record<string, unknown>;

  const places = (data.places ?? []).map((p: RawPlace) => ({
    ...p,
    photoUrl: p.photos?.[0]?.name
      ? `https://places.googleapis.com/v1/${p.photos[0].name}/media?maxWidthPx=600&key=${API_KEY}`
      : null,
  }));

  return NextResponse.json({ places });
}
