import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button'; 

export default async function PricingPage() {
  // Fetch all Stripe products and prices
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);



export default async function PricingPage() {
  // Fetch all Stripe products and prices
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  // Map plan names to Stripe product names and price amounts
  const planConfigs = [
    {
      name: 'Basic',
      price: 7499,
      features: [
        'Unlimited Usage',
        'Unlimited Workspace Members',
        'Email Support',
        'Advanced Analytics',
        'Priority Support',
      ],
      stripeName: 'Pro',
    },
    {
      name: 'Pro+ CRM',
      price: 19900,
      features: [
        'Everything in Pro, and:',
        'CRM Integration',
        'Custom Workflows',
      ],
      stripeName: 'Pro+ CRM',
    },
    {
      name: 'Pro+ AI',
      price: 29900,
      features: [
        'Everything in Pro+ CRM, and:',
        'AI-powered Insights',
        'Automated Data Entry',
      ],
      stripeName: 'Pro+ AI',
    },
    {
      name: 'Portfolio',
      price: 49900,
      features: [
        'Everything in Pro+ AI, and:',
        'Portfolio Management',
        'Dedicated Account Manager',
      ],
      stripeName: 'Portfolio',
    },
    {
      name: 'Enterprise',
      price: 99900,
      features: [
        'Everything in Portfolio, and:',
        'Custom Integrations',
        'SLA & Enterprise Support',
        'Contact us for custom pricing',
      ],
      stripeName: 'Enterprise',
    },
  ];

  // Map each plan config to its Stripe priceId (if available)
  const plans = planConfigs.map((plan) => {
    const product = products.find((p) => p.name === plan.stripeName);
    const price = prices.find((pr) => pr.productId === product?.id);
    return {
      ...plan,
      price: price?.unitAmount ?? plan.price,
      interval: price?.interval || 'month',
      trialDays: price?.trialPeriodDays || 7,
      priceId: price?.id,
    };
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            name={plan.name}
            price={plan.price}
            interval={plan.interval}
            trialDays={plan.trialDays}
            features={plan.features}
            priceId={plan.priceId}
          />
        ))}
      </div>
    </main>
  );
}


function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
}) {
  const isDisabled = !priceId;
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId || ''} />
        <SubmitButton disabled={isDisabled} />
        {isDisabled && (
          <div className="text-xs text-red-500 mt-2">This plan is not available. Please contact support.</div>
        )}
      </form>
    </div>
  );
}
