let map;
let selectedLatLng = null;
let locationMarker = null;
let userMarker = null;

window.initMap = function() {
  showLoading('กำลังโหลดแผนที่...');

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
        const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        map.setCenter(userLocation);
        if (userMarker) {
          userMarker.setPosition(userLocation);
        } else {
          userMarker = new google.maps.Marker({
            position: userLocation,
            map: map,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
              scaledSize: new google.maps.Size(40, 40)
            },
            animation: google.maps.Animation.DROP
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
      { timeout: 10000 }
    );
  } else {
    console.log("เบราว์เซอร์ไม่รองรับ Geolocation");
    setupMapClick();
    hideLoading();
  }
};

function setupMapClick() {
  google.maps.event.clearListeners(map, 'click');
  map.addListener("click", (event) => {
    selectedLatLng = event.latLng;
    updateLocationForm(selectedLatLng);
    updateLocationMarker(selectedLatLng);
    if (!document.getElementById('addOrgModal').classList.contains('show')) {
      $('#addOrgModal').modal('show');
    }
  });
}

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
  map.panTo(latLng);
}

function updateLocationForm(latLng) {
  const lat = latLng.lat().toFixed(6);
  const lng = latLng.lng().toFixed(6);
  document.getElementById("location").value = `${lat}, ${lng}`;
  const locationDisplay = document.getElementById("selectedLocation");
  if (locationDisplay) {
    locationDisplay.textContent = `ละติจูด: ${lat}, ลองจิจูด: ${lng}`;
  }
}

function resetLocationSelection() {
  if (locationMarker) {
    locationMarker.setMap(null);
    locationMarker = null;
  }
  selectedLatLng = null;
  
  if (document.getElementById("location")) {
    document.getElementById("location").value = "";
  }
  const locationDisplay = document.getElementById("selectedLocation");
  if (locationDisplay) {
    locationDisplay.textContent = "คลิกบนแผนที่เพื่อเลือกตำแหน่ง";
  }
}
