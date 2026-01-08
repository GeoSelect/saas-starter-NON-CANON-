# Next.js SaaS Starter

This is a starter template for building a SaaS application using **Next.js** with support for authentication, Stripe integration for payments, and a dashboard for logged-in users.

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) which connects to Stripe Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with Stripe Customer Portal
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Prerequisites

Before getting started, ensure you have accounts with the following services:

- **[Supabase](https://supabase.com)** - Database and authentication backend
- **[Stripe](https://stripe.com)** - Payment processing
- **[GitHub](https://github.com)** - Repository hosting and OAuth (optional)
- **[DigitalOcean](https://digitalocean.com)** (Optional) - Backend deployment
- **[Vercel](https://vercel.com)** (Optional) - Frontend deployment

> 📚 **Important**: See [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md) for comprehensive secrets management instructions covering both local development and GitHub Actions workflows.

## Getting Started

### 1. Environment Setup

First, set up your environment variables:

```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local and fill in your actual credentials
# See docs/SECRETS_SETUP.md for detailed instructions on where to get each value
```

> 📚 **Detailed Instructions**: For comprehensive environment setup including where to get each credential, see [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md)

### 2. Install Dependencies

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

### 3. Configure Stripe

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

### 4. Database Setup

Use the included setup script to configure your database:

```bash
# This will use your .env.local configuration
pnpm db:setup
```

### 5. Run Database Migrations

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

### 6. Start Development Server

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

### 7. Test Stripe Webhooks (Optional)

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `STRIPE_SECRET_KEY`: Use your Stripe secret key for the production environment.
3. `STRIPE_WEBHOOK_SECRET`: Use the webhook secret from the production webhook you created in step 1.
4. `POSTGRES_URL`: Set this to your production database URL.
5. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.
6. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: Use your production Supabase credentials.
7. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase credentials for client-side.

> 📚 **For complete environment variable setup**: See [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md) for detailed instructions on all required environment variables and where to obtain them.

## GitHub Actions & CI/CD

This repository includes GitHub Actions workflows for continuous integration and deployment:

- **CI/CD Workflows**: Located in `.github/workflows/`
- **Organization Secrets**: Required secrets should be set at the `geoselect-it` organization level
- **Deployment**: Automated deployments to DigitalOcean and Vercel

See [docs/SECRETS_SETUP.md](docs/SECRETS_SETUP.md) for:
- Setting up GitHub organization secrets
- Configuring repository access for secrets
- Example deployment workflows
- Security best practices

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
