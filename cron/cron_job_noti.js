// noti_payment_cron.js
const cron = require('node-cron');
const db_bewsie = require('../db/db_bewise'); // ไฟล์ DB ของคุณ
const { sendNotification, sendNotificationToMany } = require('../functions/notiSend_function'); // ฟังชั่นส่ง FCM

async function sendPaymentReminder() {
    const query = `
    SELECT DISTINCT f.device_token 
    FROM fcm_token f 
    INNER JOIN dataregister_2026_april_r4 d 
    ON f.id_customer = d.id_customer 
    WHERE TRIM(d.idcard_std) = ''
  `;

    db_bewsie.query(query, async (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return;
        }

        const deviceTokensList = results.map(row => row.device_token);
        if (deviceTokensList.length === 0) {
            console.log("ไม่มีผู้ใช้ที่ยังไม่ได้ชำระเงิน");
            return;
        }

        try {
            const response = await sendNotificationToMany(
                deviceTokensList,
                'ชำระเงินค่าสมัครสอบ',
                'ผู้สมัครยังไม่ได้ชำระเงินค่าสมัครสอบ'
            );
            // console.log(`ส่งแจ้งเตือนเรียบร้อย: ${response.successCount} สำเร็จ, ${response.failureCount} ล้มเหลว`);
        } catch (error) {
            console.error("Error sending notification:", error.message);
        }
    });
}

// ตั้ง cron ให้รันทุก 1 นาที
function startCron() {
    cron.schedule('* * * * *', () => {
     
        sendPaymentReminder();
    });


}
module.exports = { startCron, sendPaymentReminder };
