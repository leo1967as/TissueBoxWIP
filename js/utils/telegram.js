// Updated telegram.js with error logging

// ฟังก์ชันหลักสำหรับส่งข้อความไปยัง Telegram
function sendTelegramMessage(statusType, orgId) {
    console.log(`Starting sendTelegramMessage: statusType=${statusType}, orgId=${orgId}`);
    const db = firebase.firestore();
    
    // ถ้ามี orgId ให้ดึงข้อมูลจาก Firestore
    if (orgId) {
      console.log(`Fetching organization data for ID: ${orgId}`);
      db.collection("organizations").doc(orgId).get()
        .then(doc => {
          if (doc.exists) {
            const orgData = doc.data();
            console.log(`Organization data retrieved: ${JSON.stringify(orgData)}`);
            
            // ตรวจสอบว่ามี telegramChatId หรือไม่
            if (!orgData.telegramChatId) {
              console.warn(`Missing telegramChatId for organization: ${orgId}`);
              
              // ถามผู้ใช้ว่าต้องการเพิ่ม telegramChatId หรือไม่
              const chatId = prompt("กรุณาระบุ Telegram Chat ID สำหรับหน่วยงานนี้:", "");
              
              if (chatId) {
                // อัปเดต telegramChatId ในเอกสารหน่วยงาน
                db.collection("organizations").doc(orgId).update({
                  telegramChatId: chatId,
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                  console.log(`Updated organization ${orgId} with telegramChatId: ${chatId}`);
                  
                  // ส่งการแจ้งเตือนด้วย telegramChatId ที่เพิ่งเพิ่ม
                  if (orgData.telegramToken) {
                    console.log(`Sending Telegram notification with new chatId: ${chatId}`);
                    sendMessage(statusType, orgData.name, orgData.telegramToken, chatId);
                  } else {
                    console.warn(`Missing telegramToken for organization: ${orgId}`);
                    alert("ไม่พบ Telegram Token ของหน่วยงานปลายทาง");
                  }
                }).catch(error => {
                  console.error(`Error updating organization: ${error.message}`, error);
                  alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลหน่วยงาน");
                });
              } else {
                console.log("User cancelled adding telegramChatId");
                alert("ยกเลิกการส่งการแจ้งเตือน");
              }
              return;
            }
            
            sendMessage(statusType, orgData.name, orgData.telegramToken, orgData.telegramChatId);
          } else {
            console.error(`Organization not found with ID: ${orgId}`);
            alert('ไม่พบข้อมูลหน่วยงาน');
          }
        })
        .catch(error => {
          console.error(`Error getting organization: ${error.message}`, error);
          alert('เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงาน');
        });
    } else {
      // ดึงค่าจากฟอร์ม (กรณีเรียกใช้จากฟอร์มโดยตรง)
      const orgName = document.getElementById('orgName').value.trim();
      const botToken = document.getElementById('telegramToken').value.trim();
      const chatId = document.getElementById('telegramChatId').value.trim();
      
      console.log(`Using form data: orgName=${orgName}, botToken=${botToken.substring(0, 5)}..., chatId=${chatId}`);
      sendMessage(statusType, orgName, botToken, chatId);
    }
  }
  
  // ฟังก์ชันสำหรับส่งข้อความไปยัง Telegram API
  function sendMessage(statusType, orgName, botToken, chatId) {
    console.log(`sendMessage called: statusType=${statusType}, orgName=${orgName}`);
    
    // ตรวจสอบความครบถ้วน
    if (!orgName || !botToken || !chatId) {
      console.error("Missing required fields:", {
        orgName: !!orgName,
        botToken: !!botToken,
        chatId: !!chatId
      });
      alert('กรุณากรอกชื่อหน่วยงาน, Token และ Chat ID ให้ครบถ้วน');
      return;
    }
  
    // สร้างข้อความ (text)
    // สร้างข้อความ (text) ตามสถานะ
    const now = new Date().toLocaleString('th-TH');
    let text = `ชื่อหน่วยงาน: ${orgName}\nเวลา: ${now}\nสถานะ: `;
    
    if (statusType === 'sending') {
      text += 'กำลังจัดส่ง';
    } else if (statusType === 'received') {
      text += 'จัดส่งสำเร็จ\nใช้เวลาจัดส่ง: (ทดสอบ)';
    } else {
      text += statusType; // กรณีอื่นๆ ใช้ค่า statusType โดยตรง
    }
  
    console.log(`Sending message to Telegram: ${text}`);
  
    // เรียก Telegram Bot API
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    })
    .then(res => {
      console.log(`Telegram API response status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log(`Telegram API response data:`, data);
      if (data.ok) {
        alert('ส่งข้อความสำเร็จ');
      } else {
        console.error(`Telegram API error: ${data.description}`);
        alert('ส่งข้อความล้มเหลว: ' + data.description);
      }
    })
    .catch(err => {
      console.error(`Fetch error in sendMessage: ${err.message}`, err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    });
  }
  