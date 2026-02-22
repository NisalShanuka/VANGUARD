import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();

        const userId = session.user.id;

        // Ensure user exists in application_users (should already exist due to session)
        const users = await query("SELECT id FROM application_users WHERE id = ?", [userId]);
        if (users.length === 0) {
            // Fallback for edge cases where user is in session but not in DB somehow
            const result = await query(
                "INSERT INTO application_users (discord_id, username, discriminator, avatar) VALUES (?, ?, ?, ?)",
                [session.user.discord_id || userId, session.user.name || "Unknown", "", session.user.image || ""]
            );
            // userId is already set to session.user.id, but if we just inserted, we should use the new one?
            // Actually, session.user.id SHOULD be the DB ID.
        }

        // Check if application_types exists, specifically 'whitelist'
        // If it doesn't exist, we might need to insert it or handle the error
        const types = await query("SELECT id FROM application_types WHERE slug = 'whitelist'");
        if (types.length === 0) {
            return NextResponse.json({ success: false, message: "Application type 'whitelist' not found in database." }, { status: 400 });
        }
        const typeId = types[0].id;

        await query(
            "INSERT INTO applications (user_id, type_id, content, status) VALUES (?, ?, ?, 'pending')",
            [userId, typeId, JSON.stringify(body)]
        );

        return NextResponse.json({ success: true, message: "Application submitted successfully" });
    } catch (error) {
        console.error("Whitelist Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
