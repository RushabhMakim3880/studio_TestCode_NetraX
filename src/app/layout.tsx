
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeInitializer } from '@/components/theme-initializer';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'NETRA-X',
  description: 'Advanced Red Team C2 & Attack Simulation Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn('font-body antialiased', fontBody.variable, fontHeadline.variable)}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <ThemeInitializer />
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
