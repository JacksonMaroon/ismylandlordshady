import Link from 'next/link';
import { ArrowLeft, TerminalSquare } from 'lucide-react';

export const metadata = {
    title: 'API | NYCLandlordCheck',
    description: 'Public API endpoints for NYC building and landlord records.',
    alternates: { canonical: '/api' },
};

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NYCLandlordCheck API',
    description: 'Public API endpoints for NYC building and landlord records.',
    url: 'https://www.nyclandlordcheck.com/api',
    isPartOf: { '@id': 'https://www.nyclandlordcheck.com/#website' },
};

const endpoints = [
    {
        method: 'GET',
        path: '/api/v1/buildings/search?q={query}&limit={n}',
        description: 'Search by address or landlord name.',
    },
    {
        method: 'GET',
        path: '/api/v1/buildings/{bbl}',
        description: 'Building report with violations, complaints, and owner info.',
    },
    {
        method: 'GET',
        path: '/api/v1/buildings/{bbl}/violations?limit={n}&status={status}',
        description: 'Violations for a building with optional filters.',
    },
    {
        method: 'GET',
        path: '/api/v1/buildings/{bbl}/timeline?limit={n}',
        description: 'Timeline events for a building.',
    },
    {
        method: 'GET',
        path: '/api/v1/owners/{id}',
        description: 'Owner portfolio details and stats.',
    },
    {
        method: 'GET',
        path: '/api/v1/leaderboards/worst-buildings?borough={borough}&limit={n}',
        description: 'Worst buildings leaderboard, optionally filtered by borough.',
    },
    {
        method: 'GET',
        path: '/api/v1/leaderboards/worst-landlords?limit={n}',
        description: 'Worst landlords leaderboard.',
    },
    {
        method: 'GET',
        path: '/api/v1/buildings/violations/recent?limit={n}',
        description: 'Recent violations feed.',
    },
];

export default function ApiPage() {
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
                        <TerminalSquare className="w-5 h-5 text-[#C65D3B]" />
                    </div>
                    <h1 className="font-serif text-4xl font-bold text-[#1A1A1A]">API</h1>
                </div>

                <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed">
                    The NYCLandlordCheck API exposes public records we aggregate from NYC Open Data. All endpoints are
                    read-only and return JSON.
                </p>

                <section className="mb-10">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">Base URL</h2>
                    <div className="bg-white border border-[#D4CFC4] rounded-xl p-4 text-sm text-[#1A1A1A]">
                        https://www.nyclandlordcheck.com/api/v1
                    </div>
                </section>

                <section className="mb-10">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">Endpoints</h2>
                    <div className="space-y-4">
                        {endpoints.map((endpoint) => (
                            <div key={endpoint.path} className="bg-white border border-[#D4CFC4] rounded-xl p-5">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-widest text-[#C65D3B]">
                                        {endpoint.method}
                                    </span>
                                    <code className="text-xs text-[#1A1A1A] bg-[#FAF7F2] px-2 py-1 rounded">
                                        {endpoint.path}
                                    </code>
                                </div>
                                <p className="text-sm text-[#4A4A4A]">{endpoint.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-10">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">Example</h2>
                    <pre className="bg-[#1A1A1A] text-[#FAF7F2] rounded-xl p-4 text-xs overflow-x-auto">
                        <code>{`curl "https://www.nyclandlordcheck.com/api/v1/buildings/search?q=123%20Main%20St"`}</code>
                    </pre>
                </section>

                <section className="bg-white border border-[#D4CFC4] rounded-xl p-6">
                    <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">Responsible use</h2>
                    <p className="text-[#4A4A4A] text-sm">
                        Please be respectful with request volume. If you need higher-volume access or data exports,
                        email us at{' '}
                        <a className="text-[#C65D3B] hover:underline" href="mailto:hello@nyclandlordcheck.com">
                            hello@nyclandlordcheck.com
                        </a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
