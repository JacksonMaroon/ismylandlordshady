import { SearchBox } from '@/components/building/SearchBox';
import { Building2, Shield, Users, FileWarning } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Is Your NYC Landlord Shady?
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Search any NYC address to see building violations, complaints,
              evictions, and landlord portfolios.
            </p>

            <SearchBox />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Building2 className="h-8 w-8 text-blue-600" />}
              title="Building Reports"
              description="Detailed reports on HPD violations, 311 complaints, and DOB violations for any NYC building."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-green-600" />}
              title="Safety Grades"
              description="Easy-to-understand letter grades (A-F) based on violations, complaints, and evictions."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-purple-600" />}
              title="Landlord Portfolios"
              description="See all buildings owned by a landlord and their overall track record."
            />
            <FeatureCard
              icon={<FileWarning className="h-8 w-8 text-orange-600" />}
              title="Public Data"
              description="All data comes from NYC Open Data and is updated daily."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            NYC Housing Data at a Glance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCard value="6M+" label="HPD Violations" />
            <StatCard value="5M+" label="311 Complaints" />
            <StatCard value="250K+" label="Registered Buildings" />
            <StatCard value="100K+" label="Eviction Records" />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white rounded-lg border hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-blue-600">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}
