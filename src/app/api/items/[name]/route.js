import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    const { name } = params;
    const FIVEM_API_URL = process.env.FIVEM_API_URL;

    if (!FIVEM_API_URL) {
        return NextResponse.json({ error: 'FiveM API not configured' }, { status: 503 });
    }

    try {
        const res = await fetch(`${FIVEM_API_URL}/api/items/${name}`, {
            method: 'GET',
            cache: 'no-store'
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Item image not found' }, { status: 404 });
        }

        const data = await res.arrayBuffer();
        const contentType = res.headers.get('Content-Type') || 'image/png';

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=604800, immutable',
            },
        });
    } catch (error) {
        console.error('[Items API Error]', error.message);
        return NextResponse.json({ error: 'Failed to fetch item image' }, { status: 500 });
    }
}
