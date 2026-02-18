"use client";

import React from 'react';
import { useSystemControl } from '../../contexts/SystemControlContext';

export function DiagnosticPanel() {
  const { isDiagnosticsRunning, diagnosticResults, systemState } = useSystemControl();

  // Only show if diagnostics have run or are running
  if (diagnosticResults.length === 0) return null;

  return (
    <div className={`fixed bottom-6 right-6 w-96 bg-[#0f1e36] border border-gray-700 rounded-lg shadow-2xl overflow-hidden transition-all duration-500 z-50`}>
      {/* Header */}
      <div className="bg-[#1e293b] px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          DIAGNOSTIC CONSOLE
        </h3>
        <span className="text-xs text-gray-500 font-mono">v5.0.1</span>
      </div>

      {/* Results List */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {diagnosticResults.map((result, index) => (
          <div key={index} className="flex items-start gap-3 text-sm p-2 rounded bg-black/20 border border-transparent hover:border-gray-700 transition-colors">
            {/* Status Icon */}
            <div className="mt-0.5">
              {result.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-600"></div>
              )}
              {result.status === 'running' && (
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              )}
              {result.status === 'passed' && (
                <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center border border-green-500/50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {result.status === 'failed' && (
                <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/50">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className={`font-medium truncate ${
                  result.status === 'passed' ? 'text-gray-200' : 'text-gray-400'
                }`}>{result.name}</span>
                {result.latency && (
                  <span className="text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 rounded">
                    {result.latency}ms
                  </span>
                )}
              </div>
              {result.message && (
                <p className={`text-xs ${
                  result.status === 'passed' ? 'text-green-400/80' : 'text-red-400/80'
                }`}>{result.message}</p>
              )}
            </div>
          </div>
        ))}

        {/* Footer Summary */}
        {!isDiagnosticsRunning && diagnosticResults.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Status Check Complete</span>
              <span className={`font-bold ${
                diagnosticResults.every(r => r.status === 'passed') ? 'text-green-500' : 'text-red-500'
              }`}>
                {diagnosticResults.every(r => r.status === 'passed') ? 'SYSTEM HEALTHY' : 'ISSUES DETECTED'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
