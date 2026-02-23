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
        "SELECT id, label, field_type FROM application_questions"
    );

    console.log(`Total questions in DB: ${rows.length}`);

    const targets = rows.filter(r =>
        r.label.toLowerCase().includes('agree') ||
        r.label.includes('එකඟ')
    );

    console.log(`Matching target questions: ${targets.length}`);

    for (const q of targets) {
        console.log(`ID: ${q.id} | Current: ${q.field_type} | Label: ${q.label}`);
        await connection.execute(
            "UPDATE application_questions SET field_type = 'checkbox_single', options = '' WHERE id = ?",
            [q.id]
        );
        console.log(`Updated ID ${q.id} to checkbox_single`);
    }

    await connection.end();
}

run().catch(console.error);
