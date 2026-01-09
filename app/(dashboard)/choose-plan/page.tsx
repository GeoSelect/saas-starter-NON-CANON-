// app/(dashboard)/choose-plan/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChoosePlanPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$29/mo',
      features: ['Up to 10 reports', 'Basic analytics', 'Email support'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$99/mo',
      features: ['Unlimited reports', 'Advanced analytics', 'Priority support'],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      features: ['Custom features', 'Dedicated support', 'SLA'],
    },
  ]

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    setLoading(true)
    try {
      // Call API to update user plan
      const response = await fetch('/api/subscription/select-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      if (response.ok) {
        router.push('/account') // Redirect to account page
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Choose Your Plan</h1>
        <p className="text-center text-gray-600 mb-12">
          Select the perfect plan for your needs
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg p-8 transition-all ${
                plan.popular
                  ? 'bg-white border-2 border-indigo-500 shadow-xl scale-105'
                  : 'bg-white border border-gray-200 shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="mb-4 inline-block bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-3xl font-bold text-indigo-600 mb-6">
                {plan.price}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center">
                    <span className="text-green-500 mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading && selectedPlan === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                } disabled:opacity-50`}
              >
                {loading && selectedPlan === plan.id ? 'Selecting...' : 'Select'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/account" className="text-indigo-600 hover:underline">
            Back to Account
          </Link>
        </div>
      </div>
    </div>
  )
}