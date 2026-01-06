import Link from 'next/link';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/lib/context/AuthContext';

export default function ChatPage() {
  return (
    <AuthProvider>
      <ChatPageContent />
    </AuthProvider>
  );
}

function ChatPageContent() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-grow pb-24">
        <div className="px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Chat</h1>
            
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-gray-600 text-sm mb-2">AI Assistant</div>
                <p className="text-gray-800">Hello! How can I help you today?</p>
              </div>

              <div className="bg-orange-100 rounded-lg p-4 ml-8">
                <div className="text-orange-600 text-sm mb-2">You</div>
                <p className="text-gray-800">I'd like to know more about the analytics feature</p>
              </div>

              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-gray-600 text-sm mb-2">AI Assistant</div>
                <p className="text-gray-800">
                  Our Advanced Analytics dashboard provides real-time insights into your parcel data. 
                  You can track performance metrics, generate reports, and export data for further analysis.
                </p>
              </div>
            </div>

            {/* Chat Input */}
            <div className="mt-8 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Link href="/search" className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold">
                Send
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNavigation />
    </div>
  );
}
