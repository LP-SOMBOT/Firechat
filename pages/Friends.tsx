import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { searchUserByUID4, sendFriendRequest, acceptFriendRequest } from '../services/db';
import { Search, UserPlus, Check, X } from 'lucide-react';

export default function Friends() {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    const requestsRef = ref(db, `friend_requests/${userProfile.uid}`);
    
    return onValue(requestsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = await Promise.all(Object.values(data).map(async (req: any) => {
            const userSnap = await new Promise<any>(res => onValue(ref(db, `users/${req.from}`), s => res(s.val()), { onlyOnce: true }));
            return { ...req, user: userSnap };
        }));
        setRequests(list);
      } else {
        setRequests([]);
      }
    });
  }, [userProfile]);

  const handleSearch = async () => {
    if (searchTerm.length !== 4) return;
    setLoadingSearch(true);
    const user = await searchUserByUID4(searchTerm);
    // Don't show self
    if (user && user.uid !== userProfile?.uid) {
        setSearchResult(user);
    } else {
        setSearchResult(null);
    }
    setLoadingSearch(false);
  };

  const handleSendRequest = async () => {
    if (!userProfile || !searchResult) return;
    await sendFriendRequest(userProfile.uid, searchResult.uid);
    alert('Request sent!');
    setSearchResult(null);
    setSearchTerm('');
  };

  const handleAccept = async (fromUid: string) => {
    if (!userProfile) return;
    await acceptFriendRequest(userProfile.uid, fromUid);
  };

  return (
    <div className="p-6 h-full bg-white dark:bg-gray-950 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Friends</h1>

      {/* Search Section */}
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Add Friend</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              maxLength={4}
              placeholder="Enter 4-digit ID"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg tracking-widest focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g,''))}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-brand-600 text-white px-6 rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            Find
          </button>
        </div>

        {loadingSearch && <p className="mt-4 text-gray-500">Searching...</p>}
        
        {searchResult && (
          <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
               <img src={searchResult.photoURL} className="w-12 h-12 rounded-full" alt="profile" />
               <div>
                   <p className="font-bold text-gray-900 dark:text-white">{searchResult.username}</p>
                   <p className="text-sm text-gray-500">#{searchResult.uid4}</p>
               </div>
            </div>
            <button 
                onClick={handleSendRequest}
                className="flex items-center gap-2 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-4 py-2 rounded-lg hover:bg-brand-200 transition-colors"
            >
                <UserPlus size={18} />
                <span>Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Requests Section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Friend Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-400 italic">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.from} className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3">
                   <img src={req.user?.photoURL} className="w-10 h-10 rounded-full" alt="req" />
                   <span className="font-medium text-gray-900 dark:text-white">{req.user?.username}</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleAccept(req.from)}
                        className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                    >
                        <Check size={20} />
                    </button>
                    {/* Add reject logic if needed */}
                    <button className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                        <X size={20} />
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}