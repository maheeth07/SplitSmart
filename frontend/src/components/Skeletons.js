import React from 'react';

// Base Shimmer wrapper class
const shimmerClass = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

export const GroupListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className={`h-6 w-32 ${shimmerClass}`}></div>
            <div className={`h-5 w-16 ${shimmerClass}`}></div>
          </div>
          <div className={`h-4 w-full ${shimmerClass}`}></div>
          <div className={`h-4 w-2/3 ${shimmerClass}`}></div>
          <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
            <div className={`h-5 w-20 ${shimmerClass}`}></div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((c) => (
                <div key={c} className={`w-8 h-8 rounded-full border-2 border-white ${shimmerClass}`}></div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ExpenseFeedSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
          <div className="flex items-center space-x-4">
            {/* Category circle */}
            <div className={`w-12 h-12 rounded-xl ${shimmerClass}`}></div>
            {/* Details */}
            <div className="space-y-2">
              <div className={`h-5 w-40 ${shimmerClass}`}></div>
              <div className="flex space-x-2">
                <div className={`h-4 w-24 ${shimmerClass}`}></div>
                <div className={`h-4 w-16 ${shimmerClass}`}></div>
              </div>
            </div>
          </div>
          {/* Amount info */}
          <div className="text-right space-y-2">
            <div className={`h-6 w-20 ${shimmerClass}`}></div>
            <div className={`h-4 w-24 ${shimmerClass}`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SettlementsSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${shimmerClass}`}></div>
              <div className={`h-5 w-28 ${shimmerClass}`}></div>
            </div>
            <div className={`h-6 w-20 ${shimmerClass}`}></div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-50">
            <div className={`h-4 w-44 ${shimmerClass}`}></div>
            <div className={`h-8 w-24 ${shimmerClass}`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};
