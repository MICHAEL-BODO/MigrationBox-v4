"use client";

import React from 'react';
import { useSystemControl } from '../../contexts/SystemControlContext';

export function SystemStatusHeader() {
  const { systemState, setSystemState, runDiagnostics, isDiagnosticsRunning } = useSystemControl();

  const getStatusColor = () => {
    switch (systemState) {
      case 'ON': return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
      case 'STANDBY': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]';
      case 'OFF': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
    }
  };

  const getStatusText = () => {
    switch (systemState) {
      case 'ON': return 'SYSTEM ACTIVE';
      case 'STANDBY': return 'STANDBY MODE';
      case 'OFF': return 'SYSTEM OFFLINE';
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#0A1628] border-b border-gray-800">
      <div className="flex items-center gap-4">
        {/* Placeholder for future left-side content */}
      </div>

      {/* Center Control Cluster */}
      <div className="flex items-center gap-6 bg-[#0f1e36] px-6 py-2 rounded-full border border-gray-700/50">
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-700">
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${getStatusColor()}`} />
          <span className="text-gray-300 text-xs font-mono tracking-wider">{getStatusText()}</span>
        </div>

        {/* Master Control Switch */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono uppercase">Master Control</span>
          <div className="flex bg-black/40 rounded p-1 border border-gray-700">
            {/* OFF Button */}
            <button
              onClick={() => setSystemState('OFF')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                systemState === 'OFF' 
                  ? 'bg-red-900/50 text-red-400 border border-red-800 shadow-inner' 
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              OFF
            </button>
            {/* STANDBY Button */}
            <button
              onClick={() => setSystemState('STANDBY')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                systemState === 'STANDBY' 
                  ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800 shadow-inner' 
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              STBY
            </button>
            {/* ON Button */}
            <button
              onClick={() => setSystemState('ON')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                systemState === 'ON' 
                  ? 'bg-green-900/50 text-green-400 border border-green-800 shadow-inner' 
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              ON
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics Action */}
      <button
        onClick={runDiagnostics}
        disabled={isDiagnosticsRunning || systemState === 'OFF'}
        className={`flex items-center gap-2 px-4 py-2 rounded border text-xs font-medium transition-all ${
          isDiagnosticsRunning 
            ? 'bg-blue-900/20 border-blue-800 text-blue-400 cursor-wait'
            : systemState === 'OFF'
              ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
              : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white'
        }`}
      >
        {isDiagnosticsRunning ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            RUNNING CHECKS...
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            RUN DIAGNOSTICS
          </>
        )}
      </button>
    </div>
  );
}
