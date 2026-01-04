# Observability & Monitoring Guide

## Overview

GeoSelect includes minimal but effective observability infrastructure for tracking key operations and debugging issues.

## Logging Infrastructure

### Logger API

Located in `lib/observability/logger.ts`:

```typescript
import { logger } from '@/lib/observability/logger';

// Info: Important operations
logger.info('operation_name', { userId: 1, duration: 234 });

// Debug: Development-only details
logger.debug('operation_name', { details: 'value' });

// Warn: Non-critical issues
logger.warn('operation_name', { issue: 'description' });

// Error: Critical failures
logger.error('operation_name', error, { context: 'value' });
```

### Log Format

All logs are structured JSON for easy parsing:

```json
{
  "timestamp": "2026-01-04T12:00:00.000Z",
  "level": "info",
  "operation": "report_created",
  "environment": "production",
  "userId": 1,
  "teamId": 1,
  "reportId": "abc123",
  "duration": 234
}
```

## Instrumented Operations

### Report Creation

**Flow**: Client → SaveReportDialog → createReport action → Database

**Logs Generated**:
1. `report_create_start` (debug) - User initiates save
2. `report_created` (info) - Success with reportId, duration
3. `report_create_failed` (error) - Failure with error details
4. `report_create_success` (info) - Client-side success handler triggered

**Key Metrics**:
- `reportId` - Unique report identifier
- `userId` - Who created it
- `teamId` - Which team owns it
- `address` - Property being reported on
- `duration` - Time from start to database insert

### Report Listing

**Flow**: Client → ReportsPage useEffect → /api/reports → Database

**Logs Generated**:
1. `reports_load_start` (debug) - Page loads
2. `reports_listed` (info) - API returns data
3. `reports_list_failed` (error) - Query fails
4. `reports_load_success` (info) - Client receives data

**Key Metrics**:
- `count` - Number of reports returned
- `teamId` - Which team's reports
- `duration` - Query time

## Error Boundaries

### ErrorBoundary Component

Location: `components/error-boundary.tsx`

Catches React errors at component level and logs them:

```tsx
<ErrorBoundary operation="reports-page">
  {/* Child components */}
</ErrorBoundary>
```

Logs include:
- `operation` - What was the user doing
- `componentStack` - React component trace
- `errorBoundary: true` - Indicates this is from boundary

### Usage Example

```tsx
// Wrap pages or sections that might error
<ErrorBoundary 
  operation="report-creation"
  fallback={<ErrorFallback />}
  onError={(error, info) => {
    // Custom error handling
  }}
>
  <SaveReportDialog {...props} />
</ErrorBoundary>
```

## Monitoring in Development

### Console Output

In development mode (`NODE_ENV=development`), logs appear in console:

```
[INFO] {"timestamp":"2026-01-04T12:00:00Z","operation":"report_created",...}
```

### Real-time Monitoring

Watch application logs in real-time:

```bash
# On macOS/Linux
tail -f ~/.local/share/geoselect/logs/app.log

# On Windows (PowerShell)
Get-Content -Path "$env:APPDATA\geoselect\logs\app.log" -Tail 20 -Wait
```

## Monitoring in Production

### Accessing Logs

#### Vercel
1. Go to project → Deployments → select deployment
2. Click "Logs" tab
3. View function and build logs

#### Netlify
1. Go to Site Settings → Logs
2. Select date range
3. View function and edge logs

### Log Aggregation (Coming Soon)

To set up centralized logging:

1. **Sentry.io** (recommended for errors)
   ```typescript
   // Add to logger.ts sendToMonitoring()
   import * as Sentry from "@sentry/nextjs";
   Sentry.captureException(error);
   ```

2. **LogRocket** (session recording)
   - Requires integration in app/layout.tsx
   - Records user sessions with errors

3. **Datadog**
   - Structured log ingestion
   - Custom dashboards and alerts

### Setting Up Sentry

1. Create account at sentry.io
2. Create Next.js project
3. Install SDK: `npm install @sentry/nextjs`
4. Configure in `sentry.config.ts`
5. Add environment variable: `NEXT_PUBLIC_SENTRY_DSN`

## Key Metrics to Monitor

### Performance
- `duration` on report operations (target: <500ms)
- API response times (target: <1s)

### Errors
- `report_create_failed` - Creation failures
- `reports_list_failed` - Listing failures
- Error boundary catches - Unexpected React errors

### Usage
- `report_created` - Daily report count
- `reports_listed` - How many accessed reports

## Debugging with Logs

### Find All Operations by User

```bash
grep "userId.*1" app.log
```

### Find All Errors in Timeframe

```bash
grep '"level":"error"' app.log | tail -50
```

### Find Slow Operations

```bash
grep -E 'duration.*[0-9]{4,}' app.log  # > 1000ms
```

### Track a Report's Lifecycle

```bash
grep "reportId.*abc123" app.log
```

## Best Practices

### When Adding New Features

1. Add `logger.debug()` at start
2. Add `logger.info()` on success
3. Add `logger.error()` with context on failure
4. Include operation name, userId, duration

### Log Sensitive Data Carefully

✅ Safe to log:
- Operation names
- IDs (userId, teamId, reportId)
- Durations
- Status codes
- Addresses

❌ Never log:
- Passwords
- API keys
- Personal information
- Full error stacks in production
- Service role keys

### Performance Monitoring

```typescript
const startTime = Date.now();
try {
  // operation
} finally {
  const duration = Date.now() - startTime;
  logger.info('operation_complete', { duration });
}
```

## Future Enhancements

- [ ] Metrics dashboard (Grafana)
- [ ] Alert rules (e.g., error rate > 5%)
- [ ] Performance budgets
- [ ] User session tracking
- [ ] A/B testing integration
