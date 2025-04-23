/**
 * บันทึกข้อมูลหน่วยงานลง Firestore
 * @returns {Promise<void>}
 */
async function saveOrganization() {
  try {
    // ดึงค่าจากฟอร์ม
    const orgName = document.getElementById("orgName").value.trim();
    const telegramToken = document.getElementById("telegramToken").value.trim();
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orgName || !telegramToken || !selectedLatLng) {
      throw new Error("กรุณากรอกข้อมูลให้ครบถ้วนและเลือกตำแหน่งบนแผนที่");
    }

    // ตรวจสอบชื่อหน่วยงานซ้ำ
    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgName);
    
    const doc = await orgRef.get();
    if (doc.exists && !isEditMode) {
      throw new Error(`หน่วยงาน "${orgName}" มีอยู่แล้วในระบบ`);
    }

    // แสดง Loading
    showLoading('กำลังบันทึกข้อมูลหน่วยงาน...');

    // บันทึกข้อมูลลง Firestore
    await orgRef.set({
      name: orgName,
      telegramToken: telegramToken,
      location: new firebase.firestore.GeoPoint(selectedLatLng.lat(), selectedLatLng.lng()),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // แจ้งเตือนสำเร็จและรีเซ็ตฟอร์ม
    showAlert('success', 'บันทึกข้อมูลสำเร็จ', `หน่วยงาน "${orgName}" ถูกเพิ่มเรียบร้อยแล้ว`);
    
    // ปิด Modal และรีเฟรชข้อมูล
    $('#addOrgModal').modal('hide');
    resetForm();
    await fetchOrganizations(); // ฟังก์ชันดึงข้อมูลหน่วยงานใหม่

    // รีเซ็ตโหมดการแก้ไข
    resetEditMode();
    
  } catch (error) {
    console.error("Error saving organization:", error);
    showAlert('error', 'เกิดข้อผิดพลาด', error.message);
  } finally {
    hideLoading();
  }
}


// ฟังก์ชันแสดง Alert แบบสวยงาม
function showAlert(type, title, message) {
  // ใช้ Toast, SweetAlert หรือ UI Library อื่นๆ ที่คุณมี
  // ตัวอย่างใช้ SweetAlert2
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: type,
      title: title,
      text: message,
      confirmButtonText: 'ตกลง'
    });
  } else {
    alert(`${title}: ${message}`);
  }
}

// ฟังก์ชันรีเซ็ตฟอร์ม
// ฟังก์ชันที่ใช้ในการแสดงข้อมูลหน่วยงานในตาราง
async function fetchOrganizations() {
  try {
    // ดึงข้อมูลหน่วยงานจาก Firestore
    const snapshot = await firebase.firestore().collection("organizations").get();

    const orgListContainer = document.getElementById("orgListContainer");
    orgListContainer.innerHTML = "";  // เคลียร์ข้อมูลที่มีอยู่ก่อน

    // ใช้ตัวแปร index ในการเพิ่มหมายเลขลำดับ
    let index = 1;

    snapshot.forEach(doc => {
      const orgData = doc.data();
      
      // สร้างแถวใหม่ในตาราง
      const orgItem = document.createElement("tr");

      // เพิ่มข้อมูลลงในแถว
      orgItem.innerHTML = `
        <td>${index++}</td>  <!-- เพิ่มหมายเลขลำดับ -->
        <td>${orgData.name}</td>
        <td>${orgData.telegramToken || "undefined"}</td>
        <td>${orgData.createdAt ? orgData.createdAt.toDate().toLocaleString() : "ไม่ระบุ"}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editOrganization('${doc.id}')">แก้ไข</button>
          <button class="btn btn-danger btn-sm" onclick="deleteOrganization('${doc.id}')">ลบ</button>
        </td>
      `;
      orgListContainer.appendChild(orgItem);
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    showAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลหน่วยงานได้');
  }
}



// เมื่อคลิกปุ่ม "ยืนยัน"
document.getElementById("saveOrgBtn").addEventListener("click", async function () {
  try {
    // ดึงค่าจากฟอร์ม
    const orgName = document.getElementById("orgName").value.trim();
    const telegramToken = document.getElementById("telegramToken").value.trim();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orgName || !telegramToken || !selectedLatLng) {
      throw new Error("กรุณากรอกข้อมูลให้ครบถ้วนและเลือกตำแหน่งบนแผนที่");
    }

    // ตรวจสอบรูปแบบ Telegram Token
    // if (!/^\d+:[a-zA-Z0-9_-]+$/.test(telegramToken)) {
    //   throw new Error("รูปแบบ Telegram Token ไม่ถูกต้อง");
    // }

    // ตรวจสอบชื่อหน่วยงานซ้ำ
    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgName);
    
    const doc = await orgRef.get();
    if (doc.exists) {
      throw new Error(`หน่วยงาน "${orgName}" มีอยู่แล้วในระบบ`);
    }

    // แสดง Loading
    showLoading('กำลังบันทึกข้อมูลหน่วยงาน...');

    // บันทึกข้อมูลลง Firestore
    await orgRef.set({
      name: orgName,
      telegramToken: telegramToken,
      location: new firebase.firestore.GeoPoint(selectedLatLng.lat(), selectedLatLng.lng()),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // แจ้งเตือนสำเร็จและรีเซ็ตฟอร์ม
    showAlert('success', 'บันทึกข้อมูลสำเร็จ', `หน่วยงาน "${orgName}" ถูกเพิ่มเรียบร้อยแล้ว`);
    
    // ปิด Modal และรีเฟรชข้อมูล
    $('#orgModal').modal('hide');
    resetForm();
    await fetchOrganizations(); // ฟังก์ชันดึงข้อมูลหน่วยงานใหม่

    $('#addOrgModal').on('hidden.bs.modal', function() {
  resetLocationSelection();
});
    
  } catch (error) {
    console.error("Error saving organization:", error);
    showAlert('error', 'เกิดข้อผิดพลาด', error.message);
  } finally {
    hideLoading();
  }
});

// ฟังก์ชันที่ใช้ในการแสดงรายการหน่วยงานที่ดึงมาจาก Firestore
function renderOrganizations(organizations) {
  const orgListContainer = document.getElementById("orgListContainer"); // สมมุติว่าเรามี container สำหรับแสดงข้อมูลหน่วยงาน
  
  // เคลียร์ข้อมูลเก่า
  orgListContainer.innerHTML = "";

  organizations.forEach(doc => {
    const orgData = doc.data(); // ดึงข้อมูลจาก Firestore

    // สร้าง HTML สำหรับแสดงหน่วยงาน
    const orgItem = document.createElement("div");
    orgItem.classList.add("org-item");

    orgItem.innerHTML = `
      <h3>${orgData.name}</h3>
      <p>Telegram Token: ${orgData.telegramToken}</p>
      <p>ตำแหน่ง: Lat: ${orgData.location.latitude}, Lng: ${orgData.location.longitude}</p>
      <p>สร้างเมื่อ: ${orgData.createdAt.toDate().toLocaleString()}</p>
    `;
    
    // เพิ่มหน่วยงานลงใน container
    orgListContainer.appendChild(orgItem);
  });
}

// ฟังก์ชันแสดง Alert
function showAlert(type, title, message) {
  // ใช้ Toast หรือ SweetAlert
  if (typeof Swal !== 'undefined') {
    Swal.fire({
      icon: type,
      title: title,
      text: message,
      confirmButtonText: 'ตกลง'
    });
  } else {
    alert(`${title}: ${message}`);
  }
}

// ฟังก์ชันสำหรับเปิด Modal เพื่อแก้ไขข้อมูลหน่วยงาน
async function editOrganization(orgId) {
  try {
    // ดึงข้อมูลจาก Firestore ด้วย orgId
    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgId);
    const doc = await orgRef.get();

    if (doc.exists) {
      const orgData = doc.data();

      // แสดงข้อมูลในฟอร์ม
      document.getElementById("editOrgName").value = orgData.name;
      document.getElementById("editTelegramToken").value = orgData.telegramToken;

      // ตรวจสอบว่า location มีข้อมูลหรือไม่
      if (orgData.location && orgData.location.latitude && orgData.location.longitude) {
        const lat = orgData.location.latitude;
        const lng = orgData.location.longitude;
        document.getElementById("editLocation").value = `Lat: ${lat}, Lng: ${lng}`;  // แสดงข้อมูลตำแหน่ง
      } else {
        document.getElementById("editLocation").value = "ไม่พบข้อมูลตำแหน่ง";  // ถ้าไม่มีข้อมูล location
      }

      // ปรับข้อความของปุ่มให้เป็น "อัปเดต"
      document.getElementById("updateOrgBtn").textContent = "อัปเดต";

      // ตั้งค่าให้เรียกฟังก์ชัน updateOrganization เมื่อกดปุ่ม "อัปเดต"
      document.getElementById("updateOrgBtn").onclick = function() {
        updateOrganization(orgId);  // เรียกฟังก์ชัน updateOrganization เมื่อกดปุ่ม "อัปเดต"
      };

      // เปิด Modal แก้ไข
      $('#editOrgModal').modal('show');
    } else {
      alert("ไม่พบข้อมูลหน่วยงานที่ต้องการแก้ไข");
    }
  } catch (error) {
    console.error("Error editing organization:", error);
    alert("เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงาน");
  }
}



// ฟังก์ชันสำหรับอัปเดตข้อมูลหน่วยงาน
async function updateOrganization(orgId) {
  const orgName = document.getElementById("editOrgName").value.trim();
  const telegramToken = document.getElementById("editTelegramToken").value.trim();

  if (!orgName || !telegramToken) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  try {
    // ดึงข้อมูลตำแหน่งจากฟอร์ม
    const location = document.getElementById("editLocation").value.trim().split(",");
    const latitude = parseFloat(location[0].replace("Lat:", "").trim());
    const longitude = parseFloat(location[1].replace("Lng:", "").trim());

    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgId);

    // อัปเดตข้อมูลใน Firestore
    await orgRef.update({
      name: orgName,
      telegramToken: telegramToken,
      location: new firebase.firestore.GeoPoint(latitude, longitude),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    alert("ข้อมูลหน่วยงานอัปเดตเรียบร้อยแล้ว");
    
    // ปิด Modal
    $('#editOrgModal').modal('hide');
    
    // รีเฟรชข้อมูลหน่วยงาน
    fetchOrganizations(); // ฟังก์ชันดึงข้อมูลหน่วยงานใหม่จาก Firestore

  } catch (error) {
    console.error("Error updating organization:", error);
    alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลหน่วยงาน");
  }
}



// ฟังก์ชันสำหรับลบข้อมูลหน่วยงานจาก Firestore
async function deleteOrganization(orgId) {
  try {
    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgId);

    // ขอการยืนยันจากผู้ใช้ก่อนลบ
    const confirmDelete = confirm("คุณต้องการลบหน่วยงานนี้หรือไม่?");
    if (!confirmDelete) {
      return;  // ถ้าผู้ใช้ไม่ยืนยันการลบ, ไม่ทำอะไร
    }

    // ลบข้อมูลจาก Firestore
    await orgRef.delete();
    
    // แสดงข้อความแจ้งเตือนว่าได้ลบข้อมูลแล้ว
    alert("หน่วยงานถูกลบเรียบร้อยแล้ว");

    // รีเฟรชข้อมูลหน่วยงานใหม่
    fetchOrganizations(); // ฟังก์ชันดึงข้อมูลหน่วยงานใหม่จาก Firestore

  } catch (error) {
    console.error("Error deleting organization:", error);
    alert("เกิดข้อผิดพลาดในการลบหน่วยงาน");
  }
}

// ฟังก์ชันรีเซ็ตฟอร์ม
function resetForm() {
  // ล้างค่าในฟอร์ม
  document.getElementById("orgName").value = "";
  document.getElementById("telegramToken").value = "";
  
  // รีเซ็ตค่าตำแหน่ง
  document.getElementById("location").value = "คลิกบนแผนที่เพื่อเลือกตำแหน่ง";
  
  // รีเซ็ตตัวแปรตำแหน่ง
  selectedLatLng = null;

  // หากคุณใช้ฟังก์ชันแสดงตำแหน่ง, ให้รีเซ็ตข้อความตำแหน่ง
  document.getElementById("clicked-coord").textContent = "📍 คลิกบนแผนที่เพื่อเลือกตำแหน่ง";
}


// ฟังก์ชันรีเซ็ตโหมดการแก้ไข
function resetEditMode() {
  isEditMode = false;
  document.getElementById("saveOrgBtn").textContent = "ยืนยัน"; // เปลี่ยนปุ่มกลับมาเป็น "ยืนยัน"
  document.getElementById("saveOrgBtn").onclick = saveOrganization; // เปลี่ยนให้เรียกฟังก์ชัน saveOrganization
}


// ฟังก์ชันเริ่มต้นเมื่อหน้าโหลดเสร็จ
document.addEventListener("DOMContentLoaded", fetchOrganizations);

