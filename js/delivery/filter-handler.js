// แก้ไขไฟล์ filter-handler.js

// ตัวแปรสำหรับเก็บค่า filter ปัจจุบัน
let currentOrgFilter = "all";
let currentStartDate = null;
let currentEndDate = null;
let orgIdToNameMap = {}; // เก็บข้อมูล mapping ID => ชื่อองค์กร
// เมื่อโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", () => {
  console.log("Filter handler loaded");
  
  // ตั้งค่า event listener สำหรับปุ่มเลือกช่วงเวลา
  const dateRangeButton = document.getElementById("dateRangeButton");
  if (dateRangeButton) {
    dateRangeButton.addEventListener("click", () => {
      const dateRangeModal = new bootstrap.Modal(document.getElementById("dateRangeModal"));
      dateRangeModal.show();
    });
  }

  // โหลดข้อมูลองค์กรสำหรับ dropdown
  loadOrganizationsForFilter();
});

// โหลดรายชื่อองค์กรสำหรับ dropdown
async function loadOrganizationsForFilter() {
  try {
    const db = firebase.firestore();
    const snapshot = await db.collection('organizations').get();
    const dropdownMenuButton = document.getElementById('dropdownMenuButtonSearch');
    
    // สร้าง dropdown menu สำหรับองค์กร
    // ตรวจสอบว่า dropdownMenuButton มีอยู่จริง
    if (!dropdownMenuButton) {
      console.error('ไม่พบปุ่ม dropdown ในหน้าเว็บ');
      return;
    }
    
    // สร้าง dropdown menu ถ้ายังไม่มี
    let dropdownMenu = document.querySelector('[aria-labelledby="dropdownMenuButtonSearch"]');
    if (!dropdownMenu) {
      dropdownMenu = document.createElement('ul');
      dropdownMenu.classList.add('dropdown-menu');
      dropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButtonSearch');
      dropdownMenuButton.parentNode.appendChild(dropdownMenu);
    } else {
      // เคลียร์รายการเดิม
      dropdownMenu.innerHTML = '';
    }
    
    // เพิ่มรายการ "ทั้งหมด"
    const allLi = document.createElement('li');
    const allLink = document.createElement('a');
    allLink.classList.add('dropdown-item');
    allLink.setAttribute('href', '#');
    allLink.setAttribute('data-filter', 'all');
    allLink.textContent = 'ทั้งหมด';
    allLink.addEventListener('click', (e) => {
      e.preventDefault();
      setOrgFilter('all');
    });
    allLi.appendChild(allLink);
    dropdownMenu.appendChild(allLi);
    
    // เพิ่มรายการองค์กรใน dropdown
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ดึงข้อมูลจาก Firestore: ${JSON.stringify(data)}`); // ตรวจสอบข้อมูลที่ดึงมา
      if (data.name) { // ตรวจสอบว่ามีฟิลด์ name หรือไม่
        console.log(`พบ NAME    `); // ตรวจสอบข้อมูลที่ดึงมา
        orgIdToNameMap[doc.id] = data.name; // map ID => ชื่อ
        const li = document.createElement('li');
        const a = document.createElement('a');
      a.classList.add('dropdown-item');
      a.setAttribute('href', '#');
      a.setAttribute('data-filter', data.name);
      a.textContent = data.name;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        setOrgFilter(data.name);
      });
      li.appendChild(a);
      dropdownMenu.appendChild(li);
    }
      else {
        console.warn(`เอกสารไม่มีฟิลด์ name: ${doc.id}`);
      }
    });
    
    console.log("Organizations loaded in dropdown");
    
  } catch (error) {
    console.error('Error loading organizations for filter:', error);
  }
}

// ตั้งค่าตัวกรององค์กร
function setOrgFilter(orgName) {
  console.log(` Setting organization filter to: ${orgName}`);
  currentOrgFilter = orgName;
  updateFilterButtonText();
  applyFilters();
}

// อัปเดตข้อความบนปุ่ม dropdown เลือกหน่วยงาน
function updateFilterButtonText() {
  const dropdownButton = document.getElementById('dropdownMenuButtonSearch');
  if (!dropdownButton) return;
  
  if (currentOrgFilter === 'all') {
    dropdownButton.textContent = 'เลือกหน่วยงาน';
  } else {
    dropdownButton.textContent = currentOrgFilter;
  }
}

// อัปเดตข้อความบนปุ่มเลือกช่วงเวลา
function updateDateRangeButtonText() {
  const dateRangeButton = document.getElementById('dateRangeButton');
  if (!dateRangeButton) return;
  
  const dateRangeTextElement = dateRangeButton.querySelector('.date-range-text') || dateRangeButton;
  
  if (currentStartDate && currentEndDate) {
    const startText = new Date(currentStartDate).toLocaleDateString('th-TH');
    const endText = new Date(currentEndDate).toLocaleDateString('th-TH');
    dateRangeTextElement.textContent = `${startText} - ${endText}`;
  } else {
    dateRangeTextElement.textContent = 'เลือกช่วงเวลา';
  }
}

// ใช้ตัวกรองช่วงเวลา
function applyDateFilter() {
  currentStartDate = document.getElementById('startDate').value;
  currentEndDate = document.getElementById('endDate').value;
  
  // ตรวจสอบว่ามีการเลือกวันที่ทั้งสองค่าหรือไม่
  if (currentStartDate && currentEndDate) {
    // แปลงค่าเป็น Date object เพื่อเปรียบเทียบ
    const startDate = new Date(currentStartDate);
    const endDate = new Date(currentEndDate);
    
    // ตรวจสอบว่าวันที่เริ่มต้นไม่มากกว่าวันที่สิ้นสุด
    if (startDate > endDate) {
      alert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
      return;
    }
  }
  
  // อัปเดตข้อความบนปุ่ม
  updateDateRangeButtonText();
  
  // ซ่อน modal
  const dateRangeModal = bootstrap.Modal.getInstance(document.getElementById('dateRangeModal'));
  if (dateRangeModal) {
    dateRangeModal.hide();
  }
  
  // ใช้ตัวกรอง
  applyFilters();
}

// ล้างตัวกรองวันที่
function clearDateFilter() {
  currentStartDate = null;
  currentEndDate = null;
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  updateDateRangeButtonText();
  
  // ซ่อน modal
  const dateRangeModal = bootstrap.Modal.getInstance(document.getElementById('dateRangeModal'));
  if (dateRangeModal) {
    dateRangeModal.hide();
  }
  
  // ใช้ตัวกรอง
  applyFilters();
}

// ใช้ตัวกรองทั้งหมด (ทั้งองค์กรและช่วงเวลา)
// ใช้ตัวกรองทั้งหมด (ทั้งองค์กรและช่วงเวลา)
function applyFilters() {
  console.log(`Applying filters - Organization: ${currentOrgFilter}, Date range: ${currentStartDate} to ${currentEndDate}`);

  const rows = document.querySelectorAll('#orgListContainer tr');
  let filteredCount = 0;
  let index = 1; // เริ่มต้นลำดับที่ 1

  rows.forEach(row => {
    let showRow = true;

    // กรองตามองค์กร
    if (currentOrgFilter !== 'all') {
      const fromLocationCell = row.cells[7]; // คอลัมน์ "ส่งจาก"
      if (fromLocationCell) {
        const fromText = fromLocationCell.textContent.trim();
        if (fromText.toLowerCase() !== currentOrgFilter.toLowerCase()) {
          showRow = false;
        }
      }
    }

    // กรองตามช่วงเวลา
    if (showRow && currentStartDate && currentEndDate) {
      const dateCell = row.cells[6]; // คอลัมน์วันที่
      if (dateCell) {
        const dateText = dateCell.textContent.trim();
        if (dateText !== 'ไม่ระบุ') {
          try {
            const rowDate = new Date(dateText);
            const startDate = new Date(currentStartDate);
            const endDate = new Date(currentEndDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            if (isNaN(rowDate) || rowDate < startDate || rowDate > endDate) {
              showRow = false;
            }
          } catch (e) {
            console.error(`Error parsing date: ${dateText}`, e);
            showRow = false;
          }
        } else {
          showRow = false;
        }
      }
    }

    // แสดงหรือซ่อนแถว
    if (showRow) {
      row.style.display = "";
      row.cells[0].textContent = index++; // อัปเดตลำดับใหม่
      filteredCount++;
    } else {
      row.style.display = "none";
    }
  });

  console.log(`Filtered ${filteredCount} rows`);
}
  
    console.log(`Filtered ${filteredCount} out of ${totalRows} rows`);
    const tbody = document.getElementById('orgListContainer');
  const existingNoData = tbody.querySelector('.no-data-row');
  if (filteredCount === 0) {
    // สร้างแถว ไม่มีข้อมูล ใหม่ ถ้ายังไม่มี
    if (!existingNoData) {
      const tr = document.createElement('tr');
      tr.className = 'no-data-row';
      tr.innerHTML = `
        <td colspan="10" class="text-center">ไม่มีข้อมูล</td>
      `;
      tbody.appendChild(tr);
    }
  } else {
    // ลบแถว ไม่มีข้อมูล ถ้ามีอยู่
    if (existingNoData) {
      existingNoData.remove();
    }
  }
  

// แทนที่ฟังก์ชัน listenToDeliveries ด้วยฟังก์ชันนี้
// ต้องเพิ่มในไฟล์ tablehandler.js หรือในไฟล์ที่มีการกำหนดฟังก์ชัน listenToDeliveries
function enhancedListenToDeliveries() {
  const db = firebase.firestore();

  // ฟังการเปลี่ยนแปลงในคอลเลกชัน "deliveries"
  db.collection("deliveries").onSnapshot((snapshot) => {
    const orgListContainer = document.getElementById("orgListContainer");


    orgListContainer.innerHTML = ""; // เคลียร์ข้อมูลเก่า

    let index = 1;
    const formattedDate = data.createdAt ? formatTimestamp(data.createdAt) : "ไม่ระบุ";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const boxId = doc.id;
      const fromLocationName = orgIdToNameMap[data.fromLocation] || data.fromLocation || "-";
      const toLocationName = orgIdToNameMap[data.toLocation] || data.toLocation || "-";
      // สร้างแถวใหม่ในตาราง - แสดงจากและไปยังอย่างชัดเจน
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
        </td>
      </tr>

    `;
      orgListContainer.innerHTML += row;
    });
    
    // หลังจากโหลดข้อมูลเสร็จ ให้ใช้ตัวกรองตามค่าปัจจุบัน
    setTimeout(() => {
        if (typeof applyFilters === 'function') applyFilters();
      }, 100);
  }, (error) => {
    console.error("Error listening to deliveries:", error);
  });
}

// ทดแทนฟังก์ชัน listenToDeliveries เดิม (ถ้าทำได้)
// With this:
if (typeof listenToDeliveries === 'function') {
    window.originalListenToDeliveries = listenToDeliveries;
    window.listenToDeliveries = enhancedListenToDeliveries;
    // Call the enhanced version right away
    enhancedListenToDeliveries();
  } else {
    // If listenToDeliveries isn't defined yet, try again later
    window.addEventListener('load', () => {
      if (typeof listenToDeliveries === 'function') {
        window.originalListenToDeliveries = listenToDeliveries;
        window.listenToDeliveries = enhancedListenToDeliveries;
        enhancedListenToDeliveries();
      }
    });
  }