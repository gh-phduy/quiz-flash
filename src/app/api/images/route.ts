import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || !query.trim()) return NextResponse.json({ images: [] });

  const cleanQuery = query.trim();
  const images: string[] = [];

  // 1. Try Pexels API with High Quality (large / large2x) images
  const pexelsKey = process.env.PEXELS_API_KEY || 'cfBfAMEniEhsukW23ZHe9ZdWowZGBqDo1joZjwxN079yxQqR5CDJf1uJ';
  if (pexelsKey) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=12`, {
        headers: {
          Authorization: pexelsKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.photos && Array.isArray(data.photos)) {
          // Use large (940px) or large2x for high quality sharpness
          const pexelsImgs = data.photos
            .map((photo: any) => photo.src?.large || photo.src?.large2x || photo.src?.medium)
            .filter(Boolean);
          images.push(...pexelsImgs);
        }
      }
    } catch (err) {
      console.error('Pexels API search error:', err);
    }
  }

  // 2. Fallback to Wikimedia Commons ONLY if Pexels returned 0 images
  if (images.length === 0) {
    try {
      const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
      const res = await fetch(wikiUrl);
      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages || {};
        const wikiImgs = Object.values(pages)
          .filter((p: any) => {
            const info = p.imageinfo?.[0];
            if (!info?.url) return false;
            const mime = info.mime || '';
            const url = info.url.toLowerCase();
            return (
              (mime.includes('jpeg') || mime.includes('png') || mime.includes('webp')) &&
              !url.endsWith('.svg') &&
              !url.includes('sound') &&
              !url.includes('audio')
            );
          })
          .map((p: any) => p.imageinfo[0].url);

        for (const img of wikiImgs) {
          if (!images.includes(img)) images.push(img);
          if (images.length >= 8) break;
        }
      }
    } catch (err) {
      console.error('Wikimedia fetch error:', err);
    }
  }

  // 3. Fallback to Wikipedia Page Images if still 0 images
  if (images.length === 0) {
    try {
      const wpUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrlimit=8&prop=pageimages&pithumbsize=600&format=json&origin=*`;
      const res = await fetch(wpUrl);
      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages || {};
        const wpImgs = Object.values(pages)
          .map((p: any) => p.thumbnail?.source)
          .filter(Boolean);

        for (const img of wpImgs) {
          if (!images.includes(img)) images.push(img);
        }
      }
    } catch (err) {
      console.error('Wikipedia fetch error:', err);
    }
  }

  return NextResponse.json({ images: images.slice(0, 10) });
}


