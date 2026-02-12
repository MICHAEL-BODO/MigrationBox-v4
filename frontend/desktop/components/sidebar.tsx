'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '⬡' },
  { name: 'Discoveries', href: '/discoveries', icon: '⬢' },
  { name: 'Assessments', href: '/assessments', icon: '◈' },
  { name: 'Migrations', href: '/migrations', icon: '▶' },
  { name: 'I2I Pipeline', href: '/i2i', icon: '⬣' },
  { name: 'Knowledge', href: '/knowledge', icon: '◉' },
  { name: 'Optimization', href: '/optimization', icon: '◇' },
  { name: 'Settings', href: '/settings', icon: '⚙' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <span className="text-lg font-bold text-primary">MigrationBox</span>
        <span className="text-xs text-zinc-500 ml-2">V5.0</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          LocalStack Connected
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          14 MCP Servers
        </div>
      </div>
    </aside>
  );
}
