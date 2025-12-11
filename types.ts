export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  uid4: string; // Unique 4 digit ID
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: number;
}

export interface FriendRequest {
  from: string; // uid
  to: string; // uid
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageURL?: string;
  audioURL?: string;
  type: 'text' | 'image' | 'audio';
  timestamp: number;
  seen: boolean;
}

export interface ChatSession {
  id: string;
  participants: string[]; // [uid1, uid2]
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: number;
    seen: boolean;
    type: 'text' | 'image' | 'audio';
  };
  unreadCount?: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}