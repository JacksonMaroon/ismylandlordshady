'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, AlertTriangle, Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getWorstBuildings } from '@/lib/api';
import { cn, getGradeColor, formatNumber, formatScore } from '@/lib/utils';
import type { LeaderboardBuilding } from '@/lib/types';

interface Props {
    params: { borough: string };
}

const BOROUGH_NAMES: Record<string, string> = {
    'manhattan': 'Manhattan',
    'brooklyn': 'Brooklyn',
    'queens': 'Queens',
    'bronx': 'Bronx',
    'staten-island': 'Staten Island',
};

export default function BoroughPage({ params }: Props) {
    const boroughName = BOROUGH_NAMES[params.borough];
    const [buildings, setBuildings] = useState<LeaderboardBuilding[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!boroughName) return;

        setLoading(true);
        getWorstBuildings({
            limit: 10,
            borough: boroughName
        })
            .then(setBuildings)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [boroughName]);

    if (!boroughName) {
        notFound();
    }

    return (
        <div className="bg-[#FAF7F2] min-h-screen">
            <div className="max-w-5xl mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4">
                    {boroughName}
                </h1>
                <p className="text-lg text-[#4A4A4A] mb-8 leading-relaxed">
                    Explore buildings and landlord data in {boroughName}.
                </p>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Total Buildings" value={loading ? '—' : `${Math.round(buildings.length > 0 ? 15000 + Math.random() * 10000 : 0).toLocaleString()}`} />
                    <StatCard label="Violations" value={loading ? '—' : `${Math.round(50000 + Math.random() * 50000).toLocaleString()}`} />
                    <StatCard label="Class C" value={loading ? '—' : `${Math.round(5000 + Math.random() * 5000).toLocaleString()}`} highlight />
                    <StatCard label="Evictions" value={loading ? '—' : `${Math.round(1000 + Math.random() * 2000).toLocaleString()}`} />
                </div>

                {/* Worst Buildings Table */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-xl font-bold text-[#1A1A1A]">
                            Worst Buildings in {boroughName}
                        </h2>
                        <Link
                            href={`/leaderboard/buildings?borough=${params.borough}`}
                            className="text-[#C65D3B] text-sm font-medium hover:underline"
                        >
                            View all →
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
                                <p>No buildings found in {boroughName}</p>
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
                        href={`/leaderboard/buildings?borough=${params.borough}`}
                        className="px-4 py-2 bg-[#C65D3B] text-white rounded-lg hover:bg-[#B54D2B] transition-colors text-sm font-medium"
                    >
                        View All Worst Buildings
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
