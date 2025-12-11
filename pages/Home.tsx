import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getChatId } from '../services/db';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { Circle } from 'lucide-react';

export default function Home() {
  const { userProfile } = useAuth();
  const [friends, setFriends] = useState<(UserProfile & { lastMsg?: any })[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile) return;

    const friendsRef = ref(db, `users/${userProfile.uid}/friends`);
    const unsub = onValue(friendsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setFriends([]);
        return;
      }

      const friendIds = Object.keys(data);
      const friendDataPromises = friendIds.map(async (fid) => {
        // Fetch friend details
        const friendSnap = await new Promise<any>((resolve) => {
          onValue(ref(db, `users/${fid}`), (snap) => resolve(snap.val()), { onlyOnce: true });
        });
        
        // Fetch Last Message
        const chatId = getChatId(userProfile.uid, fid);
        const lastMsgSnap = await new Promise<any>((resolve) => {
          onValue(ref(db, `chats/${chatId}/lastMessage`), (snap) => resolve(snap.val()), { onlyOnce: true });
        });

        return {
          uid: fid,
          ...friendSnap,
          lastMsg: lastMsgSnap
        };
      });

      const resolvedFriends = await Promise.all(friendDataPromises);
      // Sort by last message timestamp
      resolvedFriends.sort((a, b) => (b.lastMsg?.timestamp || 0) - (a.lastMsg?.timestamp || 0));
      setFriends(resolvedFriends);
    });

    return () => unsub();
  }, [userProfile]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <header className="p-4 border-b border-gray-100 dark:border-gray-900 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Chats</h1>
        <div className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full text-sm font-mono font-medium">
            ID: {userProfile?.uid4}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p>No chats yet.</p>
            <button onClick={() => navigate('/friends')} className="text-brand-500 hover:underline mt-2">Add friends to start chatting</button>
          </div>
        ) : (
          friends.map(friend => (
            <div 
              key={friend.uid}
              onClick={() => navigate(`/chat/${friend.uid}`)}
              className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-900/50"
            >
              <div className="relative">
                <img 
                  src={friend.photoURL} 
                  alt={friend.username} 
                  className="w-12 h-12 rounded-full bg-gray-200 object-cover"
                />
                {friend.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-950"></div>
                )}
              </div>
              
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{friend.username}</h3>
                  {friend.lastMsg && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(friend.lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                   {friend.lastMsg ? (
                       friend.lastMsg.senderId === userProfile?.uid ? `You: ${friend.lastMsg.text || 'Sent a file'}` : (friend.lastMsg.text || 'Sent a file')
                   ) : 'Start a conversation'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}