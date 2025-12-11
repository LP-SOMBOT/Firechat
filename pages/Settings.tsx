import React, { useEffect, useState } from 'react';
import { Moon, Sun, Trash2, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import { deleteUser } from 'firebase/auth';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure? This cannot be undone.")) {
        try {
            if (auth.currentUser) await deleteUser(auth.currentUser);
        } catch (e) {
            alert("Re-login required for security reasons.");
        }
    }
  };

  return (
    <div className="p-6 h-full bg-white dark:bg-gray-950">
      <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Settings</h1>

      <div className="space-y-6 max-w-lg">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-3">
                {darkMode ? <Moon size={24} className="text-brand-500" /> : <Sun size={24} className="text-orange-500" />}
                <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
            </div>
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${darkMode ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${darkMode ? 'left-6.5 translate-x-1' : 'left-0.5'}`} />
            </button>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
            <h3 className="text-red-500 font-bold mb-4">Danger Zone</h3>
            
            <button 
                onClick={handleDeleteAccount}
                className="flex items-center gap-3 w-full p-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
                <Trash2 size={20} />
                <span>Delete Account</span>
            </button>
        </div>
      </div>
    </div>
  );
}