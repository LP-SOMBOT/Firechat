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
const placeholderConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://REPLACE_WITH_YOUR_PROJECT_ID.firebaseio.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
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