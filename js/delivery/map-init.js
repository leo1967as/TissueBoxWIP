let map;
let selectedLatLng = null; // เก็บตำแหน่งที่คลิก
let locationMarker = null; // เก็บ Marker ตำแหน่งที่เลือก
let userMarker = null; // เก็บ Marker ตำแหน่งผู้ใช้

window.initMap = function() {
  // ตรวจสอบว่าเบราว์เซอร์รองรับ Geolocation หรือไม่
  showLoading('กำลังโหลดแผนที่...');

  // ตั้งค่าขั้นต่ำของแผนที่
  const defaultLocation = { lat: 17.3, lng: 103.75 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
    streetViewControl: false,
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'hybrid']
    }
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // ใช้ตำแหน่งของผู้ใช้
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // อัปเดตศูนย์กลางแผนที่
        map.setCenter(userLocation);

        // เพิ่ม/อัปเดต Marker ตำแหน่งผู้ใช้
        if (userMarker) {
          userMarker.setPosition(userLocation);
        } else {
          userMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            title: "ตำแหน่งของคุณ",
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
              scaledSize: new google.maps.Size(40, 40)
            }
          });
        }

        setupMapClick();
        hideLoading();
      },
      (error) => {
        console.error("ไม่สามารถดึงตำแหน่งผู้ใช้ได้:", error);
        setupMapClick();
        hideLoading();
      },
      { timeout: 10000 } // ตั้งค่า timeout 10 วินาที
    );
  } else {
    console.log("เบราว์เซอร์ไม่รองรับ Geolocation");
    setupMapClick();
    hideLoading();
  }
};

// ฟังก์ชันตั้งค่าการคลิกแผนที่
function setupMapClick() {
  // ลบ event listener เก่าถ้ามี
  google.maps.event.clearListeners(map, 'click');
  
  map.addListener("click", (event) => {
    selectedLatLng = event.latLng;
    
    // อัปเดตตำแหน่งในฟอร์ม
    updateLocationForm(selectedLatLng);
    
    // อัปเดต Marker บนแผนที่
    updateLocationMarker(selectedLatLng);
    
    // เปิด Modal
    if (!document.getElementById('addOrgModal').classList.contains('show')) {
      $('#addOrgModal').modal('show');
    }
  });
}

// อัปเดต Marker ตำแหน่งที่เลือก
function updateLocationMarker(latLng) {
  if (locationMarker) {
    locationMarker.setPosition(latLng);
  } else {
    locationMarker = new google.maps.Marker({
      position: latLng,
      map: map,
      title: "ตำแหน่งที่เลือก",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        scaledSize: new google.maps.Size(40, 40)
      },
      animation: google.maps.Animation.DROP
    });
  }
  
  // ย้ายแผนที่ไปที่ตำแหน่งที่เลือก
  map.panTo(latLng);
}

// อัปเดตฟอร์มด้วยตำแหน่งที่เลือก
function updateLocationForm(latLng) {
  const lat = latLng.lat().toFixed(6);
  const lng = latLng.lng().toFixed(6);
  
  // อัปเดต input ในฟอร์ม
  document.getElementById("location").value = `${lat}, ${lng}`;
  
  // อัปเดตการแสดงผล (ถ้ามี)
  const locationDisplay = document.getElementById("selectedLocation");
  if (locationDisplay) {
    locationDisplay.textContent = `ละติจูด: ${lat}, ลองจิจูด: ${lng}`;
  }
}

// รีเซ็ตการเลือกตำแหน่ง
function resetLocationSelection() {
  if (locationMarker) {
    locationMarker.setMap(null);
    locationMarker = null;
  }
  selectedLatLng = null;
  
  // รีเซ็ตในฟอร์ม
  if (document.getElementById("location")) {
    document.getElementById("location").value = "";
  }
  const locationDisplay = document.getElementById("selectedLocation");
  if (locationDisplay) {
    locationDisplay.textContent = "คลิกบนแผนที่เพื่อเลือกตำแหน่ง";
  }
}