import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { sendDiscordDM } from '@/lib/discord';

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

        // Fetch the order before updating it so we can DM the user
        const currentOrders = await query(`SELECT user_id, vehicle_name, quantity FROM pdm_orders WHERE id = ?`, [order_id]);
        
        await query(`UPDATE pdm_orders SET status = ? WHERE id = ?`, [status, order_id]);

        let dmResult = null;
        // If order was found and status is completed or declined, send a Discord DM
        if (currentOrders.length > 0 && (status === 'completed' || status === 'declined')) {
            const order = currentOrders[0];
            const isCompleted = status === 'completed';
            const embed = {
                title: isCompleted ? "✅ PDM Order Ready" : "❌ PDM Order Declined",
                description: `Your order **#PDM-${order_id}** for **${order.quantity || 1}x ${order.vehicle_name}** has been marked as **${status.toUpperCase()}** by a dealer.`,
                color: isCompleted ? 65280 : 16711680, // Green or Red
                timestamp: new Date().toISOString(),
                footer: {
                    text: isCompleted ? "Please contact a dealer in-city to collect your vehicle." : "If you have questions, please reach out via a ticket."
                }
            };

            dmResult = await sendDiscordDM({
                userId: order.user_id,
                embed
            });
            console.log("Discord DM Send Result:", dmResult);
        }

        return NextResponse.json({ success: true, dm_result: dmResult });
    } catch (error) {
        console.error('Dealer Update Order Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
