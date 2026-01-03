'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string>('');

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Sending link...');

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }

    setStatus('Magic link sent. Check your email.');
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Sign in</h1>
      <form onSubmit={sendLink}>
        <label style={{ display: 'block', marginBottom: 8 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
        />
        <button
          type="submit"
          style={{ marginTop: 12, padding: 10, borderRadius: 6, border: '1px solid #333' }}
        >
          Send magic link
        </button>
      </form>
      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}


