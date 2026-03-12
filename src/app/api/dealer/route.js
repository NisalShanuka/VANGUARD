import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['admin', 'dealer'].includes(session.user.role)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orders = await query(`SELECT * FROM pdm_orders ORDER BY created_at DESC`);
        return NextResponse.json({ success: true, orders });
    } catch (error) {
        console.error('Dealer Fetch Orders Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !['admin', 'dealer'].includes(session.user.role)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { order_id, status } = await req.json();
        
        if (!order_id || !['pending', 'completed', 'declined'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
        }

        await query(`UPDATE pdm_orders SET status = ? WHERE id = ?`, [status, order_id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Dealer Update Order Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
