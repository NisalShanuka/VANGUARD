const mysql = require('mysql2/promise');
const fs = require('fs');

async function main() {
  const pool = mysql.createPool({
    host: '23.111.14.21',
    user: 'van_dsp',
    password: 'nisal_200405',
    database: 'Qbox_9E0DC6',
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync('setup_pdm.sql', 'utf8');
    await pool.query(sql);
    console.log('Database updated successfully');
    pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    pool.end();
  }
}
main();
