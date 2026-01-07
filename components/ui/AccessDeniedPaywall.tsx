import React from "react";
import { Lock, Info } from "lucide-react";

export function AccessDeniedPaywall() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, borderRadius: 12, background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      maxWidth: 340, margin: '40px auto'
    }}>
      <Lock size={48} color="#eab308" style={{ marginBottom: 16 }} />
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#b91c1c' }}>Access Denied</div>
      <div style={{ color: '#444', marginBottom: 18, textAlign: 'center' }}>
        Unlock premium details to share this report.<br />
        <a href="/pricing" style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500 }}>More info</a>
      </div>
      <button
        style={{
          background: '#eab308', color: '#fff', border: 0, borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16
        }}
        onClick={() => window.location.href = '/pricing'}
      >
        Unlock Premium
      </button>
    </div>
  );
}
