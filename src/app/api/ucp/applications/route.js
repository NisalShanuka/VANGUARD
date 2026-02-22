import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const applications = await query(
            `SELECT a.*, t.name as type_name, u.discord_name 
       FROM applications a 
       JOIN application_types t ON a.type_id = t.id 
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = ? 
       ORDER BY a.created_at DESC`,
            [session.user.id]
        );

        return NextResponse.json(applications);
    } catch (error) {
        console.error('UCP Applications API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
