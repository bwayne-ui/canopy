import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Sidebar from '@/components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Canopy | Fund Administration Toolkit',
  description: 'Canopy — Juniper Square Fund Administration Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
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
        <SpeedInsights />
      </body>
    </html>
  );
}
