function createMarkerWithColor(position, label, color, title, map) {
    return new google.maps.Marker({
      position,
      map,
      label,
      title,
      icon: {
        url: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
      },
      animation: google.maps.Animation.DROP
    });
  }
  