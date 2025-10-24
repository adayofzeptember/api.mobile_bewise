const express = require('express');
const dotenv = require('dotenv');
const upload_router = require('./router/upload_router');
const user_data_router = require('./router/user_data_router');
const register_exam_router = require('./router/register_exam');
const path = require('path');
const log_error = require('./functions/log_error');
const axios = require('axios');
require('dotenv').config(); // โหลดตัวแปรจากไฟล์ .env
const { constants } = require('module');

dotenv.config();
const app = express();
const onPort = process.env.PORT || 3000;

app.use(express.json());
app.use('/userinfo', user_data_router);
app.use('/exam_register', register_exam_router);


app.use('/upload', upload_router);
app.use('/uploads', express.static('/newdata/vhosts/bewise-global.com/httpdocs/uploads'));

//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use((err, req, res, next) => {
  log_error.error(`🔥 API Error: ${err.stack || err}`);
  console.log(err);
  res.status(500).json({
    success: false,
    message: "Server error, please try again later."
  });
});

// ✅ จับ error ที่ Express handle ไม่ได้
process.on("uncaughtException", (err) => {
  log_error.error("🔥 Uncaught Exception:", err);
  console.log(err);

  // แค่ log เอาไว้ก่อน ยังห้ใ server รันต่อ
});

process.on("unhandledRejection", (reason, promise) => {
  log_error.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
  // ป้องกันไม่ให้ process crash
  console.log(err);
});

app.listen(onPort, () => {
  console.log('🚀 Server is running on port ' + onPort);
});



//  data.datetime = {
//           date: '12 ตุลาคม 2568',
//           time: '12.00 - 14.30 น.'
//       };