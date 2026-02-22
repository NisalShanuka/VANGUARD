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
            // Admin: show alerts for all application statuses
            // 1. Get counts for badge/summary
            const counts = await query(`
                SELECT status, COUNT(*) as count 
                FROM applications 
                WHERE status IN ('pending', 'interview')
                GROUP BY status
            `).catch(() => []);

            const pendingCount = counts.find(c => c.status === 'pending')?.count || 0;
            const interviewCount = counts.find(c => c.status === 'interview')?.count || 0;
            const totalUnread = pendingCount + interviewCount;

            // 2. Fetch recent activity (alerts)
            const recentActivity = await query(`
                SELECT a.id, a.status, a.updated_at, u.name as username
                FROM applications a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.updated_at DESC
                LIMIT 5
            `).catch(() => []);

            const notifications = recentActivity.map(app => {
                let title = 'Application Alert';
                let subtitle = `${app.username}'s app is now ${app.status.toUpperCase()}`;

                if (app.status === 'pending') title = 'New Application';
                else if (app.status === 'interview') title = 'Interview Scheduled';
                else if (app.status === 'accepted') title = 'Application Accepted';
                else if (app.status === 'declined') title = 'Application Declined';

                return {
                    title,
                    subtitle,
                    status: app.status,
                    time: app.updated_at,
                    href: '/admin',
                };
            });

            // If no recent activity, but pending items exist, show summary
            if (notifications.length === 0 && totalUnread > 0) {
                notifications.push({
                    title: `${totalUnread} items awaiting review`,
                    subtitle: `${pendingCount} pending, ${interviewCount} interview`,
                    status: 'pending',
                    time: new Date(),
                    href: '/admin',
                });
            }

            return NextResponse.json({ notifications, unread: totalUnread });

        } else {
            // Regular user: show their application status updates
            const apps = await query(`
                SELECT a.id, a.status, a.updated_at, t.name as type_name
                FROM applications a
                LEFT JOIN application_types t ON a.type_id = t.id
                WHERE a.user_id = ?
                ORDER BY a.updated_at DESC
                LIMIT 5
            `, [session.user.id]).catch(() => []);

            const notifications = (apps || []).map(app => ({
                title: 'Application Update',
                subtitle: `Your ${app.type_name} application is ${app.status.toUpperCase()}`,
                status: app.status,
                time: app.updated_at,
                href: '/ucp/my-applications',
            }));

            // Count anything updated in the last 24 hours as "unread" for simplicity if no 'seen' field exists
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const unread = (apps || []).filter(a => new Date(a.updated_at) > oneDayAgo).length;
            return NextResponse.json({ notifications, unread });
        }
    } catch (error) {
        console.error('[Notifications API]', error.message);
        return NextResponse.json({ notifications: [], unread: 0 });
    }
}
