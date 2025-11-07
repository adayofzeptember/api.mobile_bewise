const express = require("express");
const admin = require("firebase-admin");
const fs = require("fs");
const router = express.Router();

// ✅ โหลด service account key
const serviceAccount = JSON.parse(
    fs.readFileSync("./serviceAccountKey.json", "utf-8")
);

// ✅ ป้องกัน initialize ซ้ำ
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// ✅ ฟังก์ชันยิงแจ้งเตือน
router.post("/send", async (req, res) => {
    const { token, title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: "Missing token, title, or body" });
    }
    const message = {
        token: token,
        notification: {
            title: title,
            body: body,
        },
        android: {
            priority: "high",
        },
    };
    try {
        const response = await admin.messaging().send(message);
    
        res.json({ success: true, message: "notification sent" });
    } catch (error) {
        console.error("❌ Error sending message:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// router.post("/getToken", async (req, res) => {
//     const { token } = req.body;
//     console.log(token);
//     res.status(200).json({ success: true});
// });

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

      console.log("✅ Token saved:", token);
      res.status(200).json({ success: true, message: "Token saved successfully" });
    });
  } catch (error) {
    console.error("🔥 Error in /getToken:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
