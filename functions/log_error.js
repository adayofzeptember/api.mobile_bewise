// logger.js
const fs = require('fs');
const path = require('path');

// สร้าง path ของไฟล์ log
const logFile = path.join(__dirname, 'apperror.log');

// ฟังก์ชันเขียน log ลงไฟล์
function writeLog(level, message) {
  const logMessage = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage, 'utf8');  // เขียนต่อท้ายไฟล์
  console.log(logMessage); // ยังโชว์บน console ด้วย
}

module.exports = {
  info: (msg) => writeLog('info', msg),
  error: (msg) => writeLog('error', msg),
};