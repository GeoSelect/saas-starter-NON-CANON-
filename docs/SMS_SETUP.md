# Phone/SMS OTP Authentication Setup Guide

Complete guide for implementing and configuring phone/SMS OTP authentication using Supabase.

## Overview

This implementation adds phone number authentication with SMS OTP (One-Time Password) verification alongside existing email/password authentication. Users can sign in by:

1. Entering their phone number in E.164 format (e.g., +14155552671)
2. Receiving a 6-digit code via SMS
3. Entering the code to verify and sign in

## Prerequisites

- Supabase project created and configured
- Supabase auth client initialized in your application
- Node.js 16+ and npm/pnpm

## Step 1: Enable Phone Authentication in Supabase

### 1.1 Access Authentication Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Look for **Phone** provider

### 1.2 Enable Phone Provider

1. Click on **Phone** in the providers list
2. Toggle **Enable Phone signup** to ON
3. Choose your SMS provider (see Step 2)
4. Click **Save**

## Step 2: Configure SMS Provider

Supabase supports multiple SMS providers. Choose one based on your needs:

### Option A: Twilio (Recommended for US/International)

**Advantages:**
- Best international coverage
- Reliable delivery
- Good documentation
- Competitive pricing (~$0.01 per SMS)

**Setup:**

1. Sign up at [Twilio](https://www.twilio.com)
2. Get your **Account SID** and **Auth Token** from the dashboard
3. Purchase a phone number (or use trial number for testing)
4. In Supabase Phone provider settings:
   - Select **Twilio** as the provider
   - Enter Account SID
   - Enter Auth Token
   - Enter your Twilio phone number
5. Click **Save**

### Option B: MessageBird

**Advantages:**
- Good European coverage
- Simple setup
- Competitive pricing

**Setup:**

1. Sign up at [MessageBird](https://www.messagebird.com)
2. Get your **API Key**
3. In Supabase Phone provider settings:
   - Select **MessageBird**
   - Enter API Key
4. Click **Save**

### Option C: Vonage (Nexmo)

**Advantages:**
- Excellent international coverage
- Large network
- Good for scalability

**Setup:**

1. Sign up at [Vonage](https://www.vonage.com)
2. Get your **API Key** and **API Secret**
3. In Supabase Phone provider settings:
   - Select **Vonage**
   - Enter API Key
   - Enter API Secret
4. Click **Save**

## Step 3: Configure Rate Limiting

Protect against abuse by setting rate limits:

1. In Supabase Authentication settings
2. Under **Security**, find **Rate Limiting**
3. Set SMS rate limit (recommended: 3-5 SMS per hour per phone number)
4. This prevents users from requesting too many codes

## Step 4: Update API Routes for Production

The API routes include TODO comments where Supabase Auth calls should be added.

### Update `/api/auth/phone-otp/route.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // ... validation code ...

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            );
          } catch {
            // Handle error during cookie setting
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'OTP sent successfully',
  });
}
```

### Update `/api/auth/verify-phone-otp/route.ts`:

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  phone: phone,
  token: token,
  type: 'sms',
});

if (error) {
  return NextResponse.json(
    { error: error.message || 'Invalid or expired verification code' },
    { status: 401 }
  );
}

// User is now authenticated
return NextResponse.json({
  success: true,
  message: 'Phone verified and signed in',
  user: data.user,
});
```

## Step 5: Testing

### 5.1 Development Testing

Use Supabase's test phone numbers:
- **+1234567890** - Always returns OTP: **123456**
- **+0987654321** - Always returns OTP: **123456**

### 5.2 Test Flow

1. Navigate to sign-in page
2. Click **Phone** tab
3. Enter test phone number: `+1234567890`
4. Click **Send Code**
5. Enter OTP: `123456`
6. Verify success message

### 5.3 Production Testing

Before deploying:

1. Send test SMS to real phone number
2. Verify SMS arrives within 10 seconds
3. Test with multiple phone number formats
4. Test international numbers (+44, +81, etc.)
5. Verify rate limiting works

## Step 6: Environment Variables

Ensure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema

No additional database tables needed. Supabase Auth handles user creation and session management automatically.

## Security Considerations

### 1. OTP Expiration
- Supabase default: 60 seconds
- Configure in Phone provider settings if needed

### 2. Rate Limiting
- Always enable rate limiting
- Recommended: 3-5 SMS per hour per phone
- Prevents SMS spam and credential stuffing

### 3. Input Validation
- Only accept E.164 format phone numbers
- Validate 6-digit codes on frontend and backend
- Never log sensitive phone information

### 4. Session Management
- Use secure, httpOnly cookies
- Set appropriate session timeouts
- Implement logout clearing

### 5. SMS Content
- Never send codes via email subject lines
- Keep SMS messages simple and clear
- Include company name for context

## Cost Estimation

### Twilio
- SMS cost: ~$0.01 per SMS
- For 1,000 active users with 1 code/week: ~$40/month
- Setup fee: None

### MessageBird
- SMS cost: ~$0.01-0.02 per SMS
- Similar monthly cost to Twilio

### Vonage
- SMS cost: ~$0.01 per SMS
- Volume discounts available

### Cost Optimization
- Use test numbers in development
- Set rate limits to reduce abuse
- Monitor delivery failures
- Consider authentication method mix (email vs SMS)

## Monitoring & Analytics

### Key Metrics to Track
1. **OTP Delivery Rate**: Percentage of SMS successfully delivered
2. **Verification Success Rate**: Percentage of valid OTPs entered
3. **Failed Attempts**: Track repeated failures
4. **Abuse Attempts**: Monitor unusual patterns

### Supabase Analytics
1. Go to **Authentication** → **Logs**
2. Filter by **Phone** provider
3. Monitor for failed sign-ins
4. Check for rate limit blocks

## Troubleshooting

### SMS Not Received
- Verify phone number format (E.164)
- Check SMS provider account balance
- Verify provider credentials in Supabase
- Check phone number isn't blacklisted
- Test with SMS provider directly

### OTP Always Invalid
- Check OTP hasn't expired (60s default)
- Verify exact 6-digit code
- Ensure no leading zeros accidentally added
- Check system clock is synchronized

### Rate Limit Errors
- Wait before requesting new code
- Check configured limit in Supabase
- Verify not hitting provider rate limits

### User Not Created
- Check "Create user on signup" enabled
- Verify user doesn't already exist
- Check database insert isn't failing

## Integration Examples

### React Component
```typescript
const [phone, setPhone] = useState('');
const [showOtp, setShowOtp] = useState(false);
const [code, setCode] = useState('');

const handleSendOtp = async () => {
  const response = await fetch('/api/auth/phone-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await response.json();
  if (data.success) setShowOtp(true);
};

const handleVerifyOtp = async () => {
  const response = await fetch('/api/auth/verify-phone-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, token: code }),
  });
  const data = await response.json();
  if (data.success) router.push('/(dashboard)/chat');
};
```

## Fallback Options

If SMS provider unavailable:
1. Automatically fall back to email OTP
2. Offer alternative auth methods
3. Display helpful error messages
4. Log issues for debugging

## Additional Resources

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio Setup](https://www.twilio.com/docs/sms/quickstart)
- [MessageBird Setup](https://developers.messagebird.com/quickstart)
- [Vonage Setup](https://developer.vonage.com/)
- [E.164 Phone Format](https://en.wikipedia.org/wiki/E.164)

## Support

For issues with:
- **Supabase Auth**: Check [Supabase Documentation](https://supabase.com/docs)
- **SMS Delivery**: Contact your SMS provider support
- **Application**: Debug logs in browser console and server logs

## Changelog

- **v1.0** (Jan 2026): Initial implementation
  - Phone OTP API endpoints
  - Tab-based UI for Email/Phone
  - E.164 validation
  - SMS provider setup guide
