import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal, Shield, AlertTriangle, LogIn, ChevronRight, Server } from 'lucide-react';
import { getApiUrl } from '../services/api';

export default function Login({ onOpenSettings }) {
  const { 
    googleClientId, 
    handleGoogleLoginSuccess, 
    loginAsDemo, 
    error, 
    setError,
    loading 
  } = useAuth();

  const [demoEmail, setDemoEmail] = useState("admin@kce.ac.in");
  const [customEmail, setCustomEmail] = useState("");
  const [showCustomDemo, setShowCustomDemo] = useState(false);

  // Initialize Google Sign-in button
  useEffect(() => {
    let checkInterval;
    
    const initGoogleSignIn = () => {
      if (googleClientId && window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleLoginSuccess,
            auto_select: false,
          });
          
          const container = document.getElementById("googleSignInButton");
          if (container) {
            window.google.accounts.id.renderButton(container, {
              theme: "filled_blue",
              size: "large",
              shape: "pill",
              width: 320,
            });
            clearInterval(checkInterval);
          }
        } catch (err) {
          console.error("Failed to initialize Google login button:", err);
        }
      }
    };

    if (googleClientId) {
      // Check every 500ms for window.google to load
      checkInterval = setInterval(initGoogleSignIn, 500);
      initGoogleSignIn();
    }

    return () => clearInterval(checkInterval);
  }, [googleClientId]);

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    const emailToUse = showCustomDemo ? customEmail : demoEmail;
    if (!emailToUse) {
      setError("Please select or enter an email address");
      return;
    }
    const res = await loginAsDemo(emailToUse);
    if (!res.success) {
      // Error is set in context, will be displayed
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background Tech Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#102a43_1px,transparent_1px),linear-gradient(to_bottom,#102a43_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      
      {/* Left Column: Branding / Marketing */}
      <div className="md:w-1/2 flex flex-col justify-between p-8 md:p-16 relative z-10 text-white border-b md:border-b-0 md:border-r border-navy-800 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500 flex items-center justify-center font-display font-extrabold text-navy-950 text-xl shadow-lg shadow-gold-500/20">
            K
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-wider text-gold-500">KARPAGAM</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">College of Engineering</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="my-auto py-12 md:py-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold mb-6 tracking-wide uppercase">
            <Terminal size={12} />
            <span>Software Development Club</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
            Digital Identity & <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-300">Club Portal</span>
          </h1>
          <p className="text-slate-400 mt-4 text-sm md:text-base max-w-md font-light leading-relaxed">
            A secure administrative platform for managing members, processing physical ID card scanning with real-time OCR, and tracking analytics.
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 flex flex-col gap-1">
          <p>&copy; {new Date().getFullYear()} Karpagam College of Engineering.</p>
          <p className="font-mono text-[10px]">v1.0.0 // Powered by Google Apps Script & Tesseract OCR</p>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md dark-glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden bg-navy-900/40">
          {/* Top glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>

          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl text-white tracking-tight">Admin Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Authorized access only. Log in to manage resources.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-xl p-3 flex gap-2.5 items-start">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Google Login Section */}
          {googleClientId ? (
            <div className="space-y-6 flex flex-col items-center">
              <div id="googleSignInButton" className="min-h-[44px]"></div>
              
              <div className="relative w-full flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-navy-800"></div></div>
                <span className="relative px-3 bg-navy-950/80 text-[10px] uppercase font-bold tracking-widest text-slate-500">Or Continue With</span>
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs rounded-xl p-4 flex gap-3">
              <AlertTriangle size={20} className="shrink-0 text-amber-400" />
              <div className="space-y-1">
                <p className="font-bold">Google Login Unconfigured</p>
                <p className="leading-relaxed">
                  No Google OAuth Client ID has been set. You can set it in settings, or use the pre-seeded administrators below to log in.
                </p>
                <button 
                  onClick={onOpenSettings}
                  className="text-gold-400 hover:text-gold-300 font-bold underline flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Server size={12} />
                  <span>Configure client credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* Sandbox / Demo Login Panel */}
          <form onSubmit={handleDemoLogin} className="space-y-4">
            {!showCustomDemo ? (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Demo Identity
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setDemoEmail("admin@kce.ac.in"); setShowCustomDemo(false); }}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      demoEmail === "admin@kce.ac.in" && !showCustomDemo
                        ? 'border-gold-500 bg-gold-500/5 text-white shadow-sm shadow-gold-500/10'
                        : 'border-navy-800 bg-navy-950/40 text-slate-400 hover:border-navy-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy-900 border border-gold-500/30 flex items-center justify-center text-gold-500">
                        <Shield size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">SDC Admin (Super Admin)</p>
                        <p className="text-[10px] text-slate-500">admin@kce.ac.in</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className={demoEmail === "admin@kce.ac.in" && !showCustomDemo ? 'text-gold-500' : 'text-slate-600'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setDemoEmail("717823p243@kce.ac.in"); setShowCustomDemo(false); }}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      demoEmail === "717823p243@kce.ac.in" && !showCustomDemo
                        ? 'border-gold-500 bg-gold-500/5 text-white shadow-sm shadow-gold-500/10'
                        : 'border-navy-800 bg-navy-950/40 text-slate-400 hover:border-navy-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-navy-900 border border-navy-700 flex items-center justify-center text-slate-400">
                        <LogIn size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Praveen M (Admin)</p>
                        <p className="text-[10px] text-slate-500">717823p243@kce.ac.in</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className={demoEmail === "717823p243@kce.ac.in" && !showCustomDemo ? 'text-gold-500' : 'text-slate-600'} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Enter Registered Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. administrator@kce.ac.in"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 rounded-xl border border-navy-800 bg-navy-950/50 text-white focus:outline-none focus:border-gold-500"
                />
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] mt-2">
              <button
                type="button"
                onClick={() => setShowCustomDemo(!showCustomDemo)}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                {showCustomDemo ? 'Select Predefined Admins' : 'Use Another Admin Email'}
              </button>
              
              <span className="text-slate-500 font-mono">
                {getApiUrl() ? 'Active Cloud Mode' : 'Sandbox Mode'}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-3 px-4 rounded-xl text-xs tracking-wider uppercase transition-colors shadow-lg shadow-gold-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Authenticate Session</span>
              <ChevronRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
