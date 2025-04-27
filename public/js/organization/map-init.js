// Global variables - avoid redeclaring if already defined
window.map = window.map || null;
window.locationMarker = window.locationMarker || null;
window.userMarker = window.userMarker || null;
window.selectedLatLng = window.selectedLatLng || null;
window.tempMarker = window.tempMarker || null;
window.allMarkers = window.allMarkers || [];
window.mapInitialized = false;

/**
 * Initialize Google Map
 * This function is called by the Google Maps API when it's loaded
 */
window.initMap = function() {
  console.log("Initializing map...");
  
  // Show loading indicator
  if (typeof showLoading === 'function') {
    showLoading('กำลังโหลดแผนที่...');
  }

  // Check if map element exists
  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.error("Map element not found");
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
    return;
  }

  try {
    // Initialize the map with default location (Thailand)
    const defaultLocation = { lat: 17.3, lng: 103.75 };
    window.map = new google.maps.Map(mapElement, {
      center: defaultLocation,
      zoom: 12,
      streetViewControl: false,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'hybrid']
      }
    });
    
    window.mapInitialized = true;
    console.log("Map initialized successfully");

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          window.map.setCenter(userLocation);
          
          // Add user marker
          window.userMarker = new google.maps.Marker({
            position: userLocation,
            map: window.map,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
              scaledSize: new google.maps.Size(40, 40)
            }
          });
          
          if (typeof hideLoading === 'function') {
            hideLoading();
          }
          
          // Add click event listener to map after it's fully initialized
          if (typeof window.handleMapClick === 'function') {
            window.map.addListener("click", window.handleMapClick);
            console.log("Map click handler attached");
          }
          
          // Fetch organizations after map is ready
          if (typeof window.fetchOrganizations === 'function') {
            window.fetchOrganizations();
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          if (typeof hideLoading === 'function') {
            hideLoading();
          }
          
          // Add click event listener to map even if geolocation fails
          if (typeof window.handleMapClick === 'function') {
            window.map.addListener("click", window.handleMapClick);
            console.log("Map click handler attached");
          }
          
          // Fetch organizations after map is ready
          if (typeof window.fetchOrganizations === 'function') {
            window.fetchOrganizations();
          }
        },
        { timeout: 10000 }
      );
    } else {
      console.log("Geolocation not supported");
      if (typeof hideLoading === 'function') {
        hideLoading();
      }
      
      // Add click event listener to map even if geolocation is not supported
      if (typeof window.handleMapClick === 'function') {
        window.map.addListener("click", window.handleMapClick);
        console.log("Map click handler attached");
      }
      
      // Fetch organizations after map is ready
      if (typeof window.fetchOrganizations === 'function') {
        window.fetchOrganizations();
      }
    }
  } catch (error) {
    console.error("Error initializing map:", error);
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
  }
};

/**
 * Check if map is initialized
 * @returns {boolean} True if map is initialized, false otherwise
 */
function isMapInitialized() {
  return window.map !== null && window.mapInitialized === true;
}

/**
 * Update location marker on the map
 * @param {google.maps.LatLng} latLng - The coordinates to place the marker
 */
function updateLocationMarker(latLng) {
  if (!isMapInitialized()) {
    console.error("Map is not initialized");
    return;
  }

  try {
    if (window.locationMarker) {
      window.locationMarker.setPosition(latLng);
    } else {
      window.locationMarker = new google.maps.Marker({
        position: latLng,
        map: window.map,
        title: "ตำแหน่งที่เลือก",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new google.maps.Size(40, 40)
        },
        animation: google.maps.Animation.DROP
      });
    }
    
    // Pan map to the selected location
    window.map.panTo(latLng);
    
    // Store selected coordinates
    window.selectedLatLng = latLng;
  } catch (error) {
    console.error("Error updating location marker:", error);
  }
}

/**
 * Update form with selected location
 * @param {google.maps.LatLng} latLng - The coordinates to display in the form
 */
function updateLocationForm(latLng) {
  try {
    const lat = latLng.lat().toFixed(6);
    const lng = latLng.lng().toFixed(6);
    
    // Update input in form
    const locationInput = document.getElementById("location");
    if (locationInput) {
      locationInput.value = `Lat: ${lat}, Lng: ${lng}`;
    }
    
    // Update display text if it exists
    const locationDisplay = document.getElementById("selectedLocation");
    if (locationDisplay) {
      locationDisplay.textContent = `ละติจูด: ${lat}, ลองจิจูด: ${lng}`;
    }
  } catch (error) {
    console.error("Error updating location form:", error);
  }
}

/**
 * Reset location selection
 */
function resetLocationSelection() {
  try {
    if (window.locationMarker) {
      window.locationMarker.setMap(null);
      window.locationMarker = null;
    }
    
    if (window.tempMarker) {
      window.tempMarker.setMap(null);
      window.tempMarker = null;
    }
    
    window.selectedLatLng = null;
    
    // Reset form input
    const locationInput = document.getElementById("location");
    if (locationInput) {
      locationInput.value = "";
    }
    
    // Reset display text
    const locationDisplay = document.getElementById("selectedLocation");
    if (locationDisplay) {
      locationDisplay.textContent = "คลิกบนแผนที่เพื่อเลือกตำแหน่ง";
    }
  } catch (error) {
    console.error("Error resetting location selection:", error);
  }
}

/**
 * Clear all markers from the map
 */
function clearAllMarkers() {
  if (Array.isArray(window.allMarkers)) {
    for (let i = 0; i < window.allMarkers.length; i++) {
      if (window.allMarkers[i]) {
        window.allMarkers[i].setMap(null);
      }
    }
    window.allMarkers = [];
  }
}

/**
 * Go to specific location on the map
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
function goToLocation(lat, lng) {
  if (isMapInitialized()) {
    const location = new google.maps.LatLng(lat, lng);
    window.map.setCenter(location);
    window.map.setZoom(15);
  } else {
    console.error("Map is not initialized");
  }
}

// Make functions globally accessible
window.isMapInitialized = isMapInitialized;
window.updateLocationMarker = updateLocationMarker;
window.updateLocationForm = updateLocationForm;
window.resetLocationSelection = resetLocationSelection;
window.clearAllMarkers = clearAllMarkers;
window.goToLocation = goToLocation;
