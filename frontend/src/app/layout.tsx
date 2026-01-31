import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700', '800']
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nyclandlordcheck.com'),
  title: 'NYCLandlordCheck | NYC Building & Landlord Transparency',
  description:
    'Check your NYC building and landlord records. View violations, complaints, evictions, and owner portfolios.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'NYCLandlordCheck',
    description: 'NYC Building & Landlord Transparency',
    url: 'https://www.nyclandlordcheck.com',
    siteName: 'NYCLandlordCheck',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NYCLandlordCheck',
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
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
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
