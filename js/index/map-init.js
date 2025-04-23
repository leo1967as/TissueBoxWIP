let map;
window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 17.3, lng: 103.75 },
    zoom: 12,
  });
  loadBoxList();
  setupMapClick();
};

function setupMapClick() {
    map.addListener("click", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
  
      if (!currentBoxNumber) {
        alert("❗ กรุณาเลือกกล่องก่อนคลิกแผนที่");
        return;
      }
  
      pendingLatLng = { lat, lng };
  
      document.getElementById("clicked-coord").textContent =
        `📍 พิกัดที่คลิก: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      document.getElementById("confirmAddBtn").style.display = "inline-block";
    });
  }
  