import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'MIKE-FIRST v6.0 — Multi-Cloud Platform',
  description: 'Migration, Intelligence, Compliance, Engineering — Fully Integrated Resilience & Security Toolkit',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-[#0a0a0f] text-white min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
