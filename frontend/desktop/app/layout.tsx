import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'MigrationBox V5.0',
  description: 'AI-First Multi-Cloud Migration Automation Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden">
        <Providers>
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-[1440px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
