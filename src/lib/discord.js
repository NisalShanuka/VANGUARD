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

export async function manageDiscordRole({ userId, roleId, action = 'add' }) {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    // Ensure they are strings
    const strUserId = userId ? String(userId) : null;
    const strRoleId = roleId ? String(roleId) : null;

    if (!botToken || !guildId || !strUserId || !strRoleId) {
        console.error("[manageDiscordRole] Missing parameters:", { botToken: !!botToken, guildId, strUserId, strRoleId });
        return { ok: false, reason: "missing_parameters" };
    }

    const endpoint = `${DISCORD_API_BASE}/guilds/${guildId}/members/${strUserId}/roles/${strRoleId}`;

    try {
        console.log(`[Discord API] ${action === 'add' ? 'Adding' : 'Removing'} role ${strRoleId} to/from user ${strUserId}`);
        const response = await fetch(endpoint, {
            method: action === 'add' ? 'PUT' : 'DELETE',
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (response.status === 204) {
            console.log(`[Discord API] Success: 204 No Content`);
            return { ok: true };
        }

        const raw = await response.text();
        console.error(`[manageDiscordRole] Discord API error (${response.status}):`, raw);
        return {
            ok: false,
            status: response.status,
            reason: "discord_api_error",
            body: raw,
        };
    } catch (error) {
        console.error("[manageDiscordRole] Network error:", error);
        return {
            ok: false,
            reason: "network_or_fetch_error",
            error: error?.message || String(error),
        };
    }
}
