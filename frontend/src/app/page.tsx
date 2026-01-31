'use client';

import { SearchBox } from '@/components/building/SearchBox';
import { NYCBoroughMap } from '@/components/ui/NYCBoroughMap';
import Link from 'next/link';
import { MapPin, Layers, AlertTriangle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-[#FAF7F2]">
      {/* Hero Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C65D3B] font-semibold mb-5">
            Search Any NYC Address
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            NYC <span className="text-[#C65D3B]">LandlordCheck</span>
          </h1>
          <p className="text-lg text-[#4A4A4A] mb-8">
            See violations, complaints, evictions, and ownership history in seconds.
          </p>

          <SearchBox />

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <QuickLink href="/leaderboard/landlords" icon={<Layers className="w-4 h-4" />}>
              View Worst Landlords
            </QuickLink>
            <QuickLink href="/neighborhoods" icon={<MapPin className="w-4 h-4" />}>
              Browse by Neighborhood
            </QuickLink>
            <QuickLink href="/violations/recent" icon={<AlertTriangle className="w-4 h-4" />}>
              Recent Violations
            </QuickLink>
          </div>
        </div>
      </section>

      {/* Borough Section */}
      <section className="border-t border-[#D4CFC4] py-12 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_1.3fr] gap-8 items-center">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-3">
              Explore by Borough
            </h2>
            <p className="text-[#4A4A4A] mb-4 leading-relaxed">
              From Manhattan high-rises to Brooklyn brownstones. Click any borough to see the worst buildings and landlords in your area.
            </p>
            <Link href="/map" className="inline-flex items-center gap-1 text-[#C65D3B] font-semibold text-sm hover:underline">
              See full map →
            </Link>
          </div>
          <NYCBoroughMap />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-[#D4CFC4] py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value="250K+" label="Buildings" />
          <StatCard value="5M+" label="311 Complaints" />
          <StatCard value="100K+" label="Evictions" />
          <StatCard value="50K+" label="Landlords" />
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-[#D4CFC4]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3">
          <FeatureCard
            stat="6M+"
            title="Violation Records"
            description="HPD, DOB, and ECB violations from the past 10 years. Heat, lead, mold, structural—all searchable."
          />
          <FeatureCard
            stat="100%"
            title="Rent Stabilization Data"
            description="Instantly check if a unit is rent-stabilized. Know your rights before you sign."
            bordered
          />
          <FeatureCard
            stat="A–F"
            title="Landlord Grades"
            description="We score landlords on response time, violation history, and litigation. Compare side-by-side."
          />
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D4CFC4] rounded-full text-sm font-medium text-[#1A1A1A] hover:border-[#C65D3B] hover:text-[#C65D3B] hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
      {icon}
      {children}
    </Link>
  );
}

function BoroughCard({ name, count, color, span = 1 }: { name: string; count: string; color: string; span?: number }) {
  return (
    <Link
      href={`/borough/${name.toLowerCase().replace(' ', '-')}`}
      className={`${color} rounded-lg p-4 text-white text-center hover:-translate-y-1 hover:shadow-lg transition-all ${span === 2 ? 'col-span-2' : ''}`}
    >
      <div className="font-bold text-xs uppercase tracking-wide">{name}</div>
      <div className="text-[10px] opacity-85 mt-0.5">{count} buildings</div>
    </Link>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-serif text-3xl md:text-4xl font-bold text-[#1A1A1A] relative inline-block">
        {value}
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-9 h-0.5 bg-[#C65D3B]" />
      </div>
      <div className="text-xs text-[#4A4A4A] uppercase tracking-wide mt-3">{label}</div>
    </div>
  );
}

function FeatureCard({ stat, title, description, bordered = false }: { stat: string; title: string; description: string; bordered?: boolean }) {
  return (
    <div className={`p-8 ${bordered ? 'border-x border-[#D4CFC4]' : ''}`}>
      <div className="font-serif text-3xl font-bold text-[#C65D3B] mb-2">{stat}</div>
      <h3 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">{title}</h3>
      <p className="text-sm text-[#4A4A4A] leading-relaxed">{description}</p>
    </div>
  );
}
