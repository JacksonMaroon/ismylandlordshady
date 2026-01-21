'use client';

import Link from 'next/link';
import { Building2, Trophy } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              IsMyLandlordShady
              <span className="text-blue-600">.nyc</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/leaderboard/buildings"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <Trophy className="h-4 w-4" />
              <span>Worst Buildings</span>
            </Link>
            <Link
              href="/leaderboard/landlords"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <Trophy className="h-4 w-4" />
              <span>Worst Landlords</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
