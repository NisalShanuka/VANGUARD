const mysql = require('mysql2/promise');

async function run() {
    const connection = await mysql.createConnection({
        host: 'mysql.gravelhost.com',
        user: 'u34572_rhgHiyuWev',
        password: 'h47149Ob27@D+jBHCJ^k2oL0',
        database: 's34572_qbox',
    });

    console.log('Connected to database.');

    // 1. Convert field_type to VARCHAR to support new types
    console.log('Altering table schema...');
    await connection.execute(
        "ALTER TABLE application_questions MODIFY COLUMN field_type VARCHAR(255) DEFAULT 'text'"
    );
    console.log('Schema updated.');

    // 2. Set the correct type for declaration questions
    console.log('Updating questions to checkboxes...');
    const [rows] = await connection.execute(
        `UPDATE application_questions 
         SET field_type = 'checkbox_single', options = '' 
         WHERE label LIKE '%I confirm%' 
            OR label LIKE '%I understand%' 
            OR label LIKE '%Do you agree%' 
            OR label LIKE '%read all rules%' 
            OR label LIKE '%එකඟද%'`
    );

    console.log(`Updated ${rows.affectedRows} rows.`);

    // Check current state
    const [final] = await connection.execute(
        "SELECT id, label, field_type FROM application_questions WHERE field_type = 'checkbox_single'"
    );
    console.log('Current checkbox_single questions:');
    final.forEach(q => console.log(`- [${q.id}] ${q.label}`));

    await connection.end();
}

run().catch(console.error);
