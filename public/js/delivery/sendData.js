
  // DROPDOWNS
  // โหลดข้อมูลหน่วยงานจาก Firestore และเติมลงใน Dropdowns
  async function loadOrganizations() {
  try {
    const db = firebase.firestore();
    const snapshot = await db.collection('organizations').get();
    const orgs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      orgs.push(data.name); 
    });

    // เติมข้อมูลลงใน Dropdown ทั้งหมด
    const selects = document.querySelectorAll('#fromLocation, #toLocation, #editFromLocation, #editToLocation');
    selects.forEach(select => {
      // ล้าง options เดิม
      select.innerHTML = '<option value="" disabled selected>เลือกสถานที่</option>';
      orgs.forEach(org => {
        const option = document.createElement('option');
        option.value = org;
        option.textContent = org;
        select.appendChild(option);
      });
    });
  } catch (error) {
    console.error('Error loading organizations:', error);
    alert('ไม่สามารถโหลดข้อมูลหน่วยงานได้');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadOrganizations();
  listenToDeliveries();
});