import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google'; // Removed Geist fonts
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AddressProvider } from '@/context/address-context';
import { Toaster } from '@/components/ui/toaster';

// Removed font definitions
// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

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
    // Removed font variables from html tag
    <html lang="en" suppressHydrationWarning className="h-full">
      {/* Removed font variables and antialiased. Added h-full to body. */}
      <body
        className={`antialiased flex flex-col min-h-screen h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AddressProvider>
             {/* Ensure main container takes full height */}
            <main className="flex-grow flex flex-col h-full">{children}</main>
            <Toaster />
          </AddressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

    