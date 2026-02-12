'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/discoveries': 'Discoveries',
  '/assessments': 'Assessments',
  '/migrations': 'Migrations',
  '/i2i': 'I2I Pipeline',
  '/knowledge': 'Knowledge Network',
  '/optimization': 'Optimization',
  '/settings': 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const title = titles[pathname] || 'MigrationBox';

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Cloud provider badges */}
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20">AWS</span>
          <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20">Azure</span>
          <span className="px-2 py-1 rounded text-xs bg-red-500/10 text-red-500 border border-red-500/20">GCP</span>
        </div>
        {/* User avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
          MB
        </div>
      </div>
    </header>
  );
}
