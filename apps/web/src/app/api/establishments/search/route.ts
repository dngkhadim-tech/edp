import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams.toString();
  const res = await fetch(`${API_URL}/api/v1/establishments/search?${params}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: 'Backend error', details: err }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}
