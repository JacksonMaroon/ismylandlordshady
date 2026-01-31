import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Grade } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGradeColor(grade: string | null | undefined): string {
  switch (grade?.toUpperCase()) {
    case 'A':
      return 'bg-green-500 text-white';
    case 'B':
      return 'bg-lime-500 text-white';
    case 'C':
      return 'bg-yellow-500 text-black';
    case 'D':
      return 'bg-orange-500 text-white';
    case 'F':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

export function getGradeTextColor(grade: string | null | undefined): string {
  switch (grade?.toUpperCase()) {
    case 'A':
      return 'text-green-500';
    case 'B':
      return 'text-lime-500';
    case 'C':
      return 'text-yellow-500';
    case 'D':
      return 'text-orange-500';
    case 'F':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
}

export function getViolationClassColor(violationClass: string | null | undefined): string {
  switch (violationClass?.toUpperCase()) {
    case 'C':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'B':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'A':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '-';
  return score.toFixed(1);
}

export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
