// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARCoVa4KGI8p2Qcy2eUwlQW2CBJYtH3dM",
  authDomain: "library-room-booking.firebaseapp.com",
  projectId: "library-room-booking",
  storageBucket: "library-room-booking.firebasestorage.app",
  messagingSenderId: "424683897083",
  appId: "1:424683897083:web:4069600d5beacff711305e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('✅ Firebase initialized successfully');