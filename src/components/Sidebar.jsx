import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Scan, ShieldAlert, LogOut, Terminal } from 'lucide-react';

export default function Sidebar() {
  const { isSuperAdmin, logout, user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/members', label: 'Club Members', icon: Users },
    { to: '/', label: 'Verify ID Card', icon: Scan },
  ];

  if (isSuperAdmin) {
    navItems.push({ to: '/admins', label: 'Admin Settings', icon: ShieldAlert });
  }

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile screens) */}
      <aside className="hidden md:flex w-64 bg-navy-950 text-slate-300 border-r border-navy-800 flex-col justify-between shrink-0 h-[calc(100vh-73px)]">
        {/* Navigation Links */}
        <div className="p-4 flex-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
            Core Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gold-500/10 text-gold-400 border-l-4 border-gold-500 font-semibold'
                        : 'hover:bg-navy-900 text-slate-400 hover:text-slate-200 border-l-4 border-transparent'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* SDC Brand / Footer */}
        <div className="p-4 border-t border-navy-800 bg-navy-950/50">
          <div className="p-3 bg-navy-900/50 border border-navy-800 rounded-lg flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gold-500">
              <Terminal size={14} />
              <span className="text-xs font-bold font-display tracking-wider">KCE-SDC ENGINE</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Platform built for secure, digital member validation & tracking.
            </p>
          </div>
          
          {user && (
            <button
              onClick={logout}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-navy-800 text-slate-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-500/5 transition-all text-xs font-medium cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out Session</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (hidden on desktop screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-navy-950 border-t border-navy-800 text-slate-400 flex justify-around items-center z-40 py-2 px-3 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[9px] font-bold px-2 py-1 transition-all duration-200 cursor-pointer ${
                  isActive ? 'text-gold-400' : 'text-slate-500 active:text-slate-200'
                }`
              }
            >
              <Icon size={16} className="stroke-[2]" />
              <span className="truncate max-w-[80px]">
                {item.label === 'Admin Settings' ? 'Settings' : item.label === 'Verify ID Card' ? 'Scanner' : item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
