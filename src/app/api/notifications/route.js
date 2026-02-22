import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ notifications: [], unread: 0 });

    const isAdmin = session.user.role === 'admin';

    try {
        if (isAdmin) {
            // Admin: show pending applications count
            const rows = await query(
                `SELECT COUNT(*) as count FROM applications WHERE status = 'pending'`
            ).catch(() => [{ count: 0 }]);

            const count = rows[0]?.count || 0;
            const notifications = count > 0 ? [{
                title: `${count} pending application${count > 1 ? 's' : ''} awaiting review`,
                subtitle: 'Click to open the admin dashboard',
                status: 'pending',
                href: '/admin',
            }] : [];

            return NextResponse.json({ notifications, unread: count });

        } else {
            // Regular user: show their application status updates
            const apps = await query(`
                SELECT a.id, a.status, a.updated_at
                FROM applications a
                WHERE a.user_id = ?
                ORDER BY a.updated_at DESC
                LIMIT 5
            `, [session.user.id]).catch(() => []);

            const notifications = (apps || []).map(app => ({
                title: 'Application Update',
                subtitle: `Status: ${app.status}`,
                status: app.status,
                href: '/ucp',
            }));

            const unread = (apps || []).filter(a => a.status !== 'pending').length;
            return NextResponse.json({ notifications, unread });
        }
    } catch (error) {
        console.error('[Notifications API]', error.message);
        return NextResponse.json({ notifications: [], unread: 0 });
    }
}
