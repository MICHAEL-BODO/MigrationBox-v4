'use client';

import React, { useState } from 'react';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#0d0d14] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold shadow-lg shadow-violet-500/20">
              M
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight">MIKE-FIRST</span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-medium">v6.0</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavSection title="PLATFORM">
            <NavItem href="/" icon="📊" label="Dashboard" />
            <NavItem href="/command-center" icon="🎯" label="Command Center" />
          </NavSection>

          <NavSection title="PILLAR 1 — AUDITOR">
            <NavItem href="/auditor" icon="🛡️" label="Compliance Hub" />
            <NavItem href="/auditor/one-click" icon="⚡" label="One-Click Audit" badge="NEW" />
            <NavItem href="/auditor/guardian" icon="👁️" label="Guardian Agent" badge="LIVE" />
            <NavItem href="/auditor/reports" icon="📋" label="Reports" />
          </NavSection>

          <NavSection title="PILLAR 2 — ANALYZER">
            <NavItem href="/analyzer" icon="📊" label="Intelligence Hub" />
            <NavItem href="/analyzer/cost" icon="💰" label="Cost Optimizer" />
            <NavItem href="/analyzer/security" icon="🔒" label="Security Center" badge="LIVE" />
            <NavItem href="/analyzer/health" icon="❤️" label="Health Monitor" />
          </NavSection>

          <NavSection title="PILLAR 3 — MIGRATOR">
            <NavItem href="/migrator" icon="🚀" label="Migration Hub" />
            <NavItem href="/migrator/discover" icon="🔍" label="Discovery" />
            <NavItem href="/migrator/plan" icon="📐" label="Plan Builder" />
            <NavItem href="/migrator/execute" icon="▶️" label="Execute" />
          </NavSection>

          <NavSection title="INFRASTRUCTURE">
            <NavItem href="/clouds" icon="☁️" label="Cloud Providers" />
            <NavItem href="/agents" icon="🤖" label="AI Agents" />
            <NavItem href="/settings" icon="⚙️" label="Settings" />
          </NavSection>
        </nav>

        {/* Mode Toggle */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-zinc-500">Mode</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                {'● DEMO'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d0d14]/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-zinc-300">Multi-Cloud Platform</h2>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-500">All systems operational</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400">
              <span>{'🌐'}</span>
              <span>3 Clouds Connected</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400">
              <span>{'📱'}</span>
              <span>iPhone Linked</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold">
              MB
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* Subcomponents */

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-2">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ href, icon, label, badge }: {
  href: string; icon: string; label: string; badge?: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
    >
      <span className="text-sm">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <span className={[
          'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
          badge === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
          badge === 'NEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
          'bg-zinc-700 text-zinc-400'
        ].join(' ')}>
          {badge}
        </span>
      )}
    </a>
  );
}
