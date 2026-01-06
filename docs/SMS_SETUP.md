# SMS Authentication Setup

This guide explains how to configure SMS/Phone OTP authentication for your SaaS application using Supabase.

## Overview

Phone authentication allows users to sign in using their phone number. Supabase sends a 6-digit OTP (One-Time Password) via SMS, which the user enters to verify their identity.

## Supabase Configuration

### 1. Enable Phone Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Phone** in the list of providers
5. Toggle the **Enable Phone provider** switch to ON

### 2. Configure SMS Provider

Supabase supports multiple SMS providers. Choose one based on your needs:

#### Option 1: Twilio (Recommended for Production)

**Best for:** Production applications with high volume

1. In the Phone provider settings, select **Twilio** from the dropdown
2. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
3. Get your credentials from the Twilio Console:
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (or Messaging Service SID)
4. Enter these credentials in the Supabase Phone provider settings
5. Save the configuration

**Pricing:** Pay-as-you-go, starting at $0.0075/SMS (US)

#### Option 2: MessageBird

**Best for:** International SMS with competitive pricing

1. Select **MessageBird** from the provider dropdown
2. Sign up at [MessageBird](https://www.messagebird.com)
3. Get your **API Key** from the MessageBird dashboard
4. Enter the API key in Supabase
5. Configure your originator (sender ID)
6. Save the configuration

#### Option 3: Vonage (formerly Nexmo)

**Best for:** Global reach and reliability

1. Select **Vonage** from the provider dropdown
2. Create a [Vonage account](https://www.vonage.com)
3. Get your credentials:
   - **API Key**
   - **API Secret**
4. Enter credentials in Supabase
5. Save the configuration

#### Option 4: Supabase Test Provider (Development Only)

**Best for:** Development and testing (NOT for production)

⚠️ **Warning:** The test provider has strict rate limits and should never be used in production.

1. Select **Test Provider** from the dropdown
2. Save the configuration
3. Use test phone numbers for development

**Limitations:**
- Very low rate limits
- May not deliver SMS reliably
- Not suitable for production use

### 3. Configure Rate Limiting (Recommended)

To prevent SMS abuse and reduce costs:

1. In **Authentication** → **Rate Limits**, configure:
   - **SMS per hour:** 3-5 (recommended)
   - **OTP verification attempts:** 5-10 per hour
2. Save the settings

### 4. Set OTP Expiry (Optional)

1. In **Authentication** → **Settings**, find **OTP Expiry**
2. Default is 60 seconds
3. Adjust based on your needs (30-300 seconds recommended)

## Environment Variables

If you're using custom SMS provider settings, add these to your `.env.local`:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Base URL for redirects (optional, defaults to current domain)
BASE_URL=https://yourdomain.com
```

## Testing

### Development Testing

1. **Use Test Phone Numbers:**
   - Format: `+1234567890` (E.164 format)
   - Include country code
   - For testing, you can use your own phone number

2. **Test the Flow:**
   ```
   1. Navigate to /sign-in
   2. Click the "Phone" tab
   3. Enter phone number (e.g., +1234567890)
   4. Click "Send Code"
   5. Check your phone for the SMS
   6. Enter the 6-digit code
   7. Click "Verify Code"
   8. You should be redirected to the dashboard
   ```

3. **Common Test Numbers:**
   - US: `+1` followed by 10 digits
   - UK: `+44` followed by 10 digits
   - Other: Use [E.164 format](https://en.wikipedia.org/wiki/E.164)

### Production Testing

Before launching:

1. ✅ Test with multiple phone numbers
2. ✅ Test international formats (+1, +44, +91, etc.)
3. ✅ Verify rate limiting works correctly
4. ✅ Test error scenarios (invalid code, expired OTP)
5. ✅ Monitor SMS delivery rates
6. ✅ Check SMS costs and set up billing alerts

## Phone Number Format

All phone numbers must be in **E.164 format**:

- Starts with `+`
- Followed by country code (1-3 digits)
- Followed by subscriber number (up to 15 digits total)
- No spaces, dashes, or parentheses

**Valid Examples:**
- `+14155552671` (US)
- `+442071838750` (UK)
- `+919876543210` (India)

**Invalid Examples:**
- `4155552671` (missing +)
- `+1 (415) 555-2671` (contains spaces/parentheses)
- `+1-415-555-2671` (contains dashes)

## Security Considerations

### Rate Limiting
- **Default:** 3-5 SMS per phone number per hour
- **Why:** Prevents SMS spam and reduces costs
- **How:** Configured in Supabase Dashboard → Authentication → Rate Limits

### OTP Expiry
- **Default:** 60 seconds
- **Range:** 30-300 seconds recommended
- **Why:** Shorter expiry = more secure, but less user-friendly

### Verification Attempts
- **Default:** 5-10 attempts per hour
- **Why:** Prevents brute force attacks
- **How:** Configured in Supabase rate limits

### Input Validation
The implementation includes:
- ✅ Phone number format validation (E.164)
- ✅ 6-digit OTP validation
- ✅ Server-side validation in API routes
- ✅ Client-side validation in UI

### Best Practices
1. ✅ Always validate phone numbers server-side
2. ✅ Use rate limiting to prevent abuse
3. ✅ Set appropriate OTP expiry times
4. ✅ Limit verification attempts
5. ✅ Monitor SMS delivery rates and costs
6. ✅ Use a reputable SMS provider in production
7. ✅ Implement logging for security events
8. ✅ Consider implementing CAPTCHA for additional security

## Cost Estimation

SMS costs vary by provider and region:

### Twilio (Example)
- US/Canada: ~$0.0075/SMS
- UK: ~$0.04/SMS
- Global average: ~$0.05/SMS

### Monthly Cost Example
If you have 1,000 users signing in once per month:
- 1,000 SMS × $0.0075 = **$7.50/month** (US)
- 1,000 SMS × $0.05 = **$50/month** (global average)

**Cost Optimization Tips:**
1. Implement rate limiting
2. Use test provider in development
3. Monitor and alert on unusual SMS volume
4. Consider alternative auth methods (email) for non-critical users

## Troubleshooting

### SMS Not Received

**Possible causes:**
1. ❌ SMS provider not configured correctly
2. ❌ Invalid phone number format
3. ❌ Rate limit exceeded
4. ❌ SMS provider account has insufficient credits
5. ❌ Phone carrier blocking SMS
6. ❌ Test provider being used in production

**Solutions:**
1. ✅ Verify SMS provider credentials in Supabase
2. ✅ Check phone number is in E.164 format
3. ✅ Wait and try again (rate limiting)
4. ✅ Add credits to SMS provider account
5. ✅ Try a different phone number
6. ✅ Use a production SMS provider (Twilio, MessageBird, Vonage)

### "Invalid Token" Error

**Possible causes:**
1. ❌ OTP has expired (default: 60 seconds)
2. ❌ Wrong code entered
3. ❌ Code already used

**Solutions:**
1. ✅ Request a new code
2. ✅ Double-check the code in your SMS
3. ✅ Ensure you're entering all 6 digits

### Rate Limit Errors

**Error:** "Too many requests. Please try again later."

**Solutions:**
1. ✅ Wait before requesting another code
2. ✅ Adjust rate limits in Supabase (if legitimate use case)
3. ✅ Check for suspicious activity

## API Reference

### Send OTP

```typescript
POST /api/auth/phone-otp

Body:
{
  "phone": "+1234567890"
}

Success Response:
{
  "ok": true
}

Error Response:
{
  "ok": false,
  "error": "Error message"
}
```

### Verify OTP

```typescript
POST /api/auth/verify-phone-otp

Body:
{
  "phone": "+1234567890",
  "token": "123456"
}

Success Response:
{
  "ok": true,
  "session": { ... },
  "user": { ... }
}

Error Response:
{
  "ok": false,
  "error": "Error message"
}
```

## Support

For issues:
1. Check [Supabase Phone Auth Documentation](https://supabase.com/docs/guides/auth/phone-login)
2. Review [SMS Provider Documentation](https://www.twilio.com/docs)
3. Check Supabase logs in Dashboard → Logs
4. Contact your SMS provider support

## Additional Resources

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)
- [Twilio Documentation](https://www.twilio.com/docs)
- [MessageBird Documentation](https://developers.messagebird.com/)
- [Vonage Documentation](https://developer.vonage.com/)
