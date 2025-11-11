const express = require("express");
const admin = require("firebase-admin");
const fs = require("fs");
const router = express.Router();
const db_bewsie = require('../db/db_bewise');
const { sendNotification, sendNotificationToMany } = require("../functions/notiSend_function");

// ✅ โหลด service account key
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}



router.post("/send", async (req, res) => {
  const { token, title, body } = req.body;

  try {
    const result = await sendNotification(token, title, body);
    if (result.success) {
      res.json({ success: true, message: "notification sent" });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});


router.post("/boardcast", async (req, res) => {
  const { title, body } = req.body;
  const query = "SELECT device_token FROM fcm_token";

  db_bewsie.query(query, async (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });


    const tokens = results.map(r => r.device_token);
    // console.log("Tokens to send:", tokens);
    if (tokens.length === 0) return res.status(404).json({ success: false, message: "No tokens found" });

    try {
      const response = await sendNotificationToMany(tokens, title, body);
      res.json({
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
});



router.post("/noti_payment", async (req, res) => {

  const query = "SELECT DISTINCT f.device_token FROM fcm_token f INNER JOIN dataregister_2026_april_r4 d ON f.id_customer = d.id_customer WHERE TRIM(d.idcard_std) = ''";

  db_bewsie.query(query, async (err, results) => {

    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({
        success: false,
        message: "Database query failed",
        error: err.message
      });
    }

    const deviceTokensList = results.map(row => row.device_token);
    res.json({
      deviceTokensList
    });
    try {

      const response = await sendNotificationToMany(deviceTokensList, 'ชำระเงินค่าสมัครสอบ', 'ผู้สมัครยังไม่ได้ชำระเงินค่าสมัครสอบ');
      res.json({
        success: true,

        sent: response.successCount,
        failed: response.failureCount,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
});

router.post("/insert_token", async (req, res) => {
  try {
    const { token, id } = req.body;

    if (!token || token === "null") {
      return res.status(400).json({
        message: "⚠️ Token เป็น null หรือว่าง ไม่สามารถ insert ได้",
      });
    }

    const query = `
      INSERT INTO fcm_token (id_customer, device_token, update_time)
      VALUES (?, ?, NOW())
      ON DUPLICATE KEY UPDATE update_time = NOW();
    `;

    db_bewsie.query(query, [id, token], (err, result) => {
      if (err) {
        console.error("❌ Error inserting/updating token:", err);
        return res.status(500).json({
          message: "Database error",
          error: err,
        });
      }

      if (result.affectedRows === 1) {
        return res.status(200).json({
          message: "✅ เก็บ token ใหม่แล้ว",
        });
      } else if (result.affectedRows === 2) {
        return res.status(200).json({
          message: "♻️ Token มีอยู่แล้วสำหรับ id นี้ อัปเดต update_time เรียบร้อย",
        });
      } else {
        return res.status(200).json({
          message: "ℹ️ ไม่มีการเปลี่ยนแปลง",
        });
      }
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
});


router.post("/getToken", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token not found" });
    }

    // 📝 กำหนดชื่อไฟล์ที่เก็บ token
    const filePath = "./fcm_tokens.txt";

    // เขียนต่อท้ายไฟล์ (append)
    const logLine = `${new Date().toISOString()} - ${token}\n`;

    fs.appendFile(filePath, logLine, (err) => {
      if (err) {
        console.error("❌ Error writing token:", err);
        return res.status(500).json({ success: false, message: "Failed to save token" });
      }

      res.status(200).json({ success: true, message: "Token saved successfully" });
    });
  } catch (error) {
    console.error("🔥 Error in /getToken:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;