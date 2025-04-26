function generateQRCode(boxId) {
    try {
      const db = firebase.firestore();
      if (!boxId) {
        console.error("boxId is undefined or null");
        alert("กรุณาระบุ ID ของกล่อง");
        return;
      }
      
      // ดึงข้อมูลกล่องจาก Firestore
      db.collection("deliveries").doc(boxId).get().then(async (doc) => {
        if (doc.exists) {
          const data = doc.data();
          
          // สร้าง URL สำหรับอัพเดทสถานะ
          // ตัวอย่าง: https://yoursite.com/update-status.html?boxId=BX00113
          const baseUrl = window.location.origin; // Gets your domain
          const qrUrl = `${baseUrl}/update-status.html?boxId=${boxId}`;
          
          // ลบ QR code เก่า (ถ้ามี)
          document.getElementById('qrcode').innerHTML = '';
          
          // สร้าง QR Code ใหม่
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
            <div class="fw-bold mb-1 mt-4" style="color:gray">( Scan above )</div>
            <div class="fw-bold mb-1">ข้อมูลกล่อง: ${data.boxNumber}</div>
            <div>จาก: ${data.fromLocation || "-"}</div>
            <div>ไปยัง: ${data.toLocation || "-"}</div>
          `;
          
          // แสดง Modal
          const qrModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
          qrModal.show();
          
          // ตั้งค่าปุ่มดาวน์โหลด QR Code
          document.getElementById('downloadQRCode').onclick = function() {
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
            }
          };
          
          // ตั้งค่าปุ่มพิมพ์ QR Code
          document.getElementById('printQRCode').onclick = function() {
            const printWindow = window.open('', '_blank');
            const qrImage = document.querySelector('#qrcode img') || document.querySelector('#qrcode canvas');
            const boxInfo = document.getElementById('qrInfo').innerHTML;
            
            if (qrImage) {
              // ถ้ามี img ให้ใช้ src, ถ้าเป็น canvas ให้แปลงเป็น data URL
              const imgSrc = qrImage.tagName === 'IMG' ? 
                qrImage.src : 
                qrImage.toDataURL('image/png');
              
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
            }
          };
        } else {
          console.error("No delivery found with ID:", boxId);
          alert("ไม่พบข้อมูลกล่องที่ต้องการ");
        }
            
      }).catch(error => {
        console.error("Error getting delivery:", error.message, error.code);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล" + error.message);
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง QR Code");
    }
  }