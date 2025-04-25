function formatTimestamp(ts) {
  if (!ts?.toDate) return "-";
  const date = ts.toDate();

  // แปลงวันที่เป็นรูปแบบ "24-04-2568"
  const datePart = date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
  }).replace(/\//g, "-"); // เปลี่ยน "/" เป็น "-"

  // แปลงเวลาเป็นรูปแบบ "16.00"
  const timePart = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit"
  })

  return `${datePart} ${timePart}`; // รวมวันที่และเวลา
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