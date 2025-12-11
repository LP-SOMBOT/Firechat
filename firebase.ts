import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseConfig } from './types';

const CONFIG_KEY = 'firechat_config';

// ============================================================================
// FIREBASE CONFIGURATION
// Instructions: 
// 1. Paste your actual Firebase keys inside the quotes below.
// 2. Do not remove the quotes or commas.
// ============================================================================
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://REPLACE_WITH_YOUR_PROJECT_ID.firebaseio.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

export const getStoredConfig = (): FirebaseConfig | null => {
  // 1. Use Hardcoded Config if user has updated it
  if (firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
      return firebaseConfig as FirebaseConfig;
  }

  // 2. Local Storage (Fallback for UI Config Page)
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
  }
}

export { app, auth, db, storage };