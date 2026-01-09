export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Disclaimer</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Parcel Ownership Updates
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
            <p>
              Parcel ownership information is updated frequently based on upstream data sources.
            </p>
            <p>
              <strong>Latest ownership update:</strong> Nightly (source-dependent).
            </p>
            <p>
              Users must confirm parcel ownership and configuration directly with the County
              Assessor's Office prior to reliance.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Data Use and Limitations
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <p>
              The maps, data, and information provided through this site are for informational
              purposes only and do not constitute a legal survey, legal description, or
              determination of ownership, boundaries, zoning, or regulatory status.
            </p>
            <p>
              Geographic Information System (GIS) data is compiled from a variety of sources and
              is subject to change without notice. GeoSelect makes no warranties, express or
              implied, regarding the accuracy, completeness, reliability, or suitability of the
              data for any particular purpose.
            </p>
            <p>
              Parcel ownership, configuration, zoning, and regulatory attributes may change over
              time. Users are responsible for independently verifying all information with the
              appropriate authority, including the County Assessor, Planning Department, or other
              relevant agency, before making decisions or taking action.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Limitation of Liability
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            <p>
              GeoSelect assumes no liability for errors, omissions, or the use or interpretation
              of the information provided through this site.
            </p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
