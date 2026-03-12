import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { vehicle_model, vehicle_name, price, is_preorder } = body;

        if (!vehicle_model || !vehicle_name || price === undefined) {
            return NextResponse.json({ success: false, error: 'Missing information' }, { status: 400 });
        }

        const insert = await query(`
            INSERT INTO pdm_orders (user_id, username, vehicle_model, vehicle_name, price, status, is_preorder)
            VALUES (?, ?, ?, ?, ?, 'pending', ?)
        `, [
            session.user.discord_id || session.user.id,
            session.user.name,
            vehicle_model,
            vehicle_name,
            price,
            is_preorder ? 1 : 0
        ]);

        return NextResponse.json({ success: true, order_id: insert.insertId });
    } catch (error) {
        console.error('PDM Order Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
