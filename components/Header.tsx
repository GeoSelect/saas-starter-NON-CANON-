'use client';

import Link from 'next/link';
import { Home, MapPin } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <MapPin className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-orange-500">GeoSelect</span>.It
            </h1>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-orange-500 transition-colors duration-200 rounded-lg hover:bg-orange-50"
            aria-label="Go to home"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Home</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
