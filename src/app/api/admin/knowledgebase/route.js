import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const pages = await query("SELECT id, slug, data_en, data_si, updated_at FROM knowledgebase_pages");
        const formatted = pages.map(p => ({
            id: p.id,
            slug: p.slug,
            en: JSON.parse(p.data_en),
            si: JSON.parse(p.data_si),
            updated_at: p.updated_at
        }));
        return NextResponse.json(formatted);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { slug, en, si } = await req.json();
        if (!slug || !en || !si) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await query(
            "INSERT INTO knowledgebase_pages (slug, data_en, data_si) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data_en = VALUES(data_en), data_si = VALUES(data_si)",
            [slug, JSON.stringify(en), JSON.stringify(si)]
        );

        // Log the action
        await query(
            "INSERT INTO admin_logs (admin_discord_id, admin_name, action_type, action_details) VALUES (?, ?, ?, ?)",
            [session.user.id, session.user.name || 'Admin', 'SYSTEM', `Updated Knowledgebase page: ${slug}`]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
