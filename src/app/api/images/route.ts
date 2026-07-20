import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) return NextResponse.json({ images: [] });

  const pexelsKey = process.env.PEXELS_API_KEY;
  if (!pexelsKey) {
    console.error('PEXELS_API_KEY is not set');
    return NextResponse.json({ images: [], error: 'API key not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5`, {
      headers: {
        Authorization: pexelsKey,
      },
    });

    if (!res.ok) {
      throw new Error(`Pexels API error: ${res.statusText}`);
    }

    const data = await res.json();
    const images = data.photos.map((photo: any) => photo.src.medium); // 350px height, responsive width

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ images: [], error: 'Failed to fetch images' }, { status: 500 });
  }
}
