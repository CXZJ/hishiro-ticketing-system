import { initializeApp } from "firebase/app";

import {
  getFirestore,
  query,
  getDocs,
  collection,
  where,
  addDoc,
} from "firebase/firestore";

import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAe6z8yTDficX3M0JVFBGzkv1cO9UCna24",
  authDomain: "testing-59e97.firebaseapp.com",
  projectId: "testing-59e97",
  storageBucket: "testing-59e97.firebasestorage.app",
  messagingSenderId: "616171546108",
  appId: "1:616171546108:web:63d38fd761673ed5813e79",
  measurementId: "G-HLDVM557R5"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const provider = new GoogleAuthProvider()
// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

// Register with email and password
export const registerWithEmailAndPassword = async (
  email,
  password
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user, {
      url: 'http://localhost:5173/verify-email'
    });
    return result.user;
  } catch (error) {
    throw error;
  }
};

// Login with email and password
export const logInWithEmailAndPassword = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await result.user.reload();
    if (!result.user.emailVerified) {
      await signOut(auth); // SignS out if email not verified
      throw new Error("Please verify your email before logging in.");
    }
    return result.user;
  } catch (error) {
    throw error;
  }
};

// Send password reset email
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Logout
export const logout = () => {
  signOut(auth)
}

export { auth, db };

