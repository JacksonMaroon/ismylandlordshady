import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Scale } from 'lucide-react';

export const metadata = {
    title: 'About | NYCLandlordCheck',
    description: 'Our mission to bring transparency to NYC housing through public data.',
};

export default function AboutPage() {
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
                    About NYCLandlordCheck
                </h1>
                <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed">
                    Empowering NYC renters with the information they need to make informed housing decisions.
                </p>

                {/* Mission */}
                <section className="mb-12">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-4">
                        Our Mission
                    </h2>
                    <p className="text-[#4A4A4A] leading-relaxed mb-4">
                        Finding an apartment in New York City is hard enough without having to worry
                        about whether your landlord will fix that broken heater or if the building
                        has a history of pest infestations.
                    </p>
                    <p className="text-[#4A4A4A] leading-relaxed">
                        We built NYCLandlordCheck to give renters access to the same information
                        that landlords and real estate professionals have—violation records, complaint
                        histories, eviction rates, and more. All of this data is public, but it's
                        scattered across dozens of government databases. We bring it together in one
                        searchable, understandable format.
                    </p>
                </section>

                {/* Values */}
                <section className="mb-12">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-6">
                        What We Believe
                    </h2>
                    <div className="space-y-4">
                        <ValueCard
                            icon={<Eye className="w-6 h-6 text-[#C65D3B]" />}
                            title="Transparency"
                            description="Renters deserve to know the history of a building before signing a lease. Public data should be publicly accessible."
                        />
                        <ValueCard
                            icon={<Scale className="w-6 h-6 text-[#C65D3B]" />}
                            title="Accountability"
                            description="Bad landlords thrive in the dark. When their records are visible, there's incentive to do better."
                        />
                        <ValueCard
                            icon={<Shield className="w-6 h-6 text-[#C65D3B]" />}
                            title="Empowerment"
                            description="Knowledge is power. We give renters the tools to ask the right questions and make informed choices."
                        />
                    </div>
                </section>

                {/* FAQ */}
                <section className="mb-12">
                    <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <FAQItem
                            question="Is this data accurate?"
                            answer="We pull data directly from NYC Open Data, the official source for city records. However, data entry errors can occur at the source, and some records may be incomplete."
                        />
                        <FAQItem
                            question="How often is the data updated?"
                            answer="We refresh our data weekly. Scores are recalculated after each update to reflect the latest records."
                        />
                        <FAQItem
                            question="Can I trust the letter grades?"
                            answer="Grades are a helpful starting point, but we encourage you to look at the underlying data. A building with a 'C' grade might have one serious issue or many minor ones."
                        />
                        <FAQItem
                            question="Is this legal advice?"
                            answer="No. This tool is for informational purposes only. If you have legal concerns about a landlord or building, consult a tenant rights attorney."
                        />
                        <FAQItem
                            question="My building info is wrong. How do I fix it?"
                            answer="We don't create this data—it comes from city agencies. If there's an error, you'll need to contact the relevant agency (HPD, DOB, etc.) to correct the source records."
                        />
                    </div>
                </section>

                {/* Contact */}
                <section className="bg-white border border-[#D4CFC4] rounded-xl p-6">
                    <h2 className="font-serif text-xl font-bold text-[#1A1A1A] mb-3">
                        Get in Touch
                    </h2>
                    <p className="text-[#4A4A4A] text-sm mb-4">
                        Have feedback, found a bug, or want to collaborate? We'd love to hear from you.
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

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-4 bg-white border border-[#D4CFC4] rounded-xl p-5">
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-1">{title}</h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div>
            <h3 className="font-semibold text-[#1A1A1A] mb-2">{question}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">{answer}</p>
        </div>
    );
}
