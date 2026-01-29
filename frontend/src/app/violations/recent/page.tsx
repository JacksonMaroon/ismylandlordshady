'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Loader2, Building2, MapPin, Calendar } from 'lucide-react';
import { getRecentViolations, type RecentViolation } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

export default function RecentViolationsPage() {
    const [loading, setLoading] = useState(true);
    const [violations, setViolations] = useState<RecentViolation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('');

    useEffect(() => {
        const fetchViolations = async () => {
            try {
                setLoading(true);
                const data = await getRecentViolations({ limit: 50 });
                setViolations(data);
            } catch (e) {
                setError('Failed to load recent violations');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchViolations();
    }, []);

    const filteredViolations = filter
        ? violations.filter(v => v.violation_class === filter)
        : violations;

    return (
        <div className="bg-[#FAF7F2] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-4">
                    Recent Violations
                </h1>
                <p className="text-lg text-[#4A4A4A] mb-6 leading-relaxed">
                    Latest HPD violations issued across NYC buildings.
                </p>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <FilterButton active={filter === ''} onClick={() => setFilter('')}>
                        All Classes
                    </FilterButton>
                    <FilterButton active={filter === 'C'} onClick={() => setFilter('C')} className="text-red-600">
                        Class C (Immediate Hazard)
                    </FilterButton>
                    <FilterButton active={filter === 'B'} onClick={() => setFilter('B')} className="text-orange-600">
                        Class B
                    </FilterButton>
                    <FilterButton active={filter === 'A'} onClick={() => setFilter('A')} className="text-yellow-600">
                        Class A
                    </FilterButton>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C65D3B]" />
                    </div>
                ) : error ? (
                    <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">
                            Error Loading Violations
                        </h2>
                        <p className="text-[#4A4A4A]">{error}</p>
                    </div>
                ) : filteredViolations.length === 0 ? (
                    <div className="bg-white border border-[#D4CFC4] rounded-xl p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-[#C65D3B] mx-auto mb-4" />
                        <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">
                            No Violations Found
                        </h2>
                        <p className="text-[#4A4A4A]">
                            No recent violations match your filter.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredViolations.map((violation) => (
                            <ViolationCard key={violation.id} violation={violation} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterButton({
    children,
    active,
    onClick,
    className,
}: {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                    ? 'bg-[#C65D3B] text-white'
                    : 'bg-white border border-[#D4CFC4] text-[#1A1A1A] hover:border-[#C65D3B]',
                className
            )}
        >
            {children}
        </button>
    );
}

function ViolationCard({ violation }: { violation: RecentViolation }) {
    const classColor = {
        'A': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'B': 'bg-orange-100 text-orange-800 border-orange-200',
        'C': 'bg-red-100 text-red-800 border-red-200',
    }[violation.violation_class || 'A'] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
        <div className="bg-white border border-[#D4CFC4] rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <span className={cn(
                        'px-3 py-1 rounded-full text-sm font-bold border',
                        classColor
                    )}>
                        Class {violation.violation_class || '?'}
                    </span>
                    <span className="text-sm text-[#8A8A8A]">
                        ID: {violation.id}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#8A8A8A]">
                    <Calendar className="w-4 h-4" />
                    {violation.inspection_date ? formatDate(violation.inspection_date) : 'Unknown date'}
                </div>
            </div>

            <p className="text-[#1A1A1A] mb-4 leading-relaxed">
                {violation.description || 'No description available'}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link
                    href={`/building/${violation.bbl}`}
                    className="flex items-center gap-2 text-[#C65D3B] hover:underline"
                >
                    <Building2 className="w-4 h-4" />
                    {violation.address || 'Unknown address'}
                </Link>

                <div className="flex items-center gap-2 text-[#4A4A4A]">
                    <MapPin className="w-4 h-4" />
                    {violation.borough || 'Unknown borough'}
                </div>

                {(violation.apartment || violation.story) && (
                    <div className="text-[#8A8A8A]">
                        {violation.apartment && `Apt ${violation.apartment}`}
                        {violation.apartment && violation.story && ', '}
                        {violation.story && `${violation.story}`}
                    </div>
                )}

                {violation.status && (
                    <span className="ml-auto px-2 py-1 bg-[#FAF7F2] rounded text-[#4A4A4A]">
                        {violation.status}
                    </span>
                )}
            </div>
        </div>
    );
}
