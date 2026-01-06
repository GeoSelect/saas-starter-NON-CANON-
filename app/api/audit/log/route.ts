// API route to log audit events
// POST /api/audit/log

import { createAuditLog, getClientIp } from '@/lib/audit/log';

// In-memory audit log store (replace with database later)
const auditLogs: any[] = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      userName,
      userEmail,
      plan,
      action,
      status,
      details,
    } = body;

    // Validate required fields
    if (!userId || !userName || !userEmail || !action) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get IP address from request headers
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create audit log entry
    const auditLog = createAuditLog(
      userId,
      userName,
      userEmail,
      plan || 'unknown',
      action,
      ipAddress,
      status || 'success',
      userAgent,
      details
    );

    // Store in memory (TODO: persist to database)
    auditLogs.push(auditLog);

    return Response.json(
      { success: true, log: auditLog },
      { status: 201 }
    );
  } catch (error) {
    console.error('Audit log error:', error);
    return Response.json(
      { error: 'Failed to log audit event' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve audit logs
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const userId = url.searchParams.get('userId');

    let logs = auditLogs;

    // Filter by user if specified
    if (userId) {
      logs = logs.filter(log => log.user_id === userId);
    }

    // Sort by timestamp descending (most recent first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    const limitedLogs = logs.slice(0, limit);

    return Response.json({
      success: true,
      total: logs.length,
      returned: limitedLogs.length,
      logs: limitedLogs,
    });
  } catch (error) {
    console.error('Audit log retrieval error:', error);
    return Response.json(
      { error: 'Failed to retrieve audit logs' },
      { status: 500 }
    );
  }
}
