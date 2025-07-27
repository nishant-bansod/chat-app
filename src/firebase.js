import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQOsLeLXd4EWa0x_4wcSoVT6tgHOjAsFw",
  authDomain: "chat-room-a4175.firebaseapp.com",
  projectId: "chat-room-a4175",
  storageBucket: "chat-room-a4175.firebasestorage.app",
  messagingSenderId: "264416438017",
  appId: "1:264416438017:web:a21aa9bb0259d216089d00"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app); 