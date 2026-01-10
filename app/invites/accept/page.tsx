'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Validate token exists
    setLoading(false);
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    setAccepting(true);
    setError(null);

    try {
      const response = await fetch('/api/team/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      setWorkspaceName(data.workspace?.name || 'the workspace');
      toast.success('Invitation accepted! Redirecting to dashboard...');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Aboard! 🎉</h1>
          <p className="text-gray-600 mb-6">
            You've successfully joined {workspaceName}. Redirecting you to the dashboard...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Redirecting...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You've Been Invited!</h1>
          <p className="text-gray-600">
            You have been invited to join a workspace. Click accept below to get started.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full h-12 text-base"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                Accept Invitation
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <Button
            onClick={handleDecline}
            variant="outline"
            className="w-full h-12 text-base"
            disabled={accepting}
          >
            Decline
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-6">
          By accepting, you agree to collaborate with this team and follow their workspace guidelines.
        </p>
      </Card>
    </div>
  );
}
