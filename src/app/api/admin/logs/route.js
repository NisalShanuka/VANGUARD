import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function initLogsTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS admin_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_discord_id VARCHAR(255) NOT NULL,
            admin_name VARCHAR(255) NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            action_details TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await initLogsTable();
        const logs = await query(`
            SELECT * FROM admin_logs 
            ORDER BY created_at DESC 
            LIMIT 100
        `);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('[Admin Logs GET Error]', error);
        return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 });
    }
}
