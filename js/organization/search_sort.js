// ฟังก์ชันเพื่อจัดการการคลิกที่หัวตารางเพื่อเรียงลำดับ
let sortDirection = true; // true สำหรับ ascending (น้อยไปมาก), false สำหรับ descending (มากไปน้อย)

function sortTableByColumn(columnIndex) {
  console.log(`Sorting table by column: ${columnIndex}, direction: ${sortDirection ? 'ascending' : 'descending'}`);
  try {
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
    
    console.log('Table sorting completed');
  } catch (error) {
    console.error(`Error sorting table: ${error.message}`, error);
  }
}

// เพิ่มตัวจัดการเหตุการณ์ให้กับหัวตาราง
document.addEventListener('DOMContentLoaded', function() {
  try {
    const tableHeaders = document.querySelectorAll('thead th');
    tableHeaders.forEach((th, index) => {
      th.addEventListener('click', () => {
        console.log(`Header clicked: ${th.textContent}, index: ${index}`);
        sortTableByColumn(index);
      });
    });
    console.log('Table header click handlers initialized');
  } catch (error) {
    console.error(`Error setting up table headers: ${error.message}`, error);
  }
});

// ฟังก์ชันค้นหาหน่วยงานจากชื่อหน่วยงานและ Telegram Token
function searchOrganizations() {
  console.log('Searching organizations');
  try {
    const searchTerm = document.getElementById("searchOrg").value.toLowerCase();  // คำค้นจากช่องค้นหา
    console.log(`Search term: "${searchTerm}"`);
    
    const orgListContainer = document.getElementById("orgListContainer");  // ตัวแสดงผลรายการหน่วยงานในตาราง
    const orgItems = orgListContainer.getElementsByTagName("tr");  // ดึงแถวทั้งหมดในตาราง

    let visibleCount = 0; // นับจำนวนแถวที่แสดง
    
    // วนลูปผ่านแถวทั้งหมดในตาราง
    for (let i = 0; i < orgItems.length; i++) {
      const orgItem = orgItems[i];
      const orgName = orgItem.getElementsByTagName("td")[1].textContent.toLowerCase();  // ชื่อหน่วยงานในแต่ละแถว
      const telegramToken = orgItem.getElementsByTagName("td")[2].textContent.toLowerCase();  // Telegram Token ในแต่ละแถว
      const telegramChatId = orgItem.getElementsByTagName("td")[3].textContent.toLowerCase();  // Telegram Chat ID ในแต่ละแถว
      
      // ตรวจสอบว่าข้อความในแถวตรงกับคำค้นหาหรือไม่
      if (orgName.includes(searchTerm) || telegramToken.includes(searchTerm) || telegramChatId.includes(searchTerm)) {
        orgItem.style.display = "";  // แสดงแถวที่ตรงกับคำค้นหา
        
        // อัปเดตลำดับที่
        orgItem.getElementsByTagName("td")[0].textContent = visibleCount + 1;
        
        visibleCount++;
      } else {
        orgItem.style.display = "none";  // ซ่อนแถวที่ไม่ตรงกับคำค้นหา
      }
    }
    
    console.log(`Search completed. Found ${visibleCount} matching organizations`);
    
    // ถ้าไม่พบข้อมูลที่ตรงกับคำค้นหา
    if (visibleCount === 0 && searchTerm !== "") {
      // สร้างแถวแจ้งเตือนว่าไม่พบข้อมูล
      const noResultRow = document.createElement("tr");
      noResultRow.innerHTML = `<td colspan="6" class="text-center">ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"</td>`;
      noResultRow.id = "noResultRow";
      
      // ลบแถวแจ้งเตือนเก่า (ถ้ามี)
      const oldNoResultRow = document.getElementById("noResultRow");
      if (oldNoResultRow) {
        oldNoResultRow.remove();
      }
      
      // เพิ่มแถวแจ้งเตือนใหม่
      orgListContainer.appendChild(noResultRow);
    } else {
      // ลบแถวแจ้งเตือนเก่า (ถ้ามี)
      const oldNoResultRow = document.getElementById("noResultRow");
      if (oldNoResultRow) {
        oldNoResultRow.remove();
      }
    }
  } catch (error) {
    console.error(`Error searching organizations: ${error.message}`, error);
    alert('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
  }
}
