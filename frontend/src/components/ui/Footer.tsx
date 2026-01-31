'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Footer() {
  const [copied, setCopied] = useState(false);
  const shareUrl = 'https://www.nyclandlordcheck.com';
  const shareText = 'Check NYC building and landlord records with NYCLandlordCheck.';
  const emailSubject = 'NYCLandlordCheck — NYC Building & Landlord Transparency';
  const emailBody = `${shareText}\n${shareUrl}`;

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const redditHref = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', shareUrl);
    }
  };

  const openShare = (url: string) => {
    if (typeof window === 'undefined') return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmailShare = () => {
    if (typeof window === 'undefined') return;
    window.location.href = emailHref;
  };

  return (
    <footer className="border-t border-[#D4CFC4] bg-[#FAF7F2]">
      {/* Share Section */}
      <div className="max-w-xl mx-auto text-center py-10 px-4 border-b border-[#D4CFC4]">
        <p className="text-sm text-[#4A4A4A] mb-4">Know someone apartment hunting? Share NYCLandlordCheck.</p>
        <div className="flex justify-center gap-3">
          <ShareButtonButton onClick={() => openShare(twitterHref)} title="Share on Twitter/X">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </ShareButtonButton>
          <ShareButtonButton onClick={() => openShare(facebookHref)} title="Share on Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </ShareButtonButton>
          <ShareButtonButton onClick={() => openShare(redditHref)} title="Share on Reddit">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z" />
            </svg>
          </ShareButtonButton>
          <ShareButtonButton onClick={handleEmailShare} title="Share via Email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </ShareButtonButton>
          <ShareButtonButton onClick={handleCopy} title={copied ? 'Copied!' : 'Copy Link'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </ShareButtonButton>
        </div>
        <p
          className={`mt-3 text-xs transition-opacity ${copied ? 'text-[#C65D3B] opacity-100' : 'text-transparent opacity-0'}`}
          role="status"
          aria-live="polite"
        >
          Link copied!
        </p>
      </div>

      {/* Footer Links */}
      <div className="container mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 md:gap-8">
            <Link href="/about" className="text-[#4A4A4A] hover:text-[#1A1A1A] text-xs transition-colors">
              About
            </Link>
            <Link href="/methodology" className="text-[#4A4A4A] hover:text-[#1A1A1A] text-xs transition-colors">
              Methodology
            </Link>
            <Link href="/data-sources" className="text-[#4A4A4A] hover:text-[#1A1A1A] text-xs transition-colors">
              Data Sources
            </Link>
            <Link href="/api" className="text-[#4A4A4A] hover:text-[#1A1A1A] text-xs transition-colors">
              API
            </Link>
            <Link href="/privacy" className="text-[#4A4A4A] hover:text-[#1A1A1A] text-xs transition-colors">
              Privacy
            </Link>
          </div>
          <div className="text-right">
            <p className="font-serif italic text-sm text-[#4A4A4A]">Trustworthy. Distinctly New York.</p>
            <p className="text-[10px] text-[#8A8A8A] mt-0.5">© 2026 NYCLandlordCheck</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

const shareButtonClassName =
  'inline-flex items-center justify-center w-11 h-11 rounded-full bg-white border border-[#D4CFC4] text-[#4A4A4A] hover:border-[#C65D3B] hover:text-[#C65D3B] hover:-translate-y-0.5 transition-all';

function ShareButtonButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={shareButtonClassName}
    >
      {children}
    </button>
  );
}
