// ฟังก์ชันสำหรับส่งการแจ้งเตือนเมื่อสแกน QR code
// ฟังก์ชันสำหรับส่งการแจ้งเตือนเมื่อสแกน QR code
// ฟังก์ชันสำหรับส่งการแจ้งเตือนเมื่อสแกน QR code
function sendNotificationFromQR(boxId, status) {
  console.log(`sendNotificationFromQR called: boxId=${boxId}, status=${status}`);
  try {
    const db = firebase.firestore();
    
    // ดึงข้อมูลกล่องจาก Firestore
    console.log(`Fetching delivery data for box ID: ${boxId}`);
    db.collection("deliveries").doc(boxId).get().then(async (doc) => {
      if (doc.exists) {
        const data = doc.data();
        console.log(`Delivery data retrieved:`, data);
        const toLocationId = data.toLocationId || data.toLocation;
        const fromLocationId = data.fromLocationId || data.fromLocation;
        
        // ดึงข้อมูลหน่วยงานปลายทาง
        if (toLocationId) {
          console.log(`Fetching destination organization data for ID: ${toLocationId}`);
          db.collection("organizations").doc(toLocationId).get().then(toOrgDoc => {
            if (toOrgDoc.exists) {
              const toOrgData = toOrgDoc.data();
              console.log(`Destination organization data retrieved:`, toOrgData);
              
              // ดึงข้อมูลหน่วยงานต้นทาง
              if (fromLocationId) {
                console.log(`Fetching source organization data for ID: ${fromLocationId}`);
                db.collection("organizations").doc(fromLocationId).get().then(fromOrgDoc => {
                  if (fromOrgDoc.exists) {
                    const fromOrgData = fromOrgDoc.data();
                    console.log(`Source organization data retrieved:`, fromOrgData);
                    
                    // ส่งการแจ้งเตือนไปยังทั้งหน่วยงานต้นทางและปลายทาง
                    sendNotificationsToOrganizations(status, boxId, fromOrgData, toOrgData);
                  } else {
                    console.warn(`Source organization not found with ID: ${fromLocationId}`);
                    // ถ้าไม่พบหน่วยงานต้นทาง ให้ส่งแจ้งเตือนเฉพาะหน่วยงานปลายทาง
                    sendNotificationToSingleOrganization(status, boxId, toOrgData, "destination");
                  }
                }).catch(error => {
                  console.error(`Error fetching source organization: ${error.message}`, error);
                  // ถ้าเกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงานต้นทาง ให้ส่งแจ้งเตือนเฉพาะหน่วยงานปลายทาง
                  sendNotificationToSingleOrganization(status, boxId, toOrgData, "destination");
                });
              } else {
                console.warn(`No source organization ID found for box: ${boxId}`);
                // ถ้าไม่มีข้อมูลหน่วยงานต้นทาง ให้ส่งแจ้งเตือนเฉพาะหน่วยงานปลายทาง
                sendNotificationToSingleOrganization(status, boxId, toOrgData, "destination");
              }
            } else {
              console.error(`Destination organization not found with ID: ${toLocationId}`);
              alert("ไม่พบข้อมูลหน่วยงานปลายทาง");
            }
          }).catch(error => {
            console.error(`Error fetching destination organization: ${error.message}`, error);
            alert("เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงานปลายทาง");
          });
        } else {
          console.warn(`No destination organization ID found for box: ${boxId}`);
          alert("ไม่พบข้อมูลหน่วยงานปลายทาง");
        }
      } else {
        console.error(`Delivery not found with ID: ${boxId}`);
        alert("ไม่พบข้อมูลกล่องที่ต้องการ");
      }
    }).catch(error => {
      console.error(`Error fetching delivery: ${error.message}`, error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลกล่อง");
    });
  } catch (error) {
    console.error(`Exception in sendNotificationFromQR: ${error.message}`, error);
    alert("เกิดข้อผิดพลาดในการส่งการแจ้งเตือน");
  }
}

// ฟังก์ชันสำหรับส่งการแจ้งเตือนไปยังทั้งหน่วยงานต้นทางและปลายทาง
function sendNotificationsToOrganizations(status, boxId, fromOrgData, toOrgData) {
  console.log(`Sending notifications to both organizations: status=${status}, boxId=${boxId}`);
  
  // ส่งการแจ้งเตือนไปยังหน่วยงานปลายทาง
  if (toOrgData.telegramToken) {
    if (!toOrgData.telegramChatId) {
      const toChatId = prompt(`กรุณาระบุ Telegram Chat ID สำหรับหน่วยงานปลายทาง (${toOrgData.name}):`, "");
      if (toChatId) {
        // อัปเดต telegramChatId ในเอกสารหน่วยงานปลายทาง
        firebase.firestore().collection("organizations").doc(toOrgData.id).update({
          telegramChatId: toChatId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          console.log(`Updated destination organization ${toOrgData.id} with telegramChatId: ${toChatId}`);
          sendTelegramNotification(status, boxId, toOrgData.name, toOrgData.telegramToken, toChatId, "destination");
        }).catch(error => {
          console.error(`Error updating destination organization: ${error.message}`, error);
        });
      }
    } else {
      sendTelegramNotification(status, boxId, toOrgData.name, toOrgData.telegramToken, toOrgData.telegramChatId, "destination");
    }
  } else {
    console.warn(`Missing Telegram token for destination organization: ${toOrgData.id}`);
  }
  
  // ส่งการแจ้งเตือนไปยังหน่วยงานต้นทาง
  if (fromOrgData.telegramToken) {
    if (!fromOrgData.telegramChatId) {
      const fromChatId = prompt(`กรุณาระบุ Telegram Chat ID สำหรับหน่วยงานต้นทาง (${fromOrgData.name}):`, "");
      if (fromChatId) {
        // อัปเดต telegramChatId ในเอกสารหน่วยงานต้นทาง
        firebase.firestore().collection("organizations").doc(fromOrgData.id).update({
          telegramChatId: fromChatId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          console.log(`Updated source organization ${fromOrgData.id} with telegramChatId: ${fromChatId}`);
          sendTelegramNotification(status, boxId, fromOrgData.name, fromOrgData.telegramToken, fromChatId, "source");
        }).catch(error => {
          console.error(`Error updating source organization: ${error.message}`, error);
        });
      }
    } else {
      sendTelegramNotification(status, boxId, fromOrgData.name, fromOrgData.telegramToken, fromOrgData.telegramChatId, "source");
    }
  } else {
    console.warn(`Missing Telegram token for source organization: ${fromOrgData.id}`);
  }
}
// ฟังก์ชันสำหรับส่งการแจ้งเตือนไปยังหน่วยงานเดียว (กรณีที่ไม่มีข้อมูลอีกหน่วยงาน)
function sendNotificationToSingleOrganization(status, boxId, orgData, orgType) {
  console.log(`Sending notification to single organization: status=${status}, boxId=${boxId}, orgType=${orgType}`);
  
  if (orgData.telegramToken) {
    if (!orgData.telegramChatId) {
      const chatId = prompt(`กรุณาระบุ Telegram Chat ID สำหรับหน่วยงาน ${orgData.name}:`, "");
      if (chatId) {
        // อัปเดต telegramChatId ในเอกสารหน่วยงาน
        firebase.firestore().collection("organizations").doc(orgData.id).update({
          telegramChatId: chatId,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          console.log(`Updated organization ${orgData.id} with telegramChatId: ${chatId}`);
          sendTelegramNotification(status, boxId, orgData.name, orgData.telegramToken, chatId, orgType);
        }).catch(error => {
          console.error(`Error updating organization: ${error.message}`, error);
          alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลหน่วยงาน");
        });
      } else {
        console.log("User cancelled adding telegramChatId");
        alert("ยกเลิกการส่งการแจ้งเตือน");
      }
    } else {
      sendTelegramNotification(status, boxId, orgData.name, orgData.telegramToken, orgData.telegramChatId, orgType);
    }
  } else {
    console.warn(`Missing Telegram token for organization: ${orgData.id}`);
    alert("ไม่พบข้อมูล Telegram Token ของหน่วยงาน");
  }
}
// ฟังก์ชันสำหรับส่งข้อความไปยัง Telegram API
// ฟังก์ชันสำหรับส่งข้อความไปยัง Telegram API
function sendTelegramNotification(statusType, boxId, orgName, botToken, chatId, orgType) {
  console.log(`sendTelegramNotification called: statusType=${statusType}, orgName=${orgName}, boxId=${boxId}, orgType=${orgType}`);
  
  // ตรวจสอบความครบถ้วน
  if (!orgName || !botToken || !chatId || !boxId) {
    console.error("Missing required fields:", {
      orgName: !!orgName,
      botToken: !!botToken,
      chatId: !!chatId,
      boxId: !!boxId
    });
    alert('ข้อมูลไม่ครบถ้วนสำหรับการส่งการแจ้งเตือน');
    return;
  }

  // ดึงข้อมูลกล่องเพื่อใช้ในการสร้างข้อความ
  const db = firebase.firestore();
  db.collection("deliveries").doc(boxId).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const fromLocation = data.fromLocation || "ไม่ระบุ";
      const toLocation = data.toLocation || "ไม่ระบุ";
      const boxNumber = data.boxNumber || boxId;
      
      // เวลาปัจจุบัน
      const now = new Date();
      const currentTime = now.toLocaleString('th-TH');
      
      // เวลาที่จัดส่ง (จากข้อมูลในฐานข้อมูล หรือใช้เวลาปัจจุบันถ้าไม่มี)
      const sendTime = data.sendTime ? new Date(data.sendTime.toDate()).toLocaleString('th-TH') : currentTime;
      
      // สร้างข้อความตามสถานะและประเภทของหน่วยงาน
      let text = "";
      
      if (statusType === 'sending') {
        // แจ้งเตือนการส่ง
        if (orgType === "source") {
          // ข้อความสำหรับหน่วยงานต้นทาง
          text += `🚚 *กำลังจัดส่งกล่องจากหน่วยงานของคุณ* 🚚\n\n`;
        } else {
          // ข้อความสำหรับหน่วยงานปลายทาง
          text += `🚚 *กำลังมีกล่องจัดส่งมายังหน่วยงานของคุณ* 🚚\n\n`;
        }
        
        text += `📦 ข้อมูลกล่อง: ${boxNumber}\n`;
        text += `📤 ส่งจาก: ${fromLocation}\n`;
        text += `📥 ไปยัง: ${toLocation}\n`;
        text += `🕒 เวลาที่จัดส่ง: ${currentTime}\n`;
        text += `📋 สถานะ: กำลังจัดส่ง`;
        
        // อัปเดตเวลาส่งในฐานข้อมูล
        db.collection("deliveries").doc(boxId).update({
          sendTime: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'กำลังจัดส่ง',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
          console.error(`Error updating delivery send time: ${error.message}`, error);
        });
      } else if (statusType === 'received') {
        // แจ้งเตือนการรับ
        if (orgType === "source") {
          // ข้อความสำหรับหน่วยงานต้นทาง
          text += `✅ *กล่องที่ส่งจากหน่วยงานของคุณถูกรับแล้ว* ✅\n\n`;
        } else {
          // ข้อความสำหรับหน่วยงานปลายทาง
          text += `✅ *กล่องถูกรับเข้าหน่วยงานของคุณแล้ว* ✅\n\n`;
        }
        
        text += `📦 ข้อมูลกล่อง: ${boxNumber}\n`;
        text += `📤 ส่งจาก: ${fromLocation}\n`;
        text += `📥 ไปยัง: ${toLocation}\n`;
        text += `🕒 เวลาที่จัดส่ง: ${sendTime}\n`;
        text += `🕒 เวลาที่รับ: ${currentTime}\n`;
        text += `📋 สถานะ: จัดส่งสำเร็จ\n`;
        
        // คำนวณเวลาที่ใช้ในการจัดส่ง
        let deliveryTime = "ไม่สามารถคำนวณได้";
        if (data.sendTime) {
          const sendDate = data.sendTime.toDate();
          const diffMs = now - sendDate;
          
          // แปลงเวลาเป็นรูปแบบที่อ่านง่าย
          if (diffMs < 60000) { // น้อยกว่า 1 นาที
            deliveryTime = `${Math.floor(diffMs / 1000)} วินาที`;
          } else if (diffMs < 3600000) { // น้อยกว่า 1 ชั่วโมง
            deliveryTime = `${Math.floor(diffMs / 60000)} นาที`;
          } else if (diffMs < 86400000) { // น้อยกว่า 1 วัน
            const hours = Math.floor(diffMs / 3600000);
            const minutes = Math.floor((diffMs % 3600000) / 60000);
            deliveryTime = `${hours} ชั่วโมง ${minutes} นาที`;
          } else { // มากกว่า 1 วัน
            const days = Math.floor(diffMs / 86400000);
            const hours = Math.floor((diffMs % 86400000) / 3600000);
            deliveryTime = `${days} วัน ${hours} ชั่วโมง`;
          }
        }
        
        text += `⏱️ เวลาที่ใช้: ${deliveryTime}`;
        
        // อัปเดตเวลารับและสถานะในฐานข้อมูล
        db.collection("deliveries").doc(boxId).update({
          receiveTime: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'จัดส่งสำเร็จ',
          deliveryTime: deliveryTime,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
          console.error(`Error updating delivery receive time: ${error.message}`, error);
        });
      }

      console.log(`Sending message to Telegram: ${text}`);

      // เรียก Telegram Bot API
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'  // เพิ่ม parse_mode เพื่อรองรับการจัดรูปแบบข้อความ
        })
      })
      .then(res => {
        console.log(`Telegram API response status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log(`Telegram API response data:`, data);
        if (data.ok) {
          console.log('ส่งข้อความสำเร็จ');
          // ไม่แสดง alert เพื่อไม่ให้รบกวนผู้ใช้มากเกินไป เมื่อส่งหลายข้อความ
        } else {
          console.error(`Telegram API error: ${data.description}`);
          alert('ส่งข้อความล้มเหลว: ' + data.description);
        }
      })
      .catch(err => {
        console.error(`Fetch error in sendTelegramNotification: ${err.message}`, err);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      });
    } else {
      console.error(`Delivery not found with ID: ${boxId}`);
      alert("ไม่พบข้อมูลกล่องที่ต้องการ");
    }
  }).catch(error => {
    console.error(`Error fetching delivery for notification: ${error.message}`, error);
    alert("เกิดข้อผิดพลาดในการดึงข้อมูลกล่อง");
  });
}
// ปรับปรุงฟังก์ชัน generateQRCode เพื่อเพิ่มปุ่มส่งการแจ้งเตือนและการบันทึกข้อผิดพลาด
function generateQRCode(boxId) {
  console.log(`generateQRCode called with boxId: ${boxId}`);
  try {
    const db = firebase.firestore();
    if (!boxId) {
      console.error("boxId is undefined or null");
      alert("กรุณาระบุ ID ของกล่อง");
      return;
    }
    
    // ดึงข้อมูลกล่องจาก Firestore
    console.log(`Fetching delivery data for QR generation: ${boxId}`);
    db.collection("deliveries").doc(boxId).get().then(async (doc) => {
      if (doc.exists) {
        const data = doc.data();
        console.log(`Delivery data retrieved for QR generation:`, data);
        
        // สร้าง URL สำหรับอัพเดทสถานะ
        const baseUrl = window.location.origin;
        const qrUrl = `${baseUrl}/update-status.html?boxId=${boxId}`;
        console.log(`Generated QR URL: ${qrUrl}`);
        
        // ลบ QR code เก่า (ถ้ามี)
        document.getElementById('qrcode').innerHTML = '';
        
        try {
          // สร้าง QR Code ใหม่
          console.log("Creating new QR code");
          const qrcode = new QRCode(document.getElementById('qrcode'), {
            text: qrUrl,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
          
          // แสดงข้อมูลพื้นฐาน
          document.getElementById('qrInfo').innerHTML = `
            <div class="fw-bold mb-1" style="color:gray">( Scan above )</div>
            <div class="fw-bold mb-1">ข้อมูลกล่อง: ${data.boxNumber}</div>
            <div>จาก: ${data.fromLocation || "-"}</div>
            <div>ไปยัง: ${data.toLocation || "-"}</div>
            <div class="mt-3">
              <button class="btn btn-success" onclick="sendNotificationFromQR('${boxId}', 'sending')">แจ้งเตือนการส่ง</button>
              <button class="btn btn-info" onclick="sendNotificationFromQR('${boxId}', 'received')">แจ้งเตือนการรับ</button>
            </div>
          `;
          
          // แสดง Modal
          console.log("Showing QR code modal");
          const qrModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
          qrModal.show();
          
          // ตั้งค่าปุ่มดาวน์โหลด QR Code
          document.getElementById('downloadQRCode').onclick = function() {
            console.log("Download QR code button clicked");
            // หา canvas ของ QR Code
            const canvas = document.querySelector('#qrcode canvas');
            if (canvas) {
              // สร้าง link ดาวน์โหลด
              const link = document.createElement('a');
              link.download = `qrcode-${data.boxNumber || 'box'}.png`;
              link.href = canvas.toDataURL('image/png');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              console.log("QR code download initiated");
            } else {
              console.error("QR code canvas not found");
            }
          };
          
          // ตั้งค่าปุ่มพิมพ์ QR Code
          document.getElementById('printQRCode').onclick = function() {
            console.log("Print QR code button clicked");
            const printWindow = window.open('', '_blank');
            const qrImage = document.querySelector('#qrcode img') || document.querySelector('#qrcode canvas');
            const boxInfo = document.getElementById('qrInfo').innerHTML;
            
            if (qrImage) {
              // ถ้ามี img ให้ใช้ src, ถ้าเป็น canvas ให้แปลงเป็น data URL
              const imgSrc = qrImage.tagName === 'IMG' ? 
                qrImage.src : 
                qrImage.toDataURL('image/png');
              
              console.log(`Preparing print window with QR image type: ${qrImage.tagName}`);
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>พิมพ์ QR Code</title>
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; }
                    .container { max-width: 400px; margin: 0 auto; padding: 20px; }
                    img { max-width: 100%; height: auto; }
                    .info { margin-top: 15px; text-align: left; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <img src="${imgSrc}" alt="QR Code">
                    <div class="info">${boxInfo}</div>
                  </div>
                  <script>
                    window.onload = function() { window.print(); }
                  </script>
                </body>
                </html>
              `);
              
              printWindow.document.close();
              console.log("Print window prepared and opened");
            } else {
              console.error("QR image element not found for printing");
              alert("ไม่พบรูปภาพ QR Code สำหรับพิมพ์");
            }
          };
        } catch (qrError) {
          console.error(`Error creating QR code: ${qrError.message}`, qrError);
          alert("เกิดข้อผิดพลาดในการสร้าง QR Code");
        }
      } else {
        console.error(`No delivery found with ID: ${boxId}`);
        alert("ไม่พบข้อมูลกล่องที่ต้องการ");
      }
          
    }).catch(error => {
      console.error(`Error getting delivery: ${error.message}`, error.code);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message);
    });
  } catch (error) {
    console.error(`Error generating QR code: ${error.message}`, error);
    alert("เกิดข้อผิดพลาดในการสร้าง QR Code");
  }
}
