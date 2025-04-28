
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

  // เพิ่มฟังก์ชันคำนวณระยะเวลาในการจัดส่ง
function calculateDeliveryDuration(createdAt, receivedAt) {
  if (!createdAt || !receivedAt) return "-";
  
  const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const receivedDate = receivedAt.toDate ? receivedAt.toDate() : new Date(receivedAt);
  
  // คำนวณระยะเวลาในการจัดส่ง
  const diffTime = Math.abs(receivedDate - createdDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  // สร้างข้อความแสดงเวลาที่ใช้ในการจัดส่ง
  let timeComponents = [];
  
  if (diffDays > 0) {
    timeComponents.push(`${diffDays} วัน`);
  }
  
  if (diffHours > 0) {
    timeComponents.push(`${diffHours} ชั่วโมง`);
  }
  
  if (diffMinutes > 0 || timeComponents.length === 0) {
    timeComponents.push(`${diffMinutes} นาที`);
  }
  
  return timeComponents.join(' ');
}

// ในฟังก์ชันที่สร้างแถวของตาราง (เช่น renderDeliveryRow หรือชื่อที่คล้ายกัน)
// ต้องเพิ่มคอลัมน์สำหรับแสดงระยะเวลาในการจัดส่ง
function renderDeliveryRow(doc, index) {
  const data = doc.data();
  const deliveryId = doc.id;
  
  // จัดรูปแบบวันที่
  let formattedDate = "-";
  if (data.createdAt) {
    const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
    formattedDate = date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // คำนวณระยะเวลาในการจัดส่ง
  let deliveryDuration = "-";
  if (data.status === "จัดส่งสำเร็จ" && data.createdAt && data.receivedAt) {
    deliveryDuration = calculateDeliveryDuration(data.createdAt, data.receivedAt);
  } else if (data.createdAt) {
    // กรณียังไม่จัดส่งสำเร็จ แสดงเวลาที่ผ่านไปแล้ว
    deliveryDuration = calculateDeliveryDuration(data.createdAt, new Date()) + " (กำลังจัดส่ง)";
  }
  
  // สร้าง HTML สำหรับแถวในตาราง
  return `
    <tr>
      <td>${index + 1}</td>
      <td>${data.boxNumber || "-"}</td>
      <td>${data.senderName || "-"}</td>
      <td>
        <span class="badge ${getStatusBadgeClass(data.status)}">${data.status || "กำลังจัดส่ง"}</span>
      </td>
      <td>${data.itemList || "-"}</td>
      <td>${data.notes || "-"}</td>
      <td>${formattedDate}</td>
      <td>${data.fromLocation || "-"}</td>
      <td>${data.toLocation || "-"}</td>
      <td>
        <div class="btn-group" role="group">
          <button type="button" class="btn btn-sm btn-primary" onclick="showQRCode('${deliveryId}')">
            <i class="bi bi-qr-code"></i>
          </button>
          <button type="button" class="btn btn-sm btn-warning" onclick="editDelivery('${deliveryId}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button type="button" class="btn btn-sm btn-danger" onclick="deleteDelivery('${deliveryId}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
      <td>${deliveryDuration}</td>
    </tr>
  `;
}

// ฟังก์ชันช่วยกำหนดคลาสของ badge ตามสถานะ
function getStatusBadgeClass(status) {
  switch (status) {
    case "จัดส่งสำเร็จ":
      return "bg-success";
    case "กำลังจัดส่ง":
      return "bg-primary";
    case "ยกเลิก":
      return "bg-danger";
    default:
      return "bg-secondary";
  }
}
