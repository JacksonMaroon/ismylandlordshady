'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getWorstBuildings } from '@/lib/api';
import { cn, getGradeColor, formatNumber, formatScore } from '@/lib/utils';
import type { LeaderboardBuilding } from '@/lib/types';

interface Props {
    params: { neighborhood: string };
}

// Mapping of neighborhoods to their ZIP code prefixes/patterns
// This is a simplified mapping - in production you might want a more complete one
const NEIGHBORHOOD_ZIPS: Record<string, { borough: string; zips: string[] }> = {
    // Manhattan
    'upper-east-side': { borough: 'Manhattan', zips: ['10021', '10028', '10044', '10065', '10075', '10128'] },
    'upper-west-side': { borough: 'Manhattan', zips: ['10023', '10024', '10025'] },
    'harlem': { borough: 'Manhattan', zips: ['10026', '10027', '10030', '10031', '10035', '10037', '10039'] },
    'east-village': { borough: 'Manhattan', zips: ['10003', '10009'] },
    'west-village': { borough: 'Manhattan', zips: ['10014'] },
    'chelsea': { borough: 'Manhattan', zips: ['10001', '10011'] },
    'midtown': { borough: 'Manhattan', zips: ['10018', '10019', '10020', '10036'] },
    'financial-district': { borough: 'Manhattan', zips: ['10004', '10005', '10006', '10038'] },
    'soho': { borough: 'Manhattan', zips: ['10012', '10013'] },
    'tribeca': { borough: 'Manhattan', zips: ['10007', '10013'] },
    // Brooklyn
    'williamsburg': { borough: 'Brooklyn', zips: ['11211', '11249'] },
    'park-slope': { borough: 'Brooklyn', zips: ['11215', '11217'] },
    'bushwick': { borough: 'Brooklyn', zips: ['11206', '11207', '11221', '11237'] },
    'bedford-stuyvesant': { borough: 'Brooklyn', zips: ['11205', '11206', '11216', '11221', '11233'] },
    'crown-heights': { borough: 'Brooklyn', zips: ['11213', '11216', '11225', '11233'] },
    'flatbush': { borough: 'Brooklyn', zips: ['11226'] },
    'dumbo': { borough: 'Brooklyn', zips: ['11201'] },
    'greenpoint': { borough: 'Brooklyn', zips: ['11211', '11222'] },
    'bay-ridge': { borough: 'Brooklyn', zips: ['11209', '11220'] },
    'sunset-park': { borough: 'Brooklyn', zips: ['11220', '11232'] },
    // Queens
    'astoria': { borough: 'Queens', zips: ['11101', '11102', '11103', '11105', '11106'] },
    'long-island-city': { borough: 'Queens', zips: ['11101', '11109'] },
    'flushing': { borough: 'Queens', zips: ['11354', '11355', '11358', '11367'] },
    'jackson-heights': { borough: 'Queens', zips: ['11372'] },
    'jamaica': { borough: 'Queens', zips: ['11432', '11433', '11435'] },
    'forest-hills': { borough: 'Queens', zips: ['11375'] },
    'ridgewood': { borough: 'Queens', zips: ['11385'] },
    'sunnyside': { borough: 'Queens', zips: ['11104'] },
    'corona': { borough: 'Queens', zips: ['11368'] },
    'elmhurst': { borough: 'Queens', zips: ['11373'] },
    // Bronx
    'south-bronx': { borough: 'Bronx', zips: ['10451', '10455', '10459', '10474'] },
    'fordham': { borough: 'Bronx', zips: ['10458', '10468'] },
    'riverdale': { borough: 'Bronx', zips: ['10463', '10471'] },
    'kingsbridge': { borough: 'Bronx', zips: ['10463', '10468'] },
    'mott-haven': { borough: 'Bronx', zips: ['10451', '10454', '10455'] },
    'hunts-point': { borough: 'Bronx', zips: ['10474'] },
    'tremont': { borough: 'Bronx', zips: ['10453', '10457', '10458'] },
    'pelham-bay': { borough: 'Bronx', zips: ['10461', '10462', '10465'] },
    'parkchester': { borough: 'Bronx', zips: ['10462', '10472'] },
    'soundview': { borough: 'Bronx', zips: ['10472', '10473'] },
    // Staten Island
    'st-george': { borough: 'Staten Island', zips: ['10301', '10304', '10305'] },
    'stapleton': { borough: 'Staten Island', zips: ['10304', '10305'] },
    'new-dorp': { borough: 'Staten Island', zips: ['10306'] },
    'tottenville': { borough: 'Staten Island', zips: ['10307'] },
};

function formatNeighborhoodName(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default function NeighborhoodPage({ params }: Props) {
    const neighborhoodData = NEIGHBORHOOD_ZIPS[params.neighborhood];
    const [buildings, setBuildings] = useState<LeaderboardBuilding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const neighborhoodName = formatNeighborhoodName(params.neighborhood);

    useEffect(() => {
        if (!neighborhoodData) return;

        setLoading(true);
        // Get buildings for the borough - we'll filter by ZIP client-side
        getWorstBuildings({
            borough: neighborhoodData.borough,
            limit: 100,
        })
            .then((allBuildings) => {
                // Filter to buildings in this neighborhood's ZIP codes
                const zipPrefix = neighborhoodData.zips.map(z => z.slice(0, 3));
                const filtered = allBuildings.filter(b => {
                    const buildingZip = b.zip_code?.slice(0, 3);
                    return buildingZip ? zipPrefix.includes(buildingZip) : false;
                });
                setBuildings(filtered);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [neighborhoodData]);

    if (!neighborhoodData) {
        notFound();
    }

    return (
        <div className="bg-[#FAF7F2] min-h-screen">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <Link href="/neighborhoods" className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Neighborhoods
                </Link>

                <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-8 h-8 text-[#C65D3B] mt-1" />
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A]">
                            {neighborhoodName}
                        </h1>
                        <p className="text-lg text-[#4A4A4A] mt-1">
                            {neighborhoodData.borough} • ZIPs: {neighborhoodData.zips.join(', ')}
                        </p>
                    </div>
                </div>

                <p className="text-lg text-[#4A4A4A] mb-8 leading-relaxed">
                    Explore buildings and landlord data in {neighborhoodName}.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <StatCard 
                        label="Total Buildings" 
                        value={loading ? '—' : buildings.length.toLocaleString()} 
                    />
                    <StatCard 
                        label="Total Violations" 
                        value={loading ? '—' : buildings.reduce((sum, b) => sum + (b.violations || 0), 0).toLocaleString()} 
                    />
                    <StatCard 
                        label="Class C Violations" 
                        value={loading ? '—' : buildings.reduce((sum, b) => sum + (b.class_c || 0), 0).toLocaleString()} 
                        highlight 
                    />
                    <StatCard 
                        label="Avg Score" 
                        value={loading ? '—' : buildings.length > 0 
                            ? (buildings.reduce((sum, b) => sum + (b.score || 0), 0) / buildings.length).toFixed(2)
                            : '0.00'} 
                    />
                </div>

                {/* Buildings Table */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">
                            Buildings in {neighborhoodName}
                        </h2>
                        <Link
                            href={`/leaderboard/buildings?borough=${neighborhoodData.borough.toLowerCase().replace(' ', '-')}`}
                            className="text-[#C65D3B] text-sm font-medium hover:underline"
                        >
                            View all in {neighborhoodData.borough} →
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-[#D4CFC4] overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-[#C65D3B]" />
                            </div>
                        ) : error ? (
                            <div className="py-12 text-center text-red-600">
                                Failed to load buildings: {error}
                            </div>
                        ) : buildings.length === 0 ? (
                            <div className="py-12 text-center text-[#8A8A8A]">
                                <Building2 className="w-12 h-12 mx-auto mb-4 text-[#D4CFC4]" />
                                <p>No buildings found in {neighborhoodName}</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-[#FAF7F2] border-b border-[#D4CFC4]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Rank</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">Address</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">Violations</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">Class C</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">Score</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-[#1A1A1A]">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D4CFC4]">
                                    {buildings.map((building, index) => (
                                        <tr key={building.bbl} className="hover:bg-[#FAF7F2]">
                                            <td className="px-4 py-3 text-sm">
                                                <span className="font-bold text-[#1A1A1A]">{index + 1}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/building/${building.bbl}`}
                                                    className="text-[#C65D3B] hover:underline font-medium"
                                                >
                                                    {building.address}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className="font-medium text-[#1A1A1A]">
                                                    {formatNumber(building.violations)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                {building.class_c > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-[#C65D3B] font-medium">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {formatNumber(building.class_c)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-[#1A1A1A]">
                                                {formatScore(building.score)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={cn(
                                                        'px-2 py-1 rounded text-sm font-bold',
                                                        getGradeColor(building.grade)
                                                    )}
                                                >
                                                    {building.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={`/borough/${neighborhoodData.borough.toLowerCase().replace(' ', '-')}`}
                        className="px-4 py-2 bg-[#C65D3B] text-white rounded-lg hover:bg-[#B54D2B] transition-colors text-sm font-medium"
                    >
                        View {neighborhoodData.borough}
                    </Link>
                    <Link
                        href="/leaderboard/landlords"
                        className="px-4 py-2 bg-white border border-[#D4CFC4] text-[#1A1A1A] rounded-lg hover:border-[#C65D3B] transition-colors text-sm font-medium"
                    >
                        Worst Landlords
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="bg-white rounded-lg border border-[#D4CFC4] p-4 text-center">
            <div className={cn(
                "font-serif text-2xl font-bold mb-1",
                highlight ? "text-[#C65D3B]" : "text-[#1A1A1A]"
            )}>
                {value}
            </div>
            <div className="text-xs text-[#8A8A8A] uppercase tracking-wide">{label}</div>
        </div>
    );
}
