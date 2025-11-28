const cron = require('node-cron');
const db_bewsie = require('../db/db_bewise');
const { sendNotificationToMany } = require('../functions/notiSend_function');
const import_config = require('../functions/config');


async function sendPaymentReminder() {
    const query = `
    SELECT DISTINCT f.device_token 
    FROM fcm_token f 
    INNER JOIN ${import_config.data_register_round} d 
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
                'แจ้งเตือนชำระเงินค่าสมัครสอบ',
                'การสมัครสอบยังไม่สมบูรณ์ กรุณาชำระเงินค่าสมัครสอบ'
            );
            // console.log(`ส่งแจ้งเตือนเรียบร้อย: ${response.successCount} สำเร็จ, ${response.failureCount} ล้มเหลว`);
        } catch (error) {
            console.error("Error sending notification:", error.message);
        }
    });
}
//*
async function sendDocsNoti() {
    const query = `SELECT DISTINCT f.device_token FROM fcm_token f INNER JOIN ${import_config.data_register_round} d ON f.id_customer = d.id_customer WHERE (d.idcard_std != '' AND d.idcard_std IS NOT NULL) AND NOT (d.status_file_id = 'doc_correct' AND d.status_file_gpa = 'doc_correct') AND NOT ( d.file_idcard != '' AND d.file_gpa != '' AND d.status_file_id = '' AND d.status_file_gpa = '' );`;

    db_bewsie.query(query, async (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return;
        }

        const deviceTokensList = results.map(row => row.device_token);
        if (deviceTokensList.length === 0) {
            return;
        }

        try {
            const response = await sendNotificationToMany(
                deviceTokensList,
                'เอกสารไม่ครบถ้วน', 'เอกสารสมัครสอบของนักเรียนยังไม่ครบถ้วน กรุณาตรวจสอบและอัปโหลดเอกสาร'
            );
            // console.log(`ส่งแจ้งเตือนเรียบร้อย: ${response.successCount} สำเร็จ, ${response.failureCount} ล้มเหลว`);
        } catch (error) {
            console.error("Error sending notification:", error.message);
        }
    });
}



function startCron() {
    cron.schedule('0 10,15,19 * * *', async () => {
        try {
            await sendPaymentReminder();
        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดใน cron senddPaymentReminder:', error);
        }
    }, {
        timezone: "Asia/Bangkok"
    });

    // cron.schedule('0 10,15,19 * * *', async () => {
    //     try {
    //         await sendDocsNoti();
    //     } catch (error) {
    //         console.error('❌ เกิดข้อผิดพลาดใน cron sendDocsNoti:', error);
    //     }
    // }, {
    //     timezone: "Asia/Bangkok"
    // });
}

module.exports = { startCron, sendPaymentReminder };