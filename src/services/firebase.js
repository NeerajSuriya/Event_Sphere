import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD29LCgYr18SoZMoItfcw7vBo_hegYpsgs",
  authDomain: "eventsphere-18aee.firebaseapp.com",
  projectId: "eventsphere-18aee",
  storageBucket: "eventsphere-18aee.firebasestorage.app",
  messagingSenderId: "712919192672",
  appId: "1:712919192672:web:23306bc16bfa4739e69f05"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
