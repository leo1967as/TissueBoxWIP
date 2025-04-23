async function fetchDeliveries() {
    try {
      const db = firebase.firestore();
      const snapshot = await db.collection("deliveries").get();
  
      const orgListContainer = document.getElementById("orgListContainer");
      orgListContainer.innerHTML = ""; // เคลียร์ข้อมูลเก่า
  
      let index = 1;
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        const boxId = doc.id; // ใช้ ID ของเอกสารใน Firestore
  
        // สร้างแถวใหม่ในตาราง
        const row = `
          <tr>
            <td>${index++}</td>
            <td>${data.boxNumber}</td>
            <td>${data.senderName}</td>
            <td>${data.status}</td>
            <td>${data.itemList}</td>
            <td>${data.notes || "-"}</td>
            <td>
              <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#editItemModal" onclick="populateEditModal('${boxId}')">แก้ไข</button>
              <button class="btn btn-danger btn-sm" onclick="deleteDelivery('${boxId}')">ลบ</button>
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
    db.collection("deliveries").onSnapshot((snapshot) => {
      const orgListContainer = document.getElementById("orgListContainer");
      orgListContainer.innerHTML = ""; // เคลียร์ข้อมูลเก่า
  
      let index = 1;
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        const boxId = doc.id; // ใช้ ID ของเอกสารใน Firestore
  
        // สร้างแถวใหม่ในตาราง
        const row = `
          <tr>
            <td>${index++}</td>
            <td>${data.boxNumber}</td>
            <td>${data.senderName}</td>
            <td>${data.status}</td>
            <td>${data.itemList}</td>
            <td>${data.notes || "-"}</td>
            <td>
              <button class="btn btn-warning btn-sm" data-bs-toggle="modal" data-bs-target="#editItemModal" onclick="populateEditModal('${boxId}')">แก้ไข</button>
              <button class="btn btn-danger btn-sm" onclick="deleteDelivery('${boxId}')">ลบ</button>
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