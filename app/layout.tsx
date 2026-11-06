
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PayShield AI | Payment Security Command Center',
  description:
    'Agentic payment firewall, fraud intelligence and recovery workspace.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

