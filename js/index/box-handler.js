  // ===== Load All Box Names to datalist =====
  async function loadBoxList() {
    const snapshot = await db.collection("box_positions").get();
    const dataList = document.getElementById("boxList");
    dataList.innerHTML = "";
    snapshot.forEach(doc => {
      const option = document.createElement("option");
      option.value = doc.id;
      dataList.appendChild(option);
    });
  }
  

// ===== Load Path =====
async function loadBoxPath() {
    const boxInput = document.getElementById("boxNumberInput");
    const boxNumber = boxInput.value.trim();
    currentBoxNumber = boxNumber;
  
    if (!boxNumber) {
      alert("❗ กรุณากรอกหรือเลือกชื่อกล่อง");
      return;
    }
  
    try {
      const snapshot = await db.collection("box_positions")
        .doc(boxNumber)
        .collection("locations")
        .orderBy("createdAt")
        .get();
  
      if (snapshot.empty) {
        alert("❌ ไม่พบตำแหน่งของกล่องนี้");
        clearMarkers();
        return;
      }
  
      clearMarkers();
      let index = 0;
      const docs = snapshot.docs;
      docs.forEach((doc, i) => {
        const data = doc.data();
        const position = { lat: data.lat, lng: data.lng };
  
        let color = "red";
        if (i === 0) color = "green";
        else if (i === docs.length - 1) color = "yellow";
  
        const tooltipText = `กล่อง: ${boxNumber}\nลำดับ: ${index + 1}\n${data.lat}, ${data.lng}\nเวลา: ${formatTimestamp(data.createdAt)}`;
  
        const marker = new google.maps.Marker({
          position,
          map,
          label: `${index + 1}`,
          title: tooltipText, // ✅ Tooltip แสดงเมื่อ hover
          icon: {
            url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
          },
          animation: google.maps.Animation.DROP
        });
  
        const info = new google.maps.InfoWindow({
          content: `<b>กล่อง:</b> ${boxNumber}<br>
  ลำดับ: ${index + 1}<br>
  ${data.lat}, ${data.lng}<br>
  🕒 เวลา: ${formatTimestamp(data.createdAt)}`
        });
  
        marker.addListener("click", () => info.open(map, marker));
  
        markers.push(marker);
        index++;
      });
  
      if (markers.length >= 2) {
        const pathCoordinates = markers.map(m => m.getPosition());
        polyline = new google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: "#2563eb",
          strokeOpacity: 0.8,
          strokeWeight: 3,
        });
        polyline.setMap(map);
      }
  
      const first = docs[0].data();
      map.setCenter({ lat: first.lat, lng: first.lng });
      map.setZoom(14);
    } catch (err) {
      console.error("❌ โหลดตำแหน่งกล่องล้มเหลว:", err);
    }
  }
  
  // ===== Clear Markers & Polyline =====
  function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    if (polyline) {
      polyline.setMap(null);
      polyline = null;
    }
  }