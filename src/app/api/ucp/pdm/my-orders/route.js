import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const discordId = session.user.discord_id || session.user.id;
        const orders = await query(`
            SELECT id, vehicle_name, vehicle_model, price, quantity, status, is_preorder, created_at 
            FROM pdm_orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [discordId]);

        return NextResponse.json({ success: true, orders });
    } catch (error) {
        console.error('Fetch My Orders Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
