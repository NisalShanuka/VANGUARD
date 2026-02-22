const DISCORD_API_BASE = "https://discord.com/api/v10";

export async function addDiscordMemberToGuild({ userId, userAccessToken }) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!botToken || !guildId) {
        return { ok: false, skipped: true, reason: "missing_bot_token_or_guild_id" };
    }

    if (!userId || !userAccessToken) {
        return { ok: false, skipped: true, reason: "missing_user_id_or_access_token" };
    }

    const endpoint = `${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`;

    try {
        const response = await fetch(endpoint, {
            method: "PUT",
            headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                access_token: userAccessToken,
            }),
        });

        if (response.status === 201 || response.status === 204) {
            return { ok: true, status: response.status };
        }

        const raw = await response.text();
        return {
            ok: false,
            status: response.status,
            reason: "discord_api_error",
            body: raw,
        };
    } catch (error) {
        return {
            ok: false,
            reason: "network_or_fetch_error",
            error: error?.message || String(error),
        };
    }
}
