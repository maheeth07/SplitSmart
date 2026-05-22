'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { GroupListSkeleton } from '../../components/Skeletons';
import { Users, Plus, ArrowRight, TrendingUp, TrendingDown, IndianRupee, Loader2, Sparkles, FolderPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModal, setOpenModal] = useState(false);

  // Group Form State
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Balance Summary Card State
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwe, setTotalOwe] = useState(0);

  const router = useRouter();

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load Groups & Fetch settlements to aggregate balances
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/groups');
      if (data.success) {
        setGroups(data.groups);

        // Parallel fetch settlements for each group to aggregate net balances
        let aggregateOwed = 0;
        let aggregateOwe = 0;

        await Promise.all(
          data.groups.map(async (group) => {
            try {
              const settleData = await api.get(`/groups/${group._id}/settlements`);
              if (settleData.success && settleData.balances) {
                const userBalance = settleData.balances.find(
                  (b) => b.userId === user?.id
                );
                if (userBalance) {
                  const net = userBalance.netBalance;
                  if (net > 0) {
                    aggregateOwed += net;
                  } else if (net < 0) {
                    aggregateOwe += Math.abs(net);
                  }
                }
              }
            } catch (err) {
              console.error(`[Dashboard Balance Fetch error for group ${group._id}]:`, err.message);
            }
          })
        );

        setTotalOwed(Math.round(aggregateOwed * 100) / 100);
        setTotalOwe(Math.round(aggregateOwe * 100) / 100);
      }
    } catch (err) {
      console.error('[Dashboard Page Fetch Error]:', err.message);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
      toast.error(err.message || 'Error fetching groups');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadDashboardData();
    }
  }, [isAuthenticated, user?.id, loadDashboardData]);

  // Handle Group Creation
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName) return;

    setSaving(true);
    try {
      const data = await api.post('/groups', {
        name: groupName.trim(),
        description: groupDesc.trim(),
      });

      if (data.success) {
        toast.success(`Group "${groupName}" created successfully!`);
        setGroupName('');
        setGroupDesc('');
        setOpenModal(false);
        // Reload list
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  const netGlobalBalance = Math.round((totalOwed - totalOwe) * 100) / 100;

  if (authLoading || (!isAuthenticated && authLoading)) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[75vh]">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full select-none animate-in fade-in duration-500 flex flex-col gap-8">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, {user?.name}!</span>
            <Sparkles size={18} className="text-amber-500 fill-amber-500 animate-pulse" />
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Manage your group balances, log shared bills, and settle debts efficiently.
          </p>
        </div>
        <button
          onClick={() => setOpenModal(true)}
          className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-150 hover:shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Plus size={16} />
          <span>New Split Group</span>
        </button>
      </div>

      {/* ERROR CORNER - Resiliency Warning Banner */}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl shadow-sm text-left animate-in shake duration-300">
          <div className="flex items-start gap-3">
            <div className="bg-rose-100 p-1.5 rounded-lg text-rose-600">
              <TrendingDown size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-800">Unable to Sync Dashboard Data</h4>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-3 bg-white text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 font-extrabold text-[10px] tracking-wider transition-all"
              >
                RETRY TRANSACTION Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {!error && (
        <>
          {/* Dashboard balance summary widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Global Net Balance */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold tracking-wider text-slate-400">NET STANDING</span>
                <span className={`p-2 rounded-xl text-xs font-bold ${
                  netGlobalBalance > 0 ? 'bg-emerald-50 text-emerald-600' :
                  netGlobalBalance < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  <IndianRupee size={14} />
                </span>
              </div>
              <div>
                <h3 className={`text-2xl font-black ${
                  netGlobalBalance > 0 ? 'text-emerald-500' :
                  netGlobalBalance < 0 ? 'text-rose-500' : 'text-slate-700'
                }`}>
                  {netGlobalBalance > 0 ? `+₹${netGlobalBalance.toFixed(2)}` :
                   netGlobalBalance < 0 ? `-₹${Math.abs(netGlobalBalance).toFixed(2)}` : '₹0.00'}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  {netGlobalBalance > 0 ? 'You are net positive across all groups' :
                   netGlobalBalance < 0 ? 'You owe money in total standings' : 'No pending balances'}
                </span>
              </div>
            </div>

            {/* Total You Owe */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold tracking-wider text-slate-400">TOTAL YOU OWE</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <TrendingDown size={14} />
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-rose-500">
                  ₹{totalOwe.toFixed(2)}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  Debts outstanding that require settlement
                </span>
              </div>
            </div>

            {/* Total You Owed */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold tracking-wider text-slate-400">TOTAL YOU ARE OWED</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp size={14} />
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-emerald-500">
                  ₹{totalOwed.toFixed(2)}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                  Credits due to be collected from members
                </span>
              </div>
            </div>
          </div>

          {/* Group Grid Panel */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-900 tracking-wider flex items-center gap-2">
              <Users size={16} className="text-indigo-600" />
              <span>ACTIVE GROUPS ({groups.length})</span>
            </h2>

            {loading ? (
              <GroupListSkeleton />
            ) : groups.length === 0 ? (
              /* EMPTY STATE */
              <div className="border border-dashed border-slate-200 rounded-3xl py-12 px-6 bg-white text-center flex flex-col items-center gap-4 animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No active split groups found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Create your first group to start inviting members, adding shared bills, and calculating settlements dynamically!
                  </p>
                </div>
                <button
                  onClick={() => setOpenModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
                >
                  Create your first Group
                </button>
              </div>
            ) : (
              /* GROUP GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <div
                    key={group._id}
                    onClick={() => router.push(`/groups/${group._id}`)}
                    className="border border-slate-100 rounded-3xl p-6 bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:-translate-y-0.5"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                          {group.name}
                        </h3>
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {group.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-500">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Created by {group.createdBy?._id === user?.id ? 'You' : group.createdBy?.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-indigo-600 group-hover:gap-1.5 transition-all">
                        <span>Workspace</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal - Create Group Form */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 select-none animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Create a New Split Group</h3>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-slate-700">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roommates, Trip to Paris"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={saving}
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  placeholder="Summarize what expenses are tracked..."
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  disabled={saving}
                  rows="3"
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !groupName}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-98 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating Group...</span>
                  </>
                ) : (
                  <span>Create Group</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
