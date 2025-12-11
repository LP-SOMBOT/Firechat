import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, User, Settings, LogOut } from 'lucide-react';
import { auth } from '../firebase';

const NavItem = ({ to, icon: Icon, label, active }: any) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex flex-col md:flex-row items-center md:space-x-3 p-2 md:px-4 md:py-3 rounded-lg transition-all
        ${active 
          ? 'text-brand-600 dark:text-brand-500 bg-brand-50 dark:bg-gray-800' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-xs md:text-sm mt-1 md:mt-0 font-medium">{label}</span>
    </button>
  );
};

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'home';
  const isChatPage = currentPath === 'chat';

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-950 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-600 dark:text-brand-500">FireChat</h1>
          <p className="text-xs text-gray-400 mt-1">Realtime Messenger</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem to="/home" icon={MessageSquare} label="Chats" active={currentPath === 'home' || currentPath === 'chat'} />
          <NavItem to="/friends" icon={Users} label="Friends" active={currentPath === 'friends'} />
          <NavItem to="/profile" icon={User} label="Profile" active={currentPath === 'profile'} />
          <NavItem to="/settings" icon={Settings} label="Settings" active={currentPath === 'settings'} />
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full w-full relative">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile - Hidden on Chat Page */}
      {!isChatPage && (
        <nav className="md:hidden flex items-center justify-around bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 h-16 absolute bottom-0 w-full z-50 pb-safe">
          <NavItem to="/home" icon={MessageSquare} label="Chats" active={currentPath === 'home' || currentPath === 'chat'} />
          <NavItem to="/friends" icon={Users} label="Friends" active={currentPath === 'friends'} />
          <NavItem to="/profile" icon={User} label="Profile" active={currentPath === 'profile'} />
          <NavItem to="/settings" icon={Settings} label="Settings" active={currentPath === 'settings'} />
        </nav>
      )}
    </div>
  );
}