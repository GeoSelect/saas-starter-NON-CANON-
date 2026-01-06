// Hook for logging audit events from the client
'use client';

export async function logAuditEvent(
  userId: string,
  userName: string,
  userEmail: string,
  plan: string,
  action: 'login' | 'logout' | 'signup' | 'plan_change' | 'data_export' | 'data_import',
  status: 'success' | 'failure' = 'success',
  details?: string
) {
  try {
    const response = await fetch('/api/audit/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        userEmail,
        plan,
        action,
        status,
        details,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log audit event:', response.statusText);
    }

    return response.json();
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}
