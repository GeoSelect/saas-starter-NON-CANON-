"use client";

export default function MobileLandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-orange-50 to-orange-100">
      <h1 className="text-3xl font-bold text-orange-700 mb-4">Welcome to GeoSelect Mobile</h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-md">
        Start your parcel search, view reports, and manage your workspace on the go.
      </p>
      <a
        href="/mobile-onboarding-choice"
        className="px-6 py-3 rounded-full bg-orange-600 text-white font-semibold shadow hover:bg-orange-700 transition"
      >
        Get Started
      </a>
    </main>
  );
}
