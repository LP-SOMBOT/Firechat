import { ref, set, get, push, child, update, serverTimestamp, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';
import { UserProfile, Message } from '../types';

export const generateUID4 = async (): Promise<string> => {
  // Simple generation logic. In production, check for collision.
  let uid4 = Math.floor(1000 + Math.random() * 9000).toString();
  const snapshot = await get(child(ref(db), `uid4_map/${uid4}`));
  if (snapshot.exists()) {
    return generateUID4(); // Retry
  }
  return uid4;
};

export const createUserProfile = async (uid: string, email: string | null, username: string) => {
  const uid4 = await generateUID4();
  
  const updates: any = {};
  updates[`users/${uid}`] = {
    username,
    email,
    uid4,
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
    isOnline: true,
    createdAt: serverTimestamp(),
  };
  updates[`uid4_map/${uid4}`] = uid;

  await update(ref(db), updates);
};

export const searchUserByUID4 = async (uid4: string): Promise<UserProfile | null> => {
  const mapRef = ref(db, `uid4_map/${uid4}`);
  const snapshot = await get(mapRef);
  if (!snapshot.exists()) return null;
  
  const uid = snapshot.val();
  const userRef = ref(db, `users/${uid}`);
  const userSnap = await get(userRef);
  
  if (!userSnap.exists()) return null;
  return { uid, ...userSnap.val() };
};

export const sendFriendRequest = async (fromUid: string, toUid: string) => {
  const updates: any = {};
  const requestKey = `${fromUid}_${toUid}`;
  updates[`friend_requests/${toUid}/${fromUid}`] = {
    from: fromUid,
    status: 'pending',
    timestamp: serverTimestamp(),
  };
  await update(ref(db), updates);
};

export const acceptFriendRequest = async (currentUserUid: string, senderUid: string) => {
  const updates: any = {};
  
  // Add to friends lists
  updates[`users/${currentUserUid}/friends/${senderUid}`] = true;
  updates[`users/${senderUid}/friends/${currentUserUid}`] = true;
  
  // Remove request
  updates[`friend_requests/${currentUserUid}/${senderUid}`] = null;
  
  await update(ref(db), updates);
};

export const sendMessage = async (chatId: string, message: Partial<Message>) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, {
    ...message,
    id: newMessageRef.key,
    timestamp: serverTimestamp(),
  });

  // Update last message
  await update(ref(db, `chats/${chatId}/lastMessage`), {
    ...message,
    timestamp: serverTimestamp(),
  });
};

export const getChatId = (uid1: string, uid2: string) => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};