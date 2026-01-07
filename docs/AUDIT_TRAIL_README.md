# Audit Trail System Documentation

## Overview

The audit trail system tracks all user activity including logins, signups, plan changes, and data modifications. It captures:
- **Date & Time** - Exact timestamp of the event
- **User Info** - Name, email, and user ID
- **Plan** - Current subscription plan
- **IP Address** - Source IP for security tracking
- **Action** - Type of activity (login, logout, signup, etc.)
- **Status** - Success or failure

## Architecture

### Files Created

```
lib/
  audit/
    log.ts              # Core audit logging utilities
    client.ts           # Client-side logging hook
    INTEGRATION_GUIDE.ts # Integration instructions
    
app/
  api/
    audit/
      log/
        route.ts        # API endpoint for logging and retrieving logs
  (dashboard)/
    audit/
      page.tsx          # Audit dashboard UI
      
components/
  RecentActivityWidget.tsx  # Widget for main dashboard
  
migrations/
  001_create_audit_logs.sql # Database schema
```

## Setup Instructions

### 1. Database Setup

Run the migration SQL to create the `audit_logs` table:

```bash
# If using Supabase
supabase db push migrations/001_create_audit_logs.sql

# If using MySQL directly
mysql -u username -p database_name < migrations/001_create_audit_logs.sql

# If using PostgreSQL directly
psql -U username -d database_name -f migrations/001_create_audit_logs.sql
```

Or manually execute the SQL from `migrations/001_create_audit_logs.sql` in your database.

### 2. Environment Variables

No additional environment variables needed - uses existing database connection.

### 3. Integration with Sign-In

Update your `/(login)/sign-in/page.tsx`:

```typescript
'use client';

import { logAuditEvent } from '@/lib/audit/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSignIn(email: string, password: string) {
    try {
      // Call your existing auth API
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Sign in failed');
      }

      const user = await response.json();

      // Log successful login
      await logAuditEvent(
        user.id,
        user.name,
        user.email,
        user.plan || 'browse',
        'login',
        'success'
      );

      router.push('/(dashboard)/chat');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMsg);

      // Log failed login attempt
      await logAuditEvent(
        email,
        'Unknown',
        email,
        'browse',
        'login',
        'failure',
        errorMsg
      );
    }
  }

  return (
    // Your existing sign-in form
    // Call handleSignIn on form submit
  );
}
```

### 4. Integration with Sign-Up

Update your `/(login)/sign-up/page.tsx`:

```typescript
// After successful user creation:
await logAuditEvent(
  newUser.id,
  newUser.name,
  newUser.email,
  'browse', // Default plan for new users
  'signup',
  'success',
  'New user registration'
);
```

### 5. Integration with Plan Changes

When users upgrade/downgrade plans:

```typescript
await logAuditEvent(
  user.id,
  user.name,
  user.email,
  newPlan,
  'plan_change',
  'success',
  `Upgraded from ${oldPlan} to ${newPlan}`
);
```

## Accessing Audit Logs

### Dashboard View

Navigate to `/(dashboard)/audit` to see:
- **Summary Cards**: Total events, successful logins, failed attempts
- **Detailed Table**: All events with filtering and sorting
- **Event Details**: Date, time, user, plan, IP, action, status

### API Endpoints

**GET** `/api/audit/log?limit=50&userId=<user_id>`
- Returns audit logs
- Query params:
  - `limit` (default: 50) - Number of logs to return
  - `userId` (optional) - Filter by specific user

Response:
```json
{
  "success": true,
  "total": 100,
  "returned": 50,
  "logs": [
    {
      "id": "audit_1704067200000_abc123def",
      "user_id": "user_123",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "plan": "pro + crm",
      "action": "login",
      "date": "2024-01-01",
      "time": "14:30:45",
      "ip_address": "192.168.1.100",
      "status": "success",
      "timestamp": "2024-01-01T14:30:45.000Z"
    }
  ]
}
```

**POST** `/api/audit/log`
- Logs an event
- Required body fields:
  - `userId` - User ID
  - `userName` - User name
  - `userEmail` - User email
  - `action` - 'login' | 'logout' | 'signup' | 'plan_change' | 'data_export' | 'data_import'

Optional fields:
  - `plan` - Current plan
  - `status` - 'success' | 'failure'
  - `details` - Additional details

## Dashboard Widget

Add the recent activity widget to your main dashboard:

```typescript
import { RecentActivityWidget } from '@/components/RecentActivityWidget';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* ... other widgets */}
      <div className="col-span-1">
        <RecentActivityWidget />
      </div>
    </div>
  );
}
```

## Data Storage

### Current Implementation

Events are currently stored **in-memory** via the API route (`app/api/audit/log/route.ts`).

### Migration to Database

To persist logs to PostgreSQL/MySQL:

1. Update `app/api/audit/log/route.ts`:
   ```typescript
   // Replace in-memory array with database call
   const query = `
     INSERT INTO audit_logs (
       id, user_id, user_name, user_email, plan, action, 
       timestamp, date, time, ip_address, user_agent, status, details, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `;
   
   await db.query(query, [
     auditLog.id,
     auditLog.user_id,
     auditLog.user_name,
     // ... etc
   ]);
   ```

2. Update GET endpoint to fetch from database instead of memory

## Database Views

The migration creates helpful views:

### audit_daily_logins
Daily login summary:
```sql
SELECT * FROM audit_daily_logins;
```

### audit_user_logins
User login history:
```sql
SELECT * FROM audit_user_logins;
```

### audit_failed_logins
Failed login attempts:
```sql
SELECT * FROM audit_failed_logins;
```

## Security Considerations

1. **IP Capture**: IP addresses are logged for security auditing
2. **Failed Attempts**: Track failed logins to detect brute force attacks
3. **Data Retention**: Logs older than 1 year can be deleted via stored procedure
4. **Access Control**: Restrict audit page to admins/owners via AuthContext
5. **No Password Logging**: Never log passwords or sensitive auth data

## Performance

- **Indexes**: Created on user_id, timestamp, action, status for fast queries
- **Partitioning**: Consider table partitioning by date for large datasets
- **Archival**: Move logs older than 1 year to archive table

## Future Enhancements

- [ ] Export logs to CSV/JSON
- [ ] Email alerts for suspicious activity
- [ ] Geographic IP mapping
- [ ] Device fingerprinting
- [ ] Real-time activity stream with WebSocket
- [ ] Analytics dashboard
- [ ] Data modification tracking
- [ ] Admin approval workflows

## Troubleshooting

**Logs not appearing?**
- Check that `logAuditEvent()` is called after successful auth
- Verify API endpoint `/api/audit/log` is accessible
- Check browser console for fetch errors

**IP shows as "unknown"?**
- Verify request headers are passed correctly
- Check proxy/reverse proxy configuration

**Dashboard not loading?**
- Verify API endpoint is working: `GET /api/audit/log`
- Check for CORS issues in browser console

## Support

For issues or questions, refer to `lib/audit/INTEGRATION_GUIDE.ts` for detailed examples.
