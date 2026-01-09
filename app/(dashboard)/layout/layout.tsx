// app/(dashboard)/layout.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Telluride
          </Link>
          <div className="flex gap-6">
            <Link href="/pricing" className="text-gray-700 hover:text-indigo-600">
              Pricing
            </Link>
            <Link href="/account" className="text-gray-700 hover:text-indigo-600">
              Account
            </Link>
            <button
              onClick={() => router.push('/api/auth/logout')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}