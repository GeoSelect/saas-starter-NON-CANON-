'use client';

import { useApp } from '@/lib/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, CheckCircle } from 'lucide-react';

export default function BillingPage() {
  const { team } = useApp();

  if (!team) {
    return <div>Loading...</div>;
  }

  const currentPlan = {
    name: 'Professional',
    price: '$29/month',
    features: [
      'Up to 100 parcels',
      'Basic reporting',
      'Email support',
      'Monthly data updates',
    ],
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing & Plans</h2>
        <p className="mt-1 text-sm text-gray-600">Manage your subscription and invoices.</p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 border-2 border-orange-500">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-500" />
              {currentPlan.name} Plan
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{currentPlan.price}</p>
          </div>
          <Button variant="outline">Manage Plan</Button>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Includes:</p>
          <ul className="space-y-2">
            {currentPlan.features.map((feature) => (
              <li key={feature} className="text-sm text-gray-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-600">
            Next billing date: <span className="font-semibold">February 3, 2026</span>
          </p>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </h3>

        <div className="bg-gray-50 p-4 rounded-lg flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Visa ending in 4242</p>
            <p className="text-xs text-gray-600 mt-1">Expires 12/2026</p>
          </div>
          <Button size="sm" variant="outline">
            Update
          </Button>
        </div>
      </Card>

      {/* Invoices */}
      <Card className="p-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Invoices</h3>

        <div className="divide-y">
          {[
            { date: 'Jan 3, 2026', amount: '$29.00', status: 'Paid' },
            { date: 'Dec 3, 2025', amount: '$29.00', status: 'Paid' },
            { date: 'Nov 3, 2025', amount: '$29.00', status: 'Paid' },
          ].map((invoice) => (
            <div key={invoice.date} className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{invoice.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-gray-900">{invoice.amount}</p>
                <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                  {invoice.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="mt-6">
          Download All Invoices
        </Button>
      </Card>
    </div>
  );
}
