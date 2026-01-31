'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchBuildings } from '@/lib/api';
import { cn, getGradeColor } from '@/lib/utils';
import type { BuildingSearch } from '@/lib/types';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchBuildings(query),
    enabled: query.length >= 3,
    staleTime: 30000,
  });

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleSelect = (building: BuildingSearch) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/building/${building.bbl}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results?.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative group">
        <div className="flex bg-white border-2 border-[#1A1A1A] rounded-xl overflow-hidden shadow-md transition-all duration-200 group-focus-within:shadow-xl group-focus-within:-translate-y-0.5 group-focus-within:border-[#C65D3B]">
          <span className="flex items-center pl-4 text-[#8A8A8A]">
            <Search className="w-5 h-5" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Enter any NYC address or landlord name..."
            className="flex-1 px-3 py-4 text-base bg-transparent border-none outline-none placeholder:text-[#8A8A8A]"
          />
          {isLoading ? (
            <span className="flex items-center pr-4">
              <Loader2 className="w-5 h-5 text-[#8A8A8A] animate-spin" />
            </span>
          ) : (
            <button className="bg-[#C65D3B] hover:bg-[#B54D2B] text-white font-semibold px-5 m-1.5 rounded-lg transition-colors">
              Search
            </button>
          )}
        </div>
        <p className="text-sm text-[#8A8A8A] mt-3">
          Try &quot;123 Main St Brooklyn&quot; or &quot;Kushner Companies&quot;
        </p>
      </div>

      {/* Dropdown Results */}
      {isOpen && results && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#1A1A1A] rounded-xl shadow-xl z-50 max-h-96 overflow-auto">
          {results.map((building, index) => (
            <button
              key={building.bbl}
              onClick={() => handleSelect(building)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-[#FAF7F2] flex items-center justify-between transition-colors',
                index === selectedIndex && 'bg-[#FAF7F2]'
              )}
            >
              <div>
                <div className="font-medium text-[#1A1A1A]">
                  {building.address}
                </div>
                <div className="text-sm text-[#8A8A8A]">
                  {building.borough} | {building.units ?? '-'} units
                </div>
              </div>
              {building.grade && (
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-bold',
                    getGradeColor(building.grade)
                  )}
                >
                  {building.grade}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 3 && !isLoading && results?.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#1A1A1A] rounded-xl shadow-xl z-50 p-4 text-center text-[#8A8A8A]">
          No buildings found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
