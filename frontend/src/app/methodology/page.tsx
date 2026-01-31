import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Methodology | NYCLandlordCheck',
    description: 'How we calculate building and landlord grades using NYC Open Data.',
};

export default function MethodologyPage() {
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
                    Methodology
                </h1>
                <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed">
                    How we calculate building grades and landlord scores using public NYC data.
                </p>

                {/* Grading Scale */}
                <section className="mb-12">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">
                        Grading Scale
                    </h2>
                    <p className="text-[#4A4A4A] mb-6 leading-relaxed">
                        Every building receives a letter grade from A to F based on its overall score.
                        The score is calculated on a 0–100 point scale.
                    </p>

                    <div className="grid grid-cols-5 gap-3 mb-6">
                        <GradeBox grade="A" range="80-100" color="bg-green-500" />
                        <GradeBox grade="B" range="60-79" color="bg-lime-500" />
                        <GradeBox grade="C" range="40-59" color="bg-yellow-500" />
                        <GradeBox grade="D" range="20-39" color="bg-orange-500" />
                        <GradeBox grade="F" range="0-19" color="bg-red-500" />
                    </div>
                </section>

                {/* Score Components */}
                <section className="mb-12">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">
                        Score Components
                    </h2>
                    <p className="text-[#4A4A4A] mb-6 leading-relaxed">
                        The overall score is a weighted average of five components, each measuring
                        a different aspect of building quality and landlord behavior.
                    </p>

                    <div className="space-y-4">
                        <ScoreComponent
                            name="Violations Score"
                            weight="30%"
                            description="Based on HPD violations. Class C (hazardous) violations have the highest impact. Open violations count more than closed ones."
                        />
                        <ScoreComponent
                            name="Complaints Score"
                            weight="25%"
                            description="Based on 311 complaints filed. Heating, mold, and pest complaints carry extra weight. Recurring complaints indicate systemic issues."
                        />
                        <ScoreComponent
                            name="Eviction Score"
                            weight="20%"
                            description="Based on eviction filings. Buildings with higher eviction rates receive lower scores. We normalize by unit count."
                        />
                        <ScoreComponent
                            name="Ownership Score"
                            weight="15%"
                            description="LLC ownership reduces transparency. Portfolio landlords with poor track records impact individual building scores."
                        />
                        <ScoreComponent
                            name="Resolution Score"
                            weight="10%"
                            description="Measures how quickly the landlord resolves violations. Fast resolution times improve the score."
                        />
                    </div>
                </section>

                {/* Percentile Rankings */}
                <section className="mb-12">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">
                        Percentile Rankings
                    </h2>
                    <p className="text-[#4A4A4A] leading-relaxed">
                        We also provide percentile rankings to show how a building compares to others
                        citywide and within its borough. A building in the "Top 10% citywide" means
                        it scores better than 90% of all NYC buildings in our database.
                    </p>
                </section>

                {/* Data Updates */}
                <section className="mb-12">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">
                        Data Updates
                    </h2>
                    <p className="text-[#4A4A4A] leading-relaxed">
                        Our data is refreshed weekly from NYC Open Data. Scores are recalculated
                        after each update to reflect the latest violations, complaints, and records.
                    </p>
                </section>

                {/* Limitations */}
                <section className="bg-white border border-[#D4CFC4] rounded-xl p-6">
                    <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">
                        Limitations
                    </h2>
                    <ul className="text-[#4A4A4A] space-y-2 text-sm">
                        <li>• Scores reflect reported issues only—unreported problems won't appear.</li>
                        <li>• Older buildings may have more historical violations simply due to age.</li>
                        <li>• Entity resolution (linking LLCs to owners) is imperfect.</li>
                        <li>• This tool is for informational purposes and not legal advice.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

function GradeBox({ grade, range, color }: { grade: string; range: string; color: string }) {
    return (
        <div className={`${color} rounded-lg p-3 text-center text-white`}>
            <div className="text-2xl font-bold">{grade}</div>
            <div className="text-xs opacity-90">{range}</div>
        </div>
    );
}

function ScoreComponent({ name, weight, description }: { name: string; weight: string; description: string }) {
    return (
        <div className="bg-white border border-[#D4CFC4] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#1A1A1A]">{name}</h3>
                <span className="text-sm text-[#C65D3B] font-medium">{weight}</span>
            </div>
            <p className="text-sm text-[#4A4A4A]">{description}</p>
        </div>
    );
}
