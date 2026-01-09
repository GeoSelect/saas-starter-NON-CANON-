# Vercel Preview with Fixture Data

This project includes fixture API endpoints to make Vercel preview deployments immediately useful for QA and design reviews, even without a connected backend.

## Quick Start

1. **Deploy to Vercel** - Every PR automatically gets a preview URL
2. **Visit `/preview`** on your preview URL for test links and documentation
3. **Share with team** - Preview URLs work immediately, no backend needed

## What's Included

### Fixture API Endpoints

- **`/api/parcels`** - List and search parcels
  - Returns 3 fixture parcels
  - Supports `?q=query` parameter for search
  
- **`/api/parcels/[id]`** - Get parcel details
  - IDs: `parcel-1`, `parcel-2`, `parcel-3`
  - Includes full property details and history

### Preview Page

Visit `/preview` on any deployment to see:
- Links to all fixture endpoints
- Configuration instructions
- Usage guidelines

### Utility Functions

`lib/getApiBase.ts` provides:
- `getApiBase()` - Get API base URL
- `getApiUrl(path)` - Construct full API URLs
- `isUsingFixtures()` - Check if using fixture data

## Configuration

### Using Fixtures (Default)

No configuration needed! Fixture data is used automatically when `NEXT_PUBLIC_API_URL` is not set.

**Perfect for:**
- UI/design reviews
- Frontend development
- Stakeholder demos
- Quick iterations

### Using Real Backend

Set `NEXT_PUBLIC_API_URL` in Vercel environment variables:

1. Go to Vercel Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` = `https://your-api.example.com`
3. Scope to "Preview" or "Production" as needed
4. Redeploy

**Use when:**
- Integration testing
- E2E testing
- Backend testing with real data

## Example Usage

### In Your Components

```typescript
import { getApiUrl, isUsingFixtures } from '@/lib/getApiBase';

export async function fetchParcels() {
  const response = await fetch(getApiUrl('/api/parcels'));
  const data = await response.json();
  
  if (data.isFixture) {
    console.log('Using fixture data');
  }
  
  return data.parcels;
}
```

### In API Routes

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  // Fixture data when NEXT_PUBLIC_API_URL is not set
  if (!process.env.NEXT_PUBLIC_API_URL) {
    return NextResponse.json({
      data: FIXTURE_DATA,
      isFixture: true
    });
  }
  
  // Real backend call
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/endpoint`);
  return response.json();
}
```

## Fixture Data

All fixture data represents safe, non-sensitive sample data for Telluride, CO parcels:

- 3 sample parcels with varied property types
- Realistic addresses, APNs, and property details
- Safe to share publicly
- No secrets or sensitive information

## Development Workflow

### For UI/Frontend Work
```bash
# No setup needed - fixtures work out of the box
pnpm dev
# Visit http://localhost:3000/preview
```

### For Backend Integration
```bash
# Set up .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
pnpm dev
```

### For Vercel Previews
1. Push branch to GitHub
2. Vercel auto-deploys preview
3. Visit `<preview-url>/preview`
4. Share preview URL for feedback

## Best Practices

1. **Always include fixtures** - Makes previews immediately useful
2. **Keep fixtures simple** - Don't over-complicate test data
3. **Mark fixture responses** - Include `isFixture: true` in responses
4. **Document endpoints** - Update `/preview` page when adding new endpoints
5. **No secrets** - Never include real API keys or sensitive data in fixtures

## Troubleshooting

**Q: Preview shows blank data**
- Check `/preview` page for endpoint links
- Verify fixture endpoints return data
- Check browser console for errors

**Q: Want to test with real backend**
- Add `NEXT_PUBLIC_API_URL` to Vercel environment variables
- Scope to "Preview" environment
- Redeploy or wait for next PR push

**Q: Need more fixture data**
- Add to `app/api/parcels/route.ts`
- Update fixture counts on `/preview` page
- Keep data simple and realistic

## Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js App Router](https://nextjs.org/docs/app)

## Security Note

⚠️ **Fixture data is public** - Never include:
- Real API keys
- Production database credentials
- Sensitive customer information
- Internal system details

✅ Fixtures are safe, sample data only.
