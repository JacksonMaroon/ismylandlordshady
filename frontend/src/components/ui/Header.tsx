'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#D4CFC4] bg-[#FAF7F2]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#D4CFC4]">
                <Image
                  src="/favicon-48x48.png"
                  alt="NYCLandlordCheck"
                  width={18}
                  height={18}
                  priority
                />
              </span>
              <span className="font-serif font-bold text-sm sm:text-base text-[#1A1A1A]">
                NYCLandlordCheck
              </span>
              <span className="text-sm text-[#4A4A4A] font-medium hidden md:inline">
                NYC Building & Landlord Transparency
              </span>
            </Link>
            <button
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#D4CFC4] text-[#4A4A4A] hover:border-[#C65D3B] hover:text-[#C65D3B] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
          </div>

          <nav className="hidden sm:flex items-center gap-6 md:gap-10">
            <Link
              href="/leaderboard/landlords"
              className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors"
            >
              Worst Landlords
            </Link>
            <Link
              href="/methodology"
              className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors hidden md:inline"
            >
              Methodology
            </Link>
            <Link
              href="/data-sources"
              className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors hidden md:inline"
            >
              Data Sources
            </Link>
            <Link
              href="/about"
              className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors hidden lg:inline"
            >
              About
            </Link>
          </nav>

          {menuOpen && (
            <nav className="sm:hidden flex flex-col gap-3 pt-2 border-t border-[#E3DED4]">
              <Link
                href="/leaderboard/landlords"
                className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Worst Landlords
              </Link>
              <Link
                href="/methodology"
                className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Methodology
              </Link>
              <Link
                href="/data-sources"
                className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Data Sources
              </Link>
              <Link
                href="/about"
                className="text-[#1A1A1A] hover:text-[#C65D3B] text-sm font-medium transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
