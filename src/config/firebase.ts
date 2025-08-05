import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDuZNOmX8-0j2dry6f9Bf3fR5Qmyj_CsCA",
  authDomain: "draworld-6898f.firebaseapp.com",
  projectId: "draworld-6898f",
  storageBucket: "draworld-6898f.firebasestorage.app",
  messagingSenderId: "814051215268",
  appId: "1:814051215268:web:f251c9b76e9452ed1d6331"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服务
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Google 登录提供商
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;