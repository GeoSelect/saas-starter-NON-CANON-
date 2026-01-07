'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function ComponentsPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header with Home Button */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Component Preview</h1>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <h2 className="text-3xl font-bold text-white mb-4">Components Showcase</h2>
          <p className="text-gray-300 mb-6">
            This page will showcase all the components and UI elements used throughout the application.
          </p>
          <div className="bg-gray-900 rounded p-4 text-gray-400 text-sm">
            Component previews coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
