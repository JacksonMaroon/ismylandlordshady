import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export const metadata = {
    title: 'Data Sources | NYCLandlordCheck',
    description: 'NYC Open Data sources we use to compile building and landlord records.',
};

export default function DataSourcesPage() {
    return (
        <div className="bg-[#FAF7F2] min-h-screen">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                {/* Header */}
                <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4">
                    Data Sources
                </h1>
                <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed">
                    All data comes from official NYC Open Data. Here are the specific datasets we use.
                </p>

                {/* Data Sources List */}
                <div className="space-y-6">
                    <DataSourceCard
                        title="HPD Violations"
                        description="Housing code violations issued by the NYC Department of Housing Preservation and Development. Includes violation class (A, B, C), status, and description."
                        records="6M+"
                        updateFrequency="Weekly"
                        url="https://data.cityofnewyork.us/Housing-Development/Housing-Maintenance-Code-Violations/wvxf-dwi5"
                    />

                    <DataSourceCard
                        title="HPD Registrations"
                        description="Property registration records including building ownership information, rent stabilization status, and registration contacts."
                        records="250K+"
                        updateFrequency="Monthly"
                        url="https://data.cityofnewyork.us/Housing-Development/Multiple-Dwelling-Registrations/tesw-yqqr"
                    />

                    <DataSourceCard
                        title="311 Complaints"
                        description="Heating, hot water, mold, pest, and other housing complaints filed by residents. Includes complaint type and resolution status."
                        records="5M+"
                        updateFrequency="Weekly"
                        url="https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9"
                    />

                    <DataSourceCard
                        title="DOB Violations"
                        description="Building code violations from the Department of Buildings covering structural issues, illegal conversions, and construction violations."
                        records="500K+"
                        updateFrequency="Weekly"
                        url="https://data.cityofnewyork.us/Housing-Development/DOB-Violations/3h2n-5cm9"
                    />

                    <DataSourceCard
                        title="Eviction Records"
                        description="Marshal eviction records showing legal evictions executed in NYC. Data is geocoded to building addresses."
                        records="100K+"
                        updateFrequency="Monthly"
                        url="https://data.cityofnewyork.us/City-Government/Evictions/6z8x-wfk4"
                    />
                </div>

                {/* Disclaimer */}
                <div className="mt-12 bg-white border border-[#D4CFC4] rounded-xl p-6">
                    <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">
                        Data Disclaimer
                    </h2>
                    <ul className="text-[#4A4A4A] space-y-2 text-sm">
                        <li>• Data is provided "as-is" from NYC Open Data and may contain errors.</li>
                        <li>• We are not affiliated with NYC government or any city agency.</li>
                        <li>• Historical records may be incomplete prior to 2010.</li>
                        <li>• Use this information for research, not legal decisions.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function DataSourceCard({
    title,
    description,
    records,
    updateFrequency,
    url,
}: {
    title: string;
    description: string;
    records: string;
    updateFrequency: string;
    url: string;
}) {
    return (
        <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">{title}</h3>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#C65D3B] hover:underline text-sm"
                >
                    View Source
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>
            <p className="text-[#4A4A4A] text-sm mb-4 leading-relaxed">{description}</p>
            <div className="flex gap-4 text-xs">
                <span className="bg-[#FAF7F2] px-3 py-1 rounded-full text-[#4A4A4A]">
                    {records} records
                </span>
                <span className="bg-[#FAF7F2] px-3 py-1 rounded-full text-[#4A4A4A]">
                    Updated {updateFrequency}
                </span>
            </div>
        </div>
    );
}
