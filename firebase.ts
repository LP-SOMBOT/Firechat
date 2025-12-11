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
  apiKey: "AIzaSyDKFpwQU9W4Njvtmtz6N_Jc2kZjdY_CIEc",
  authDomain: "connectsphare-a27d6.firebaseapp.com",
  databaseURL: "https://connectsphare-a27d6-default-rtdb.firebaseio.com",
  projectId: "connectsphare-a27d6",
  storageBucket: "connectsphare-a27d6.firebasestorage.app",
  messagingSenderId: "277886142393",
  appId: "1:277886142393:web:44fedcbec4e9cc5363d868"
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
    // If init fails and we have a stored config, it might be corrupt. Clear it.
    if (localStorage.getItem(CONFIG_KEY)) {
        console.warn("Invalid config detected. Clearing localStorage.");
        localStorage.removeItem(CONFIG_KEY);
        // We can't immediately reload or we might loop if the error persists, 
        // but clearing it ensures the next manual refresh works.
    }
  }
}

export { app, auth, db, storage };
