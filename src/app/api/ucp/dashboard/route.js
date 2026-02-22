import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * Vanguard UCP Dashboard API
 * Fetches user profile, recent applications, and available types.
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch user basic data
        const users = await query(
            'SELECT role FROM application_users WHERE id = ?',
            [session.user.id]
        );
        const user = users[0];

        // Fetch recent applications
        const recentApplications = await query(
            `SELECT a.*, t.name as type_name 
             FROM applications a 
             JOIN application_types t ON a.type_id = t.id 
             WHERE a.user_id = ? 
             ORDER BY a.created_at DESC LIMIT 5`,
            [session.user.id]
        );

        const applicationTypes = await query(
            'SELECT id, name, slug, description FROM application_types'
        );

        return NextResponse.json({
            user,
            recentApplications,
            applicationTypes
        });
    } catch (error) {
        console.error('UCP Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
