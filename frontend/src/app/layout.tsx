import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IsMyLandlordShady.nyc | NYC Building & Landlord Transparency',
  description:
    'Check your NYC building and landlord records. View violations, complaints, evictions, and owner portfolios.',
  openGraph: {
    title: 'IsMyLandlordShady.nyc',
    description: 'NYC Building & Landlord Transparency',
    url: 'https://ismylandlordshady.nyc',
    siteName: 'IsMyLandlordShady.nyc',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IsMyLandlordShady.nyc',
    description: 'Check your NYC building and landlord records',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
