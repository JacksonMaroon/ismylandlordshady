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
      { url: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/icon-144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'NYCLandlordCheck',
    description: 'NYC Building & Landlord Transparency',
    url: 'https://www.nyclandlordcheck.com',
    siteName: 'NYCLandlordCheck',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'NYCLandlordCheck',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NYCLandlordCheck',
    description: 'Check your NYC building and landlord records',
    images: ['/twitter-image'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.nyclandlordcheck.com/#organization',
      name: 'NYCLandlordCheck',
      url: 'https://www.nyclandlordcheck.com',
      email: 'hello@nyclandlordcheck.com',
      logo: {
        '@type': 'ImageObject',
        '@id': 'https://www.nyclandlordcheck.com/#logo',
        url: 'https://www.nyclandlordcheck.com/icon-144.png',
        width: 144,
        height: 144,
        caption: 'NYCLandlordCheck',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.nyclandlordcheck.com/#website',
      url: 'https://www.nyclandlordcheck.com/',
      name: 'NYCLandlordCheck',
      description:
        'Check your NYC building and landlord records. View violations, complaints, evictions, and owner portfolios.',
      inLanguage: 'en-US',
      publisher: { '@id': 'https://www.nyclandlordcheck.com/#organization' },
      image: { '@id': 'https://www.nyclandlordcheck.com/#logo' },
      potentialAction: {
        '@type': 'SearchAction',
        target:
          'https://www.google.com/search?q=site:nyclandlordcheck.com+{search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
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
