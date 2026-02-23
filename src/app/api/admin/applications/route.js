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
            SELECT a.*, u.username, u.discord_id, u.avatar, t.name as type_name,
                   t.webhook_accepted, t.webhook_declined, t.webhook_interview, t.webhook_log
            FROM applications a
            LEFT JOIN application_users u ON a.user_id = u.id
            LEFT JOIN application_types t ON a.type_id = t.id
            WHERE a.id = ?
        `, [id]);

        const app = apps[0];
        if (!app) return NextResponse.json({ success: true });

        // Fire Discord webhook based on new status
        const webhookMap = {
            accepted: {
                url: app.webhook_accepted,
                emoji: '✅',
                color: 0x43b581,
                image: 'https://cdn.discordapp.com/attachments/1460228743955218497/1475437694342402048/standard_4.gif?ex=699d7bee&is=699c2a6e&hm=fcd38a8ed1a2d39fe2292f718e80261d51315e4620f5a2731d76c721033878be&'
            },
            declined: {
                url: app.webhook_declined,
                emoji: '❌',
                color: 0xf04747,
                image: 'https://cdn.discordapp.com/attachments/1460228743955218497/1475437694753701908/standard_3.gif?ex=699d7bee&is=699c2a6e&hm=7b95af5e8d440d991ee5103b6388e038b6ba8390a9ca13c1293310ef2c643683&'
            },
            interview: {
                url: app.webhook_interview,
                emoji: '🎤',
                color: 0x7289da,
                image: 'https://cdn.discordapp.com/attachments/1460228743955218497/1475437693344153770/standard_2.gif?ex=699d7bee&is=699c2a6e&hm=f00784c328e028b3a5e5e7ea3d8e3c5401d3ac0f8ff124177129b34ded3a2f89&'
            },
        };

        const wh = webhookMap[status];

        // 1. Send status update webhook (to applicant/public)
        if (wh && wh.url) {
            const mention = app.discord_id ? `<@${app.discord_id}>` : `**${app.username}**`;

            await fetch(wh.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: mention,
                    embeds: [{
                        title: `🛡️ APPLICATION STATUS: ${status.toUpperCase()}`,
                        thumbnail: { url: app.avatar ? `https://cdn.discordapp.com/avatars/${app.discord_id}/${app.avatar}.png` : 'https://vanguardroleplay.net/logo.png' },
                        description: `### Hello ${mention},\nYour application for **${app.type_name}** has been processed by our management team.`,
                        color: wh.color,
                        fields: [
                            { name: '📊 DECISION', value: `>>> **${status.toUpperCase()}** ${wh.emoji}`, inline: true },
                            { name: '🏷️ TYPE', value: `>>> ${app.type_name}`, inline: true },
                            { name: '📝 STAFF MESSAGE', value: notes ? `\`\`\`${notes}\`\`\`` : `\`\`\`Read our community rules and guidelines carefully.\`\`\``, inline: false }
                        ],
                        image: { url: wh.image },
                        footer: { text: 'Vanguard Management System • Automatic Notification', icon_url: 'https://vanguardroleplay.net/logo.png' },
                        timestamp: new Date().toISOString(),
                    }]
                })
            }).catch(() => { });
        }

        // 2. Send private staff log webhook (Audit Log)
        if (app.webhook_log) {
            const adminMention = session.user.discord_id ? `<@${session.user.discord_id}>` : `**${session.user.name}**`;
            const userMention = app.discord_id ? `<@${app.discord_id}>` : `**${app.username}**`;

            await fetch(app.webhook_log, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [{
                        title: `📑 STAFF ACTION LOG`,
                        color: wh?.color || 0x2f3136,
                        fields: [
                            { name: '👤 STAFF MEMBER', value: `>>> ${adminMention}`, inline: true },
                            { name: '🎯 ACTION', value: `>>> **${status.toUpperCase()}**`, inline: true },
                            { name: '📝 APPLICANT', value: `>>> ${userMention} (${app.username})`, inline: true },
                            { name: '🏷️ APP TYPE', value: `>>> ${app.type_name}`, inline: true },
                            { name: '💬 STAFF NOTES', value: notes ? `\`\`\`${notes}\`\`\`` : `\`\`\`No notes provided.\`\`\``, inline: false }
                        ],
                        footer: { text: `Application ID: #${app.id} • Vanguard Management` },
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
