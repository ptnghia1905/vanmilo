// ========================================
// Firebase Configuration
// Cấu hình Firebase cho Vanmilo
// ========================================

// THAY THẾ config bên dưới bằng config từ Firebase Console của bạn
// Firebase Console > Project Settings > Your apps > Web app > Config

const firebaseConfig = {
    apiKey: "AIzaSyABcECzCy-SFKJ6r8rHQ7VaH2bFwpzgRWk",
    authDomain: "vanmilo.firebaseapp.com",
    projectId: "vanmilo",
    storageBucket: "vanmilo.firebasestorage.app",
    messagingSenderId: "177002728208",
    appId: "1:177002728208:web:d5d3a4a0fdf737c857b395",
    measurementId: "G-BHN4EYFDD0"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore & Auth
const db = firebase.firestore();
const auth = firebase.auth();

// ========================================
// Firestore Collection: products
// Cấu trúc document:
// {
//   id: string,
//   name: string,
//   price: number,
//   quantity: number,
//   category: string
// }
// ========================================

// Export để sử dụng trong app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { db, firebase };
}
