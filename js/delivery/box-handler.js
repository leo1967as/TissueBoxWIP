// ฟังก์ชันสำหรับส่งข้อมูลใหม่ (sendItemForm)
document.getElementById("sendItemForm").addEventListener("submit", async function (event) {
  event.preventDefault(); // ป้องกันการรีเฟรชหน้า
  
  const boxNumber = document.getElementById("boxNumber").value.trim();
  const senderName = document.getElementById("senderName").value.trim();
  const fromLocation = document.getElementById("fromLocation").value.trim();
  const toLocation = document.getElementById("toLocation").value.trim();
  const status = document.getElementById("status").value;
  const itemList = document.getElementById("itemList").value.trim();
  const notes = document.getElementById("notes").value.trim();

  // ตัวอย่าง: แสดงข้อมูลใน Console
  console.log({
    boxNumber,
    senderName,
    fromLocation,
    toLocation,
    status,
    itemList,
    notes,
  });

  try {
    const db = firebase.firestore();

    // เพิ่มข้อมูลใหม่ลงใน Firestore
    await db.collection("deliveries").add({
      boxNumber: boxNumber,
      senderName: senderName,
      fromLocation: fromLocation,
      toLocation: toLocation,
      status: status,
      itemList: itemList,
      notes: notes,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // ปิด Modal หลังจากบันทึกสำเร็จ
    const modal = bootstrap.Modal.getInstance(document.getElementById("sendItemModal"));
    modal.hide();

    // รีเซ็ตฟอร์ม
    document.getElementById("sendItemForm").reset();
    alert("บันทึกข้อมูลสำเร็จ!");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
    alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง");
  }
});
  
 // ฟังก์ชันสำหรับแก้ไขข้อมูล (editItemForm)
document.getElementById("editItemForm").addEventListener("submit", async function (event) {
  event.preventDefault(); // ป้องกันการรีเฟรชหน้า
  
  const boxId = document.getElementById("editItemForm").getAttribute("data-box-id");

  if (!boxId) {
    console.error("ไม่พบ boxId สำหรับการอัปเดต");
    return;
  }

  const boxNumber = document.getElementById("editBoxNumber").value.trim();
  const senderName = document.getElementById("editSenderName").value.trim();
  const fromLocation = document.getElementById("editFromLocation").value.trim();
  const toLocation = document.getElementById("editToLocation").value.trim();
  const status = document.getElementById("editStatus").value;
  const itemList = document.getElementById("editItemList").value.trim();
  const notes = document.getElementById("editNotes").value.trim();

  try {
    const db = firebase.firestore();

    // อัปเดตข้อมูลใน Firestore
    await db.collection("deliveries").doc(boxId).update({
      boxNumber: boxNumber,
      senderName: senderName,
      fromLocation: fromLocation,
      toLocation: toLocation,
      status: status,
      itemList: itemList,
      notes: notes,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // ปิด Modal หลังจากบันทึกสำเร็จ
    const modal = bootstrap.Modal.getInstance(document.getElementById("editItemModal"));
    modal.hide();

    // รีเซ็ตฟอร์ม
    document.getElementById("editItemForm").reset();
    alert("ข้อมูลถูกอัปเดตเรียบร้อยแล้ว");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล:", error);
    alert("ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองอีกครั้ง");
  }
});

  async function populateEditModal(boxId) {
    try {
      const db = firebase.firestore();
      const doc = await db.collection("deliveries").doc(boxId).get();
  
      if (doc.exists) {
        const data = doc.data();
  
        // เติมข้อมูลในฟอร์มแก้ไข
        document.getElementById("editBoxNumber").value = data.boxNumber;
        document.getElementById("editSenderName").value = data.senderName;
        document.getElementById("editFromLocation").value = data.fromLocation;
        document.getElementById("editToLocation").value = data.toLocation;
        document.getElementById("editStatus").value = data.status;
        document.getElementById("editItemList").value = data.itemList;
        document.getElementById("editNotes").value = data.notes || "";
  
        // เก็บ boxId ไว้ในฟอร์ม (ถ้าจำเป็น)
        document.getElementById("editItemForm").setAttribute("data-box-id", boxId);
      } else {
        console.error("ไม่พบข้อมูลสำหรับ ID:", boxId);
      }
    } catch (error) {
      console.error("Error populating edit modal:", error);
    }
  }

  async function deleteDelivery(boxId) {
    if (confirm("คุณต้องการลบรายการนี้หรือไม่?")) {
      try {
        const db = firebase.firestore();
        await db.collection("deliveries").doc(boxId).delete();
  
        alert("ลบข้อมูลสำเร็จ");
      } catch (error) {
        console.error("Error deleting delivery:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  }