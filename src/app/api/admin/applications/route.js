import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { initLogsTable } from '../logs/route';

export const dynamic = 'force-dynamic';

// Safely ensure a column exists (works on all MySQL/MariaDB versions)
async function ensureColumn(table, column, definition) {
    try {
        const rows = await query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [table, column]
        );
        if (!rows || rows.length === 0) {
            await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
    } catch (e) {
        console.error(`[ensureColumn] ${table}.${column}:`, e.message);
    }
}

// GET — all applications for admin
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Ensure applications table exists
        await query(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type_id INT NOT NULL,
                content JSON,
                status ENUM('pending','accepted','declined','interview') DEFAULT 'pending',
                notes TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Safely add notes column if table existed before this migration
        await ensureColumn('applications', 'notes', "TEXT DEFAULT ''");

        const applications = await query(`
            SELECT 
                a.id, a.user_id, a.type_id, a.content, a.status, 
                a.notes, a.created_at, a.updated_at,
                u.username, u.discord_id, u.avatar,
                t.name as type_name, t.slug as type_slug
            FROM applications a
            LEFT JOIN application_users u ON a.user_id = u.id
            LEFT JOIN application_types t ON a.type_id = t.id
            ORDER BY a.created_at DESC
        `);

        return NextResponse.json(applications);
    } catch (error) {
        console.error('[Admin Applications GET]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH — update application status / notes
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id, status, notes } = await req.json();
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        await ensureColumn('applications', 'notes', "TEXT DEFAULT ''");

        await query(
            `UPDATE applications SET status = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
            [status, notes ?? '', id]
        );

        // Add to admin logs
        await initLogsTable();
        await query(
            `INSERT INTO admin_logs (admin_discord_id, admin_name, action_type, action_details) VALUES (?, ?, ?, ?)`,
            [session.user.id, session.user.name || 'Admin', 'APPLICATION', `Set application #${id} status to ${status.toUpperCase()}`]
        );

        // Get full application for webhook
        const apps = await query(`
            SELECT a.*, u.username, u.discord_id, t.name as type_name,
                   t.webhook_accepted, t.webhook_declined, t.webhook_interview
            FROM applications a
            LEFT JOIN application_users u ON a.user_id = u.id
            LEFT JOIN application_types t ON a.type_id = t.id
            WHERE a.id = ?
        `, [id]);

        const app = apps[0];
        if (!app) return NextResponse.json({ success: true });

        // Fire Discord webhook based on new status
        const webhookMap = {
            accepted: { url: app.webhook_accepted, emoji: '✅', color: 0x43b581 },
            declined: { url: app.webhook_declined, emoji: '❌', color: 0xf04747 },
            interview: { url: app.webhook_interview, emoji: '🎤', color: 0x7289da },
        };
        const wh = webhookMap[status];
        if (wh && wh.url) {
            await fetch(wh.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: `${wh.emoji} Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                        description: `**${app.username}**'s **${app.type_name}** application has been **${status}**.`,
                        color: wh.color,
                        fields: notes ? [{ name: 'Staff Notes', value: notes }] : [],
                        timestamp: new Date().toISOString(),
                    }]
                })
            }).catch(() => { });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Admin Applications PATCH]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
