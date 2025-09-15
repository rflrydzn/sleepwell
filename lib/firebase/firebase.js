// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNgVSPKvPAPdXH8ujdRzUZN8zoP_mFrWM",
  authDomain: "sleepwell-ff2d3.firebaseapp.com",
  projectId: "sleepwell-ff2d3",
  storageBucket: "sleepwell-ff2d3.firebasestorage.app",
  messagingSenderId: "662456256560",
  appId: "1:662456256560:web:b93cca54fe50ff10aa45f5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
