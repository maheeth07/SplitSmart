'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, AlertCircle, WifiOff, FileSearch, Settings, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SimulationController() {
  const [isOpen, setIsOpen] = useState(false);
  const [delay, setDelay] = useState(0);
  const [failure, setFailure] = useState(false);
  const [empty, setEmpty] = useState(false);

  // Sync state from localStorage on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDelay = localStorage.getItem('sim_delay') || '0';
      const savedFailure = localStorage.getItem('sim_failure') === 'true';
      const savedEmpty = localStorage.getItem('sim_empty') === 'true';

      setDelay(Number(savedDelay));
      setFailure(savedFailure);
      setEmpty(savedEmpty);
    }
  }, []);

  const handleToggleFailure = (val) => {
    setFailure(val);
    localStorage.setItem('sim_failure', val ? 'true' : 'false');
    if (val) {
      toast.error('Simulation Active: Forced API Failures (500)', { id: 'sim-fail' });
    } else {
      toast.success('Simulation Disabled: Forced API Failures', { id: 'sim-fail' });
    }
    // Refresh page to take immediate effect
    setTimeout(() => window.location.reload(), 600);
  };

  const handleToggleEmpty = (val) => {
    setEmpty(val);
    localStorage.setItem('sim_empty', val ? 'true' : 'false');
    if (val) {
      toast.error('Simulation Active: Forced Empty API Responses', { id: 'sim-empty' });
    } else {
      toast.success('Simulation Disabled: Forced Empty Responses', { id: 'sim-empty' });
    }
    setTimeout(() => window.location.reload(), 600);
  };

  const handleDelayChange = (val) => {
    setDelay(val);
    localStorage.setItem('sim_delay', val.toString());
    if (val > 0) {
      toast.success(`Simulation Active: Synthetic ${val}ms Network Latency`, { id: 'sim-delay' });
    } else {
      toast.success('Simulation Disabled: Synthetic Latency', { id: 'sim-delay' });
    }
  };

  const activeCount = (delay > 0 ? 1 : 0) + (failure ? 1 : 0) + (empty ? 1 : 0);

  return (
    <>
      {/* Active simulation warnings bar at the top of the viewport */}
      {activeCount > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white py-1.5 px-4 text-xs font-semibold flex justify-center items-center gap-4 shadow-md select-none animate-pulse">
          <div className="flex items-center gap-1">
            <ShieldAlert size={14} className="animate-spin-slow" />
            <span>ENG-MODE ACTIVE:</span>
          </div>
          <div className="flex gap-3">
            {delay > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <WifiOff size={11} /> Delay: {delay}ms
              </span>
            )}
            {failure && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-bounce">
                <AlertCircle size={11} /> Forced API Errors (500)
              </span>
            )}
            {empty && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <FileSearch size={11} /> Empty States (Mock)
              </span>
            )}
          </div>
          <button 
            onClick={() => {
              setDelay(0);
              setFailure(false);
              setEmpty(false);
              localStorage.setItem('sim_delay', '0');
              localStorage.setItem('sim_failure', 'false');
              localStorage.setItem('sim_empty', 'false');
              toast.success('All simulations cleared!');
              setTimeout(() => window.location.reload(), 600);
            }}
            className="text-xs bg-white text-rose-600 px-2.5 py-0.5 rounded-md hover:bg-rose-50 font-bold transition-all ml-2 active:scale-95"
          >
            Reset
          </button>
        </div>
      )}

      {/* Floating Widget Action Panel */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-full shadow-2xl hover:bg-slate-800 transition-all active:scale-95 hover:scale-105 border border-slate-700"
          >
            <Settings size={18} className={`animate-spin-slow group-hover:rotate-45 transition-transform duration-500`} />
            <span className="text-xs font-semibold tracking-wider">SIMULATION TOOL</span>
            {activeCount > 0 && (
              <span className="bg-amber-500 text-slate-900 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {activeCount}
              </span>
            )}
          </button>
        ) : (
          <div className="bg-slate-950 text-white rounded-3xl p-6 w-80 shadow-3xl border border-slate-800 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" />
                <h4 className="text-sm font-bold tracking-wider">Fault Resiliency Hub</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Slider: Network Delay */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Synthetic API Delay</span>
                <span className="text-amber-400 font-bold">{delay === 0 ? 'Disabled' : `${delay}ms`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="4000"
                step="500"
                value={delay}
                onChange={(e) => handleDelayChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500">Simulates slow network speeds to test skeleton UI and loading spinners.</span>
            </div>

            {/* Switch: Forced Failures */}
            <div className="flex items-center justify-between border-t border-slate-900 pt-4">
              <div className="flex flex-col gap-0.5 w-[75%]">
                <span className="text-xs font-semibold text-slate-300">Simulate Server Failures</span>
                <span className="text-[10px] text-slate-500">Injects random HTTP 500 errors to validate recovery.</span>
              </div>
              <button
                onClick={() => handleToggleFailure(!failure)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  failure ? 'bg-rose-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    failure ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Switch: Empty States */}
            <div className="flex items-center justify-between border-t border-slate-900 pt-4 pb-1">
              <div className="flex flex-col gap-0.5 w-[75%]">
                <span className="text-xs font-semibold text-slate-300">Simulate Empty States</span>
                <span className="text-[10px] text-slate-500">Forces endpoint logs to return empty arrays [].</span>
              </div>
              <button
                onClick={() => handleToggleEmpty(!empty)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  empty ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    empty ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Status Footer */}
            <div className="bg-slate-900/50 rounded-2xl p-3 text-[10px] text-slate-400 leading-relaxed flex items-start gap-2 border border-slate-900">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0 animate-ping" />
              <span>
                Changes sync immediately with the API fetch client headers. Toggle switches to see immediate UI transitions!
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
