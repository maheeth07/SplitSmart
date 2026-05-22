'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../utils/api';
import { ExpenseFeedSkeleton, SettlementsSkeleton } from '../../../components/Skeletons';
import {
  ArrowLeft,
  Plus,
  UserPlus,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  IndianRupee,
  Coffee,
  Car,
  Tv,
  ShoppingBag,
  Cpu,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Check,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Helper: map string category to lucide icons & styles
const categoryConfigs = {
  Food: { icon: Coffee, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', color: 'text-emerald-600' },
  Transport: { icon: Car, bg: 'bg-blue-50 text-blue-600 border-blue-100', color: 'text-blue-600' },
  Entertainment: { icon: Tv, bg: 'bg-violet-50 text-violet-600 border-violet-100', color: 'text-violet-600' },
  Shopping: { icon: ShoppingBag, bg: 'bg-rose-50 text-rose-600 border-rose-100', color: 'text-rose-600' },
  Utilities: { icon: Cpu, bg: 'bg-amber-50 text-amber-600 border-amber-100', color: 'text-amber-600' },
  Others: { icon: HelpCircle, bg: 'bg-slate-50 text-slate-500 border-slate-100', color: 'text-slate-500' },
};

export default function GroupDetailsPage({ params }) {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const groupId = params?.id;

  // Group Details States
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = latest first, asc = oldest first

  // Modals Toggles
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Expense Form State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Others');
  const [expenseSplitType, setExpenseSplitType] = useState('EQUAL');
  const [expenseSplits, setExpenseSplits] = useState([]); // Array of { user, amount, percentage, checked }
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [categoryAutodetected, setCategoryAutodetected] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load Group Data & Settlements & Expenses
  const loadGroupDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch group metadata
      const groupData = await api.get(`/groups/${groupId}`);
      if (groupData.success) {
        setGroup(groupData.group);
        // Default payer to current user
        setExpensePayer(currentUser?.id || '');
      }

      // 2. Fetch expenses
      // Build filter parameters for search, member, sorting
      let expenseQuery = `/expenses?group=${groupId}&sortBy=date&order=${sortOrder}`;
      if (searchQuery) expenseQuery += `&search=${encodeURIComponent(searchQuery)}`;
      if (memberFilter) expenseQuery += `&member=${encodeURIComponent(memberFilter)}`;

      const expenseData = await api.get(expenseQuery);
      if (expenseData.success) {
        setExpenses(expenseData.expenses);
      }

      // 3. Fetch settlements
      const settlementData = await api.get(`/groups/${groupId}/settlements`);
      if (settlementData.success) {
        setBalances(settlementData.balances);
        setSettlements(settlementData.settlements);
      }
    } catch (err) {
      console.error('[Group Details Fetch error]:', err.message);
      setError(err.message || 'Failed to load group details.');
      toast.error(err.message || 'Error loading group workspace');
    } finally {
      setLoading(false);
    }
  }, [groupId, currentUser?.id, searchQuery, memberFilter, sortOrder]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.id && groupId) {
      loadGroupDetails();
    }
  }, [isAuthenticated, currentUser?.id, groupId, loadGroupDetails]);

  // Invite Member Submit
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    try {
      const data = await api.post(`/groups/${groupId}/members`, {
        email: inviteEmail.trim().toLowerCase(),
      });
      if (data.success) {
        toast.success('Member added successfully!');
        setInviteEmail('');
        setOpenInviteModal(false);
        loadGroupDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  // Real-time category analyzer (Task 8 UX enhancement!)
  const analyzeDescriptionCategory = (text) => {
    const query = text.toLowerCase();
    let detected = 'Others';

    const foodKeywords = ['coffee', 'starbucks', 'pizza', 'burger', 'restaurant', 'dinner', 'lunch', 'food', 'drinks', 'grocery', 'groceries', 'beer', 'cafe', 'cafe', 'hotel', 'snack', 'snacks'];
    const transportKeywords = ['uber', 'lyft', 'taxi', 'cab', 'flight', 'ticket', 'train', 'bus', 'subway', 'car', 'gas', 'petrol', 'parking', 'toll'];
    const entertainmentKeywords = ['netflix', 'spotify', 'cinema', 'movie', 'ticket', 'concert', 'game', 'pub', 'club', 'leisure', 'museum', 'bowling', 'party'];
    const shoppingKeywords = ['target', 'walmart', 'amazon', 'mall', 'clothes', 'shoes', 'shopping', 'gift', 'gifts', 'book', 'books'];
    const utilityKeywords = ['rent', 'electricity', 'wifi', 'water', 'gas', 'power', 'bill', 'bills', 'utilities', 'internet', 'subscription'];

    if (foodKeywords.some(kw => query.includes(kw))) detected = 'Food';
    else if (transportKeywords.some(kw => query.includes(kw))) detected = 'Transport';
    else if (entertainmentKeywords.some(kw => query.includes(kw))) detected = 'Entertainment';
    else if (shoppingKeywords.some(kw => query.includes(kw))) detected = 'Shopping';
    else if (utilityKeywords.some(kw => query.includes(kw))) detected = 'Utilities';

    if (detected !== 'Others') {
      setExpenseCategory(detected);
      if (!categoryAutodetected) {
        setCategoryAutodetected(true);
        // Short bounce pulse visual
        setTimeout(() => setCategoryAutodetected(false), 1500);
      }
    }
  };

  const handleDescChange = (val) => {
    setExpenseDesc(val);
    analyzeDescriptionCategory(val);
  };

  // Initialize splits checkboxes when modal opens or amount changes
  const initExpenseFormSplits = useCallback((expense = null) => {
    if (!group) return;

    if (expense) {
      // We are EDITING
      const splitMap = {};
      expense.splits.forEach(s => {
        splitMap[s.user._id.toString()] = s.amount;
      });

      const initialSplits = group.members.map(member => {
        const hasSplit = splitMap[member._id.toString()] !== undefined;
        return {
          user: member._id,
          name: member.name,
          email: member.email,
          checked: hasSplit,
          amount: hasSplit ? splitMap[member._id.toString()] : '',
          percentage: hasSplit ? Math.round((splitMap[member._id.toString()] / expense.amount) * 100) : '',
        };
      });
      setExpenseSplits(initialSplits);
    } else {
      // NEW EXPENSE
      const initialSplits = group.members.map(member => ({
        user: member._id,
        name: member.name,
        email: member.email,
        checked: true, // select all by default
        amount: '',
        percentage: '',
      }));
      setExpenseSplits(initialSplits);
    }
  }, [group]);

  // Open Add/Edit Modal
  const handleOpenExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseDesc(expense.description);
      setExpenseAmount(expense.amount.toString());
      setExpensePayer(expense.paidBy._id.toString());
      setExpenseCategory(expense.category);
      setExpenseSplitType(expense.splitType);
      setOpenExpenseModal(true);
      // Wait for group to populate
      setTimeout(() => initExpenseFormSplits(expense), 50);
    } else {
      setEditingExpense(null);
      setExpenseDesc('');
      setExpenseAmount('');
      setExpensePayer(currentUser?.id || '');
      setExpenseCategory('Others');
      setExpenseSplitType('EQUAL');
      setOpenExpenseModal(true);
      setTimeout(() => initExpenseFormSplits(), 50);
    }
  };

  // Toggle Split checked participant
  const toggleSplitUser = (userId) => {
    setExpenseSplits(prev =>
      prev.map(s => (s.user === userId ? { ...s, checked: !s.checked } : s))
    );
  };

  // Update split input for exact / percentages
  const handleSplitValueChange = (userId, field, val) => {
    setExpenseSplits(prev =>
      prev.map(s => (s.user === userId ? { ...s, [field]: val } : s))
    );
  };

  // Save Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount || !expensePayer) {
      toast.error('Please specify description, amount, and payer');
      return;
    }

    const amountNum = Number(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const checkedSplits = expenseSplits.filter(s => s.checked);
    if (checkedSplits.length === 0) {
      toast.error('Please select at least one participant to split the bill');
      return;
    }

    // Build splits payloads depending on strategy
    let formattedSplits = [];
    if (expenseSplitType === 'EQUAL') {
      formattedSplits = checkedSplits.map(s => ({ user: s.user }));
    } else if (expenseSplitType === 'EXACT') {
      let sum = 0;
      formattedSplits = checkedSplits.map(s => {
        const val = Number(s.amount);
        if (isNaN(val) || val < 0) {
          throw new Error(`Please specify a valid share amount for ${s.name}`);
        }
        sum += val;
        return { user: s.user, amount: val };
      });
      if (Math.abs(sum - amountNum) > 0.05) {
        toast.error(`Split shares total (₹${sum.toFixed(2)}) must match expense amount (₹${amountNum.toFixed(2)})`);
        return;
      }
    } else if (expenseSplitType === 'PERCENTAGE') {
      let percentSum = 0;
      formattedSplits = checkedSplits.map(s => {
        const val = Number(s.percentage);
        if (isNaN(val) || val < 0) {
          throw new Error(`Please specify a valid percentage share for ${s.name}`);
        }
        percentSum += val;
        return { user: s.user, percentage: val };
      });
      if (Math.abs(percentSum - 100) > 0.01) {
        toast.error(`Total splits percentages (${percentSum}%) must sum up to exactly 100%`);
        return;
      }
    }

    setExpenseSaving(true);
    try {
      const payload = {
        description: expenseDesc.trim(),
        amount: amountNum,
        paidBy: expensePayer,
        group: groupId,
        splitType: expenseSplitType,
        splits: formattedSplits,
        category: expenseCategory,
        date: editingExpense ? editingExpense.date : new Date(),
      };

      let res;
      if (editingExpense) {
        res = await api.put(`/expenses/${editingExpense._id}`, payload);
      } else {
        res = await api.post('/expenses', payload);
      }

      if (res.success) {
        toast.success(editingExpense ? 'Expense updated!' : 'Expense logged successfully!');
        setOpenExpenseModal(false);
        loadGroupDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save expense');
    } finally {
      setExpenseSaving(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense log?')) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.success) {
        toast.success('Expense deleted successfully');
        loadGroupDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    }
  };

  // Quick Settle-up logger (Task 7!)
  const handleSettleDebt = async (debt) => {
    const confirmMessage = `Record a payment of ₹${debt.amount.toFixed(2)} from ${debt.fromName} to ${debt.toName}?`;
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    try {
      // Log settle-up as an expense item with EQUAL splits only between from and to, paid by 'from'
      const payload = {
        description: `Settle-Up: ${debt.fromName} paid ${debt.toName}`,
        amount: debt.amount,
        paidBy: debt.from,
        group: groupId,
        splitType: 'EXACT',
        splits: [
          { user: debt.to, amount: debt.amount } // 'to' owes 'from' the amount (clearing the balance)
        ],
        category: 'Others',
        date: new Date(),
      };

      const res = await api.post('/expenses', payload);
      if (res.success) {
        toast.success(`Registered payment of ₹${debt.amount.toFixed(2)}!`);
        loadGroupDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to register settlement');
      setLoading(false);
    }
  };

  const currentMemberStanding = balances.find(b => b.userId === currentUser?.id);
  const netStanding = currentMemberStanding ? currentMemberStanding.netBalance : 0;

  if (authLoading || (!isAuthenticated && authLoading)) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[75vh]">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full select-none animate-in fade-in duration-500 flex flex-col gap-6">
      
      {/* Return to Dashboard */}
      <div>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Main error boundary alert */}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl shadow-sm text-left">
          <h4 className="text-sm font-bold text-rose-800">Connection Error</h4>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <button
            onClick={loadGroupDetails}
            className="mt-3 bg-white text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 font-extrabold text-[10px] tracking-wider transition-all"
          >
            RETRY WORKSPACE FETCH
          </button>
        </div>
      )}

      {group && !error && (
        <>
          {/* Workspace Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {group.name}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {group.description || 'Tracking bills and splits for group participants.'}
              </p>
            </div>
            
            {/* Net Balance standing widget */}
            <div className="flex gap-4 items-center shrink-0">
              <div className="bg-slate-50 rounded-2xl px-4 py-2 border border-slate-100 text-left">
                <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">YOUR BALANCE</span>
                <span className={`text-base font-black ${
                  netStanding > 0 ? 'text-emerald-500' :
                  netStanding < 0 ? 'text-rose-500' : 'text-slate-600'
                }`}>
                  {netStanding > 0 ? `+₹${netStanding.toFixed(2)}` :
                   netStanding < 0 ? `-₹${Math.abs(netStanding).toFixed(2)}` : '₹0.00'}
                </span>
              </div>
              <button
                onClick={() => handleOpenExpenseModal()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-150 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={16} />
                <span>Log Expense</span>
              </button>
            </div>
          </div>

          {/* Grid Layout splits: Left (Expenses) and Right (Members & Settlements) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: EXPENSES FEED */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Search & filters bar */}
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search expense description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex w-full md:w-auto gap-3 shrink-0">
                  {/* Filter by Member */}
                  <div className="relative w-full md:w-40">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Filter size={12} />
                    </div>
                    <select
                      value={memberFilter}
                      onChange={(e) => setMemberFilter(e.target.value)}
                      className="block w-full pl-7.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">All Members</option>
                      {group.members.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Order Toggle */}
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap shrink-0"
                    title="Toggle Date Sort Order"
                  >
                    <ArrowUpDown size={12} />
                    <span>{sortOrder === 'desc' ? 'Latest' : 'Oldest'}</span>
                  </button>
                </div>
              </div>

              {/* Feed Card */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-xs font-black text-slate-800 tracking-wider">EXPENSE TRANSACTION RECORD</h2>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                    {expenses.length} logs
                  </span>
                </div>

                {loading ? (
                  <ExpenseFeedSkeleton />
                ) : expenses.length === 0 ? (
                  /* EMPTY STATE EXPENSES */
                  <div className="border border-dashed border-slate-200 rounded-3xl py-12 px-6 bg-white text-center flex flex-col items-center gap-3 animate-in fade-in duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <IndianRupee size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">No expense records found</h4>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        There are no logged bills that match your search filters. Click &quot;Log Expense&quot; to start!
                      </p>
                    </div>
                  </div>
                ) : (
                  /* EXPENSE FEED LIST */
                  <div className="space-y-3">
                    {expenses.map((expense) => {
                      const cfg = categoryConfigs[expense.category] || categoryConfigs.Others;
                      const Icon = cfg.icon;

                      // Check splits to see what current user owes
                      const userSplit = expense.splits.find(
                        s => s.user?._id === currentUser?.id || s.user === currentUser?.id
                      );
                      const isPayer = expense.paidBy._id === currentUser?.id;
                      const userOwedShare = userSplit ? userSplit.amount : 0;

                      return (
                        <div
                          key={expense._id}
                          className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white hover:border-slate-200 hover:shadow-sm transition-all group relative overflow-hidden"
                        >
                          <div className="flex items-center space-x-4">
                            {/* Visual Category Badge */}
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-102 shrink-0 ${cfg.bg}`}>
                              <Icon size={20} />
                            </div>

                            {/* Details */}
                            <div className="text-left space-y-0.5">
                              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                {expense.description}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold">
                                Paid by <span className="text-slate-600 font-bold">{isPayer ? 'You' : expense.paidBy.name}</span> on {new Date(expense.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Amounts standing */}
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 block">₹{expense.amount.toFixed(2)}</span>
                              {isPayer ? (
                                <span className="text-[9px] text-emerald-500 font-bold block uppercase tracking-wide">
                                  You lent ₹{(expense.amount - userOwedShare).toFixed(2)}
                                </span>
                              ) : (
                                <span className={`text-[9px] font-bold block uppercase tracking-wide ${userOwedShare > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                  {userOwedShare > 0 ? `You owe ₹${userOwedShare.toFixed(2)}` : 'No split'}
                                </span>
                              )}
                            </div>

                            {/* Edit / Delete actions when hover */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenExpenseModal(expense)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Edit Expense"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Expense"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: MEMBERS & SETTLEMENTS */}
            <div className="space-y-6">
              
              {/* Balances & Settlement Flow chart */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <h2 className="text-xs font-black text-slate-800 tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-emerald-500" />
                    <span>DEBT SETTLEMENT PLAN</span>
                  </h2>
                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Optimized
                  </span>
                </div>

                {loading ? (
                  <SettlementsSkeleton />
                ) : settlements.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                      <Check size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">All balances are settled!</h4>
                      <p className="text-[9px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                        Circular debts have been simplified. No payments are currently pending in this group.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* SETTLEMENTS MINIMIZED FEED */
                  <div className="space-y-4">
                    {/* Visual Flow chart (Task 7 premium element!) */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block text-left">
                        Payment Direction Flowchart
                      </span>
                      <div className="space-y-3">
                        {settlements.map((debt, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs bg-white rounded-xl p-3 border border-slate-100 hover:border-indigo-150 transition-all">
                            {/* Debtor */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[9px] font-bold text-rose-600">
                                {debt.fromName[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-700 truncate max-w-[65px]">{debt.fromName}</span>
                            </div>
                            
                            {/* Direction Arrow & Value */}
                            <div className="flex flex-col items-center flex-grow mx-2">
                              <span className="text-[10px] font-black text-slate-900">₹{debt.amount.toFixed(2)}</span>
                              <div className="w-full flex items-center justify-center gap-0.5 text-slate-300">
                                <div className="h-0.5 bg-slate-200 w-full" />
                                <ArrowRight size={10} className="text-indigo-500 animate-pulse shrink-0" />
                              </div>
                            </div>

                            {/* Creditor */}
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700 truncate max-w-[65px]">{debt.toName}</span>
                              <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-600">
                                {debt.toName[0].toUpperCase()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions list */}
                    <div className="space-y-2.5 pt-1">
                      {settlements.map((debt, idx) => {
                        const canSettle = debt.from === currentUser?.id;
                        return (
                          <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl bg-white hover:shadow-xs transition-all">
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">
                                {debt.fromName} owes {debt.toName}
                              </p>
                              <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                                Pending split settlement
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-rose-500 mr-1">₹{debt.amount.toFixed(2)}</span>
                              {canSettle && (
                                <button
                                  onClick={() => handleSettleDebt(debt)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                                >
                                  Settle Up
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Members Manager Panel */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <h2 className="text-xs font-black text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Users size={16} className="text-indigo-600" />
                    <span>GROUP MEMBERS ({group.members.length})</span>
                  </h2>
                  <button
                    onClick={() => setOpenInviteModal(true)}
                    className="p-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                    title="Add Member"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>

                {/* Member avatars list */}
                <div className="space-y-3">
                  {group.members.map((member) => {
                    const balanceItem = balances.find(b => b.userId === member._id);
                    const bal = balanceItem ? balanceItem.netBalance : 0;
                    return (
                      <div key={member._id} className="flex items-center justify-between py-1 px-0.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200">
                            {member.name[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-bold text-slate-800 block leading-tight">{member.name}</span>
                            <span className="text-[9px] text-slate-400 block">{member.email}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold ${
                          bal > 0 ? 'text-emerald-500' :
                          bal < 0 ? 'text-rose-500' : 'text-slate-400'
                        }`}>
                          {bal > 0 ? `+₹${bal.toFixed(2)}` :
                           bal < 0 ? `-₹${Math.abs(bal).toFixed(2)}` : 'Settled'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal - Add / Edit Expense */}
      {openExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 select-none animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <IndianRupee size={18} className="text-indigo-600" />
                <span>{editingExpense ? 'Modify Expense Log' : 'Add Shared Expense'}</span>
              </h3>
              <button
                onClick={() => setOpenExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveExpense} className="space-y-4 mt-4 text-left">
              
              {/* Description Input & detector */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-700 tracking-wider uppercase block">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starbucks, Uber Ride, Electricity Bill"
                  value={expenseDesc}
                  onChange={(e) => handleDescChange(e.target.value)}
                  disabled={expenseSaving}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                />
              </div>

              {/* Amount & Payer row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 tracking-wider uppercase block">Total Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    disabled={expenseSaving}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-700 tracking-wider uppercase block">Paid By</label>
                  <select
                    value={expensePayer}
                    onChange={(e) => setExpensePayer(e.target.value)}
                    disabled={expenseSaving}
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                  >
                    {group.members.map(m => (
                      <option key={m._id} value={m._id}>{m.name} {m._id === currentUser?.id ? '(You)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category row featuring detector animations (Task 8 UX!) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-700 tracking-wider uppercase">Category</label>
                  {categoryAutodetected && (
                    <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full animate-bounce flex items-center gap-1">
                      <Sparkles size={10} /> Auto-suggested
                    </span>
                  )}
                </div>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  disabled={expenseSaving}
                  className={`block w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs ${
                    categoryAutodetected ? 'border-indigo-400 ring-2 ring-indigo-500/10' : 'border-slate-200'
                  }`}
                >
                  <option value="Food">Food & Café</option>
                  <option value="Transport">Transport & Gas</option>
                  <option value="Entertainment">Entertainment & Leisure</option>
                  <option value="Shopping">Shopping & Gifts</option>
                  <option value="Utilities">Utilities & Bills</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Split strategy selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-700 tracking-wider uppercase block">Split Strategy</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {['EQUAL', 'EXACT', 'PERCENTAGE'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setExpenseSplitType(type)}
                      className={`py-1.5 rounded-lg text-[10px] font-black transition-all ${
                        expenseSplitType === type
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic split inputs list (checkboxes, values, percentages) */}
              <div className="space-y-2.5 pt-2 border-t border-slate-50 max-h-44 overflow-y-auto">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Select Participants Share
                </span>
                
                <div className="space-y-2">
                  {expenseSplits.map((split, idx) => (
                    <div key={split.user} className="flex items-center justify-between py-1.5 px-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={split.checked}
                          onChange={() => toggleSplitUser(split.user)}
                          className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/25"
                        />
                        <div className="text-left leading-none">
                          <span className="text-xs font-bold text-slate-800 block">{split.name}</span>
                          <span className="text-[9px] text-slate-400">{split.email}</span>
                        </div>
                      </div>

                      {/* Share amount builders */}
                      {split.checked && (
                        <div className="flex items-center">
                          {expenseSplitType === 'EXACT' && (
                            <div className="relative w-24">
                              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={split.amount}
                                onChange={(e) => handleSplitValueChange(split.user, 'amount', e.target.value)}
                                className="block w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right text-slate-900 focus:outline-none"
                              />
                            </div>
                          )}
                          {expenseSplitType === 'PERCENTAGE' && (
                            <div className="relative w-20">
                              <input
                                type="number"
                                placeholder="0"
                                value={split.percentage}
                                onChange={(e) => handleSplitValueChange(split.user, 'percentage', e.target.value)}
                                className="block w-full pr-6 pl-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right text-slate-900 focus:outline-none"
                              />
                              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">%</span>
                            </div>
                          )}
                          {expenseSplitType === 'EQUAL' && (
                            <span className="text-[10px] font-bold text-slate-400">
                              ₹{(Number(expenseAmount) > 0 ? (Number(expenseAmount) / expenseSplits.filter(s=>s.checked).length) : 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                disabled={expenseSaving}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-98 disabled:opacity-50"
              >
                {expenseSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving Expense...</span>
                  </>
                ) : (
                  <span>{editingExpense ? 'Update Expense' : 'Log Shared Expense'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Invite Member by Email */}
      {openInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 select-none animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 text-left">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Invite Group Member</h3>
              </div>
              <button
                onClick={() => setOpenInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4 mt-4 text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Member Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={inviting || !inviteEmail}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-98 disabled:opacity-50"
              >
                {inviting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Adding Member...</span>
                  </>
                ) : (
                  <span>Add to Group</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
