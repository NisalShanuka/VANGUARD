import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const FIVEM_API_URL = process.env.FIVEM_API_URL;
const FIVEM_API_TOKEN = process.env.FIVEM_API_TOKEN;

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!FIVEM_API_URL || !FIVEM_API_TOKEN) {
        return NextResponse.json({ error: 'FiveM API not configured in .env' }, { status: 503 });
    }

    try {
        const res = await fetch(`${FIVEM_API_URL}/api/data`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[FiveM API GET Data Error]', error.message);
        return NextResponse.json({ error: 'Failed to fetch data from game server' }, { status: 500 });
    }
}
