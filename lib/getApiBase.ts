/**
 * Get the base URL for API requests
 * 
 * In production/preview environments:
 * - Returns NEXT_PUBLIC_API_URL if set (for real backend)
 * - Returns empty string to use Next.js API routes (fixture data)
 * 
 * In development:
 * - Returns empty string to use local Next.js API routes
 */
export function getApiBase(): string {
  // If explicit API URL is set, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Default: use Next.js API routes (fixtures in preview, real in production)
  return '';
}

/**
 * Construct full API URL
 */
export function getApiUrl(path: string): string {
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return base ? `${base}${cleanPath}` : cleanPath;
}

/**
 * Check if using fixture data
 */
export function isUsingFixtures(): boolean {
  return !process.env.NEXT_PUBLIC_API_URL;
}
