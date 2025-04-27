/**
 * ไฟล์จัดการหน่วยงานในระบบ TissueBox
 * รับผิดชอบการเพิ่ม แก้ไข ลบ และแสดงข้อมูลหน่วยงาน
 */

// ตัวแปรสำหรับเก็บค่าพิกัดที่เลือกบนแผนที่
let selectedLatLng = null;
// ตัวแปรเก็บสถานะว่ากำลังอยู่ในโหมดแก้ไขหรือไม่
let isEditMode = false;
// ตัวแปรเก็บสถานะว่ากำลังอยู่ในโหมดเลือกตำแหน่งหรือไม่
let isSelectingLocation = false;
// ตัวแปรเก็บค่าเดิมของข้อมูลเพื่อเปรียบเทียบการเปลี่ยนแปลง
let originalOrgName = '';
let originalTelegramToken = '';
let originalLocation = '';
// ตัวแปรเก็บตำแหน่งเดิมของหน่วยงาน
let originalLatLng = null;
// ตัวแปรเก็บ marker ที่ใช้แสดงตำแหน่งที่เลือกใหม่
let tempMarker = null;
// ตัวแปรเก็บ markers ทั้งหมดบนแผนที่
let allMarkers = [];

/**
 * ล้าง markers ทั้งหมดบนแผนที่
 */
function clearAllMarkers() {
  allMarkers.forEach(marker => {
    marker.setMap(null);
  });
  allMarkers = [];
}
/**
 * จับการคลิกบนแผนที่เพื่อเลือกตำแหน่ง
 * @param {Event} event - เหตุการณ์การคลิกบนแผนที่
 */
/**
 * จับการคลิกบนแผนที่เพื่อเลือกตำแหน่ง
 * @param {Event} event - เหตุการณ์การคลิกบนแผนที่
 */
function handleMapClick(event) {
  console.log("Map clicked at:", event.latLng.lat(), event.latLng.lng());
  
  // ถ้าอยู่ในโหมดเลือกตำแหน่งสำหรับการแก้ไข ให้ใช้ handleMapClickForEdit แทน
  if (window.isSelectingLocation) {
    if (typeof window.handleMapClickForEdit === 'function') {
      window.handleMapClickForEdit(event);
    }
    return;
  }

  const lat = event.latLng.lat();
  const lng = event.latLng.lng();
  
  // เก็บตำแหน่งที่เลือก
  window.selectedLatLng = event.latLng;
  
  // อัปเดตค่าในฟอร์ม
  const locationInput = document.getElementById("location");
  if (locationInput) {
    locationInput.value = `Lat: ${lat}, Lng: ${lng}`;
  }
  
  // แสดง marker ชั่วคราวที่ตำแหน่งที่เลือก
  if (window.tempMarker) window.tempMarker.setMap(null);
  
  if (window.map) {
    window.tempMarker = new google.maps.Marker({
      position: event.latLng,
      map: window.map,
      title: "ตำแหน่งที่เลือก",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new google.maps.Size(40, 40)
      },
      animation: google.maps.Animation.DROP
    });
  }
  
  // แสดง toast แจ้งเตือน
  if (typeof showToast === 'function') {
    showToast('Info', 'เลือกตำแหน่งเรียบร้อยแล้ว', 'info', 'center');
  }
}

/**
 * บันทึกข้อมูลหน่วยงานลง Firestore
 * @returns {Promise<void>}
 */
async function saveOrganization() {
  // ดึงค่าจากฟอร์ม
  const orgName = document.getElementById("orgName").value.trim();
  const telegramToken = document.getElementById("telegramToken").value.trim();

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!orgName || !telegramToken || !selectedLatLng) {
    showToast('Warning', 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกตำแหน่งบนแผนที่', 'warning', 'center');
    highlightInput('orgName');
    highlightInput('telegramToken');
    highlightInput('location');
    return; // หยุดการทำงานถ้าข้อมูลไม่ครบ
  }

  try {
    // แสดง Loading
    showLoading('กำลังบันทึกข้อมูลหน่วยงาน...');

    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgName);
    const doc = await orgRef.get();

    // ตรวจสอบชื่อหน่วยงานซ้ำ (เฉพาะกรณีสร้างใหม่)
    if (doc.exists && !isEditMode) {
      showToast('Warning', `หน่วยงาน "${orgName}" มีอยู่แล้วในระบบ`, 'warning', 'center');
      highlightInput('orgName');
      return;
    }

    // เตรียมข้อมูลสำหรับบันทึก
    const payload = {
      name: orgName,
      telegramToken: telegramToken,
      location: new firebase.firestore.GeoPoint(
        selectedLatLng.lat(),
        selectedLatLng.lng()
      ),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // ถ้าเป็นโหมดสร้างใหม่ ให้เพิ่ม createdAt
    if (!isEditMode) {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    // บันทึกข้อมูลลง Firestore
    await orgRef.set(payload, { merge: true });

    // แจ้งเตือนสำเร็จและรีเฟรช
    showToast('Success', `หน่วยงาน "${orgName}" ถูก${isEditMode ? 'อัปเดต' : 'เพิ่ม'}เรียบร้อยแล้ว`, 'success', 'center');

    // ปิด Modal และรีเฟรชข้อมูล
    $('#addOrgModal').modal('hide');
    resetForm();
    await clearAllMarkers(); // ล้าง markers เดิมก่อนดึงข้อมูลใหม่
    await fetchOrganizations();
    resetEditMode();
  } catch (error) {
    console.error("Error saving organization:", error);
    showToast('Error', error.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error', 'center');
  } finally {
    hideLoading();
  }
}

/**
 * แสดงข้อความแจ้งเตือนแบบสวยงาม
 * @param {string} type - ประเภทของการแจ้งเตือน (success, error, warning, info)
 * @param {string} title - หัวข้อของการแจ้งเตือน
 * @param {string} message - ข้อความของการแจ้งเตือน
 */
function showAlert(type, title, message) {
  // ใช้ SweetAlert2 ถ้ามี หรือใช้ alert ปกติถ้าไม่มี
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

/**
 * เลื่อนแผนที่ไปยังตำแหน่งที่กำหนด
 * @param {number} lat - ละติจูด
 * @param {number} lng - ลองจิจูด
 */
function goToLocation(lat, lng) {
  if (window.map) {
    const location = new google.maps.LatLng(lat, lng);
    window.map.setCenter(location);
    window.map.setZoom(15); // ปรับระดับการซูม
  } else {
    console.error("Map is not initialized");
    showToast('Error', 'แผนที่ยังไม่พร้อมใช้งาน', 'error', 'center');
  }
}

/**
 * ล้าง markers ทั้งหมดบนแผนที่
 */
function clearAllMarkers() {
  if (allMarkers && allMarkers.length > 0) {
    for (let marker of allMarkers) {
      marker.setMap(null);
    }
    allMarkers = [];
  }
}

/**
 * ดึงข้อมูลหน่วยงานทั้งหมดจาก Firestore และแสดงในตาราง
 * @returns {Promise<void>}
 */
async function fetchOrganizations() {
  try {
    console.log("Fetching organizations...");
    
    // ตรวจสอบว่า map พร้อมใช้งานหรือไม่
    if (!window.isMapInitialized || !window.map) {
      console.warn("Map is not initialized yet, will try to fetch organizations without adding markers");
    }
    
    // Clear existing markers
    if (typeof window.clearAllMarkers === 'function') {
      window.clearAllMarkers();
    }
    
    // ดึงข้อมูลหน่วยงานจาก Firestore
    const snapshot = await firebase.firestore().collection("organizations").get();

    const orgListContainer = document.getElementById("orgListContainer");
    if (!orgListContainer) {
      console.error("Organization list container not found");
      return;
    }
    
    orgListContainer.innerHTML = ""; // เคลียร์ข้อมูลที่มีอยู่ก่อน

    let index = 1;

    snapshot.forEach((doc) => {
      const orgData = doc.data();

      // ตรวจสอบว่ามี location หรือไม่
      const hasLocation = orgData.location && orgData.location.latitude && orgData.location.longitude;

      // สร้างแถวใหม่ในตาราง
      const orgItem = document.createElement("tr");

      // เพิ่มข้อมูลลงในแถว
      orgItem.innerHTML = `
        <td>${index++}</td>
        <td>
          ${
            hasLocation
              ? `<a href="#" class="org-link" onclick="goToLocation(${orgData.location.latitude}, ${orgData.location.longitude})">
                  ${orgData.name}
                </a>`
              : orgData.name
          }
        </td>
        <td>${orgData.telegramToken || "undefined"}</td>
        <td>${orgData.createdAt ? orgData.createdAt.toDate().toLocaleString() : "ไม่ระบุ"}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editOrganization('${doc.id}')">แก้ไข</button>
          <button class="btn btn-danger btn-sm" onclick="deleteOrganization('${doc.id}')">ลบ</button>
        </td>
      `;
      orgListContainer.appendChild(orgItem);

      // สร้าง Marker บนแผนที่ถ้ามีข้อมูลตำแหน่ง
      if (hasLocation && window.isMapInitialized && window.map) {
        try {
          // สร้าง Marker
          const marker = new google.maps.Marker({
            position: {
              lat: orgData.location.latitude,
              lng: orgData.location.longitude,
            },
            map: window.map,
            title: orgData.name,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new google.maps.Size(40, 40)
            },
            animation: google.maps.Animation.DROP
          });

          // เพิ่ม Event Listener ให้ Marker
          marker.addListener("click", () => {
            window.map.setCenter(marker.getPosition());
            window.map.setZoom(15); // ซูมเมื่อคลิก
          });
          
          // Add marker to the global array
          if (Array.isArray(window.allMarkers)) {
            window.allMarkers.push(marker);
          }
        } catch (error) {
          console.error("Error creating marker:", error);
        }
      }
    });
    
    console.log("Organizations fetched successfully");
  } catch (error) {
    console.error("Error fetching organizations:", error);
    showAlert("error", "เกิดข้อผิดพลาด", "ไม่สามารถดึงข้อมูลหน่วยงานได้");
  }
}

/**
 * ไฮไลต์ช่องที่กรอกข้อมูลไม่ครบ
 * @param {string} inputId - ID ของ input ที่ต้องการไฮไลต์
 */
function highlightInput(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.classList.add('is-invalid');
    setTimeout(() => {
      input.classList.remove('is-invalid');
    }, 3000);
  }
}

/**
 * Event listener สำหรับปุ่มบันทึกข้อมูล
 */
function setupSaveButtonListener() {
  const saveOrgBtn = document.getElementById("saveOrgBtn");
  if (saveOrgBtn) {
    saveOrgBtn.addEventListener("click", async function () {
      // ดึงค่าจากฟอร์ม
      const orgName = document.getElementById("orgName").value.trim();
      const telegramToken = document.getElementById("telegramToken").value.trim();

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!orgName || !telegramToken || !selectedLatLng) {
        showToast('Warning', 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกตำแหน่งบนแผนที่', 'warning', 'center');
        highlightInput('orgName'); 
        highlightInput('telegramToken'); 
        highlightInput('location'); 
        return;
      }

      try {
        // แสดง Loading
        showLoading('กำลังบันทึกข้อมูลหน่วยงาน...');

        const db = firebase.firestore();
        const orgRef = db.collection("organizations").doc(orgName);
        const doc = await orgRef.get();

        // ตรวจสอบชื่อหน่วยงานซ้ำ
        if (doc.exists) {
          showToast('Warning', 'มีหน่วยงานนี้อยู่แล้วในระบบ', 'warning', 'center');
          highlightInput('orgName');
          return;
        }

        // บันทึกข้อมูลลง Firestore
        await orgRef.set({
          name: orgName,
          telegramToken: telegramToken,
          location: new firebase.firestore.GeoPoint(
            selectedLatLng.lat(),
            selectedLatLng.lng()
          ),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // แจ้งเตือนสำเร็จและรีเซ็ตฟอร์ม
        showToast('Success', `หน่วยงาน "${orgName}" ถูกเพิ่มเรียบร้อยแล้ว`, 'success', 'center');

        // ปิด Modal และรีเฟรชข้อมูล
        $('#addOrgModal').modal('hide');
        resetForm();
        await clearAllMarkers(); // ล้าง markers เดิมก่อนดึงข้อมูลใหม่
        await fetchOrganizations();

      } catch (error) {
        console.error("Error saving organization:", error);
        showToast('Error', error.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error', 'center');
      } finally {
        hideLoading();
      }
    });
  }
}

/**
 * เปิด Modal แก้ไขและแสดงข้อมูลหน่วยงานที่ต้องการแก้ไข
 * @param {string} orgId - ID ของหน่วยงานที่ต้องการแก้ไข
 * @returns {Promise<void>}
 */
// แก้ไขฟังก์ชัน editOrganization
async function editOrganization(orgId) {
  try {
    showLoading('กำลังโหลดข้อมูลหน่วยงาน...');
    
    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgId);
    const doc = await orgRef.get();

    if (doc.exists) {
      const orgData = doc.data();

      // เก็บค่าปัจจุบันเพื่อเปรียบเทียบการเปลี่ยนแปลง
      originalOrgName = orgData.name;
      originalTelegramToken = orgData.telegramToken;
      
      // เก็บตำแหน่งเดิม
      if (orgData.location && orgData.location.latitude && orgData.location.longitude) {
        originalLatLng = new google.maps.LatLng(
          orgData.location.latitude,
          orgData.location.longitude
        );
        originalLocation = `Lat: ${orgData.location.latitude}, Lng: ${orgData.location.longitude}`;
      } else {
        originalLatLng = null;
        originalLocation = "ไม่พบข้อมูลตำแหน่ง";
      }
      
      // แสดงข้อมูลในฟอร์ม
      document.getElementById("editOrgName").value = orgData.name;
      document.getElementById("editTelegramToken").value = orgData.telegramToken;

      // แสดงข้อมูลตำแหน่งเดิม
      if (orgData.location && orgData.location.latitude && orgData.location.longitude) {
        const lat = orgData.location.latitude;
        const lng = orgData.location.longitude;
        document.getElementById("editLocation").value = `Lat: ${lat}, Lng: ${lng}`;
      } else {
        document.getElementById("editLocation").value = "ไม่พบข้อมูลตำแหน่ง";
      }

      // รีเซ็ตตำแหน่งใหม่ในฟอร์ม
      document.getElementById("newLocation").value = "";
      
      // ตั้งค่าให้เรียกฟังก์ชัน updateOrganization เมื่อกดปุ่ม "อัปเดต"
      document.getElementById("updateOrgBtn").onclick = function() {
        updateOrganization(orgId);
      };
      
      // ตั้งค่าให้เรียกฟังก์ชัน startSelectingNewLocation เมื่อกดปุ่ม "เลือกตำแหน่งใหม่"
      const selectNewLocationBtn = document.getElementById("selectNewLocationBtn");
      if (selectNewLocationBtn) {
        selectNewLocationBtn.onclick = startSelectingNewLocation;
      }
      
      // ตั้งค่าให้เรียกฟังก์ชัน viewCurrentLocation เมื่อกดปุ่ม "ดูตำแหน่ง"
      const viewCurrentLocationBtn = document.getElementById("viewCurrentLocationBtn");
      if (viewCurrentLocationBtn) {
        viewCurrentLocationBtn.onclick = function() {
          if (originalLatLng) {
            // ย้ายแผนที่ไปที่ตำแหน่งเดิม
            window.map.setCenter(originalLatLng);
            window.map.setZoom(15);
            
            // แสดง marker ชั่วคราวที่ตำแหน่งเดิม
            if (tempMarker) tempMarker.setMap(null);
            tempMarker = new google.maps.Marker({
              position: originalLatLng,
              map: window.map,
              title: "ตำแหน่งปัจจุบัน",
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                scaledSize: new google.maps.Size(40, 40)
              },
              animation: google.maps.Animation.BOUNCE
            });
            
            // ปิด Modal ชั่วคราว
            $('#editOrgModal').modal('hide');
            
            // แสดง toast แจ้งเตือน
            showToast('Info', 'กำลังแสดงตำแหน่งปัจจุบัน', 'info', 'center');
            
            // เปิด Modal อีกครั้งหลังจาก 2 วินาที
            setTimeout(() => {
              $('#editOrgModal').modal('show');
            }, 2000);
          } else {
            showToast('Warning', 'ไม่พบข้อมูลตำแหน่งปัจจุบัน', 'warning', 'center');
          }
        };
      }

      // เปิด Modal แก้ไข
      $('#editOrgModal').modal('show');
      hideLoading();
    } else {
      hideLoading();
      showAlert("error", "ไม่พบข้อมูล", "ไม่พบข้อมูลหน่วยงานที่ต้องการแก้ไข");
    }
  } catch (error) {
    hideLoading();
    console.error("Error editing organization:", error);
    showAlert("error", "เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยงาน");
  }
}

/**
 * จัดการการคลิกบนแผนที่สำหรับการแก้ไขตำแหน่ง
 * @param {Event} event - เหตุการณ์การคลิกบนแผนที่
 */
function handleMapClickForEdit(event) {
  if (!window.isSelectingLocation) return;
  
  const lat = event.latLng.lat();
  const lng = event.latLng.lng();
  
  console.log("Map clicked for edit at:", lat, lng);
  
  // เก็บตำแหน่งที่เลือก
  window.selectedLatLng = event.latLng;
  
  // แสดง marker ชั่วคราวที่ตำแหน่งใหม่
  if (window.tempMarker) window.tempMarker.setMap(null);
  
  if (window.map) {
    window.tempMarker = new google.maps.Marker({
      position: window.selectedLatLng,
      map: window.map,
      title: "ตำแหน่งใหม่",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new google.maps.Size(40, 40)
      },
      animation: google.maps.Animation.DROP
    });
  }
  
  // แสดง toast แจ้งเตือน
  if (typeof showToast === 'function') {
    showToast('Success', 'เลือกตำแหน่งใหม่เรียบร้อยแล้ว', 'success', 'center');
  }
  
  // อัปเดตค่าในฟอร์ม
  const newLocationInput = document.getElementById("newLocation");
  if (newLocationInput) {
    newLocationInput.value = `Lat: ${lat}, Lng: ${lng}`;
  }
  
  // ปิดโหมดเลือกตำแหน่ง
  window.isSelectingLocation = false;
  
  // ลบ event listener
  if (window.map && google && google.maps && google.maps.event) {
    google.maps.event.clearListeners(window.map, 'click');
    
    // เพิ่ม event listener กลับคืน
    if (typeof window.handleMapClick === 'function') {
      window.map.addListener("click", window.handleMapClick);
    }
  }
  
  // ซ่อนแถบสถานะการเลือกตำแหน่ง
  const selectingLocationAlert = document.getElementById("selectingLocationAlert");
  if (selectingLocationAlert) {
    selectingLocationAlert.classList.add("d-none");
  }
  
  // เปิด Modal อีกครั้ง
  $('#editOrgModal').modal('show');
}

/**
 * เริ่มการเลือกตำแหน่งใหม่
 */
function startSelectingNewLocation() {
  // ปิด Modal ชั่วคราว
  $('#editOrgModal').modal('hide');
  
  // เปิดโหมดเลือกตำแหน่ง
  window.isSelectingLocation = true;
  
  // แสดงแถบสถานะการเลือกตำแหน่ง
  const selectingLocationAlert = document.getElementById("selectingLocationAlert");
  if (selectingLocationAlert) {
    selectingLocationAlert.classList.remove("d-none");
  }
  
  // ลบ event listener เดิม
  if (window.map && google && google.maps && google.maps.event) {
    google.maps.event.clearListeners(window.map, 'click');
    
    // เพิ่ม event listener สำหรับการเลือกตำแหน่งใหม่
    window.map.addListener("click", handleMapClickForEdit);
  }
  
  // แสดง toast แจ้งเตือน
  if (typeof showToast === 'function') {
    showToast('Info', 'คลิกบนแผนที่เพื่อเลือกตำแหน่งใหม่', 'info', 'center');
  }
}



/**
 * ยกเลิกการเลือกตำแหน่ง
 */
function cancelLocationSelection() {
  // ปิดโหมดเลือกตำแหน่ง
  window.isSelectingLocation = false;
  
  // ลบ event listener
  if (window.map && google && google.maps && google.maps.event) {
    google.maps.event.clearListeners(window.map, 'click');
    
    // เพิ่ม event listener กลับคืน
    if (typeof window.handleMapClick === 'function') {
      window.map.addListener("click", window.handleMapClick);
    }
  }
  
  // ลบ marker ชั่วคราว
  if (window.tempMarker) {
    window.tempMarker.setMap(null);
    window.tempMarker = null;
  }
  
  // ซ่อนแถบสถานะการเลือกตำแหน่ง
  const selectingLocationAlert = document.getElementById("selectingLocationAlert");
  if (selectingLocationAlert) {
    selectingLocationAlert.classList.add("d-none");
  }
  
  // เปิด Modal อีกครั้ง
  $('#editOrgModal').modal('show');
}
/**
 * อัปเดตข้อมูลหน่วยงานใน Firestore
 * @param {string} orgId - ID ของหน่วยงานที่ต้องการอัปเดต
 * @returns {Promise<void>}
 */
async function updateOrganization(orgId) {
  const orgName = document.getElementById("editOrgName").value.trim();
  const telegramToken = document.getElementById("editTelegramToken").value.trim();
  const newLocationValue = document.getElementById("newLocation").value.trim();

  if (!orgName || !telegramToken) {
    showAlert("warning", "ข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  try {
    // แสดง Loading
    showLoading('กำลังอัปเดตข้อมูลหน่วยงาน...');
    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgId);

    // สร้างตัวแปรที่ใช้ในการอัปเดตข้อมูล
    let updatedData = {};

    // ตรวจสอบว่า orgName มีการเปลี่ยนแปลง
    if (orgName !== originalOrgName) {
      updatedData.name = orgName;
    }

    // ตรวจสอบว่า telegramToken มีการเปลี่ยนแปลง
    if (telegramToken !== originalTelegramToken) {
      updatedData.telegramToken = telegramToken;
    }

    // ตรวจสอบว่ามีการเลือกตำแหน่งใหม่หรือไม่
    if (selectedLatLng) {
      updatedData.location = new firebase.firestore.GeoPoint(
        selectedLatLng.lat(),
        selectedLatLng.lng()
      );
    } else if (newLocationValue && newLocationValue !== "คลิกแผนที่เพื่อเลือกตำแหน่ง" && newLocationValue !== originalLocation) {
      // ถ้ามีการกรอกตำแหน่งใหม่ในช่อง input
      try {
        // แยกค่า latitude และ longitude จาก input
        const latMatch = newLocationValue.match(/Lat:\s*([\d.-]+)/);
        const lngMatch = newLocationValue.match(/Lng:\s*([\d.-]+)/);
        
        if (latMatch && lngMatch) {
          const latitude = parseFloat(latMatch[1]);
          const longitude = parseFloat(lngMatch[1]);
          
          if (!isNaN(latitude) && !isNaN(longitude)) {
            updatedData.location = new firebase.firestore.GeoPoint(latitude, longitude);
          } else {
            showToast('Warning', 'รูปแบบตำแหน่งไม่ถูกต้อง', 'warning', 'center');
            hideLoading();
            return;
          }
        } else {
          showToast('Warning', 'รูปแบบตำแหน่งไม่ถูกต้อง', 'warning', 'center');
          hideLoading();
          return;
        }
      } catch (error) {
        console.error("Error parsing location:", error);
        showToast('Error', 'เกิดข้อผิดพลาดในการแปลงค่าตำแหน่ง', 'error', 'center');
        hideLoading();
        return;
      }
    }

    // อัปเดตเฉพาะฟิลด์ที่เปลี่ยนแปลง
    if (Object.keys(updatedData).length > 0) {
      updatedData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await orgRef.update(updatedData);
      
      // แสดง toast แจ้งเตือนสำเร็จ
      showToast('Success', 'อัปเดตข้อมูลหน่วยงานเรียบร้อยแล้ว', 'success', 'center');
    } else {
      // แสดง toast แจ้งเตือนว่าไม่มีการเปลี่ยนแปลง
      showToast('Info', 'ไม่มีการเปลี่ยนแปลงข้อมูล', 'info', 'center');
    }

    // ปิด Modal
    $('#editOrgModal').modal('hide');

    // ลบ marker ชั่วคราว
    if (tempMarker) tempMarker.setMap(null);

    // รีเฟรชข้อมูลหน่วยงาน
    await fetchOrganizations();

  } catch (error) {
    console.error("Error updating organization:", error);
    showAlert("error", "เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการอัปเดตข้อมูลหน่วยงาน");
  } finally {
    hideLoading();
  }
}

/**
 * ลบข้อมูลหน่วยงานจาก Firestore
 * @param {string} orgId - ID ของหน่วยงานที่ต้องการลบ
 * @returns {Promise<void>}
 */
async function deleteOrganization(orgId) {
  try {
    // ขอการยืนยันจากผู้ใช้ก่อนลบ
    const confirmDelete = confirm("คุณต้องการลบหน่วยงานนี้หรือไม่?");
    if (!confirmDelete) {
      return;
    }

    // แสดง Loading
    showLoading('กำลังลบข้อมูลหน่วยงาน...');

    const db = firebase.firestore();
    const orgRef = db.collection("organizations").doc(orgId);

    // ลบข้อมูลจาก Firestore
    await orgRef.delete();
    
    // แสดง toast แจ้งเตือนสำเร็จ
    showToast('Success', 'ลบข้อมูลหน่วยงานเรียบร้อยแล้ว', 'success', 'center');

    // รีเฟรชข้อมูลหน่วยงานใหม่
    await clearAllMarkers(); // ล้าง markers เดิมก่อนดึงข้อมูลใหม่
    await fetchOrganizations();

  } catch (error) {
    console.error("Error deleting organization:", error);
    showAlert("error", "เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดในการลบหน่วยงาน");
  } finally {
    hideLoading();
  }
}

/**
 * ค้นหาหน่วยงานตามคำค้นหา
 */
function searchOrganizations() {
  const searchInput = document.getElementById("searchOrg");
  if (!searchInput) return;
  
  const searchText = searchInput.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#orgListContainer tr");
  
  rows.forEach(row => {
    const orgName = row.querySelector("td:nth-child(2)")?.textContent.toLowerCase() || "";
    const telegramToken = row.querySelector("td:nth-child(3)")?.textContent.toLowerCase() || "";
    
    if (orgName.includes(searchText) || telegramToken.includes(searchText)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

/**
 * รีเซ็ตฟอร์มหลังจากบันทึกข้อมูล
 */
function resetForm() {
  // ล้างค่าในฟอร์ม
  const orgNameInput = document.getElementById("orgName");
  const telegramTokenInput = document.getElementById("telegramToken");
  const locationInput = document.getElementById("location");

  if (orgNameInput) orgNameInput.value = "";
  if (telegramTokenInput) telegramTokenInput.value = "";
  
  // ถ้ามีการเลือกตำแหน่งไว้แล้ว ให้แสดงตำแหน่งนั้น
  if (selectedLatLng && locationInput) {
    locationInput.value = `Lat: ${selectedLatLng.lat()}, Lng: ${selectedLatLng.lng()}`;
  } else if (locationInput) {
    locationInput.value = "คลิกบนแผนที่เพื่อเลือกตำแหน่ง";
  }
}


/**
 * รีเซ็ตการเลือกตำแหน่ง
 */
function resetLocationSelection() {
  selectedLatLng = null;
  const locationInput = document.getElementById("location");
  if (locationInput) {
    locationInput.value = "คลิกบนแผนที่เพื่อเลือกตำแหน่ง";
  }
  
  // ลบ marker ชั่วคราว
  if (tempMarker) tempMarker.setMap(null);
  
  // ปิดโหมดเลือกตำแหน่ง
  isSelectingLocation = false;
  
  // ลบ event listener
  if (window.map) {
    google.maps.event.clearListeners(window.map, 'click');
  }
}

/**
 * รีเซ็ตโหมดการแก้ไข
 */
function resetEditMode() {
  isEditMode = false;
  const saveOrgBtn = document.getElementById("saveOrgBtn");
  if (saveOrgBtn) {
    saveOrgBtn.textContent = "ยืนยัน";
    saveOrgBtn.onclick = saveOrganization;
  }
  
  // รีเซ็ตตัวแปรต่างๆ
  originalOrgName = '';
  originalTelegramToken = '';
  originalLocation = '';
  originalLatLng = null;
  
  // ลบ marker ชั่วคราว
  if (tempMarker) tempMarker.setMap(null);
  
  // ปิดโหมดเลือกตำแหน่ง
  isSelectingLocation = false;
}

/**
 * ตั้งค่า event listeners เมื่อหน้าโหลดเสร็จ
 */
// แก้ไขการตั้งค่า event listener สำหรับ Modal
// แก้ไขบรรทัด 269 และบริเวณใกล้เคียง
document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM loaded, fetching organizations...");
  
  // ตั้งค่า event listener สำหรับปุ่มเลือกตำแหน่งใหม่
  const selectNewLocationBtn = document.getElementById("selectNewLocationBtn");
  if (selectNewLocationBtn) {
    selectNewLocationBtn.addEventListener("click", startSelectingNewLocation);
  }
  
  // ตั้งค่า event listener สำหรับปุ่มยกเลิกการเลือกตำแหน่ง
  const cancelSelectLocationBtn = document.getElementById("cancelSelectLocationBtn");
  if (cancelSelectLocationBtn) {
    cancelSelectLocationBtn.addEventListener("click", cancelLocationSelection);
  }
  
  // ตั้งค่า event listener สำหรับปุ่มดูตำแหน่งปัจจุบัน
  const viewCurrentLocationBtn = document.getElementById("viewCurrentLocationBtn");
  if (viewCurrentLocationBtn) {
    viewCurrentLocationBtn.addEventListener("click", function() {
      const locationText = document.getElementById("editLocation").value;
      const matches = locationText.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/);
      
      if (matches && matches.length === 3) {
        const lat = parseFloat(matches[1]);
        const lng = parseFloat(matches[2]);
        
        if (!isNaN(lat) && !isNaN(lng) && typeof window.goToLocation === 'function') {
          window.goToLocation(lat, lng);
        }
      }
    });
  }
  
  // ตั้งค่า event listener สำหรับ Modal เมื่อถูกปิด
  $('#editOrgModal').on('hidden.bs.modal', function () {
    // ลบ marker ชั่วคราว
    if (window.tempMarker) {
      window.tempMarker.setMap(null);
      window.tempMarker = null;
    }
    
    // ปิดโหมดเลือกตำแหน่ง
    window.isSelectingLocation = false;
    
    // ลบ event listener
    if (window.map && google && google.maps && google.maps.event) {
      google.maps.event.clearListeners(window.map, 'click');
      
      // เพิ่ม event listener กลับคืน
      if (typeof window.handleMapClick === 'function') {
        window.map.addListener("click", window.handleMapClick);
      }
    }
    
    // ซ่อนแถบสถานะการเลือกตำแหน่ง
    const selectingLocationAlert = document.getElementById("selectingLocationAlert");
    if (selectingLocationAlert) {
      selectingLocationAlert.classList.add("d-none");
    }
  });
  
  // ตั้งค่า event listener สำหรับ Modal เมื่อถูกเปิด
  $('#addOrgModal').on('shown.bs.modal', function () {
    resetForm();
  });
  
  // ไม่ต้องเรียก fetchOrganizations ที่นี่ เพราะจะเรียกหลังจาก map ถูกโหลดเสร็จแล้ว
});

// ทำให้ฟังก์ชันเป็น global เพื่อให้เรียกใช้จาก HTML ได้
window.handleMapClick = handleMapClick;
window.handleMapClickForEdit = handleMapClickForEdit;
window.startSelectingNewLocation = startSelectingNewLocation;
window.cancelLocationSelection = cancelLocationSelection;
window.editOrganization = editOrganization;
window.deleteOrganization = deleteOrganization;
window.goToLocation = goToLocation;
window.searchOrganizations = searchOrganizations;
window.fetchOrganizations = fetchOrganizations;
window.isSelectingLocation = false;