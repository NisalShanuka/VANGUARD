const mysql = require('mysql2/promise');

async function run() {
    const connection = await mysql.createConnection({
        host: 'mysql.gravelhost.com',
        user: 'u34572_rhgHiyuWev',
        password: 'h47149Ob27@D+jBHCJ^k2oL0',
        database: 's34572_qbox',
    });

    console.log('Connected to database.');

    try {
        await connection.execute(
            "ALTER TABLE application_types ADD COLUMN webhook_log VARCHAR(512) DEFAULT ''"
        );
        console.log('Column webhook_log added to application_types.');
    } catch (e) {
        if (e.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column webhook_log already exists.');
        } else {
            throw e;
        }
    }

    await connection.end();
}

run().catch(console.error);
