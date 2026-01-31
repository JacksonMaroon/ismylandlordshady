'use client';

import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-[#D4CFC4] bg-[#FAF7F2]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon-48x48.png"
              alt="NYCLandlordCheck"
              width={32}
              height={32}
              priority
              className="rounded-full"
            />
            <span className="font-serif font-bold text-base text-[#1A1A1A]">
              NYCLandlordCheck
            </span>

          </Link>

          <nav className="flex items-center gap-6 md:gap-10">
            <span className="text-sm text-[#4A4A4A] font-medium">
              NYC Building & Landlord Transparency
            </span>
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
        </div>
      </div>
    </header>
  );
}
