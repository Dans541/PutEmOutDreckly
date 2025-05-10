import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AddressProvider } from '@/context/address-context';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: "Put 'Em Out Dreckly",
  description: 'Cornwall bin collection reminders',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body
        // Added min-h-screen and flex-col to ensure footer behavior if needed
        className={`antialiased flex flex-col min-h-screen h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AddressProvider>
            {/* main takes remaining height */}
            <main className="flex-grow flex flex-col h-full">{children}</main>
            <Toaster />
          </AddressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
