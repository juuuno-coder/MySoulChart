// Firebase 초기화 및 설정
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCEX8XfS5l7P9MkHerEjFr9THyuqlO8ZL8",
  authDomain: "mysoulchart.firebaseapp.com",
  projectId: "mysoulchart",
  storageBucket: "mysoulchart.firebasestorage.app",
  messagingSenderId: "816848808040",
  appId: "1:816848808040:web:a801b2bd6e3fdcc1e9f3dd",
  measurementId: "G-GG112WL61L"
};

// Firebase 앱 초기화
export const app = initializeApp(firebaseConfig);

// Analytics 초기화 (브라우저 환경에서만)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Firestore 초기화
export const db = getFirestore(app);

// Auth 초기화
export const auth = getAuth(app);
