import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, ArrowDownAZ, ArrowUpAZ, Edit, Trash2, Eye, Download, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import MemberFormModal from '../components/MemberFormModal';

export default function MemberList() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("Name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Modal control
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMembers();
      if (!res.error) {
        setMembers(res.members);
      } else {
        setError(res.message || "Failed to fetch members");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while linking to the member list database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEditClick = (member) => {
    setEditingMember(member);
    setIsFormModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingMember(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = async (memberId) => {
    if (window.confirm(`Are you sure you want to remove member ${memberId}? This action is permanent.`)) {
      try {
        const res = await api.deleteMember(memberId, user.email);
        if (!res.error) {
          fetchMembers();
        } else {
          alert(res.message || "Delete failed");
        }
      } catch (err) {
        console.error(err);
        alert("Network failure while deleting member");
      }
    }
  };

  const handleSaveMember = async (memberData) => {
    let res;
    if (editingMember) {
      // Update operation
      res = await api.updateMember(memberData, user.email);
    } else {
      // Insert operation
      res = await api.addMember(memberData, user.email);
    }

    if (res.error) {
      throw new Error(res.message);
    }

    fetchMembers();
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (members.length === 0) return;

    // Define CSV headers (must match the exact spreadsheet columns for portability)
    const headers = ["Member ID", "Name", "Position", "Year", "Department", "Email", "Phone", "Status", "Date Joined"];
    
    const csvRows = [];
    csvRows.push(headers.join(","));

    filteredMembers.forEach(m => {
      const values = headers.map(header => {
        const val = m[header] || "";
        // Clean values to avoid CSV breakage
        const escaped = ('' + val).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KCE_SDC_Members_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Search Logic
  const filteredMembers = members
    .filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = 
        !q ||
        (m.Name || "").toLowerCase().includes(q) ||
        (m["Member ID"] || "").toLowerCase().includes(q) ||
        (m.Department || "").toLowerCase().includes(q) ||
        (m.Position || "").toLowerCase().includes(q);

      const matchDept = filterDept === "All" || m.Department === filterDept;
      const matchYear = filterYear === "All" || m.Year === filterYear;
      const matchStatus = filterStatus === "All" || m.Status === filterStatus;

      return matchQuery && matchDept && matchYear && matchStatus;
    })
    .sort((a, b) => {
      let fieldA = a[sortBy] || "";
      let fieldB = b[sortBy] || "";

      if (sortBy === "Name" || sortBy === "Member ID") {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }

      if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const departments = [
    "Computer Science and Engineering",
    "Information Technology",
    "Artificial Intelligence and Data Science",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering"
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-navy-900 tracking-tight">
            Club Registry
          </h2>
          <p className="text-xs text-navy-500 font-medium">
            Search, filter, edit, and export Karpagam SDC members.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredMembers.length === 0}
            className="flex items-center gap-1.5 border border-navy-200 bg-white text-navy-800 hover:text-navy-950 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-navy-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-navy-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, ID, position, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-56">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500 bg-white"
            >
              <option value="All">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="w-full md:w-36">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500 bg-white"
            >
              <option value="All">All Years</option>
              <option value="I">I Year</option>
              <option value="II">II Year</option>
              <option value="III">III Year</option>
              <option value="IV">IV Year</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-36">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-navy-100 focus:outline-none focus:border-gold-500 bg-white"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex gap-3 text-sm">
          <AlertCircle className="shrink-0 text-red-600" size={20} />
          <div>
            <p className="font-bold">Sync Failure</p>
            <p className="text-xs mt-0.5">{error}</p>
            <button 
              onClick={fetchMembers}
              className="mt-2 text-xs font-bold underline text-navy-900 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Members List Table / Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="h-44 bg-white border border-navy-100 rounded-2xl shimmer"></div>
          ))}
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div 
              key={member["Member ID"]}
              className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gold-500/30 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Active/Inactive Status corner indicator */}
              <span className={`absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                member.Status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {member.Status}
              </span>

              {/* Profile Details Row */}
              <div className="flex gap-4">
                <img
                  src={member["Photo URL"] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                  alt={member.Name}
                  className="w-16 h-16 rounded-xl border border-navy-50 object-cover shrink-0 bg-slate-50"
                />
                <div className="space-y-1 min-w-0">
                  <span className="text-[9px] font-mono font-bold text-gold-600 bg-gold-50/50 px-1.5 py-0.5 rounded border border-gold-500/10">
                    {member["Member ID"]}
                  </span>
                  <h3 className="font-display font-bold text-navy-950 truncate text-sm mt-1">{member.Name}</h3>
                  <p className="text-xs font-semibold text-navy-600 truncate">{member.Position}</p>
                  <p className="text-[10px] text-navy-400 font-medium truncate">
                    {member.Department} • Year {member.Year}
                  </p>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between border-t border-navy-50 pt-3.5 mt-4">
                <span className="text-[9px] text-navy-400 font-medium">Joined: {member["Date Joined"]}</span>
                <div className="flex gap-1.5">
                  <Link
                    to={`/members/${member["Member ID"]}`}
                    className="p-1.5 hover:bg-navy-50 text-navy-600 hover:text-navy-900 rounded-lg transition-colors border border-transparent hover:border-navy-100/50"
                    title="View Profile"
                  >
                    <Eye size={14} />
                  </Link>
                  <button
                    onClick={() => handleEditClick(member)}
                    className="p-1.5 hover:bg-gold-50 text-gold-700 hover:text-gold-900 rounded-lg transition-colors border border-transparent hover:border-gold-100"
                    title="Edit Member"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(member["Member ID"])}
                    className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Delete Member"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-2xl py-12 text-center shadow-sm">
          <AlertCircle className="mx-auto text-navy-300 mb-3" size={36} />
          <h3 className="font-display font-semibold text-navy-900 text-sm">No members matched search</h3>
          <p className="text-xs text-navy-400 mt-1">Try adjusting your filters or query terms.</p>
        </div>
      )}

      {/* Member Form Modal */}
      <MemberFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        member={editingMember}
        existingMembers={members}
      />
    </div>
  );
}
