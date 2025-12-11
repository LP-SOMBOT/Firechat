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
    if (!auth) return;

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

        return () => {
          unsubProfile();
          set(presenceRef, false);
          set(lastSeenRef, serverTimestamp());
        };
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};