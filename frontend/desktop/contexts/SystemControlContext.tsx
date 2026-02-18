"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type SystemState = 'OFF' | 'STANDBY' | 'ON';

interface DiagnosticResult {
  name: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  message?: string;
  latency?: number;
}

interface SystemControlContextType {
  systemState: SystemState;
  setSystemState: (state: SystemState) => void;
  isDiagnosticsRunning: boolean;
  diagnosticResults: DiagnosticResult[];
  runDiagnostics: () => Promise<void>;
}

const SystemControlContext = createContext<SystemControlContextType | undefined>(undefined);

export function SystemControlProvider({ children }: { children: ReactNode }) {
  const [systemState, setSystemState] = useState<SystemState>('OFF');
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setIsDiagnosticsRunning(true);
    setDiagnosticResults([
      { name: 'Database Connection (Neo4j)', status: 'running' },
      { name: 'Database Connection (Postgres)', status: 'pending' },
      { name: 'Cloud Credentials (GCP)', status: 'pending' },
      { name: 'Agent Heartbeat', status: 'pending' },
    ]);

    // Simulate diagnostic checks
    // In real implementation, these would be API calls
    await new Promise(resolve => setTimeout(resolve, 800));
    setDiagnosticResults(prev => prev.map(r => r.name === 'Database Connection (Neo4j)' ? { ...r, status: 'passed', latency: 45 } : r));
    
    setDiagnosticResults(prev => prev.map(r => r.name === 'Database Connection (Postgres)' ? { ...r, status: 'running' } : r));
    await new Promise(resolve => setTimeout(resolve, 600));
    setDiagnosticResults(prev => prev.map(r => r.name === 'Database Connection (Postgres)' ? { ...r, status: 'passed', latency: 12 } : r));

    setDiagnosticResults(prev => prev.map(r => r.name === 'Cloud Credentials (GCP)' ? { ...r, status: 'running' } : r));
    await new Promise(resolve => setTimeout(resolve, 800));
    setDiagnosticResults(prev => prev.map(r => r.name === 'Cloud Credentials (GCP)' ? { ...r, status: 'passed', message: 'Authenticated as service-account' } : r));

    setDiagnosticResults(prev => prev.map(r => r.name === 'Agent Heartbeat' ? { ...r, status: 'running' } : r));
    await new Promise(resolve => setTimeout(resolve, 1200));
    setDiagnosticResults(prev => prev.map(r => r.name === 'Agent Heartbeat' ? { ...r, status: 'passed', message: '6/6 Agents Active' } : r));

    setIsDiagnosticsRunning(false);
  };

  return (
    <SystemControlContext.Provider value={{ 
      systemState, 
      setSystemState, 
      isDiagnosticsRunning, 
      diagnosticResults,
      runDiagnostics 
    }}>
      {children}
    </SystemControlContext.Provider>
  );
}

export function useSystemControl() {
  const context = useContext(SystemControlContext);
  if (context === undefined) {
    throw new Error('useSystemControl must be used within a SystemControlProvider');
  }
  return context;
}
