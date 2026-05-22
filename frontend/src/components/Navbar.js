'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { IndianRupee, LogOut, User, Users, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <nav className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/75 border-b border-slate-100 transition-all select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-all">
                <IndianRupee size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                Split<span className="text-indigo-600 font-extrabold">Smart</span>
              </span>
            </Link>
          </div>

          {/* User Section / Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Users size={14} />
                  <span>My Groups</span>
                </Link>

                <div className="h-4 w-px bg-slate-200" />

                {/* Profile Widget */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    {user?.name ? user.name[0].toUpperCase() : <User size={14} />}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-slate-400">{user?.email}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition-all active:scale-95 border border-slate-100 hover:border-rose-100"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
