import { Suspense } from 'react';

export default function PublicFixturesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">🚀 Vercel Preview Environment</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">✅ Preview is Ready</h2>
        <p className="text-gray-700">
          This deployment is using <strong>fixture data</strong> for API endpoints.
          Perfect for UI reviews, design QA, and frontend testing.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Test Fixture Endpoints</h2>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">📋 List All Parcels</h3>
            <a 
              href="/api/parcels" 
              className="text-blue-600 hover:underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              /api/parcels
            </a>
            <p className="text-sm text-gray-600 mt-2">
              Returns a list of fixture parcels (3 total)
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">🔍 Search Parcels</h3>
            <a 
              href="/api/parcels?q=telluride" 
              className="text-blue-600 hover:underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              /api/parcels?q=telluride
            </a>
            <p className="text-sm text-gray-600 mt-2">
              Search by address, APN, owner, or zoning
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2">📄 Parcel Details</h3>
            <div className="space-y-1">
              <a 
                href="/api/parcels/parcel-1" 
                className="text-blue-600 hover:underline block"
                target="_blank"
                rel="noopener noreferrer"
              >
                /api/parcels/parcel-1
              </a>
              <a 
                href="/api/parcels/parcel-2" 
                className="text-blue-600 hover:underline block"
                target="_blank"
                rel="noopener noreferrer"
              >
                /api/parcels/parcel-2
              </a>
              <a 
                href="/api/parcels/parcel-3" 
                className="text-blue-600 hover:underline block"
                target="_blank"
                rel="noopener noreferrer"
              >
                /api/parcels/parcel-3
              </a>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Get detailed information for specific parcels
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🔧 Configuration</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <code className="bg-gray-200 px-2 py-1 rounded">NEXT_PUBLIC_API_URL</code>
              {' '}- Set this in Vercel to use real API instead of fixtures
            </li>
            <li className="text-gray-600">
              If not set, API routes will return fixture data (current behavior)
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">📚 Usage Guide</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Use this preview URL for design reviews and UI testing</li>
          <li>All API endpoints return fixture data - no backend required</li>
          <li>Share preview URLs with stakeholders for feedback</li>
          <li>Configure <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_API_URL</code> in Vercel for integration testing</li>
          <li>Check out <code className="bg-gray-200 px-1 rounded">docs/VERCEL_PREVIEW_README.md</code> for more details</li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">ℹ️ Note</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>No sensitive data is included.</strong> All fixture data is publicly safe.
            This preview is perfect for QA cycles without backend dependencies.
          </p>
        </div>
      </section>
    </div>
  );
}
