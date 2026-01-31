import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
    title: 'Privacy | NYCLandlordCheck',
    description: 'How NYCLandlordCheck handles data and protects your privacy.',
    alternates: { canonical: '/privacy' },
};

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    description: 'How NYCLandlordCheck handles data and protects your privacy.',
    url: 'https://www.nyclandlordcheck.com/privacy',
    isPartOf: { '@id': 'https://www.nyclandlordcheck.com/#website' },
};

export default function PrivacyPage() {
    return (
        <div className="bg-[#FAF7F2] min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <div className="max-w-3xl mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#D4CFC4] flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-[#C65D3B]" />
                    </div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A]">Privacy</h1>
                </div>

                <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed">
                    NYCLandlordCheck is built to surface public housing data without collecting more about you than
                    we need. This page explains what we handle and how we use it.
                </p>

                <section className="mb-10">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-3">What we collect</h2>
                    <ul className="text-[#4A4A4A] space-y-2 text-sm">
                        <li>• Searches you run (address, landlord, or building lookups).</li>
                        <li>• Basic technical data (IP address, browser type) for security and reliability.</li>
                        <li>• Public records from NYC Open Data that power the results.</li>
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-3">How we use data</h2>
                    <ul className="text-[#4A4A4A] space-y-2 text-sm">
                        <li>• To return the records you request.</li>
                        <li>• To improve search relevance and site performance.</li>
                        <li>• To prevent abuse and keep the service stable.</li>
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-3">What we do not do</h2>
                    <ul className="text-[#4A4A4A] space-y-2 text-sm">
                        <li>• We do not sell your data.</li>
                        <li>• We do not require an account to use the site.</li>
                        <li>• We do not publish private information beyond public records.</li>
                    </ul>
                </section>

                <section className="bg-white border border-[#D4CFC4] rounded-xl p-6">
                    <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">Questions?</h2>
                    <p className="text-[#4A4A4A] text-sm mb-4">
                        If you have questions or concerns about privacy, reach out and we will respond.
                    </p>
                    <a
                        href="mailto:hello@nyclandlordcheck.com"
                        className="inline-block bg-[#C65D3B] hover:bg-[#B54D2B] text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
                    >
                        Contact Us
                    </a>
                </section>
            </div>
        </div>
    );
}
