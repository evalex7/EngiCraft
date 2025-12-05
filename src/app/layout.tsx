import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import RootProviders from './root-providers';


export const metadata: Metadata = {
  title: 'EngiCraft Navigator',
  description: 'Ваш персональний помічник для вивчення та роботи в інженерних програмах.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <RootProviders>
            {children}
        </RootProviders>
        <Toaster />
      </body>
    </html>
  );
}
