# Page Scaffolder Generator

PowerShell script for generating new compliant pages with proper structure, branding, and metadata.

## Features

✅ Automatic directory creation  
✅ Proper layout group structure  
✅ Dark theme with orange branding  
✅ Metadata block for `/preview/routes`  
✅ Back navigation button  
✅ Category badges  
✅ Example button with loading state  

## Usage

### Basic Usage

```powershell
cd scripts
.\generate-page.ps1 -PageName "User Settings" -RoutePath "/dashboard/settings" -Category "Dashboard"
```

### Parameters

- **PageName** (required): Display name of the page
  - Example: `"User Settings"`, `"Admin Panel"`, `"Billing"`

- **RoutePath** (required): Route path relative to `app/`
  - Example: `"/dashboard/settings"`, `"/admin/panel"`, `"/billing/plans"`

- **Category** (required): Category for organization in `/preview/routes`
  - Examples: `"Dashboard"`, `"Admin"`, `"Auth"`, `"Billing"`, `"Tools"`

- **WithLayout** (optional): Include Layout wrapper
  - Default: `$true`
  - Example: `-WithLayout $false`

### Examples

#### Example 1: Create Auth Page
```powershell
.\generate-page.ps1 -PageName "Two-Factor Setup" -RoutePath "/auth/2fa" -Category "Auth"
```

Output:
```
✓ Created directory: C:\...\app\auth\2fa
✓ Created page: C:\...\app\auth\2fa\page.tsx

========================================
Page Scaffolding Complete!
========================================

Route Path: /auth/2fa
Category: Auth
File: C:\...\app\auth\2fa\page.tsx

Add this to app/(dashboard)/preview/routes/page.tsx routes array:

{
  path: '/auth/2fa',
  name: '25 - Two-Factor Setup',
  category: 'Auth'
},
```

#### Example 2: Create Admin Page
```powershell
.\generate-page.ps1 -PageName "User Management" -RoutePath "/admin/users" -Category "Admin"
```

#### Example 3: Create Dashboard Widget
```powershell
.\generate-page.ps1 -PageName "Analytics" -RoutePath "/dashboard/analytics" -Category "Dashboard"
```

## Generated Page Structure

Each scaffolded page includes:

```tsx
'use client'                          // Client component directive

import { useState } from 'react'      // React hooks
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = { ... }       // Next.js metadata

export default function PageName() {  // Named export
  const [loading, setLoading] = useState(false)
  
  return (
    <div className="...">
      {/* Sticky header with back button */}
      {/* Category badge */}
      {/* Main content area */}
      {/* Example card with button */}
    </div>
  )
}
```

### Styling Applied

- ✅ Dark gradient background: `from-slate-900 to-slate-800`
- ✅ Orange brand colors: `orange-500`, `orange-600`, `orange-700`
- ✅ Slate borders: `slate-600`, `slate-700`
- ✅ White text: `text-white`
- ✅ Gray secondary text: `text-gray-400`, `text-gray-300`

## Next Steps After Generation

1. **Edit the page content**
   - Replace "Replace this section with your page content" with your actual content
   - Remove example card if not needed

2. **Add to `/preview/routes`**
   - Copy the metadata block output by the script
   - Paste into `app/(dashboard)/preview/routes/page.tsx` routes array
   - Increment the numbering

3. **Customize styling**
   - All pages use the standard orange/slate theme
   - Modify Tailwind classes as needed
   - Keep brand colors consistent

4. **Add functionality**
   - Replace `useState` hooks and button handlers
   - Import additional components as needed
   - Add your business logic

## Page Naming Convention

Generated pages automatically use PascalCase naming:
- Input: `"User Settings"` → Output: `UserSettingsPage`
- Input: `"Admin Panel"` → Output: `AdminPanelPage`
- Input: `"2FA Setup"` → Output: `SetupPage` (strips non-alphanumeric)

## Troubleshooting

### Script won't run
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Path issues
```powershell
# Run from scripts directory
cd C:\path\to\saas-starter\scripts
.\generate-page.ps1 -PageName "Test" -RoutePath "/test" -Category "Test"
```

### Directory already exists
The script will not overwrite existing directories. If you need to regenerate, delete the directory first:
```powershell
Remove-Item -Path "app\your\route" -Recurse
.\generate-page.ps1 -PageName "..." -RoutePath "..." -Category "..."
```

## Best Practices

1. **Keep categories consistent** - Reuse existing categories from `/preview/routes`
2. **Use kebab-case for routes** - `/dashboard/user-settings` not `/dashboard/userSettings`
3. **Use PascalCase for display names** - `"User Settings"` not `"user settings"`
4. **Update preview routes in order** - Maintain sequential numbering (01-24, then 25, 26...)
5. **Test immediately** - Visit `http://localhost:3000/your/route` after generation

## See Also

- [routes page](../app/(dashboard)/preview/routes/page.tsx) - View all registered routes
- [Branding](../branding/) - Brand guidelines and colors
- [Next.js Pages Router](https://nextjs.org/docs/app) - Official documentation
