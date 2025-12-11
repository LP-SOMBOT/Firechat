import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, onValue, serverTimestamp, onDisconnect, set } from 'firebase/database';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth failed to initialize (e.g. bad config in firebase.ts), stop loading so app doesn't hang.
    if (!auth) {
        console.error("Auth not initialized.");
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch User Profile
        const userRef = ref(db, `users/${user.uid}`);
        const unsubProfile = onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUserProfile({ uid: user.uid, ...data });
          }
        });

        // Presence Logic
        const presenceRef = ref(db, `users/${user.uid}/isOnline`);
        const lastSeenRef = ref(db, `users/${user.uid}/lastSeen`);
        const connectedRef = ref(db, '.info/connected');

        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            onDisconnect(presenceRef).set(false);
            onDisconnect(lastSeenRef).set(serverTimestamp());
            set(presenceRef, true);
          }
        });

        // Cleanup presence on unmount/logout is tricky inside onAuthStateChanged, 
        // but we assume standard session lifecycle.
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Auth error", error);
        setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
      return (
          <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
          </div>
      );
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};