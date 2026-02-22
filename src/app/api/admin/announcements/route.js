import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { announcements as staticAnnouncementsData } from '@/data/announcements';
import { initLogsTable } from '../logs/route';

export const dynamic = 'force-dynamic';

async function initAnnouncementsTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS admin_announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image VARCHAR(512),
            author_id VARCHAR(255) NOT NULL,
            author_name VARCHAR(255) NOT NULL,
            is_pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    try {
        await query(`ALTER TABLE admin_announcements ADD COLUMN image VARCHAR(512)`);
    } catch (e) {
        // Ignored if column already exists
    }
}

// GET - Fetch all announcements
export async function GET() {
    try {
        await initAnnouncementsTable();
        const announcements = await query(`
            SELECT * FROM admin_announcements 
            ORDER BY is_pinned DESC, created_at DESC
        `);

        // Format static english announcements to match DB schema so it always displays
        let staticEnglish = staticAnnouncementsData.en.map(ann => {
            // Convert '20.02.2026' to '2026-02-20T00:00:00.000Z'
            let isoDate = new Date().toISOString();
            if (ann.date) {
                const parts = ann.date.split('.');
                if (parts.length === 3) isoDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).toISOString();
            }
            return {
                id: ann.id,
                title: ann.title,
                content: ann.summary,
                image: ann.image,
                author_name: 'System',
                created_at: isoDate,
                is_pinned: false
            };
        });

        // Omit static announcements that have been edited and saved to DB
        staticEnglish = staticEnglish.filter(staticAnn => !announcements.some(dbAnn => dbAnn.id === staticAnn.id || dbAnn.title === staticAnn.title));

        return NextResponse.json([...announcements, ...staticEnglish]);
    } catch (error) {
        console.error('[Announcements GET Error]', error.message);
        return NextResponse.json({ error: 'Failed to load announcements' }, { status: 500 });
    }
}

// POST - Create a new announcement
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await initAnnouncementsTable();
        const body = await req.json();
        const { title, content, image, is_pinned } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const result = await query(
            `INSERT INTO admin_announcements (title, content, image, author_id, author_name, is_pinned) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, content, image || null, session.user.discord_id, session.user.name || 'Admin', is_pinned ? 1 : 0]
        );

        await initLogsTable();
        await query(
            `INSERT INTO admin_logs (admin_discord_id, admin_name, action_type, action_details) VALUES (?, ?, ?, ?)`,
            [session.user.id, session.user.name || 'Admin', 'ANNOUNCEMENT', `Posted new announcement: "${title}"`]
        );

        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('[Announcements POST Error]', error.message);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}

// PUT - Update an announcement
export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, title, content, image, is_pinned } = body;

        if (!id || !title || !content) {
            return NextResponse.json({ error: 'ID, title, and content are required' }, { status: 400 });
        }

        if (id === 'enter-the-world-of-vanguard-roleplay') {
            await query(
                `INSERT INTO admin_announcements (title, content, image, author_id, author_name, is_pinned) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [title, content, image || null, session.user.discord_id, session.user.name || 'Admin', is_pinned ? 1 : 0]
            );
            return NextResponse.json({ success: true, message: 'Static announcement saved to database' });
        }

        await query(
            `UPDATE admin_announcements 
             SET title = ?, content = ?, image = ?, is_pinned = ? 
             WHERE id = ?`,
            [title, content, image || null, is_pinned ? 1 : 0, id]
        );

        await initLogsTable();
        await query(
            `INSERT INTO admin_logs (admin_discord_id, admin_name, action_type, action_details) VALUES (?, ?, ?, ?)`,
            [session.user.id, session.user.name || 'Admin', 'ANNOUNCEMENT', `Updated announcement: "${title}"`]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Announcements PUT Error]', error.message);
        return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
    }
}

// DELETE - Delete an announcement
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await query(`DELETE FROM admin_announcements WHERE id = ?`, [id]);

        await initLogsTable();
        await query(
            `INSERT INTO admin_logs (admin_discord_id, admin_name, action_type, action_details) VALUES (?, ?, ?, ?)`,
            [session.user.id, session.user.name || 'Admin', 'ANNOUNCEMENT', `Deleted announcement ID: #${id}`]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Announcements DELETE Error]', error.message);
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
