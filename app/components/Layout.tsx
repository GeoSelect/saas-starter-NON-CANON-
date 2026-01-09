import Link from 'next/link'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src="/branding/logo/happy-hoa-logo.svg"
              alt="Application Logo"
              style={{ height: 50 }}
              className="w-auto"
            />
            <span className="text-white font-semibold hidden sm:inline">Application</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/preview"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Routes
            </Link>
            <Link
              href="/account"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              Account
            </Link>
            <Link
              href="/sign-in"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-gray-400 text-sm">
          <p>
            Powered by{' '}
            <a
              href="https://geoselect.it"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              GeoSelect.It
            </a>
            {' '}| Demo
          </p>
        </div>
      </footer>
    </div>
  )
}
