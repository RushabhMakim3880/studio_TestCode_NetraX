import type { ReactNode } from 'react';

// This is a minimal layout specifically for pages that should not have the
// main application's sidebar and header, like the hosted phishing page.
export default function HostedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
