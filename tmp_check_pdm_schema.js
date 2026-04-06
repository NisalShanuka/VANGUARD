const mysql = require('mysql2/promise');

async function checkSchema() {
  const configs = [
    { host: '23.111.14.157', user: 'van_dsp', password: 'nisal_200405' },
    { host: '23.111.14.21', user: 'van_dsp', password: 'nisal_200405' }
  ];

  for (const config of configs) {
    console.log(`Trying to connect to ${config.host} to list databases...`);
    let pool;
    try {
      pool = mysql.createPool(config);
      const [rows] = await pool.query('SHOW DATABASES');
      console.log(`Databases on ${config.host}:`, JSON.stringify(rows.map(r => Object.values(r)[0]), null, 2));
      pool.end();
    } catch (e) {
      console.error(`Failed on ${config.host}:`, e.message);
      if (pool) pool.end();
    }
  }
}

checkSchema();
