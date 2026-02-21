/**
 * Firebase 초기화 (모바일 앱)
 * - 웹과 동일한 프로젝트(mysoulchart) 사용
 * - Analytics는 RN에서 미지원이므로 제외
 */
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCEX8XfS5l7P9MkHerEjFr9THyuqlO8ZL8',
  authDomain: 'mysoulchart.firebaseapp.com',
  projectId: 'mysoulchart',
  storageBucket: 'mysoulchart.firebasestorage.app',
  messagingSenderId: '816848808040',
  appId: '1:816848808040:web:a801b2bd6e3fdcc1e9f3dd',
};

// Firebase 앱 초기화 (중복 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth 초기화
export const auth = getAuth(app);

// Firestore 초기화
export const db = getFirestore(app);

export { app };
