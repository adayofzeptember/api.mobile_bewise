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
//! git-------------------------------- 
// uploads-------------------------------- 
app.use('/upload', upload_router);
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static('/newdata/vhosts/bewise-global.com/httpdocs/uploads'));


app.listen(onPort, () => {
  console.log('Server is running on port ' + onPort);
});



