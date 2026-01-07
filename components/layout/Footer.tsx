"use client";

import Link from "next/link";
import { CircleIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <CircleIcon className="h-6 w-6 text-orange-500" />
              <span className="ml-2 text-lg font-semibold text-gray-900">GeoSelect</span>
            </Link>
            <p className="text-sm text-gray-600">
              Intelligent parcel research for modern developers. 
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/parcel/resolve" className="text-sm text-gray-600 hover:text-orange-500">
                  Parcel Search
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-orange-500">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-orange-500">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-orange-500">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/social-proof" className="text-sm text-gray-600 hover: text-orange-500">
                  Social Proof
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover: text-orange-500">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-orange-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-orange-500">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} GeoSelect. All rights reserved. 
          </p>
        </div>
      </div>
    </footer>
  );
}
