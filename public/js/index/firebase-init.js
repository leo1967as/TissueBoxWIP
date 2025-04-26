// ===== Firebase Init =====
const firebaseConfig = {
    apiKey: "AIzaSyDj4aYtdPAI3-uWGKUUcScYaTn66vhuTHt4",
    authDomain: "tissueboxdb.firebaseapp.com",
    projectId: "tissueboxdb",
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  