import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-sm text-gray-600">
              IsMyLandlordShady.nyc provides transparency into NYC building
              conditions and landlord records using public data.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Data Sources</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>HPD Violations & Registrations</li>
              <li>311 Complaints</li>
              <li>DOB Violations</li>
              <li>NYC Eviction Records</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Links</h3>
            <ul className="text-sm space-y-1">
              <li>
                <Link
                  href="https://data.cityofnewyork.us"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  NYC Open Data
                </Link>
              </li>
              <li>
                <Link
                  href="https://www1.nyc.gov/site/hpd/index.page"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  NYC HPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <p>
            Data updated daily from NYC Open Data.
            Not affiliated with NYC government.
          </p>
        </div>
      </div>
    </footer>
  );
}
