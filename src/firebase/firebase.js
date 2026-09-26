import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJcd1iOqbvk_CSzH5v9LgBcw6pUurf-wY",
  authDomain: "mart-71353.firebaseapp.com",
  projectId: "mart-71353",
  storageBucket: "mart-71353.firebasestorage.app",
  messagingSenderId: "101922639593",
  appId: "1:101922639593:web:c46eb8742dd636dacaea78",
  measurementId: "G-RV5GPNE8YH",
};

// Primary app — used for the logged-in admin session
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app instance — used ONLY to create child accounts
// without logging the admin out. Firebase Auth SDK auto-signs-in
// whoever you call createUserWithEmailAndPassword on, so we isolate
// that call to a throwaway app instance.
export function getSecondaryAuth() {
  const existing = getApps().find((a) => a.name === "Secondary");
  const secondaryApp =
    existing || initializeApp(firebaseConfig, "Secondary");
  return getAuth(secondaryApp);
}