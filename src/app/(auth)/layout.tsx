import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Removed centering to allow for full-screen background effects
  return (
    <main className="flex min-h-screen flex-col items-center bg-black">
      {children}
    </main>
  );
}
