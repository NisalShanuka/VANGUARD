import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { sendDiscordDM } from '@/lib/discord';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    try {
        const users = await query('SELECT * FROM application_users WHERE id = ?', [session.user.id]);
        const user = users[0];

        if (!user || (user.role !== 'dealer' && user.is_dealer !== 1)) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Dealer access only.' }, { status: 401 });
        }

        const orders = await query(`SELECT * FROM pdm_orders ORDER BY created_at DESC`);
        return NextResponse.json({ success: true, orders });
    } catch (error) {
        console.error('Dealer Fetch Orders Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    try {
        const users = await query('SELECT * FROM application_users WHERE id = ?', [session.user.id]);
        const user = users[0];

        if (!user || (user.role !== 'dealer' && user.is_dealer !== 1)) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Dealer access only.' }, { status: 401 });
        }

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
                title: isCompleted ? "🎉 Your Delivery is Ready!" : "❌ Order Declined",
                description: isCompleted 
                    ? `Great news! Your recent vehicle order has been processed by our dealership team and is now **Ready for Collection**.` 
                    : `Unfortunately, your recent vehicle order has been **Declined** by our dealership team.`,
                color: isCompleted ? 0x2ecc71 : 0xe74c3c, // Emerald or Alizarin
                fields: [
                    {
                        name: "🧾 Order Reference",
                        value: `\`#PDM-${order_id}\``,
                        inline: true
                    },
                    {
                        name: "📊 Status",
                        value: isCompleted ? "✅ Completed" : "🚫 Declined",
                        inline: true
                    },
                    {
                        name: "🏎️ Vehicle Ordered",
                        value: `**${order.quantity || 1}x** ${order.vehicle_name}`,
                        inline: false
                    }
                ],
                author: {
                    name: "Vanguard Dealership",
                    icon_url: "https://r2.fivemanage.com/ZInWw3B9H2Y6pU3zSjC6o/images/logonew.png"
                },
                thumbnail: {
                    url: "https://cdn.discordapp.com/attachments/1113800619864703086/1144265507548233818/pdm.png"
                },
                footer: {
                    text: isCompleted 
                        ? "Please visit the dealership in-city and provide your Order Reference to collect." 
                        : "Please open a ticket if you believe this was an error.",
                    icon_url: "https://r2.fivemanage.com/ZInWw3B9H2Y6pU3zSjC6o/images/logonew.png"
                },
                timestamp: new Date().toISOString()
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
