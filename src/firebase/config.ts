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

// Connect to Firebase emulators in development environment
// But only if explicitly enabled through an environment variable
const USE_EMULATORS = false; // Set to false to use production Firebase

if (process.env.NODE_ENV === 'development' && USE_EMULATORS) {
  try {
    console.log('Attempting to connect to Firebase emulators...');
    
    // Connect to Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Functions emulator');
    
    // Connect to Firestore emulator
    import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore emulator');
    }).catch(err => {
      console.error('Failed to connect to Firestore emulator:', err);
    });
    
    // Connect to Auth emulator
    import('firebase/auth').then(({ connectAuthEmulator }) => {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('Connected to Auth emulator');
    }).catch(err => {
      console.error('Failed to connect to Auth emulator:', err);
    });
  } catch (e) {
    console.error('Could not connect to Firebase emulators:', e);
  }
} else {
  console.log('Using production Firebase services');
}

export const googleProvider = new GoogleAuthProvider();

export default app;