import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MemberList from './pages/MemberList';
import MemberProfile from './pages/MemberProfile';
import AdminManagement from './pages/AdminManagement';

// Protected Route Guard for Admins
function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null; // Wait for auth init
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Protected Route Guard for Super Admins
function SuperAdminRoute({ children }) {
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) return null;
  if (!user || !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Layout Shell for Admin Dashboard pages
function DashboardLayout({ onOpenSettings }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onOpenSettings={onOpenSettings} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-gold-500/30 flex items-center justify-center font-display font-black text-gold-500 text-3xl shadow-xl shadow-gold-500/10 animate-bounce">
            K
          </div>
          <div className="text-center">
            <h2 className="font-display font-semibold tracking-wider text-sm">SECURE TERMINAL</h2>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono tracking-widest">Verifying database configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Homepage: Scanner primary feature, login secondary at bottom */}
        <Route path="/" element={<Home onOpenSettings={() => setIsSettingsOpen(true)} />} />
        
        {/* Protected Admin Routes */}
        <Route element={<DashboardLayout onOpenSettings={() => setIsSettingsOpen(true)} />}>
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/members" 
            element={
              <ProtectedRoute>
                <MemberList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/members/:id" 
            element={<MemberProfile />} // Accessible by both admins & public via routing/links
          />
          <Route 
            path="/admins" 
            element={
              <SuperAdminRoute>
                <AdminManagement />
              </SuperAdminRoute>
            } 
          />
        </Route>

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Config Settings Modal */}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
