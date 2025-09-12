//? starter
const express = require('express');
const dotenv = require('dotenv');
const upload_router = require('./router/upload_router');
const user_data_router = require('./router/user_data_router');
const register_exam_router = require('./router/register_exam');
const path = require('path');
const { constants } = require('module');
// หลัก 
dotenv.config();
const app = express();
const onPort = process.env.PORT || 3000;

app.use(express.json());
app.use('/userinfo', user_data_router);
app.use('/exam_register', register_exam_router);

// uploads----------dd---------ก------------- 
app.use('/upload', upload_router);
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('/newdata/vhosts/bewise-global.com/httpdocs/uploads'));


// ✅ Error handler สำหรับ route
app.use((err, req, res, next) => {
  console.error("❌ Error caught:", err.stack || err);
  res.status(500).json({
    success: false,
    message: "มีข้อผิดพลาดภายในเซิร์ฟเวอร์",
  });
});

// ✅ จับ error ที่ Express handle ไม่ได้
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
  // แค่ log เอาไว้ก่อน ยังให้ server รันต่อ
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
  // ป้องกันไม่ให้ process crash
});

app.listen(onPort, () => {
  console.log('🚀 Server is running on port ' + onPort);
});

// dataregister_2026_april_r3
// datapayment_2026_april_r3
// file_BWG_April_R3_2026