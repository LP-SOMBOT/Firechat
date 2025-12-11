import React, { useState } from 'react';
import { saveConfig } from '../firebase';
import { FirebaseConfig } from '../types';

export default function ConfigPage() {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    try {
      const config = JSON.parse(json);
      // Basic validation
      if (!config.apiKey || !config.databaseURL) {
        throw new Error("Invalid config. Must contain apiKey and databaseURL.");
      }
      saveConfig(config);
    } catch (e) {
      setError("Invalid JSON configuration. Please check the format.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Setup FireChat</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          To run this application, you need to provide your Firebase Configuration JSON. 
          Enable <strong>Auth</strong>, <strong>Realtime Database</strong>, and <strong>Storage</strong> in your Firebase Console.
        </p>
        
        <textarea
          className="w-full h-48 p-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl font-mono text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-500 outline-none"
          placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <button
          onClick={handleSave}
          className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}