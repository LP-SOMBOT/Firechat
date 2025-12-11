import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import ConfigPage from './pages/ConfigPage';
import { isFirebaseConfigured } from './firebase';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  
  if (!currentUser) return <Navigate to="/login" />;

  return <>{children}</>;
};

// Check if Config is needed
const ConfigCheck = ({ children }: { children: React.ReactNode }) => {
    if (!isFirebaseConfigured()) {
        return <ConfigPage />;
    }
    return <>{children}</>;
}

export default function App() {
  return (
    <ConfigCheck>
        <AuthProvider>
        <HashRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="chat/:chatId" element={<Chat />} />
                <Route path="profile" element={<Profile />} />
                <Route path="friends" element={<Friends />} />
                <Route path="settings" element={<Settings />} />
            </Route>
            </Routes>
        </HashRouter>
        </AuthProvider>
    </ConfigCheck>
  );
}