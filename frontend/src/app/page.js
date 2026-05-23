'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { IndianRupee, ShieldAlert, Zap, TrendingUp, Users, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="flex-grow flex flex-col justify-center items-center select-none bg-gradient-to-b from-white via-slate-50 to-indigo-50/20 text-slate-900">
      
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center flex flex-col items-center gap-6 animate-in fade-in slide-in-from-top-6 duration-700">
        
        {/* Sparkle badge */}
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm shadow-indigo-100/50">
          <Sparkles size={13} className="text-indigo-600 fill-indigo-100" />
          <span>Intelligent MVC Expense Splitter</span>
        </div>

        {/* Big Heading */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-slate-900 max-w-2xl">
          Split Shared Bills,<br />
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
            Simplify Group Debts.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-500 text-sm sm:text-base max-w-lg leading-relaxed font-medium">
          Effortlessly track roommates&apos; bills, dinner expenses, or vacation costs. Automatically minimize payments using our greedy debt minimization engine.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 mt-2">
          {loading ? (
            <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
          ) : (
            <Link
              href={isAuthenticated ? '/dashboard' : '/login'}
              className="group inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get Started Now</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 w-full animate-in fade-in duration-1000">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Debt Simplifier */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
              <Zap size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Greedy Debt Simplification</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Our optimized greedy matchmaking algorithm simplifies complex circular debts down to the fewest possible transaction steps.
              </p>
            </div>
          </div>

          {/* Card 2: Flexible Splits */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <TrendingUp size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Flexible Split Strategies</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Split shared bills by exact dollar ratios, percentages, or equal portions. Auto-detect category keywords dynamically!
              </p>
            </div>
          </div>

          {/* Card 3: Fault Resiliency */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 text-left hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <ShieldAlert size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Edge-Case Resiliency Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Engineered to handle flaky environments. Test app resilience dynamically with network latencies, empty sets, or forced API crashes.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
