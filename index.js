const express = require('express');
const dotenv = require('dotenv');
const upload_router = require('./router/upload_router');
const user_data_router = require('./router/user_data_router');
const register_exam_router = require('./router/register_exam');
const log_error = require('./functions/log_error');
require('dotenv').config(); 

dotenv.config();
const app = express();
const onPort = process.env.PORT || 3000;
// 1. สำหรับแปลภาษา JSON (ที่คุณใช้กับ QR Code)
app.use(express.json()); 

// 2. สำหรับแปลภาษา Form (ที่คุณใช้กับ TikTok Pay)
app.use(express.urlencoded({ extended: true }));
 
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
 
process.on("uncaughtException", (err) => {
  log_error.error("🔥 Uncaught Exception:", err);
  console.log(err);
 
});

process.on("unhandledRejection", (reason, promise) => {
  log_error.error("🔥 Unhandled Rejection at:", promise, "reason:", reason);
 
  console.log(err);
});

app.listen(onPort, () => {
  console.log('🚀 Server is running on port ' + onPort);
});



//  data.datetime = {
//           date: '12 ตุลาคม 2568',
//           time: '12.00 - 14.30 น.'
//       };




