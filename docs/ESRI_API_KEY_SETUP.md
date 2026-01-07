# Esri API Key Setup Guide

**Date:** January 6, 2026

## 📝 Steps to Generate API Key

### Step 1: Create Esri Developer Account
- Go to https://developers.arcgis.com/
- Sign up or log in with your account

### Step 2: Navigate to API Keys
- Click on your profile icon (top right)
- Select **"API Keys"** from dropdown
- Or go directly to: https://developers.arcgis.com/api-keys

### Step 3: Create New API Key
- Click **"Create new API key"** button
- Name it: **"Developer Creds"** (or your preferred name)
- Add description: _"GeoSelect.It - Real Estate Property Platform"_

### Step 4: Enable Required Services
Select these services in the API key configuration:

✅ **Geocoding**
- Needed for address-to-coordinates conversion
- Used in: Property lookup, address validation

✅ **Basemaps**
- Needed for interactive maps
- Used in: Property map visualization

✅ **Feature Layers**
- Needed for parcel boundary queries
- Used in: Property boundary display

✅ **Routing** (Optional)
- For drive-time analysis
- Future feature: Commute time analysis

### Step 5: Copy Credentials

#### API Key
1. After creating the key, copy the full API key string
2. Paste into `.env.local`:
   ```
   NEXT_PUBLIC_ESRI_API_KEY=YOUR_API_KEY_HERE
   ```

#### Client ID & Secret (for OAuth)
1. Go to **"Authentication"** section
2. Under **"OAuth 2.0"**, click **"Create new"**
3. Copy the **Client ID** and **Client Secret**
4. Paste into `.env.local`:
   ```
   ESRI_CLIENT_ID=YOUR_CLIENT_ID
   ESRI_CLIENT_SECRET=YOUR_CLIENT_SECRET
   ```

### Step 6: Verify Configuration

Check your `.env.local` file:
```dotenv
# Esri/ArcGIS Configuration
NEXT_PUBLIC_ESRI_API_KEY=AAPTxy8BH1VEsoebNVZXo8HurDOMgRaVjIAv1SbkkWW3LU6U7F3axhhtlJLvfu-c3gbdLA2B4JFM9pHErY7xQnItFooy2qcR_VzYK3z8KtGEBxQy94gIzjJ0AwgyWUmv7LV-fTb0GO-gRcv3pABMiikzaCB4cdmVVa1Z_3Wr8mmIXTClrx5-txpnx1h0pXr9XfEofD59DgOHISwGvPfcnx8yv-0KaPro_eYXdCpYxwWFfqo.AT1_g4WqaNGk
ESRI_CLIENT_ID=QkPJveucg4WqaNGk
ESRI_CLIENT_SECRET=47d60d700932435dbf0adaa6f1eb1338
NEXT_PUBLIC_ESRI_API_URL=https://www.arcgisonline.com/sharing/rest
```

### Step 7: Restart Dev Server
```bash
# Stop current server
Ctrl+C

# Clear cache
rm -Recurse -Force .next

# Restart
pnpm dev
```

---

## 🔒 Security Best Practices

- ✅ Keep `.env.local` in `.gitignore` (already configured)
- ✅ Never commit API keys to git
- ✅ Rotate keys regularly
- ✅ Use `NEXT_PUBLIC_*` only for safe, public APIs
- ✅ Use regular env vars for sensitive keys (like Client Secret)
- ✅ Enable IP whitelisting in Esri Dashboard for production

---

## ✅ Current Status

Your credentials are already configured in `.env.local`:
- ✅ API Key ready
- ✅ Client ID ready
- ✅ Client Secret ready
- ⏳ Pending: `pnpm add @arcgis/core` to enable mapping

---

## 🚀 Next Steps

1. **Install ArcGIS SDK**
   ```bash
   pnpm add @arcgis/core
   ```

2. **Test Geocoding**
   ```bash
   # Create a test file or run in browser console
   import { geocodeAddress } from '@/lib/esri/client';
   const result = await geocodeAddress('123 Main St, Telluride, CO');
   console.log(result);
   ```

3. **Integrate into Parcel Page**
   - See `docs/ESRI_INTEGRATION.md` for integration examples

---

## 📚 Resources

- [Esri Developers](https://developers.arcgis.com/)
- [API Key Management](https://developers.arcgis.com/api-keys)
- [Geocoding API](https://developers.arcgis.com/rest/geocoding/)
- [Feature Service](https://developers.arcgis.com/rest/services-reference/)

---

## ⚠️ Troubleshooting

**Issue:** "Invalid API Key"
- Solution: Regenerate key in Esri Dashboard, copy exact string

**Issue:** "Service not enabled"
- Solution: Check API key settings, enable Geocoding/Basemaps/Feature Layers

**Issue:** "CORS error"
- Solution: Add domain to Esri API key CORS whitelist

---

**Last Updated:** January 6, 2026
