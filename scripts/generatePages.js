const fs = require('fs');
const path = require('path');

// List your routes (from previous messages)
const routes = [
  '/',
  '/mobile-onboarding-choice',
  '/parcel/resolve',
  '/preview/components',
  '/dashboard/reports',
  '/share/example-token',
  '/landing',
  '/faq',
  '/sign-in',
  '/auth/callback',
  '/continuation-choice',
  '/parcel/summary',
  '/parcel/hoa-packet',
  '/parcel/hoa-packet/success',
  '/reports',
  '/dashboard/reports/example-id',
  '/dashboard/reports/example-id/share',
  '/shared/example-token',
];

// Helper to convert route to file path/name
const getFilePath = (route) => {
  if (route === '/') return 'pages/index.js';
  // Remove leading slash, replace other slashes with dashes
  let filename = route.replace(/^\//, '').replace(/\//g, '-') + '.js';
  return path.join('pages', filename);
};

const boilerplate = (route) => `import Link from 'next/link';
import Button from '../components/Button';
import Layout from '../components/Layout';

export default function Page() {
  return (
    <Layout>
      <h1>Route: ${route}</h1>
      <div>
        <Link href="/">
          <Button>Home</Button>
        </Link>
      </div>
      {/* Add more navigation buttons here */}
    </Layout>
  );
}
`;

routes.forEach(route => {
  const filePath = getFilePath(route);

  // Ensure directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // Only create if doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, boilerplate(route), 'utf8');
    console.log(`Created: ${filePath}`);
  } else {
    console.log(`Skipped (already exists): ${filePath}`);
  }
});

console.log('✅ All route pages generated!');