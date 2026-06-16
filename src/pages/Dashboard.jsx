import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserCheck, ShieldAlert, Award, ArrowUpRight, Plus, Scan, Database, Terminal, FileText, X, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import MemberFormModal from '../components/MemberFormModal';

export default function Dashboard() {
  const { user, isSuperAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Simulation Sandbox States
  const [simulating, setSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState("");
  const [simResult, setSimResult] = useState(null);

  const handleSimulatedScan = async (memberId) => {
    setSimulating(true);
    setSimStatus("Decoding scanned OCR text...");
    setSimResult(null);

    setTimeout(() => {
      setSimStatus(`Searching member ID "${memberId}"...`);

      setTimeout(async () => {
        try {
          const res = await api.getMemberById(memberId);
          if (!res.error) {
            setSimResult({ error: false, member: res.member });
          } else {
            setSimResult({ error: true, message: `Member ID "${memberId}" is not registered in the SDC registry.` });
          }
        } catch (err) {
          setSimResult({ error: true, message: "A connection timeout occurred during validation." });
        } finally {
          setSimulating(false);
        }
      }, 500);
    }, 600);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const membersRes = await api.getMembers();
      if (!membersRes.error) {
        setMembers(membersRes.members);
      }
      
      const adminsRes = await api.getAdmins();
      if (!adminsRes.error) {
        setAdmins(adminsRes.admins);
      }

      const logsRes = await api.getActivityLogs();
      if (!logsRes.error) {
        setLogs(logsRes.logs);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddMember = async (newMemberData) => {
    const res = await api.addMember(newMemberData, user.email);
    if (res.error) {
      throw new Error(res.message);
    }
    // Refresh dashboard stats
    await fetchDashboardData();
  };

  // Calculations
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.Status === 'Active').length;
  
  // Executive members list (all members except standard 'Executive Member')
  const executiveMembers = members.filter(m => m.Position !== 'Executive Member').length;
  const totalAdmins = admins.length;

  // Department-wise distribution
  const deptCounts = members.reduce((acc, m) => {
    const dept = m.Department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Year-wise distribution
  const yearCounts = members.reduce((acc, m) => {
    const year = m.Year || 'Unknown';
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  // Render Shimmer/Loader
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-slate-200 rounded"></div>
          <div className="h-10 w-36 bg-slate-200 rounded"></div>
        </div>
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white border border-navy-100 rounded-2xl shimmer"></div>
          ))}
        </div>

        {/* Charts & Table Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white border border-navy-100 rounded-2xl shimmer"></div>
          <div className="h-96 bg-white border border-navy-100 rounded-2xl shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-navy-900 tracking-tight flex items-center gap-2">
            <Terminal className="text-gold-500" size={24} />
            Command Center
          </h2>
          <p className="text-xs text-navy-500 font-medium">
            Overview of Karpagam College of Engineering Software Development Club metrics.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Member</span>
          </button>
          
          <Link
            to="/scanner"
            className="flex items-center gap-1.5 border border-navy-200 hover:border-gold-500 bg-white text-navy-800 hover:text-gold-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Scan size={14} />
            <span>ID Scanner</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Members */}
        <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-wider">Total Members</p>
            <h3 className="font-display font-extrabold text-3xl text-navy-900">{totalMembers}</h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-navy-500 bg-navy-50 px-2 py-0.5 rounded-full">
              Registered
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-900">
            <Users size={20} />
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-wider">Active Members</p>
            <h3 className="font-display font-extrabold text-3xl text-navy-900">{activeMembers}</h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0}% ratio
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck size={20} />
          </div>
        </div>

        {/* Executive Members */}
        <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-wider">Leadership / Execs</p>
            <h3 className="font-display font-extrabold text-3xl text-navy-900">{executiveMembers}</h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-full">
              Officers
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-gold-600">
            <Award size={20} />
          </div>
        </div>

        {/* Total Admins */}
        <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-wider">System Admins</p>
            <h3 className="font-display font-extrabold text-3xl text-navy-900">{totalAdmins}</h3>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              RBAC Guarded
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Demographics Charts */}
        <div className="space-y-6">
          {/* Department Distribution */}
          <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm">
            <h4 className="font-display font-bold text-sm text-navy-900 mb-4 uppercase tracking-wider border-b border-navy-50 pb-2">
              Department Counts
            </h4>
            <div className="space-y-3.5">
              {Object.entries(deptCounts).length > 0 ? (
                Object.entries(deptCounts).map(([dept, count]) => {
                  const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-navy-700 truncate max-w-[180px]">{dept}</span>
                        <span className="text-navy-900 font-bold">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-navy-50 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-navy-900 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-navy-400 text-center py-4">No department metrics available</p>
              )}
            </div>
          </div>

          {/* Year Distribution */}
          <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm">
            <h4 className="font-display font-bold text-sm text-navy-900 mb-4 uppercase tracking-wider border-b border-navy-50 pb-2">
              Year of Study distribution
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {['I', 'II', 'III', 'IV'].map(year => {
                const count = yearCounts[year] || 0;
                const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
                return (
                  <div key={year} className="bg-navy-50/50 border border-navy-100 rounded-xl p-3 flex flex-col justify-between h-20">
                    <span className="text-[10px] font-bold text-navy-400">YEAR {year}</span>
                    <div className="flex justify-between items-baseline">
                      <span className="font-display font-extrabold text-xl text-navy-900">{count}</span>
                      <span className="text-[10px] font-bold text-navy-600">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Logs & Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-navy-100 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-navy-50 pb-3 mb-4">
            <h4 className="font-display font-bold text-sm text-navy-900 uppercase tracking-wider">
              Recent Activity logs
            </h4>
            <span className="text-[10px] font-bold text-navy-500 flex items-center gap-1">
              <Database size={10} />
              Google Sheets Log Audit
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[360px]">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="text-navy-400 font-bold uppercase border-b border-navy-50 text-[10px]">
                  <th className="pb-2.5 font-semibold">Timestamp</th>
                  <th className="pb-2.5 font-semibold">Admin</th>
                  <th className="pb-2.5 font-semibold">Action</th>
                  <th className="pb-2.5 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <tr key={index} className="hover:bg-navy-50/30 transition-colors">
                      <td className="py-2.5 font-mono text-[10px] text-navy-500 whitespace-nowrap">{log.Timestamp}</td>
                      <td className="py-2.5 font-semibold text-navy-800 truncate max-w-[120px]">{log["Admin Email"]}</td>
                      <td className="py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          log.Action === 'Member Added' ? 'bg-emerald-50 text-emerald-700' :
                          log.Action === 'Member Deleted' ? 'bg-red-50 text-red-700' :
                          log.Action === 'Admin Login' ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {log.Action}
                        </span>
                      </td>
                      <td className="py-2.5 text-navy-600 leading-normal">{log.Details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-navy-400 font-medium">
                      No system logs found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sandbox Card Scan Simulation Section (For Admins/Super Admins only) */}
      <section className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-navy-50 pb-3 gap-2">
          <div>
            <h4 className="font-display font-bold text-sm text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Database size={16} className="text-gold-500" />
              ID Card Verification & Scanner Simulator
            </h4>
            <p className="text-[10px] text-navy-500 font-medium">
              Simulate physical member ID card OCR scans to test the database lookup and verification response flows.
            </p>
          </div>
          <span className="text-[9px] font-mono font-bold bg-navy-50 px-2 py-0.5 rounded text-navy-700 w-fit">
            Internal Audit Tool
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Simulation Controls */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Select Mock Scan Feed</p>
            <div className="flex flex-col gap-2">
              <button 
                type="button"
                onClick={() => handleSimulatedScan("KCE-SDC-26-001")}
                className="w-full bg-navy-50 hover:bg-navy-100 border border-navy-100 hover:border-gold-500 p-2.5 rounded-xl text-left cursor-pointer transition-all text-xs font-semibold text-navy-900 flex justify-between items-center"
              >
                <span>Scan Member: KCE-SDC-26-001</span>
                <span className="text-[10px] font-mono text-slate-500">(Active Exec)</span>
              </button>
              <button 
                type="button"
                onClick={() => handleSimulatedScan("KCE-SDC-26-003")}
                className="w-full bg-navy-50 hover:bg-navy-100 border border-navy-100 hover:border-gold-500 p-2.5 rounded-xl text-left cursor-pointer transition-all text-xs font-semibold text-navy-900 flex justify-between items-center"
              >
                <span>Scan Member: KCE-SDC-26-003</span>
                <span className="text-[10px] font-mono text-slate-500">(Active Lead)</span>
              </button>
              <button 
                type="button"
                onClick={() => handleSimulatedScan("KCE-SDC-26-999")}
                className="w-full bg-navy-50 hover:bg-navy-100 border border-navy-100 hover:border-red-500 p-2.5 rounded-xl text-left cursor-pointer transition-all text-xs font-semibold text-navy-900 flex justify-between items-center"
              >
                <span>Scan Unregistered ID: KCE-SDC-26-999</span>
                <span className="text-[10px] font-mono text-red-500">(Invalid ID)</span>
              </button>
            </div>
          </div>

          {/* Simulation Status & Results display */}
          <div className="md:col-span-2 bg-slate-50/50 border border-navy-50 rounded-2xl p-4 flex flex-col justify-center min-h-[140px]">
            {simulating ? (
              <div className="space-y-3 text-center">
                <RefreshCw size={24} className="animate-spin text-gold-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-navy-900">{simStatus}</p>
                  <div className="w-48 bg-navy-100 h-1 rounded-full mx-auto overflow-hidden">
                    <div className="bg-gold-500 h-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            ) : simResult ? (
              <div className="animate-in fade-in duration-200">
                {simResult.error ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex gap-3 text-xs">
                    <X className="shrink-0 text-red-600 border border-red-300 rounded-full p-0.5 bg-white" size={20} />
                    <div>
                      <p className="font-bold">Verification Failed</p>
                      <p className="text-[10px] mt-0.5">{simResult.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <img 
                      src={simResult.member["Photo URL"] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                      alt={simResult.member.Name} 
                      className="w-16 h-16 rounded-xl object-cover border border-gold-500/20 shrink-0 bg-white"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono font-bold text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded border border-gold-500/10">
                          {simResult.member["Member ID"]}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                          {simResult.member.Status}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-navy-950 truncate">{simResult.member.Name}</h5>
                      <p className="text-xs font-semibold text-navy-600 truncate">{simResult.member.Position}</p>
                      <p className="text-[10px] text-navy-500 font-medium">
                        {simResult.member.Department} • Year {simResult.member.Year}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-navy-400 py-6 space-y-1">
                <Database size={20} className="mx-auto text-navy-300" />
                <p className="text-xs font-semibold">No Simulation Running</p>
                <p className="text-[10px]">Select one of the mock scanners on the left to test verification.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Member Form Modal */}
      <MemberFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddMember}
        existingMembers={members}
        member={null}
      />
    </div>
  );
}
