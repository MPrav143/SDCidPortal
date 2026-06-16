import React, { useState, useEffect } from 'react';
import { X, Save, Upload, User, Info, RefreshCw } from 'lucide-react';

export default function MemberFormModal({ isOpen, onClose, onSave, member, existingMembers }) {
  const [formData, setFormData] = useState({
    "Member ID": "",
    "Name": "",
    "Position": "",
    "Year": "I",
    "Department": "Computer Science and Engineering",
    "Email": "",
    "Phone": "",
    "Photo URL": "",
    "Date Joined": "",
    "Status": "Active"
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    setPreviewError(false);
    if (member) {
      setFormData({ ...member });
    } else {
      // Set default Date Joined to today
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        "Member ID": "",
        "Name": "",
        "Position": "Executive Member",
        "Year": "II",
        "Department": "Computer Science and Engineering",
        "Email": "",
        "Phone": "",
        "Photo URL": "",
        "Date Joined": today,
        "Status": "Active"
      });
    }
    setErrors({});
  }, [member, isOpen]);

  if (!isOpen) return null;

  // Department options
  const departments = [
    "Computer Science and Engineering",
    "Information Technology",
    "Artificial Intelligence and Data Science",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering"
  ];

  // Positions options
  const positions = [
    "President",
    "Vice President",
    "Secretary",
    "Joint Secretary",
    "Technical Director",
    "Design Lead",
    "DevOps Lead",
    "Full Stack Developer",
    "Web Developer",
    "UI/UX Designer",
    "App Developer",
    "Executive Member"
  ];

  // Auto-generate standard unique Member ID (e.g., KCE-SDC-26-001)
  const generateMemberId = () => {
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    // Filter members with similar ID structure and find max sequence
    let maxSeq = 0;
    existingMembers.forEach(m => {
      const id = m["Member ID"] || "";
      if (id.startsWith(`KCE-SDC-${currentYearShort}-`)) {
        const parts = id.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });
    
    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    const newId = `KCE-SDC-${currentYearShort}-${nextSeq}`;
    
    setFormData(prev => ({ ...prev, "Member ID": newId }));
    setErrors(prev => ({ ...prev, "Member ID": "" }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData["Member ID"].trim()) {
      newErrors["Member ID"] = "Member ID is required";
    } else if (!/^KCE-SDC-\d{2}-\d{3}$/.test(formData["Member ID"].trim())) {
      newErrors["Member ID"] = "Must match format: KCE-SDC-YY-NNN";
    } else if (!member) {
      // Check if Member ID is unique (only when creating)
      const exists = existingMembers.some(m => m["Member ID"].toLowerCase() === formData["Member ID"].trim().toLowerCase());
      if (exists) {
        newErrors["Member ID"] = "Member ID already exists";
      }
    }

    if (!formData.Name.trim()) newErrors.Name = "Full Name is required";
    if (!formData.Position) newErrors.Position = "Position is required";
    
    // Email Validation
    if (!formData.Email.trim()) {
      newErrors.Email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Invalid email format";
    }

    // Phone Validation
    if (!formData.Phone.trim()) {
      newErrors.Phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.Phone.replace(/[-\s]/g, ""))) {
      newErrors.Phone = "Must be a 10-digit number";
    }

    if (!formData["Photo URL"]) {
      newErrors["Photo URL"] = "Photo URL is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, submit: err.message || "Operation failed" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white border border-navy-100 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between border-b border-gold-500/10">
          <h2 className="font-display font-semibold text-lg text-white">
            {member ? 'Edit Member Details' : 'Register New Member'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-850 text-xs rounded-lg p-3">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Image URL Input and Live Preview Column */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-800 self-start">
                Profile Photo
              </label>
              
              <div className="relative w-36 h-36 rounded-2xl border border-navy-200 bg-navy-50/50 flex flex-col items-center justify-center overflow-hidden transition-all duration-200 shadow-sm shrink-0">
                {formData["Photo URL"] && !previewError ? (
                  <img 
                    src={formData["Photo URL"]} 
                    alt="Live Preview" 
                    onError={() => setPreviewError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-navy-450">
                    <User size={32} className="stroke-[1.5] text-navy-400" />
                    <span className="text-[10px] font-bold text-slate-500">Avatar Placeholder</span>
                  </div>
                )}
              </div>

              <div className="w-full space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-850">
                  Image Web URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData["Photo URL"] || ""}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, "Photo URL": e.target.value }));
                    setPreviewError(false);
                    setErrors(prev => ({ ...prev, "Photo URL": "" }));
                  }}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500 bg-white"
                />
              </div>

              {errors["Photo URL"] && (
                <span className="text-[10px] font-semibold text-red-650 text-center">{errors["Photo URL"]}</span>
              )}
            </div>

            {/* Form Details Column */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Member ID Field */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Member ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. KCE-SDC-26-001"
                    disabled={!!member} // Disable ID change when editing
                    value={formData["Member ID"]}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, "Member ID": e.target.value.toUpperCase() }));
                      setErrors(prev => ({ ...prev, "Member ID": "" }));
                    }}
                    className={`flex-1 text-sm px-3 py-2 rounded-lg border focus:outline-none focus:border-gold-500 ${
                      member ? 'bg-navy-50 text-navy-500 border-navy-100' : 'border-navy-200'
                    }`}
                  />
                  {!member && (
                    <button
                      type="button"
                      onClick={generateMemberId}
                      className="px-3 py-2 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Auto-Gen</span>
                    </button>
                  )}
                </div>
                {errors["Member ID"] && (
                  <span className="text-[10px] font-semibold text-red-600 mt-0.5 block">{errors["Member ID"]}</span>
                )}
              </div>

              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Praveen M"
                  value={formData.Name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, Name: e.target.value }));
                    setErrors(prev => ({ ...prev, Name: "" }));
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500"
                />
                {errors.Name && (
                  <span className="text-[10px] font-semibold text-red-600 mt-0.5 block">{errors.Name}</span>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Club Position
                </label>
                <select
                  value={formData.Position}
                  onChange={(e) => setFormData(prev => ({ ...prev, Position: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500 bg-white"
                >
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Year of Study */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Year of Study
                </label>
                <select
                  value={formData.Year}
                  onChange={(e) => setFormData(prev => ({ ...prev, Year: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500 bg-white"
                >
                  <option value="I">I Year</option>
                  <option value="II">II Year</option>
                  <option value="III">III Year</option>
                  <option value="IV">IV Year</option>
                </select>
              </div>

              {/* Department */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Department
                </label>
                <select
                  value={formData.Department}
                  onChange={(e) => setFormData(prev => ({ ...prev, Department: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500 bg-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Email ID
                </label>
                <input
                  type="email"
                  placeholder="e.g. name@kce.ac.in"
                  value={formData.Email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, Email: e.target.value }));
                    setErrors(prev => ({ ...prev, Email: "" }));
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500"
                />
                {errors.Email && (
                  <span className="text-[10px] font-semibold text-red-600 mt-0.5 block">{errors.Email}</span>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={formData.Phone}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, Phone: e.target.value }));
                    setErrors(prev => ({ ...prev, Phone: "" }));
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500"
                />
                {errors.Phone && (
                  <span className="text-[10px] font-semibold text-red-600 mt-0.5 block">{errors.Phone}</span>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Status
                </label>
                <select
                  value={formData.Status}
                  onChange={(e) => setFormData(prev => ({ ...prev, Status: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Date Joined */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-800 mb-1">
                  Date Joined
                </label>
                <input
                  type="date"
                  value={formData["Date Joined"]}
                  onChange={(e) => setFormData(prev => ({ ...prev, "Date Joined": e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-navy-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-navy-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-navy-200 hover:bg-navy-100 text-navy-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 px-5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            {saving ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <Save size={12} />
                <span>Save Member</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
