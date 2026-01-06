// Audit logging utilities for tracking user activity

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan: string;
  action: 'login' | 'logout' | 'signup' | 'plan_change' | 'data_export' | 'data_import';
  timestamp: Date;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  ip_address: string;
  user_agent?: string;
  status: 'success' | 'failure';
  details?: string;
  created_at: Date;
}

// Extract IP from headers
export function getClientIp(request: Request): string {
  const headersList = request.headers;
  
  // Try various header sources for IP (in order of precedence)
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const clientIp = headersList.get('cf-connecting-ip');
  if (clientIp) {
    return clientIp;
  }
  
  // Fallback
  return 'unknown';
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format time as HH:MM:SS
export function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0];
}

// Create a new audit log entry
export function createAuditLog(
  userId: string,
  userName: string,
  userEmail: string,
  plan: string,
  action: AuditLog['action'],
  ipAddress: string,
  status: 'success' | 'failure',
  userAgent?: string,
  details?: string
): AuditLog {
  const now = new Date();
  
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    user_name: userName,
    user_email: userEmail,
    plan,
    action,
    timestamp: now,
    date: formatDate(now),
    time: formatTime(now),
    ip_address: ipAddress,
    user_agent: userAgent,
    status,
    details,
    created_at: now,
  };
}
