import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, ShieldAlert, Plus, Trash2, Check, X, RefreshCw, Server, AlertCircle } from 'lucide-react';

export default function AdminManagement() {
  const { user, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    Name: "",
    Email: "",
    Role: "Admin",
    Status: "Active"
  });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdmins();
      if (!res.error) {
        setAdmins(res.admins);
      } else {
        setError(res.message || "Failed to load admins list");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to communicate with administrators database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!newAdmin.Name.trim()) return setFormError("Name is required");
    if (!newAdmin.Email.trim()) return setFormError("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdmin.Email)) {
      return setFormError("Invalid email format");
    }

    setActionLoading(true);
    try {
      // Generate standard ID
      const nextId = String(admins.length + 1).padStart(3, '0');
      const adminData = {
        ID: nextId,
        Name: newAdmin.Name.trim(),
        Email: newAdmin.Email.trim().toLowerCase(),
        Role: newAdmin.Role,
        Status: newAdmin.Status
      };

      const res = await api.addAdmin(adminData, user.email);
      if (!res.error) {
        // Reset form
        setNewAdmin({ Name: "", Email: "", Role: "Admin", Status: "Active" });
        setShowAddForm(false);
        fetchAdmins();
      } else {
        setFormError(res.message || "Failed to add admin");
      }
    } catch (err) {
      console.error(err);
      setFormError("Connection error. Admin addition failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    // Prevent self deactivation
    if (admin.Email.toLowerCase() === user.email.toLowerCase()) {
      alert("Self-modification error: You cannot deactivate your own active session!");
      return;
    }

    const nextStatus = admin.Status === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Are you sure you want to set status of ${admin.Email} to ${nextStatus}?`)) return;

    try {
      const updatedAdmin = { ...admin, Status: nextStatus };
      const res = await api.updateAdmin(updatedAdmin, user.email);
      if (!res.error) {
        fetchAdmins();
      } else {
        alert(res.message || "Failed to update admin");
      }
    } catch (err) {
      console.error(err);
      alert("Sync error. Deactivation failed.");
    }
  };

  const handleRoleChange = async (admin, newRole) => {
    // Prevent self role changes
    if (admin.Email.toLowerCase() === user.email.toLowerCase()) {
      alert("Self-modification error: You cannot alter your own admin privileges.");
      return;
    }

    if (!window.confirm(`Are you sure you want to change role of ${admin.Email} to ${newRole}?`)) return;

    try {
      const updatedAdmin = { ...admin, Role: newRole };
      const res = await api.updateAdmin(updatedAdmin, user.email);
      if (!res.error) {
        fetchAdmins();
      } else {
        alert(res.message || "Failed to change role");
      }
    } catch (err) {
      console.error(err);
      alert("Sync error. Role change failed.");
    }
  };

  const handleDeleteAdmin = async (email) => {
    if (email.toLowerCase() === user.email.toLowerCase()) {
      alert("Self-modification error: You cannot delete your own Super Admin access!");
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke admin access for ${email}? This action is permanent.`)) return;

    try {
      const res = await api.deleteAdmin(email, user.email);
      if (!res.error) {
        fetchAdmins();
      } else {
        alert(res.message || "Failed to remove admin");
      }
    } catch (err) {
      console.error(err);
      alert("Sync error. Revocation failed.");
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center">
          <ShieldAlert className="mx-auto text-red-600 mb-3" size={36} />
          <h3 className="font-display font-semibold text-lg">Access Violation</h3>
          <p className="text-xs mt-1">
            Admin settings is restricted to the Super Admin role only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-navy-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-gold-500" size={24} />
            Administrator Privileges
          </h2>
          <p className="text-xs text-navy-500 font-medium">
            Manage system access roles, grant permissions, and audit administrative accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-1.5 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'Hide panel' : 'Add New Admin'}</span>
        </button>
      </div>

      {/* Add Admin Panel */}
      {showAddForm && (
        <form onSubmit={handleAddAdmin} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm max-w-2xl animate-in slide-in-from-top-3 duration-200">
          <h3 className="font-display font-semibold text-sm text-navy-900 mb-4">Register Administrator Email</h3>
          
          {formError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-2.5 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-800 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. SDC Instructor"
                value={newAdmin.Name}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, Name: e.target.value }))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-800 mb-1">KCE Email ID</label>
              <input
                type="email"
                placeholder="e.g. staff@kce.ac.in"
                value={newAdmin.Email}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, Email: e.target.value }))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-800 mb-1">Admin Access Role</label>
              <select
                value={newAdmin.Role}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, Role: e.target.value }))}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500 bg-white"
              >
                <option value="Admin">Admin (Can edit members only)</option>
                <option value="Super Admin">Super Admin (Full control)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-800 mb-1">Status</label>
              <select
                value={newAdmin.Status}
                onChange={(e) => setNewAdmin(prev => ({ ...prev, Status: e.target.value }))}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500 bg-white"
              >
                <option value="Active">Active (Grant Entry)</option>
                <option value="Inactive">Inactive (Revoke Access)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-navy-50">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-navy-200 text-navy-700 hover:bg-navy-50 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center gap-1 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              {actionLoading ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
              <span>Save Admin User</span>
            </button>
          </div>
        </form>
      )}

      {/* error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex gap-3 text-xs">
          <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sync Failure</p>
            <p className="mt-0.5">{error}</p>
            <button 
              onClick={fetchAdmins}
              className="mt-2 text-xs font-bold underline text-navy-950 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} /> Retry Database Connection
            </button>
          </div>
        </div>
      )}

      {/* Admins Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-white border border-navy-100 rounded-2xl shimmer"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-navy-50 text-navy-800 font-bold uppercase text-[9px] tracking-wider border-b border-navy-100">
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Admin Name</th>
                <th className="py-4 px-6">KCE Email Address</th>
                <th className="py-4 px-6">Assigned Role</th>
                <th className="py-4 px-6">Account Status</th>
                <th className="py-4 px-6 text-right">Revoke Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {admins.map((admin) => {
                const isSelf = admin.Email.toLowerCase() === user.email.toLowerCase();
                return (
                  <tr key={admin.Email} className="hover:bg-navy-50/20 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-navy-500">{admin.ID || 'N/A'}</td>
                    <td className="py-4 px-6 font-semibold text-navy-950">
                      <span className="flex items-center gap-1.5">
                        {admin.Name}
                        {isSelf && <span className="bg-navy-900 text-gold-400 text-[8px] font-bold px-1.5 py-0.5 rounded">YOU</span>}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-navy-600">{admin.Email}</td>
                    <td className="py-4 px-6">
                      <select
                        disabled={isSelf}
                        value={admin.Role}
                        onChange={(e) => handleRoleChange(admin, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          admin.Role === 'Super Admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        } disabled:opacity-75 disabled:cursor-not-allowed`}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        disabled={isSelf}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          admin.Status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        } disabled:opacity-75 disabled:cursor-not-allowed`}
                      >
                        {admin.Status === 'Active' ? (
                          <>
                            <Check size={10} />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X size={10} />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteAdmin(admin.Email)}
                        disabled={isSelf}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-transparent hover:border-red-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={isSelf ? "Self-modification locked" : "Revoke Admin Access"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
