function showToast(header, message, type = 'info', position = 'center') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed';
        toastContainer.style.zIndex = '1055';

        if (position === 'center') {
            toastContainer.style.top = '50%';
            toastContainer.style.left = '50%';
            toastContainer.style.transform = 'translate(-50%, -50%)';
            if (window.innerWidth < 576) {
                toastContainer.style.top = '50%';
                toastContainer.style.left = '48%';
                toastContainer.style.transform = 'translate(-50%, -50%)';
            }
        } else if (position === 'top-right') {
            toastContainer.style.top = '1rem';
            toastContainer.style.right = '1rem';

            if (window.innerWidth < 576) {
                toastContainer.style.top = '0.5rem';
                toastContainer.style.right = '0.5rem';
            }
        }

        document.body.appendChild(toastContainer);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast text-white border-0`;
    toastEl.style.backgroundColor = getToastBackgroundColor(type);
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    // ปรับขนาด Toast ตามขนาดหน้าจอ
    if (window.innerWidth < 576) { // สำหรับหน้าจอเล็ก (เช่น มือถือ)
        toastEl.style.width = '400px'; // ขนาดเล็ก
        toastEl.style.fontSize = '1.3rem'; // ฟอนต์เล็ก
    } else if (window.innerWidth < 768) { // สำหรับแท็บเล็ต
        toastEl.style.width = '600px'; // ขนาดกลาง
        toastEl.style.fontSize = '1.6rem'; // ฟอนต์กลาง
    } else { // สำหรับหน้าจอใหญ่
        toastEl.style.width = '800px'; // ขนาดใหญ่
        toastEl.style.fontSize = '1.6rem'; // ฟอนต์ใหญ่
    }

    toastEl.innerHTML = `
    <div class="toast-header border-0">
      <span class="toast-icon me-2">${getToastIcon(type)}</span>
      <strong class="me-auto">${header}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

    toastContainer.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });

    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

function getToastBackgroundColor(type) {
    switch (type) {
        case 'success':
            return '#28a745';
        case 'warning':
            return '#ffc107';
        case 'error':
            return '#dc3545';
        default:
            return '#007bff';
    }
}


function getToastIcon(type) {
    switch (type) {
        case 'success':
            return '✅'; // ไอคอนสำหรับ Success
        case 'warning':
            return '⚠️'; // ไอคอนสำหรับ Warning
        case 'error':
            return '❌'; // ไอคอนสำหรับ Error
        default:
            return 'ℹ️'; // ไอคอนสำหรับ Info
    }
}