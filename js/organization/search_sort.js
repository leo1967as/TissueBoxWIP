// ฟังก์ชันเพื่อจัดการการคลิกที่หัวตารางเพื่อเรียงลำดับ
let sortDirection = true; // true สำหรับ ascending (น้อยไปมาก), false สำหรับ descending (มากไปน้อย)

function sortTableByColumn(columnIndex) {
  const rows = Array.from(document.querySelectorAll('#orgListContainer tr')); // ดึงแถวทั้งหมดในตาราง

  // เรียงแถวตามข้อมูลในคอลัมน์ที่คลิก
  rows.sort((a, b) => {
    const aCell = a.cells[columnIndex].textContent.trim();
    const bCell = b.cells[columnIndex].textContent.trim();

    if (sortDirection) {
      // การเรียงลำดับ ascending
      return aCell > bCell ? 1 : aCell < bCell ? -1 : 0;
    } else {
      // การเรียงลำดับ descending
      return aCell < bCell ? 1 : aCell > bCell ? -1 : 0;
    }
  });

  // เปลี่ยนทิศทางการเรียงลำดับ
  sortDirection = !sortDirection;

  // เพิ่มแถวที่ถูกเรียงในตารางใหม่
  const tableBody = document.getElementById('orgListContainer');
  rows.forEach(row => tableBody.appendChild(row));
}

// เพิ่มตัวจัดการเหตุการณ์ให้กับหัวตาราง
document.querySelectorAll('#orgListContainer th').forEach((th, index) => {
  th.addEventListener('click', () => sortTableByColumn(index)); // เมื่อคลิกที่หัวตาราง ให้เรียงลำดับข้อมูลในคอลัมน์
});



// ฟังก์ชันค้นหาหน่วยงานจากชื่อหน่วยงานและ Telegram Token
function searchOrganizations() {
  const searchTerm = document.getElementById("searchOrg").value.toLowerCase();  // คำค้นจากช่องค้นหา
  const orgListContainer = document.getElementById("orgListContainer");  // ตัวแสดงผลรายการหน่วยงานในตาราง
  const orgItems = orgListContainer.getElementsByTagName("tr");  // ดึงแถวทั้งหมดในตาราง

  let index = 1; // เริ่มต้นลำดับที่ 1
  
  // วนลูปผ่านแถวทั้งหมดในตาราง
  for (let i = 0; i < orgItems.length; i++) {
    const orgItem = orgItems[i];
    const orgName = orgItem.getElementsByTagName("td")[1].textContent.toLowerCase();  // ชื่อหน่วยงานในแต่ละแถว
    const telegramToken = orgItem.getElementsByTagName("td")[2].textContent.toLowerCase();  // Telegram Token ในแต่ละแถว

    // ตรวจสอบว่า คำค้นพบกับชื่อหน่วยงานหรือ Telegram Token หรือไม่
    // ตรวจสอบว่า คำค้นพบกับชื่อหน่วยงานหรือ Telegram Token หรือไม่
    if (orgName.includes(searchTerm) || telegramToken.includes(searchTerm)) {
      orgItem.style.display = ""; // แสดงแถวที่ค้นหาเจอ
      orgItem.getElementsByTagName("td")[0].textContent = index++; // อัปเดตลำดับใหม่
    } else {
      orgItem.style.display = "none"; // ซ่อนแถวที่ไม่ตรงกับคำค้น
    }
  }
}
