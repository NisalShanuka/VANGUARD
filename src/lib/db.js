import mysql from 'mysql2/promise';

const getPool = () => {
    if (globalThis.pool) return globalThis.pool;
    console.log('[DB] Creating new connection pool at ' + new Date().toISOString());
    globalThis.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'test1',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: 5000, // 5s
    });
    return globalThis.pool;
};

export const getDb = () => getPool();

export const query = async (sql, params) => {
    const db = getDb();
    try {
        const safeParams = Array.isArray(params)
            ? params.map(p => (p === undefined ? null : p))
            : [];

        // Add a 15-second timeout to any query to prevent infinite hangs
        const queryPromise = db.execute(sql, safeParams);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query Timeout (15s)')), 15000)
        );

        const [results] = await Promise.race([queryPromise, timeoutPromise]);
        return results;
    } catch (error) {
        console.error('Database Query Error:', error.message || 'Unknown Error', '| SQL:', sql);
        throw error;
    }
};

export const getUserByDiscordId = async (discordId) => {
    const results = await query('SELECT * FROM application_users WHERE discord_id = ?', [discordId]);
    return results[0];
};

export const createOrUpdateUser = async (data) => {
    const user = await getUserByDiscordId(data.id);
    const username = data.username || 'Unknown';
    const discriminator = data.discriminator || '0';
    const avatar = data.avatar || null;

    if (user) {
        await query(
            'UPDATE application_users SET username = ?, discriminator = ?, avatar = ? WHERE discord_id = ?',
            [username, discriminator, avatar, data.id]
        );
        return user.id;
    } else {
        const result = await query(
            'INSERT INTO application_users (discord_id, username, discriminator, avatar) VALUES (?, ?, ?, ?)',
            [data.id, username, discriminator, avatar]
        );
        return result.insertId;
    }
};
