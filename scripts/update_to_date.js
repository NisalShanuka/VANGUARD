const mysql = require('mysql2/promise');

async function run() {
    const connection = await mysql.createConnection({
        host: 'mysql.gravelhost.com',
        user: 'u34572_rhgHiyuWev',
        password: 'h47149Ob27@D+jBHCJ^k2oL0',
        database: 's34572_qbox',
    });

    console.log('Connected to database.');

    const [rows] = await connection.execute(
        "UPDATE application_questions SET field_type = 'date' WHERE label LIKE '%Date of Birth%' OR label LIKE '%DOB%'"
    );

    console.log(`Updated ${rows.affectedRows} rows to Date Picker.`);
    await connection.end();
}

run().catch(console.error);
