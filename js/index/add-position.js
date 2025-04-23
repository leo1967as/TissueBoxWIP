// ===== Confirm Add Position =====
async function confirmAddLocation() {
    if (!currentBoxNumber || !pendingLatLng) {
      alert("❗ กรุณาเลือกกล่อง และคลิกแผนที่ก่อน");
      return;
    }
  
    try {
      const locRef = db.collection("box_positions")
        .doc(currentBoxNumber)
        .collection("locations");
  
      const snapshot = await locRef.orderBy("createdAt").get();
      const count = snapshot.size;
      const newId = `${currentBoxNumber}_${String(count + 1).padStart(3, "0")}`;
  
      const docExists = await locRef.doc(newId).get();
      if (docExists.exists) {
        alert(`❗ ชื่อพิกัด ${newId} มีอยู่แล้ว`);
        return;
      }
  
      await locRef.doc(newId).set({
        lat: pendingLatLng.lat,
        lng: pendingLatLng.lng,
        createdAt: new Date(),
      });
  
      alert(`✅ เพิ่มตำแหน่ง ${newId} สำเร็จ`);
      pendingLatLng = null;
      document.getElementById("confirmAddBtn").style.display = "none";
      document.getElementById("clicked-coord").textContent = "";
      loadBoxPath();
    } catch (err) {
      console.error("❌ เพิ่มตำแหน่งล้มเหลว:", err);
    }
  } 