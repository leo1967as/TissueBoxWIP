// loading.js
document.addEventListener('DOMContentLoaded', function() {
    // สร้าง overlay สำหรับ loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">กำลังโหลดข้อมูล...</div>
    `;
    document.body.appendChild(loadingOverlay);

    // ซ่อน loading เมื่อหน้าเว็บโหลดเสร็จ
    window.addEventListener('load', function() {
        setTimeout(function() {
            loadingOverlay.style.opacity = '0';
            setTimeout(function() {
                loadingOverlay.style.display = 'none';
            }, 1000);
        }, 1000); // ดีเลย์เล็กน้อยเพื่อให้เห็น animation
    });

    // ฟังก์ชันสำหรับแสดง loading ใหม่เมื่อต้องการ
    window.showLoading = function (text = 'กำลังโหลดข้อมูล...') {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) loadingText.textContent = text;
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
        }
    };

    // ฟังก์ชันสำหรับซ่อน loading
    window.hideLoading = function() {
        loadingOverlay.style.opacity = '0';
        setTimeout(function() {
            loadingOverlay.style.display = 'none';
        }, 500);
    };
});