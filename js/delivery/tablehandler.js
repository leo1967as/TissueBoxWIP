
async function fetchDeliveries() {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection("deliveries").orderBy("createdAt").get();
  
      const orgListContainer = document.getElementById("orgListContainer");
      orgListContainer.innerHTML = ""; // เคลียร์ข้อมูลเก่า
  
      let index = 1;
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        const boxId = doc.id; // ใช้ ID ของเอกสารใน Firestore
  
              // สร้าง timestamp ปัจจุบัน
      const currentDate = new Date();
      const currentDateTime = currentDate.toLocaleString('th-TH');
      const formattedDate = data.createdAt ? formatTimestamp(data.createdAt) : "ไม่ระบุ";

        // สร้างแถวใหม่ในตาราง
        const row = `
          <tr>
          <td>${index++}</td>
          <td>${data.boxNumber || "-"}</td>
          <td>${data.senderName || "-"}</td>
          <td>${data.status || "-"}</td>
          <td>${data.itemList || "-"}</td>
          <td>${data.notes || "-"}</td>
                   <td>${formattedDate}</td>
            <td>${data.fromLocation || "-"}</td>
            <td>${data.toLocation || "-"}</td>
            <td>
              <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#editItemModal" onclick="populateEditModal('${boxId}')">แก้ไข</button>
              <button class="btn btn-danger btn-sm" onclick="deleteDelivery('${boxId}')">ลบ</button>
              <button class="btn btn-info btn-sm" onclick="generateQRCode('${boxId}')">QR Code</button>
            </td>
          </tr>

        `;
        orgListContainer.innerHTML += row;
      });
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    }
  }

  function listenToDeliveries() {
    const db = firebase.firestore();
  
    // ฟังการเปลี่ยนแปลงในคอลเลกชัน "deliveries"
    db.collection("deliveries").orderBy("createdAt").onSnapshot((snapshot) => {
      const orgListContainer = document.getElementById("orgListContainer");
      orgListContainer.innerHTML = ""; // เคลียร์ข้อมูลเก่า
  
      let index = 1;
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        const boxId = doc.id; // ใช้ ID ของเอกสารใน Firestore
           // ใช้ formatTimestamp เพื่อแสดงวันที่แบบไทย
           const formattedDate = data.createdAt ? formatTimestamp(data.createdAt) : "ไม่ระบุ";

        // สร้างแถวใหม่ในตาราง
        const row = `
          <tr>
          <td>${index++}</td>
          <td>${data.boxNumber || "-"}</td>
          <td>${data.senderName || "-"}</td>
          <td>${data.itemList || "-"}</td>
          <td>${data.itemList || "-"}</td>
          <td>${data.notes || "-"}</td>
                    <td>${formattedDate}</td>
            <td>${data.fromLocation || "-"}</td>
            <td>${data.toLocation || "-"}</td>
            <td>
              <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#editItemModal" onclick="populateEditModal('${boxId}')">แก้ไข</button>
              <button class="btn btn-danger btn-sm" onclick="deleteDelivery('${boxId}')">ลบ</button>
              <button class="btn btn-info btn-sm" onclick="generateQRCode('${boxId}')">QR Code</button>
            </td>
          </tr>

        `;
        orgListContainer.innerHTML += row;
      });
    }, (error) => {
      console.error("Error listening to deliveries:", error);
    });
  }


  document.addEventListener("DOMContentLoaded", () => {
    listenToDeliveries();
    fetchDeliveries();  
  });