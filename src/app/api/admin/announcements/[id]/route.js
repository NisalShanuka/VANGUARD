import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { announcementDetail as staticDetailData } from '@/data/announcements';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    if (id === 'enter-the-world-of-vanguard-roleplay') {
        const detail = staticDetailData.en;
        return NextResponse.json({
            id: id,
            title: detail.title,
            content: detail.sections.map(s => s.heading + '\n\n' + s.paragraphs.join('\n\n')).join('\n\n\n'),
            image: '/images/logo.png',
            author_name: 'System',
            created_at: new Date('2026-02-20').toISOString(),
            is_pinned: false
        });
    }

    try {
        const announcements = await query(
            `SELECT * FROM admin_announcements WHERE id = ? LIMIT 1`,
            [id]
        );

        if (!announcements || announcements.length === 0) {
            return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
        }

        return NextResponse.json(announcements[0]);
    } catch (error) {
        console.error('[Announcement GET Error]', error.message);
        return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
    }
}
