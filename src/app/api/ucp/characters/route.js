import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

let gamePool;
function getGameDb() {
    if (!gamePool) {
        console.log('--- Initializing Game Database Pool ---');
        console.log('Host:', process.env.GAME_DB_HOST);
        console.log('User:', process.env.GAME_DB_USER);
        // Never log the actual password in production, but we check if it exists
        console.log('Password set:', !!process.env.GAME_DB_PASSWORD);

        gamePool = mysql.createPool({
            host: process.env.GAME_DB_HOST || 'mysql.gravelhost.com',
            user: process.env.GAME_DB_USER || 'u34572_rhgHiyuWev',
            password: process.env.GAME_DB_PASSWORD || '5aFXsV!h9wQ!Pecq1qS6ZioS',
            database: process.env.GAME_DB_NAME || 's34572_qbox',
            port: parseInt(process.env.GAME_DB_PORT || '3306'),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    return gamePool;
}
async function gameQuery(sql, params = []) {
    const [results] = await getGameDb().execute(sql, params);
    return results;
}

function safeJson(str, fallback) {
    try {
        if (typeof str === 'object' && str !== null) return str;
        return JSON.parse(str) ?? fallback;
    } catch {
        return fallback;
    }
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discordId = session.user.discord_id;

    try {
        // Find the user in the game 'users' table
        const gameUsers = await gameQuery(
            `SELECT license, license2 FROM users WHERE discord = ?`,
            [`discord:${discordId}`]
        );

        if (!gameUsers || gameUsers.length === 0) {
            return NextResponse.json({ characters: [], gameLinked: false });
        }

        const { license, license2 } = gameUsers[0];

        // Find all characters (players)
        const characters = await gameQuery(
            `SELECT citizenid, charinfo, money, job, gang, metadata, inventory, last_updated
             FROM players 
             WHERE license = ? OR license = ?`,
            [license, license2]
        );

        if (!characters || characters.length === 0) {
            return NextResponse.json({ characters: [], gameLinked: true });
        }

        const enrichedChars = await Promise.all(characters.map(async (char) => {
            const cid = char.citizenid;

            const [vehicles, apartments, stores, fuelStations, prison, dmProfile, diceStats, appearance, outfits] = await Promise.all([
                gameQuery(`SELECT * FROM player_vehicles WHERE citizenid = ?`, [cid]).catch(() => []),
                gameQuery(`SELECT * FROM 0resmon_apartment_rooms WHERE owner = ?`, [cid]).catch(() => []),
                gameQuery(`SELECT * FROM stores WHERE owner = ?`, [cid]).catch(() => []),
                gameQuery(`SELECT * FROM fuel_stations WHERE owner = ?`, [cid]).catch(() => []),
                gameQuery(`SELECT * FROM qbx_prison WHERE identifier = ?`, [cid]).catch(() => null).then(r => Array.isArray(r) ? r[0] : null),
                gameQuery(`SELECT * FROM deathmatch_profiles WHERE player_id = ?`, [cid]).catch(() => null).then(r => Array.isArray(r) ? r[0] : null),
                gameQuery(`SELECT * FROM dicebet_stats WHERE citizenid = ?`, [cid]).catch(() => null).then(r => Array.isArray(r) ? r[0] : null),
                gameQuery(`SELECT * FROM appearance WHERE id = ?`, [cid]).catch(() => null).then(r => Array.isArray(r) ? r[0] : null),
                gameQuery(`SELECT * FROM outfits WHERE player_id = ?`, [cid]).catch(() => []),
            ]);

            return {
                citizenid: cid,
                charinfo: safeJson(char.charinfo, {}),
                money: safeJson(char.money, {}),
                job: safeJson(char.job, {}),
                gang: safeJson(char.gang, {}),
                metadata: safeJson(char.metadata, {}),
                inventory: safeJson(char.inventory, []),
                last_updated: char.last_updated,
                vehicles: (vehicles || []).map(v => ({
                    ...v,
                    trunk: safeJson(v.trunk, []),
                    glovebox: safeJson(v.glovebox, []),
                })),
                apartments: apartments || [],
                stores: (stores || []).map(s => ({ ...s, stock: safeJson(s.stock, []) })),
                fuelStations: fuelStations || [],
                prison: prison || null,
                dmProfile: dmProfile || null,
                diceStats: diceStats || null,
                appearance: appearance ? {
                    ...appearance,
                    skin: safeJson(appearance.skin, {}),
                    clothes: safeJson(appearance.clothes, {}),
                    tattoos: safeJson(appearance.tattoos, []),
                } : null,
                outfits: (outfits || []).map(o => ({ ...o, outfit: safeJson(o.outfit, {}) })),
            };
        }));

        return NextResponse.json({ characters: enrichedChars, gameLinked: true });
    } catch (error) {
        console.error('Characters API Error:', error);
        return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
    }
}
