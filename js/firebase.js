// ========================================
// Firebase Configuration
// Cấu hình Firebase cho Vanmilo
// ========================================

// THAY THẾ config bên dưới bằng config từ Firebase Console của bạn
// Firebase Console > Project Settings > Your apps > Web app > Config

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

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
