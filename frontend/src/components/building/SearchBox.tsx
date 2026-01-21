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
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
          placeholder="Enter a NYC address..."
          className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-50 max-h-96 overflow-auto">
          {results.map((building, index) => (
            <button
              key={building.bbl}
              onClick={() => handleSelect(building)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between',
                index === selectedIndex && 'bg-blue-50'
              )}
            >
              <div>
                <div className="font-medium text-gray-900">
                  {building.address}
                </div>
                <div className="text-sm text-gray-500">
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-lg z-50 p-4 text-center text-gray-500">
          No buildings found for "{query}"
        </div>
      )}
    </div>
  );
}
