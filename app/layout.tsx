import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Canopy | Fund Administration Toolkit',
  description: 'Canopy — Juniper Square Fund Administration Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-56 min-h-screen">
            <div className="max-w-[1440px] mx-auto px-3 py-3">
              {children}
            </div>
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
