/// <reference types="vite/client" />
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseConfig } from './types';

const CONFIG_KEY = 'firechat_config';

// 1. Try Environment Variables (Best for Netlify)
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 2. Hardcoded Placeholders (Manually replace these if not using Env Vars)
const firebaseConfig = {
  apiKey: "AIzaSyDKFpwQU9W4Njvtmtz6N_Jc2kZjdY_CIEc",
  authDomain: "connectsphare-a27d6.firebaseapp.com",
  databaseURL: "https://connectsphare-a27d6-default-rtdb.firebaseio.com",
  projectId: "connectsphare-a27d6",
  storageBucket: "connectsphare-a27d6.firebasestorage.app",
  messagingSenderId: "277886142393",
  appId: "1:277886142393:web:44fedcbec4e9cc5363d868"
};

export const getStoredConfig = (): FirebaseConfig | null => {
  // Priority: 
  // 1. Environment Variables (if fully defined)
  if (envConfig.apiKey && envConfig.databaseURL) {
    return envConfig as FirebaseConfig;
  }

  // 2. Hardcoded Placeholders (if user edited the file)
  if (placeholderConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
      return placeholderConfig as FirebaseConfig;
  }

  // 3. Local Storage (Fallback for UI Config Page)
  const stored = localStorage.getItem(CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveConfig = (config: FirebaseConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  window.location.reload();
};

export const isFirebaseConfigured = () => !!getStoredConfig();

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let storage: FirebaseStorage;

const config = getStoredConfig();

if (config) {
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getDatabase(app);
    storage = getStorage(app);
  } catch (e) {
    console.error("Firebase init error", e);
    // Don't clear local storage immediately in case it's a transient network error,
    // but in a real app you might handle invalid config more gracefully.
  }
}

export { app, auth, db, storage };
