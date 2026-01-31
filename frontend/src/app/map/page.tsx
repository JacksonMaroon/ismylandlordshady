import Link from 'next/link';
import { ArrowLeft, Map } from 'lucide-react';

export const metadata = {
    title: 'NYC Building Map | NYCLandlordCheck',
    description: 'Interactive map of NYC buildings with violation and landlord data.',
};

export default function MapPage() {
    return (
        <div className="bg-[#FAF7F2] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4">
                    NYC Building Map
                </h1>
                <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed">
                    Explore buildings across New York City on an interactive map.
                </p>

                {/* Map Placeholder */}
                <div className="bg-white border border-[#D4CFC4] rounded-xl p-8 text-center">
                    <Map className="w-16 h-16 text-[#C65D3B] mx-auto mb-4" />
                    <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">
                        Interactive Map Coming Soon
                    </h2>
                    <p className="text-[#4A4A4A] mb-6">
                        We're building an interactive map to help you explore buildings by location.
                    </p>

                    {/* Borough Quick Links */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        {['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'].map((borough) => (
                            <Link
                                key={borough}
                                href={`/borough/${borough.toLowerCase().replace(' ', '-')}`}
                                className="px-4 py-2 bg-[#C65D3B] text-white rounded-lg hover:bg-[#B54D2B] transition-colors text-sm font-medium"
                            >
                                {borough}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
