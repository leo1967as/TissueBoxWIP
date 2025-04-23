let map;
let currentBoxNumber = "";
let markers = [];
let polyline = null;
let pendingLatLng = null;


window.initMap = function () {
  // ตรวจสอบว่าเบราว์เซอร์รองรับ Geolocation หรือไม่
  showLoading('กำลังโหลดแผนที่...');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ใช้ตำแหน่งของผู้ใช้
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // สร้างแผนที่โดยใช้ตำแหน่งของผู้ใช้
        map = new google.maps.Map(document.getElementById("map"), {
          center: userLocation,
          zoom: 12,
        });

        // เพิ่ม Marker ที่ตำแหน่งของผู้ใช้
        new google.maps.Marker({
          position: userLocation,
          map: map,
          title: "ตำแหน่งของคุณ",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(40, 40)
          }
        });

        loadBoxList();
        setupMapClick();

        hideLoading();
      },
      (error) => {
        // กรณีที่ผู้ใช้ปฏิเสธการแชร์ตำแหน่งหรือเกิดข้อผิดพลาด
        console.error("ไม่สามารถดึงตำแหน่งผู้ใช้ได้:", error);

        // ใช้ตำแหน่งเริ่มต้นแทน
        const defaultLocation = { lat: 17.3, lng: 103.75 };
        map = new google.maps.Map(document.getElementById("map"), {
          center: defaultLocation,
          zoom: 12,
          title: "ตำแหน่งของคุณ",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(40, 40)
          }
        });

        loadBoxList();
        setupMapClick();

        hideLoading();
      }
    );
  } else {
    // กรณีที่เบราว์เซอร์ไม่รองรับ Geolocation
    alert("เบราว์เซอร์ของคุณไม่รองรับ Geolocation");
    const defaultLocation = { lat: 17.3, lng: 103.75 };
    map = new google.maps.Map(document.getElementById("map"), {
      center: defaultLocation,
      zoom: 12,
      title: "ตำแหน่งของคุณ",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        scaledSize: new google.maps.Size(40, 40)
      }
    });

    loadBoxList();
    setupMapClick();

    hideLoading();
  }
};

function setupMapClick() {
    map.addListener("click", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
  
      // if (!currentBoxNumber) {
      //   alert("❗ กรุณาเลือกกล่องก่อนคลิกแผนที่");
      //   return;
      // }
  
      pendingLatLng = { lat, lng };
  
      document.getElementById("clicked-coord").textContent =
        `📍 พิกัดที่คลิก: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      document.getElementById("confirmAddBtn").style.display = "inline-block";
    });
  }
