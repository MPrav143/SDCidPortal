import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Server, Key, HelpCircle, Save, Info, RefreshCw } from 'lucide-react';
import { getApiUrl, setApiUrl } from '../services/api';

export default function SettingsModal({ onClose }) {
  const navigate = useNavigate();
  const { googleClientId, updateGoogleClientId, loginAsDemo } = useAuth();
  const [apiUrl, setApiUrlState] = useState(getApiUrl());
  const [clientId, setClientIdState] = useState(googleClientId);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate slight save loading for premium UI feedback
    setTimeout(() => {
      setApiUrl(apiUrl.trim());
      updateGoogleClientId(clientId.trim());
      setSaving(false);
      onClose();
      // Reload pages to apply database switch
      window.location.reload();
    }, 600);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset to the Local Sandbox database?")) {
      setApiUrlState("");
      setClientIdState("");
      setApiUrl("");
      updateGoogleClientId("");
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white border border-navy-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between border-b border-gold-500/10">
          <div className="flex items-center gap-2 text-gold-400">
            <Server size={18} />
            <h2 className="font-display font-semibold text-lg text-white">System Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
            <Info size={20} className="shrink-0 mt-0.5 text-blue-600" />
            <div className="text-xs space-y-1">
              <span className="font-semibold">Database Sandbox Status:</span>
              <p>
                By default, the application runs on a local sandbox (LocalStorage). You can toggle it to a live Google Sheet backend by deploying the Apps Script and entering its URL below.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1.5 flex items-center gap-1.5">
                <Server size={12} className="text-gold-600" />
                Google Apps Script API URL
              </label>
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrlState(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-navy-100 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
              />
              <p className="text-[10px] text-navy-400 mt-1">
                Enter the deployed Google Apps Script Web App URL to sync data with Google Sheets.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1.5 flex items-center gap-1.5">
                <Key size={12} className="text-gold-600" />
                Google Client ID (OAuth 2.0)
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientIdState(e.target.value)}
                placeholder="123456789-abc.apps.googleusercontent.com"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-navy-100 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
              />
              <p className="text-[10px] text-navy-400 mt-1">
                Required for real "Google Log In". If blank, Demo/Mock Login will be enabled.
              </p>
            </div>
          </div>

          {/* Sandbox Login Bypass (Evaluator Tool) */}
          <div className="border-t border-navy-100 pt-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1 flex items-center gap-1.5">
              <Key size={12} className="text-gold-600" />
              Sandbox Login Bypass
            </label>
            <p className="text-[10px] text-navy-500 leading-normal">
              If Google OAuth credentials are not configured, use these predefined roles to bypass sign-in and access administrative dashboards immediately.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await loginAsDemo("admin@kce.ac.in");
                  if (res.success) {
                    onClose();
                    navigate('/dashboard');
                  }
                }}
                className="bg-navy-50 hover:bg-navy-100 border border-navy-100 hover:border-gold-500 p-2.5 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-center"
              >
                <span className="text-[10px] font-bold text-navy-950">Super Admin Bypass</span>
                <span className="text-[9px] text-slate-500 font-mono">admin@kce.ac.in</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await loginAsDemo("717823p243@kce.ac.in");
                  if (res.success) {
                    onClose();
                    navigate('/dashboard');
                  }
                }}
                className="bg-navy-50 hover:bg-navy-100 border border-navy-100 hover:border-gold-500 p-2.5 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-center"
              >
                <span className="text-[10px] font-bold text-navy-950">SDC Admin Bypass</span>
                <span className="text-[9px] text-slate-500 font-mono">717823p243@kce.ac.in</span>
              </button>
            </div>
          </div>

          {/* Setup Guide Link */}
          <div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-navy-600 hover:text-gold-600 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle size={14} />
              <span>{showGuide ? 'Hide' : 'Show'} Step-by-Step Backend Setup Guide</span>
            </button>

            {showGuide && (
              <div className="mt-3 bg-navy-50 rounded-xl p-4 border border-navy-100 text-xs text-navy-800 space-y-3 animate-in fade-in duration-200">
                <p className="font-semibold text-navy-950">How to link this application to Google Sheets:</p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Create a new Google Sheet. Rename the file to <code className="bg-white px-1 py-0.5 rounded border border-navy-100">KCE SDC Database</code>.
                  </li>
                  <li>
                    Create sheets named:
                    <ul className="list-disc pl-4 mt-1 font-mono text-[10px] text-navy-600">
                      <li><strong>Admins</strong> (Columns: <code className="bg-white px-0.5">ID, Name, Email, Role, Status</code>)</li>
                      <li><strong>Members</strong> (Columns: <code className="bg-white px-0.5">Member ID, Name, Position, Year, Department, Email, Phone, Photo URL, Date Joined, Status</code>)</li>
                    </ul>
                  </li>
                  <li>
                    Add at least one admin row in "Admins" sheet (e.g. your email, status "Active", role "Super Admin").
                  </li>
                  <li>
                    Go to <strong>Extensions</strong> &rarr; <strong>Apps Script</strong>. Paste the code from the <code className="bg-white px-1 py-0.5 rounded border">google_apps_script.js</code> file (located in the project folder).
                  </li>
                  <li>
                    Click <strong>Deploy</strong> &rarr; <strong>New deployment</strong>. Select <strong>Web app</strong>. Set <em>Execute as</em> to <strong>Me</strong>, and <em>Who has access</em> to <strong>Anyone</strong>.
                  </li>
                  <li>
                    Click Deploy, authorize permissions, and copy the generated <strong>Web app URL</strong>. Paste it into the input above.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-navy-50 px-6 py-4 flex items-center justify-between border-t border-navy-100">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-navy-200 text-navy-600 hover:text-navy-950 hover:bg-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw size={12} />
            <span>Reset to Sandbox</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-navy-200 hover:bg-navy-100 text-navy-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-navy-900 hover:bg-gold-600 text-white hover:text-navy-950 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Save size={12} />
                  <span>Save & Sync</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
