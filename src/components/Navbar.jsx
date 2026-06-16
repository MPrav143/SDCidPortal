import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Server, Key, Shield, User } from 'lucide-react';
import { getApiUrl, setApiUrl } from '../services/api';

const LogoImage = ({ src, alt, fallbackText, className }) => {
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0); // 0: png, 1: svg, 2: jpg

  if (error || attempt >= 3) {
    return (
      <div className="inline-flex items-center justify-center bg-navy-900 border border-gold-500/30 rounded text-gold-500 text-[10px] font-bold uppercase tracking-wider select-none shrink-0 w-8 h-8 sm:w-10 sm:h-10">
        {fallbackText}
      </div>
    );
  }

  const extensions = ['.png', '.svg', '.jpg'];
  const currentSrc = `${src}${extensions[attempt]}`;

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      onError={() => {
        setAttempt(prev => prev + 1);
      }} 
      className={className} 
    />
  );
};

export default function Navbar({ onOpenSettings }) {
  const { user, adminRecord, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="glass-panel border-b border-navy-100 bg-white/80 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <LogoImage src="/kce" alt="KCE Logo" fallbackText="K" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-navy-900 p-0.5 border border-gold-500/30 shrink-0" />
        <LogoImage src="/sdc" alt="SDC Logo" fallbackText="SDC" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-navy-900 p-0.5 border border-gold-500/30 shrink-0 hidden xs:block" />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-navy-900 text-sm sm:text-lg leading-tight tracking-tight truncate">
            Karpagam College of Engineering
          </h1>
          <p className="text-[9px] sm:text-xs text-navy-500 font-medium tracking-wide hidden sm:block">
            SOFTWARE DEVELOPMENT CLUB • MANAGEMENT PORTAL
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* API Status Badge */}
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border border-navy-100 bg-navy-50/50 text-navy-700 hover:bg-navy-100 hover:border-navy-200 transition-all cursor-pointer whitespace-nowrap"
        >
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getApiUrl() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="hidden xs:inline">{getApiUrl() ? 'Cloud Database' : 'Local Sandbox'}</span>
          <Settings size={11} className="text-navy-400 sm:w-3 sm:h-3" />
        </button>

        {/* User Profile */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-navy-50 border border-transparent hover:border-navy-100/50 transition-all cursor-pointer"
            >
              <img
                src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-gold-500/20 object-cover"
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-navy-900 leading-tight">{user.name}</p>
                <div className="flex items-center gap-1">
                  <Shield size={10} className="text-gold-600" />
                  <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wide">
                    {adminRecord?.Role || 'Admin'}
                  </span>
                </div>
              </div>
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-navy-100 shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-navy-50">
                    <p className="text-xs text-navy-400">Signed in as</p>
                    <p className="text-sm font-semibold text-navy-900 truncate">{user.name}</p>
                    <p className="text-xs text-navy-500 truncate">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-navy-50 text-sm text-navy-700 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Server size={14} className="text-navy-400" />
                    <span>Database Configuration</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
