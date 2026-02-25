import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

export const metadata: Metadata = {
  title: 'Bunchfood',
  description: 'Fresh near-expiry food deals from local shops'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body suppressHydrationWarning className="bg-brand-background text-brand-text antialiased">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand
          duration={5000}
          toastOptions={{
            style: {
              fontFamily: 'var(--font-dm-sans), sans-serif',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}