import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { update, ref } from 'firebase/database';
import { db } from '../firebase';
import { Edit2, Camera } from 'lucide-react';
import { uploadFile } from '../services/storage';

export default function Profile() {
  const { userProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(userProfile?.username || '');
  const [uploading, setUploading] = useState(false);

  const handleUpdate = async () => {
    if (!userProfile) return;
    await update(ref(db, `users/${userProfile.uid}`), { username: newName });
    setEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    setUploading(true);
    try {
        const url = await uploadFile(file, `profiles/${userProfile.uid}`);
        await update(ref(db, `users/${userProfile.uid}`), { photoURL: url });
    } catch(e) {
        alert('Failed to upload');
    } finally {
        setUploading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="p-6 h-full bg-white dark:bg-gray-950 flex flex-col items-center pt-20">
      <div className="relative group">
        <img 
            src={userProfile.photoURL} 
            alt="Profile" 
            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl"
        />
        <label className="absolute bottom-0 right-0 bg-brand-600 text-white p-2 rounded-full cursor-pointer hover:bg-brand-700 transition-colors shadow-lg">
            <Camera size={20} />
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
        </label>
      </div>

      <div className="mt-8 text-center w-full max-w-sm">
        {editing ? (
            <div className="flex gap-2">
                <input 
                    className="flex-1 p-2 border rounded bg-white dark:bg-gray-800 dark:text-white"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <button onClick={handleUpdate} className="bg-brand-600 text-white px-4 rounded">Save</button>
                <button onClick={() => setEditing(false)} className="text-gray-500">Cancel</button>
            </div>
        ) : (
            <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{userProfile.username}</h2>
                <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-brand-600">
                    <Edit2 size={16} />
                </button>
            </div>
        )}
        
        <p className="text-gray-500 mt-2">{userProfile.email}</p>
        
        <div className="mt-8 bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Your Unique ID</p>
            <p className="text-4xl font-mono font-bold text-brand-600 tracking-widest select-all">{userProfile.uid4}</p>
            <p className="text-xs text-gray-400 mt-2">Friends can use this code to add you.</p>
        </div>
      </div>
    </div>
  );
}