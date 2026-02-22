import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { initLogsTable } from '../logs/route';

export const dynamic = 'force-dynamic';

const FIVEM_API_URL = process.env.FIVEM_API_URL;
const FIVEM_API_TOKEN = process.env.FIVEM_API_TOKEN;

// GET - Fetch online players
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!FIVEM_API_URL || !FIVEM_API_TOKEN) {
        return NextResponse.json({ error: 'FiveM API not configured in .env' }, { status: 503 });
    }

    try {
        const res = await fetch(`${FIVEM_API_URL}/api/players`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[FiveM API GET Error]', error.message);
        return NextResponse.json({ error: 'Failed to connect to game server' }, { status: 500 });
    }
}

// POST - Execute admin action
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!FIVEM_API_URL || !FIVEM_API_TOKEN) {
        return NextResponse.json({ error: 'FiveM API not configured in .env' }, { status: 503 });
    }

    try {
        const body = await req.json();
        body.token = FIVEM_API_TOKEN; // Inject security token

        const res = await fetch(`${FIVEM_API_URL}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success || res.ok) {
            await initLogsTable();
            let actionText = `Sent ${body.action} to player #${body.playerId}`;
            if (body.amount) actionText += ` (Amount: $${body.amount})`;

            await query(
                `INSERT INTO admin_logs (admin_discord_id, admin_name, action_type, action_details) VALUES (?, ?, ?, ?)`,
                [session.user.id, session.user.name || 'Admin', 'SERVER', actionText]
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[FiveM API POST Error]', error.message);
        return NextResponse.json({ error: 'Failed to execute command on server' }, { status: 500 });
    }
}
