import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Social Dimension',
  description: 'Psychology workshop tool for social dimension assessment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
