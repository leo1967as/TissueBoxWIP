// ฟังก์ชันสำหรับโหลดรายการหน่วยงานทั้งหมด
function loadOrganizations() {
  console.log('Loading organizations');
  try {
    const db = firebase.firestore();
    const orgListContainer = document.getElementById('orgListContainer');
    
    if (!orgListContainer) {
      console.error('Organization list container not found');
      return;
    }
    
    // เคลียร์ข้อมูลเก่า
    orgListContainer.innerHTML = '';
    
    // ดึงข้อมูลหน่วยงานทั้งหมดจาก Firestore
    db.collection('organizations').orderBy('createdAt', 'desc').get()
      .then(querySnapshot => {
        console.log(`Retrieved ${querySnapshot.size} organizations`);
        
        if (querySnapshot.empty) {
          orgListContainer.innerHTML = '<tr><td colspan="6" class="text-center">ไม่พบข้อมูลหน่วยงาน</td></tr>';
          return;
        }
        
        // สร้างแถวข้อมูลสำหรับแต่ละหน่วยงาน
        let index = 1;
        querySnapshot.forEach(doc => {
          try {
            const orgData = doc.data();
            const orgId = doc.id;
            
            // แปลงเวลาให้อยู่ในรูปแบบที่อ่านง่าย
            const createdAt = orgData.createdAt ? new Date(orgData.createdAt.toDate()).toLocaleString('th-TH') : '-';
            
            // สร้างแถวข้อมูล
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${index}</td>
              <td>${orgData.name || '-'}</td>
              <td>${orgData.telegramToken ? '✓' : '✗'}</td>
              <td>${orgData.telegramChatId ? '✓' : '✗'}</td>
              <td>${createdAt}</td>
              <td>
                <button class="btn btn-sm btn-primary edit-org-btn" data-id="${orgId}">แก้ไข</button>
                <button class="btn btn-sm btn-danger delete-org-btn" data-id="${orgId}">ลบ</button>
              </td>
            `;
            
            // เพิ่มแถวลงในตาราง
            orgListContainer.appendChild(row);
            
            // เพิ่ม event listener สำหรับปุ่มแก้ไข
            row.querySelector('.edit-org-btn').addEventListener('click', function() {
              const orgId = this.getAttribute('data-id');
              editOrganization(orgId);
            });
            
            // เพิ่ม event listener สำหรับปุ่มลบ
            row.querySelector('.delete-org-btn').addEventListener('click', function() {
              const orgId = this.getAttribute('data-id');
              deleteOrganization(orgId);
            });
            
            index++;
          } catch (rowError) {
            console.error(`Error creating row for organization ${doc.id}: ${rowError.message}`, rowError);
          }
        });
      })
      .catch(error => {
        console.error(`Error getting organizations: ${error.message}`, error);
        orgListContainer.innerHTML = `<tr><td colspan="6" class="text-center text-danger">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</td></tr>`;
      });
  } catch (error) {
    console.error(`Error in loadOrganizations: ${error.message}`, error);
    alert('เกิดข้อผิดพลาดในการโหลดข้อมูลหน่วยงาน');
  }
}

// ฟังก์ชันสำหรับบันทึกหน่วยงานใหม่
function saveOrganization() {
  console.log('Saving new organization');
  try {
    const db = firebase.firestore();
    
    // ดึงข้อมูลจากฟอร์ม
    const orgName = document.getElementById('orgName').value.trim();
    const telegramToken = document.getElementById('telegramToken').value.trim();
    const telegramChatId = document.getElementById('telegramChatId').value.trim();
    const locationInput = document.getElementById('location').value.trim();
    
    console.log('Form data:', {
      name: orgName,
      token: telegramToken ? '(provided)' : '(missing)',
      chatId: telegramChatId ? '(provided)' : '(missing)',
      location: locationInput || '(not selected)'
    });
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orgName) {
      console.warn('Organization name is required');
      alert('กรุณาระบุชื่อหน่วยงาน');
      return;
    }
    
    // ตรวจสอบว่ามีการเลือกตำแหน่งหรือไม่
    if (!selectedLatLng && !locationInput) {
      console.warn('Location is required');
      alert('กรุณาเลือกตำแหน่งบนแผนที่');
      return;
    }
    
    // สร้างข้อมูลหน่วยงานใหม่
    const newOrg = {
      name: orgName,
      telegramToken: telegramToken,
      telegramChatId: telegramChatId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // เพิ่มข้อมูลตำแหน่ง (ถ้ามี)
    if (selectedLatLng) {
      newOrg.location = new firebase.firestore.GeoPoint(selectedLatLng.lat, selectedLatLng.lng);
    }
    
    // บันทึกข้อมูลลง Firestore
    db.collection('organizations').add(newOrg)
      .then(docRef => {
        console.log(`Organization added with ID: ${docRef.id}`);
        
        // ปิด Modal และรีเซ็ตฟอร์ม
        const modal = bootstrap.Modal.getInstance(document.getElementById('addOrgModal'));
        modal.hide();
        document.getElementById('addOrgForm').reset();
        
        // โหลดรายการหน่วยงานใหม่
        loadOrganizations();
        
        // รีเซ็ตตำแหน่งที่เลือก
        selectedLatLng = null;
        if (locationMarker) {
          locationMarker.setMap(null);
          locationMarker = null;
        }
        
        alert('เพิ่มหน่วยงานสำเร็จ');
      })
      .catch(error => {
        console.error(`Error adding organization: ${error.message}`, error);
        alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
      });
  } catch (error) {
    console.error(`Error in saveOrganization: ${error.message}`, error);
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
}

// ฟังก์ชันสำหรับแก้ไขหน่วยงาน
function editOrganization(orgId) {
  console.log(`Editing organization: ${orgId}`);
  try {
    const db = firebase.firestore();
    
    // ดึงข้อมูลหน่วยงานจาก Firestore
    db.collection('organizations').doc(orgId).get()
      .then(doc => {
        if (doc.exists) {
          const orgData = doc.data();
          console.log('Organization data retrieved:', orgData);
          
          // กรอกข้อมูลลงในฟอร์มแก้ไข
          document.getElementById('editOrgName').value = orgData.name || '';
          document.getElementById('editTelegramToken').value = orgData.telegramToken || '';
          document.getElementById('editTelegramChatId').value = orgData.telegramChatId || '';
          
          // แสดงข้อมูลตำแหน่ง (ถ้ามี)
          if (orgData.location) {
            document.getElementById('editLocation').value = `${orgData.location.latitude}, ${orgData.location.longitude}`;
          } else {
            document.getElementById('editLocation').value = '';
          }
          
          // รีเซ็ตข้อมูลตำแหน่งใหม่
          document.getElementById('newLocation').value = '';
          
          // เก็บ ID ของหน่วยงานที่กำลังแก้ไขไว้ในปุ่มอัปเดต
          document.getElementById('updateOrgBtn').setAttribute('data-id', orgId);
          
          // แสดง Modal แก้ไข
          const editModal = new bootstrap.Modal(document.getElementById('editOrgModal'));
          editModal.show();
        } else {
          console.error(`Organization not found with ID: ${orgId}`);
          alert('ไม่พบข้อมูลหน่วยงาน');
        }
      })
      .catch(error => {
        console.error(`Error getting organization: ${error.message}`, error);
        alert(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.message}`);
      });
  } catch (error) {
    console.error(`Error in editOrganization: ${error.message}`, error);
    alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
  }
}

// ฟังก์ชันสำหรับอัปเดตหน่วยงาน
function updateOrganization(orgId) {
  console.log(`Updating organization: ${orgId}`);
  try {
    const db = firebase.firestore();
    
    // ดึงข้อมูลจากฟอร์ม
    const orgName = document.getElementById('editOrgName').value.trim();
    const telegramToken = document.getElementById('editTelegramToken').value.trim();
    const telegramChatId = document.getElementById('editTelegramChatId').value.trim();
    const newLocationInput = document.getElementById('newLocation').value.trim();
    
    console.log('Form data for update:', {
      id: orgId,
      name: orgName,
      token: telegramToken ? '(provided)' : '(missing)',
      chatId: telegramChatId ? '(provided)' : '(missing)',
      newLocation: newLocationInput || '(not changed)'
    });
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!orgName) {
      console.warn('Organization name is required');
      alert('กรุณาระบุชื่อหน่วยงาน');
      return;
    }
    
    // สร้างข้อมูลที่จะอัปเดต
    const updateData = {
      name: orgName,
      telegramToken: telegramToken,
      telegramChatId: telegramChatId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // เพิ่มข้อมูลตำแหน่งใหม่ (ถ้ามี)
    if (selectedLatLng) {
      updateData.location = new firebase.firestore.GeoPoint(selectedLatLng.lat, selectedLatLng.lng);
    }
    
    // อัปเดตข้อมูลใน Firestore
    db.collection('organizations').doc(orgId).update(updateData)
      .then(() => {
        console.log(`Organization updated: ${orgId}`);
        
        // ปิด Modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editOrgModal'));
        modal.hide();
        
        // โหลดรายการหน่วยงานใหม่
        loadOrganizations();
        
        // รีเซ็ตตำแหน่งที่เลือก
        selectedLatLng = null;
        if (locationMarker) {
          locationMarker.setMap(null);
          locationMarker = null;
        }
        
        alert('อัปเดตหน่วยงานสำเร็จ');
      })
      .catch(error => {
        console.error(`Error updating organization: ${error.message}`, error);
        alert(`เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ${error.message}`);
      });
  } catch (error) {
    console.error(`Error in updateOrganization: ${error.message}`, error);
    alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
  }
}

// ฟังก์ชันสำหรับลบหน่วยงาน
function deleteOrganization(orgId) {
  console.log(`Deleting organization: ${orgId}`);
  try {
    // ถามยืนยันก่อนลบ
    if (!confirm('คุณต้องการลบหน่วยงานนี้ใช่หรือไม่?')) {
      console.log('Delete operation cancelled by user');
      return;
    }
    
    const db = firebase.firestore();
    
    // ลบข้อมูลจาก Firestore
    db.collection('organizations').doc(orgId).delete()
      .then(() => {
        console.log(`Organization deleted: ${orgId}`);
        
        // โหลดรายการหน่วยงานใหม่
        loadOrganizations();
        
        alert('ลบหน่วยงานสำเร็จ');
      })
      .catch(error => {
        console.error(`Error deleting organization: ${error.message}`, error);
        alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`);
      });
  } catch (error) {
    console.error(`Error in deleteOrganization: ${error.message}`, error);
    alert('เกิดข้อผิดพลาดในการลบข้อมูล');
  }
}

// ตั้งค่า event listener เมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing organization management');
  
  try {
    // โหลดรายการหน่วยงาน
    loadOrganizations();
    
    // ตั้งค่า event listener สำหรับปุ่มบันทึกหน่วยงานใหม่
    document.getElementById('saveOrgBtn').addEventListener('click', function() {
      saveOrganization();
    });
    
    // ตั้งค่า event listener สำหรับปุ่มอัปเดตหน่วยงาน
    document.getElementById('updateOrgBtn').addEventListener('click', function() {
      const orgId = this.getAttribute('data-id');
      updateOrganization(orgId);
    });
    
    console.log('Organization management initialized');
  } catch (error) {
    console.error(`Error initializing organization management: ${error.message}`, error);
    alert('เกิดข้อผิดพลาดในการโหลดหน้าจัดการหน่วยงาน');
  }
});
