'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Download, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const parcelId = searchParams.get('parcelId') || '40023';
  const [isLoading, setIsLoading] = useState(true);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        if (!sessionId) {
          throw new Error('No session ID provided');
        }

        const response = await fetch('/api/parcel/hoa-packet/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, parcelId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment confirmation failed');
        }

        const data = await response.json();
        setDownloadLink(data.downloadLink);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    processPayment();
  }, [sessionId, parcelId]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600">Preparing your HOA packet...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <p className="text-sm text-gray-600 mb-4">
                Please contact support if this issue persists.
              </p>
            </div>
            <Link
              href={`/parcel/hoa-packet?id=${parcelId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Try Again
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your purchase. Your HOA packet is ready to download.
            </p>

            {/* Download Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-3">Your Packet</p>
              <div className="flex items-center gap-3 p-4 bg-white border border-blue-200 rounded-lg">
                <Download className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">HOA-Packet-{parcelId}.pdf</p>
                  <p className="text-xs text-gray-600">Downloaded {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            {downloadLink && (
              <a
                href={downloadLink}
                download
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 mb-3"
              >
                <Download className="w-5 h-5" />
                Download Now
              </a>
            )}

            {/* Email Confirmation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                A download link has been sent to your email. You can access this packet anytime from your account dashboard.
              </p>
            </div>

            {/* Next Steps */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="font-semibold text-gray-900 mb-4">What's Next?</h2>
              <div className="space-y-3">
                <Link
                  href={`/parcel/summary?id=${parcelId}`}
                  className="block w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Back to Parcel Details
                </Link>
                <Link
                  href="/"
                  className="block w-full py-2 px-4 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50"
                >
                  Search Another Property
                </Link>
              </div>
            </div>

            {/* User Upgrade Notice */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Welcome to Basic Buyer!</strong> You now have access to download HOA packets for any property. Your benefits have been activated.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
