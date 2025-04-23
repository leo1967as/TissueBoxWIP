document.getElementById("sendItemForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // ป้องกันการรีเฟรชหน้า
  
    // ดึงค่าจากฟอร์ม
    const boxNumber = document.getElementById("boxNumber").value.trim();
    const senderName = document.getElementById("senderName").value.trim();
    const fromLocation = document.getElementById("fromLocation").value.trim();
    const toLocation = document.getElementById("toLocation").value.trim();
    const itemList = document.getElementById("itemList").value.trim();
    const notes = document.getElementById("notes").value.trim();
  
    try {
      // ตรวจสอบว่า boxNumber ไม่ว่างเปล่า
      if (!boxNumber) {
        alert("กรุณาระบุเลขกล่อง");
        return;
      }
  
      // อ้างอิงไปยัง Firestore
      const db = firebase.firestore();
  
      // ใช้ boxNumber เป็น ID ของเอกสาร
      await db.collection("deliveries").doc(boxNumber).set({
        boxNumber: boxNumber,
        senderName: senderName,
        fromLocation: fromLocation,
        toLocation: toLocation,
        status: "กำลังจัดส่ง", // สถานะเริ่มต้น
        itemList: itemList,
        notes: notes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(), // วันเวลา
      });
  
      // แสดงข้อความสำเร็จ
      console.log("ข้อมูลถูกบันทึกเรียบร้อยแล้ว");
  
      // ปิด Modal หลังจากบันทึกสำเร็จ
      const modal = new bootstrap.Modal.getInstance(document.getElementById("sendItemModal"));
      modal.hide();
  
      // รีเซ็ตฟอร์ม
      document.getElementById("sendItemForm").reset();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
      alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง");
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("sendItemForm").addEventListener("submit", async function (event) {
      // โค้ดของคุณ
    });
  });