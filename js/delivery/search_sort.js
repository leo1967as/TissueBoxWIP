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
