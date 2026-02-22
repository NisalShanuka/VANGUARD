import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// Simple Discord Webhook function
async function sendDiscordWebhook(url, embed) {
    if (!url) return;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    ...embed,
                    color: 3447003,
                    timestamp: new Date().toISOString()
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
            await sendDiscordWebhook(appType.webhook_pending, {
                title: `📝 New ${appType.name} Application`,
                description: `A new **${appType.name}** application has been received.`,
                fields: [
                    { name: "Applicant", value: session.user.name || 'Unknown', inline: true },
                    { name: "Discord ID", value: session.user.discord_id || session.user.id || 'N/A', inline: true },
                    { name: "Status", value: "⏳ Pending Review", inline: true }
                ]
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Submission Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
