function formatTimestamp(ts) {
    if (!ts?.toDate) return "-";
    return ts.toDate().toLocaleString("th-TH", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }
  
  
  function highlightInput(inputId, duration = 3100) {
    const inputField = document.getElementById(inputId);
    if (inputField) {
        inputField.classList.add('highlight'); // เพิ่มคลาส highlight
        setTimeout(() => {
            inputField.classList.remove('highlight'); // ลบคลาสหลังจากเวลาที่กำหนด
        }, duration);
    }
}