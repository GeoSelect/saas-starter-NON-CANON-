'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { ChevronRight, Search, Map, BarChart3, Users, Shield, Zap, BookOpen } from 'lucide-react';

export default function DocumentationPage() {
  const sections = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      items: [
        {
          title: 'Creating Your Account',
          description: 'Sign up for GeoSelect and set up your workspace in minutes.',
          link: '/sign-up',
        },
        {
          title: 'Choosing Your Plan',
          description: 'Compare our plans and find the perfect fit for your needs.',
          link: '/pricing',
        },
        {
          title: 'First Search',
          description: 'Learn how to perform your first parcel search.',
          link: '/search',
        },
      ],
    },
    {
      title: 'Features',
      icon: Zap,
      items: [
        {
          title: 'Parcel Search',
          description: 'Search millions of parcels with advanced filters and real-time data.',
        },
        {
          title: 'Property Details',
          description: 'View comprehensive property information including location, boundaries, and history.',
        },
        {
          title: 'Address Lookup',
          description: 'Find properties by address with Google Maps integration.',
        },
      ],
    },
    {
      title: 'Your Account',
      icon: Users,
      items: [
        {
          title: 'Settings',
          description: 'Manage your account preferences and personal information.',
          link: '/settings',
        },
        {
          title: 'Audit Trail',
          description: 'Track all activity and login history for security and compliance.',
          link: '/audit',
        },
        {
          title: 'View Demo',
          description: 'See a sample audit trail showing what you\'ll track.',
          link: '/audit-demo',
        },
      ],
    },
    {
      title: 'Security & Privacy',
      icon: Shield,
      items: [
        {
          title: 'Data Protection',
          description: 'Your data is encrypted and protected with industry-standard security measures.',
        },
        {
          title: 'Activity Monitoring',
          description: 'Monitor all account activities and login attempts in real-time.',
        },
        {
          title: 'Plan-Based Access',
          description: 'Different plans provide different levels of access and features.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-lg text-gray-600">
            Learn how to use GeoSelect.It to search, analyze, and manage parcel data efficiently.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                </div>

                <div className="space-y-3">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="pb-3 border-b border-gray-100 last:border-0">
                      {item.link ? (
                        <Link
                          href={item.link}
                          className="flex items-start justify-between group hover:text-orange-500 transition"
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-orange-500">{item.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 flex-shrink-0 mt-1" />
                        </Link>
                      ) : (
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What is GeoSelect.It?</h3>
              <p className="text-gray-600">
                GeoSelect.It is a comprehensive parcel data platform that provides access to millions of property records,
                detailed parcel information, and advanced search capabilities for real estate professionals.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I search for parcels?</h3>
              <p className="text-gray-600">
                You can search for parcels using our search page. Enter an address or use our address autocomplete feature
                powered by Google Maps to find properties instantly. The results show detailed information about each parcel
                including location, boundaries, and more.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What plans do you offer?</h3>
              <p className="text-gray-600">
                We offer several plans including Browse (free), Home, Studio, and Pro plans with different features. View our{' '}
                <Link href="/pricing" className="text-orange-500 hover:text-orange-600 font-medium">
                  pricing page
                </Link>{' '}
                for detailed comparison.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How is my data protected?</h3>
              <p className="text-gray-600">
                Your data is encrypted, secured, and monitored 24/7. We maintain detailed audit logs of all account activity,
                and you can view your security logs anytime in the Audit Trail section.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I export data?</h3>
              <p className="text-gray-600">
                Data export is available on select plans. Studio and higher plans include batch export functionality for
                managing large datasets efficiently.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you have an API?</h3>
              <p className="text-gray-600">
                API access is available for Enterprise and Portfolio plans. Contact our sales team for more information
                about integration options.
              </p>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Search className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Advanced Search</h3>
                <p className="text-sm text-gray-600">Search millions of parcels with powerful filters and real-time results.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Map className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Google Maps Integration</h3>
                <p className="text-sm text-gray-600">View properties on interactive maps with embedded Street View.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <BarChart3 className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Analytics & Reports</h3>
                <p className="text-sm text-gray-600">Generate comprehensive reports and analytics on property data.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Security & Audit</h3>
                <p className="text-sm text-gray-600">Track all account activity with detailed audit logs and history.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Create an account and start searching for properties today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
            >
              Create Account
            </Link>
            <Link
              href="/search"
              className="px-6 py-3 bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold rounded-lg transition"
            >
              Try Demo Search
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
