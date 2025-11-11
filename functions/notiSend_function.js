const admin = require("firebase-admin");

// ตรวจว่า initial แล้วหรือยัง (กันบั๊กเวลา import หลายไฟล์)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("../serviceAccountKey.json")), // ไฟล์ key ของ Firebase
  });
}

async function sendNotification(token, title, body) {
  if (!token || !title || !body) {
    throw new Error("Missing token, title, or body");
  }

  const message = {
    token,
    notification: { title, body },
    android: { priority: "high" },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent:", response);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return { success: false, error: error.message };
  }
}

// async function sendNotificationToMany(tokens, title, body) {
//   if (!tokens || tokens.length === 0) {
//     throw new Error("No tokens provided");
//   }

//   const CHUNK_SIZE = 400; 
//   let successCount = 0;
//   let failureCount = 0;

//   for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
//     const chunk = tokens.slice(i, i + CHUNK_SIZE);

//     const message = {
//       notification: { title, body },
//       tokens: chunk,
//     };

//     try {
//       const response = await admin.messaging().sendEachForMulticast(message);
//       successCount += response.successCount;
//       failureCount += response.failureCount;
//       console.log(`sent: ${response.successCount} success, ${response.failureCount} failed`);
//     } catch (error) {



        
//       console.error("❌ Error sending batch:", error);
//       failureCount += chunk.length; // นับว่าล้มทั้งหมด
//     }
//   }

//   return { successCount, failureCount };
// }
async function sendNotificationToMany(tokens, title, body) {
  if (!tokens || tokens.length === 0) {
    throw new Error("No tokens provided");
  }

  const CHUNK_SIZE = 400; 
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE);

    const message = {
      notification: { title, body },
      tokens: chunk,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;
      console.log(`Batch ${i/CHUNK_SIZE + 1}: sent ${response.successCount}, failed ${response.failureCount}`);
    } catch (error) {
      console.error(`❌ Error sending batch ${i/CHUNK_SIZE + 1}:`, error);
      failureCount += chunk.length;
    }

    // ✅ ใส่ delay สั้น ๆ ก่อน batch ถัดไป
    await new Promise(r => setTimeout(r, 1000));
  }

  return { successCount, failureCount };
}


module.exports = { sendNotification, sendNotificationToMany };
