
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { mockEvents, mockDocuments, mockParcels } from '@/lib/test/mockActivityDb';


export default function ActivityPage() {
  // Use mock database for each section
  const events = mockEvents;
  const documents = mockDocuments;
  const parcels = mockParcels;
  // Demo payment activity
  const payments = [
    {
      id: 'pay1',
      type: 'Stripe Checkout',
      user: 'alice@example.com',
      date: '2026-01-04',
      status: 'Completed',
      amount: '$99.00',
      link: 'https://dashboard.stripe.com/test/payments',
    },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shared Links Activity Log (Demo)</h1>

      <section className="mb-10">
        <div className="relative pl-6">
          <div className="absolute left-0 top-2 w-2 h-full bg-gray-200 rounded-full" />
          <h2 className="text-xl font-semibold mb-1">Events</h2>
          <a href="/docs/audit-logging" className="text-blue-600 text-sm mb-4 block hover:underline">Track all user and system events in the audit log</a>
        </div>
        <div className="space-y-4 mt-2">
          {events.map((event) => (
            <Card key={event.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="font-semibold">{event.type}</div>
                <div className="text-gray-600 text-sm">User: {event.user}</div>
                <div className="text-gray-500 text-xs">Date: {event.date}</div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${event.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {event.status}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="relative pl-6">
          <div className="absolute left-0 top-2 w-2 h-full bg-gray-200 rounded-full" />
          <h2 className="text-xl font-semibold mb-1">Documents</h2>
          <a href="/docs/SECURITY" className="text-blue-600 text-sm mb-4 block hover:underline">Learn how documents are shared and tracked</a>
        </div>
        <div className="space-y-4 mt-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="font-semibold">{doc.name}</div>
                <div className="text-gray-600 text-sm">Shared with: {doc.sharedWith}</div>
                <div className="text-gray-500 text-xs">Date: {doc.date}</div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${doc.status === 'Viewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {doc.status === 'Viewed' ? <Check className="h-4 w-4 mr-1" /> : null}
                {doc.status}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="relative pl-6">
          <div className="absolute left-0 top-2 w-2 h-full bg-gray-200 rounded-full" />
          <h2 className="text-xl font-semibold mb-1">Parcels</h2>
          <a href="/docs/ccp/contracts" className="text-blue-600 text-sm mb-4 block hover:underline">See how parcels are tracked and shared</a>
        </div>
        <div className="space-y-4 mt-2">
          {parcels.map((parcel) => (
            <Card key={parcel.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="font-semibold">Parcel: {parcel.parcelId}</div>
                <div className="text-gray-600 text-sm">Action: {parcel.action}</div>
                <div className="text-gray-600 text-sm">Contact: {parcel.contact}</div>
                <div className="text-gray-500 text-xs">Date: {parcel.date}</div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${parcel.status === 'Viewed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {parcel.status === 'Viewed' ? <Check className="h-4 w-4 mr-1" /> : null}
                {parcel.status}
              </span>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="relative pl-6">
          <div className="absolute left-0 top-2 w-2 h-full bg-gray-200 rounded-full" />
          <h2 className="text-xl font-semibold mb-1">Payment</h2>
          <a href="/docs/stripe" className="text-blue-600 text-sm mb-4 block hover:underline">See Stripe payment activity and integration</a>
        </div>
        <div className="space-y-4 mt-2">
          {payments.map((pay) => (
            <Card key={pay.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="font-semibold">{pay.type}</div>
                <div className="text-gray-600 text-sm">User: {pay.user}</div>
                <div className="text-gray-600 text-sm">Amount: {pay.amount}</div>
                <div className="text-gray-500 text-xs">Date: {pay.date}</div>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                {pay.status}
              </span>
              <a href={pay.link} target="_blank" rel="noopener" className="ml-4 text-blue-600 text-xs underline">View in Stripe</a>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
