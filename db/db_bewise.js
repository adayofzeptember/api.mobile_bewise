const mysql = require('mysql2');
require('dotenv').config();



const db_bewise = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8'
});

db_bewise.connect((err) => {
  if (err) {
    console.error('❌❌❌ not connect to the bewise-glob database ❌❌❌');
    process.exit(1);
  }
  console.log('✅✅✅ Connected to the bewise-glob database ✅✅✅');
});

module.exports = db_bewise;  // ส่งออกตัวแปร db เพื่อใช้งานในไฟล์อื่น

