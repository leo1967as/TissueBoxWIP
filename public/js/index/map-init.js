let map;
let currentBoxNumber = "";
let markers = [];
let polyline = null;
let pendingLatLng = null;


// ฟังก์ชันแสดง Loading
window.initMap = function () {
  showLoading('กำลังโหลดแผนที่...');

  // ตรวจสอบว่าเคยเก็บตำแหน่งแผนที่หรือไม่
  const savedLocation = localStorage.getItem('mapCenter');
  
  if (savedLocation) {
    // ใช้ตำแหน่งที่เก็บไว้
    const userLocation = JSON.parse(savedLocation);
    initMapWithLocation(userLocation);
  } else {
    // ถ้าไม่มีข้อมูลตำแหน่งเก็บไว้ ให้ใช้ตำแหน่งปัจจุบันของผู้ใช้
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          initMapWithLocation(userLocation);
        },
        (error) => {
          console.error("ไม่สามารถดึงตำแหน่งผู้ใช้ได้:", error);
          const defaultLocation = { lat: 17.3, lng: 103.75 };
          initMapWithLocation(defaultLocation);
        }
      );
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับ Geolocation");
      const defaultLocation = { lat: 17.3, lng: 103.75 };
      initMapWithLocation(defaultLocation);
    }
  }
};

function initMapWithLocation(location) {
  // สร้างแผนที่ที่ตำแหน่งที่ให้
  map = new google.maps.Map(document.getElementById("map"), {
    center: location,
    zoom: 12,
  });

  // เพิ่ม Marker
  new google.maps.Marker({
    position: location,
    map: map,
    title: "ตำแหน่งของคุณ",
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      scaledSize: new google.maps.Size(40, 40),
    },
      animation: google.maps.Animation.DROP
  });

  loadBoxList();
  setupMapClick();

  hideLoading();

  // เก็บตำแหน่งแผนที่ลงใน localStorage
  localStorage.setItem('mapCenter', JSON.stringify(location));
}

function setupMapClick() {
  map.addListener("click", (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    pendingLatLng = { lat, lng };
    document.getElementById("clicked-coord").textContent =
      `📍 พิกัดที่คลิก: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    document.getElementById("confirmAddBtn").style.display = "inline-block";
  });
}
