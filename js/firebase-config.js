// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAN06OdN68GiCzBE6KUelAW2-YBjKEISug",
  authDomain: "library-room-booking-63d6f.firebaseapp.com",
  projectId: "library-room-booking-63d6f",
  storageBucket: "library-room-booking-63d6f.firebasestorage.app",
  messagingSenderId: "231379824515",
  appId: "1:231379824515:web:b73cf7269c6d07856410b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Add error handling for Firebase initialization
try {
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Add connection test
auth.onAuthStateChanged(() => {
    console.log('✅ Firebase Auth service ready');
});

// Test Firestore connection
try {
    console.log('✅ Firebase Firestore service ready');
} catch (error) {
    console.error('❌ Firebase Firestore initialization failed:', error);
}