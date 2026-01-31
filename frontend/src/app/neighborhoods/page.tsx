import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { NEIGHBORHOODS_BY_BOROUGH, slugifyNeighborhood } from '@/lib/locations';

export const metadata = {
    title: 'Browse by Neighborhood | NYCLandlordCheck',
    description: 'Explore NYC buildings and landlords by neighborhood.',
    alternates: { canonical: '/neighborhoods' },
};

export default function NeighborhoodsPage() {
    return (
        <div className="bg-[#FAF7F2] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4">
                    Browse by Neighborhood
                </h1>
                <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed">
                    Select a neighborhood to see buildings, landlords, and violation data.
                </p>

                {Object.entries(NEIGHBORHOODS_BY_BOROUGH).map(([borough, neighborhoods]) => (
                    <section key={borough} className="mb-10">
                        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4 capitalize">
                            {borough.replace('-', ' ')}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {neighborhoods.map((neighborhood) => (
                                <Link
                                    key={neighborhood}
                                    href={`/neighborhood/${encodeURIComponent(slugifyNeighborhood(neighborhood))}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#D4CFC4] rounded-full text-sm text-[#1A1A1A] hover:border-[#C65D3B] hover:text-[#C65D3B] transition-colors"
                                >
                                    <MapPin className="w-3 h-3" />
                                    {neighborhood}
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
