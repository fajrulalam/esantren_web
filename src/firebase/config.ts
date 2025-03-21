// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyU6tlP6wQawmZd4jOwXmbX6VDQNSpC0E",
  authDomain: "e-santren.firebaseapp.com",
  projectId: "e-santren",
  storageBucket: "e-santren.appspot.com",
  messagingSenderId: "385003370337",
  appId: "1:385003370337:web:0dd74d0aee02434ed47720",
  measurementId: "G-5RVGD6Z9H1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Temporarily disable functions emulator connection to use production functions
// If we're in local development, connect to Functions emulator
// if (process.env.NODE_ENV === 'development') {
//   try {
//     connectFunctionsEmulator(functions, 'localhost', 5001);
//   } catch (e) {
//     console.log('Could not connect to functions emulator, using production functions');
//   }
// }

export const googleProvider = new GoogleAuthProvider();

export default app;