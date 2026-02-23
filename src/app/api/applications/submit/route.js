import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// Simple Discord Webhook function
async function sendDiscordWebhook(url, embed, content = null) {
    if (!url) return;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: content,
                embeds: [{
                    ...embed,
                    color: embed.color || 3447003,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Vanguard Roleplay by SLCL', icon_url: 'https://vanguardroleplay.net/logo.png' }
                }]
            })
        });
    } catch (e) {
        console.error("Webhook Error:", e);
    }
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // Accept JSON body (from apply page)
        const body = await req.json();
        const { typeId, answers } = body;

        if (!typeId) {
            return NextResponse.json({ error: "type_id is required" }, { status: 400 });
        }

        // Get application type info
        const appTypes = await query("SELECT * FROM application_types WHERE id = ?", [typeId]);
        const appType = appTypes[0];
        if (!appType) return NextResponse.json({ error: "Invalid application type" }, { status: 404 });

        // Ensure applications table exists
        await query(`
            CREATE TABLE IF NOT EXISTS applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type_id INT NOT NULL,
                content JSON,
                status ENUM('pending','accepted','declined','interview') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Save application
        await query(
            "INSERT INTO applications (user_id, type_id, content, status) VALUES (?, ?, ?, 'pending')",
            [session.user.id, typeId, JSON.stringify(answers || {})]
        );

        // Webhook notification (pending)
        if (appType.webhook_pending) {
            const mention = session.user.discord_id ? `<@${session.user.discord_id}>` : `**${session.user.name}**`;
            await sendDiscordWebhook(appType.webhook_pending, {
                title: `📋 NEW APPLICATION RECEIVED`,
                thumbnail: { url: session.user.image || 'https://vanguardroleplay.net/logo.png' },
                description: `### Hello ${mention},\nThank you for applying to **Vanguard Roleplay**. Your application for **${appType.name}** is now under review.`,
                fields: [
                    { name: "👤 APPLICANT", value: `>>> ${session.user.name}`, inline: true },
                    { name: "🆔 DISCORD ID", value: `>>> ${session.user.discord_id || 'N/A'}`, inline: true },
                    { name: "⏳ STATUS", value: ">>> **PENDING REVIEW**", inline: true }
                ],
                image: { url: 'https://cdn.discordapp.com/attachments/1460228743955218497/1475437693864382464/standard_5.gif?ex=699d7bee&is=699c2a6e&hm=48ef0a00d12c0441928bcaea140ab30f8e563ea22658d809d4cb8b8baeeb4613&' },
                color: 0xf1c40f
            }, mention);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Submission Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
