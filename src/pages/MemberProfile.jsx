import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Printer, Edit, CheckCircle, Shield, Phone, Mail, Award, Calendar, BookOpen, User } from 'lucide-react';
import MemberFormModal from '../components/MemberFormModal';

export default function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allMembers, setAllMembers] = useState([]);

  const fetchMemberDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMemberById(id);
      if (!res.error) {
        setMember(res.member);
      } else {
        setError(res.message || "Member record not found");
      }

      // Fetch all members to support ID unique checks inside edit modal
      const allRes = await api.getMembers();
      if (!allRes.error) {
        setAllMembers(allRes.members);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sync member profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberDetails();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEdit = async (updatedData) => {
    const res = await api.updateMember(updatedData, user.email);
    if (res.error) {
      throw new Error(res.message);
    }
    setMember(updatedData);
    fetchMemberDetails();
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="h-[400px] bg-white border border-navy-100 rounded-3xl shimmer"></div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Link to="/members" className="inline-flex items-center gap-1 text-xs text-navy-600 font-bold hover:text-gold-600 transition-colors">
          <ArrowLeft size={14} /> Back to Registry
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 text-center">
          <p className="font-bold">Error Accessing Record</p>
          <p className="text-xs mt-1">{error || "Member not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header / Actions (Hidden during print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate('/members')}
          className="inline-flex items-center gap-1 text-xs text-navy-700 font-bold hover:text-gold-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Member List</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 border border-navy-200 bg-white text-navy-800 hover:text-navy-950 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-navy-50 transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Physical Card</span>
          </button>
          
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Edit size={14} />
            <span>Edit Member Info</span>
          </button>
        </div>
      </div>

      {/* ID Card Display Area */}
      <div className="flex flex-col items-center justify-center py-6">
        
        {/* PHYSICAL CARD WRAPPER */}
        <div 
          id="member-id-card"
          className="w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl border border-navy-900/10 bg-white flex flex-col relative aspect-[2.7/4] print:shadow-none print:border-navy-950"
        >
          {/* Top Navy Banner */}
          <div className="bg-navy-950 text-white p-5 flex flex-col items-center text-center border-b-[3px] border-gold-500 relative">
            {/* Tech grid texture in card header */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#102a43_1px,transparent_1px),linear-gradient(to_bottom,#102a43_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-10"></div>
            
            <p className="text-[9px] font-bold text-gold-500 tracking-[0.2em] uppercase leading-none mb-1">
              Software Development Club
            </p>
            <h3 className="font-display font-bold text-xs tracking-tight uppercase">
              Karpagam College of Engineering
            </h3>
            <p className="text-[7px] text-slate-400 font-mono tracking-widest mt-1">
              COIMBATORE, TAMIL NADU, INDIA
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6 flex-1 flex flex-col items-center justify-between bg-gradient-to-b from-white via-slate-50 to-slate-100">
            
            {/* Photo Frame */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl border-[3px] border-navy-950 overflow-hidden bg-slate-50 shadow-md">
                <img
                  src={member["Photo URL"] || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.Name)}&background=0f172a&color=e2c58a&bold=true`}
                  alt={member.Name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.Name)}&background=0f172a&color=e2c58a&bold=true`;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Active Badge overlapping photo */}
              {member.Status === 'Active' && (
                <div className="absolute -bottom-2.5 -right-2.5 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-md">
                  <CheckCircle size={16} className="fill-emerald-500 stroke-white" />
                </div>
              )}
            </div>

            {/* Name & Title */}
            <div className="text-center mt-3">
              <h2 className="font-display font-extrabold text-lg text-navy-950 tracking-tight leading-tight uppercase">
                {member.Name}
              </h2>
              <p className="text-xs font-bold text-gold-600 tracking-wide mt-1 uppercase flex items-center justify-center gap-1">
                <Award size={12} className="inline text-gold-600" />
                {member.Position}
              </p>
            </div>

            {/* Monospace Code ID Bar */}
            <div className="w-full bg-navy-950 text-white rounded-xl py-2 px-3 flex flex-col items-center text-center mt-4 border border-gold-500/20">
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest leading-none">MEMBER IDENTIFIER</span>
              <span className="text-sm font-mono font-bold text-gold-400 tracking-widest mt-0.5 select-all">
                {member["Member ID"]}
              </span>
            </div>

            {/* Student Metadata Fields */}
            <div className="w-full grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-navy-100/80 pt-4 mt-4 text-[10px]">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Department</span>
                <span className="text-navy-900 font-semibold truncate block" title={member.Department}>
                  {member.Department}
                </span>
              </div>
              
              <div className="space-y-0.5 text-right">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Year of Study</span>
                <span className="text-navy-900 font-bold block">Year {member.Year}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Email ID</span>
                <span className="text-navy-900 font-medium truncate block select-all">
                  {member.Email}
                </span>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-slate-400 font-bold uppercase tracking-wider block">Phone Number</span>
                <span className="text-navy-900 font-medium block select-all">
                  {member.Phone}
                </span>
              </div>
            </div>

          </div>

          {/* Card Footer Banner */}
          <div className="bg-navy-900 text-white px-5 py-2.5 flex justify-between items-center text-[8px] border-t border-navy-800">
            <span className="font-semibold text-slate-500">VALID STATUS:</span>
            <span className="font-bold text-emerald-400 tracking-wider flex items-center gap-0.5 uppercase">
              {member.Status === 'Active' ? 'Active ✓' : 'Inactive •'}
            </span>
          </div>

        </div>

      </div>

      {/* CSS Styling to hide header/sidebar during Printing */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          main, .print\\:hidden, header, aside {
            display: none !important;
          }
          #member-id-card {
            box-shadow: none !important;
            border: 2px solid #000 !important;
            margin: auto !important;
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            top: 10% !important;
          }
        }
      `}</style>

      {/* Member Form Modal for editing details */}
      <MemberFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        member={member}
        existingMembers={allMembers}
      />
    </div>
  );
}
