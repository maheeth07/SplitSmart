'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { IndianRupee, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          throw new Error('Please fill in all fields');
        }
        await login(email.trim(), password);
        toast.success('Welcome back to SplitSmart!');
      } else {
        if (!name || !email || !password) {
          throw new Error('Please fill in all fields');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        await register(name.trim(), email.trim(), password);
        toast.success('Registration successful! Welcome to SplitSmart.');
      }
      router.push('/dashboard');
    } catch (err) {
      console.error('[Auth Page Submit Exception]:', err.message);
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[75vh]">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <span className="text-xs font-semibold text-slate-500 mt-3 tracking-widest animate-pulse">
          INITIALIZING SECURE SESSION...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-slate-100 to-indigo-50/20 select-none">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Brand Brand Card Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-4 animate-bounce">
            <IndianRupee size={24} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isLogin ? 'Sign in to SplitSmart' : 'Create an Account'}
          </h2>
          <p className="mt-2.5 text-xs font-medium text-slate-500 leading-relaxed">
            {isLogin ? "Keep track of bills and settle shared debts smoothly." : "Register now to start splitting bills and sorting transactions."}
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {authError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl animate-in shake duration-300">
                <p className="text-xs font-semibold text-rose-700 leading-tight">{authError}</p>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-98 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError('');
              }}
              disabled={submitting}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already registered? Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
