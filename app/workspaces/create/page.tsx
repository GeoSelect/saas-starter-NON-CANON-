'use client';

import { BottomNavigation } from '@/components/BottomNavigation';
import { Header } from '@/components/Header';
import { AuthProvider, useAuth, type PlanType } from '@/lib/context/AuthContext';
import { useState } from 'react';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

function CreateWorkspacePageContent() {
  const router = useRouter();
  const { setPlan } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [formData, setFormData] = useState({
    workspaceName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    country: '',
    state: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedPlan) {
      newErrors.plan = 'Please select a plan';
    }
    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = 'Workspace name is required';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Valid email is required';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Set the user's plan in the auth context
      if (selectedPlan) {
        setPlan(selectedPlan);
      }

      // In demo mode, just show success and redirect to dashboard
      setSuccess(true);
      setTimeout(() => {
        router.push('/parcels/page/1');
      }, 2000);
    } catch (error) {
      setErrors({ submit: 'Failed to create workspace. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="pb-24 px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Workspace Created!
          </h2>
          <p className="text-gray-600 mb-6">
            Your workspace "{formData.workspaceName}" has been created successfully.
            Redirecting to dashboard...
          </p>
          <div className="animate-pulse">
            <div className="h-1 bg-orange-500 rounded-full"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-24">
      <Header />
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Workspace</h1>
            <p className="text-gray-600">
              Set up your new account and workspace to get started with GeoSelect
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg p-6 border border-gray-200">
            {/* Plan Selection Section */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Your Plan</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'basic' as PlanType, name: 'Pro', desc: 'Essential features' },
                  { id: 'pro_crm' as PlanType, name: 'Pro+ CRM', desc: 'With CRM tools' },
                  { id: 'pro_ai' as PlanType, name: 'Pro+ AI', desc: 'With AI insights' },
                  { id: 'portfolio' as PlanType, name: 'Portfolio', desc: 'Full suite' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedPlan === plan.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.desc}</p>
                      </div>
                      {selectedPlan === plan.id && (
                        <Check className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {errors.plan && <p className="mt-2 text-sm text-red-600">{errors.plan}</p>}
            </div>

          {/* Workspace & Company Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Workspace Information</h2>

            <div className="space-y-4">
              {/* Workspace Name */}
              <div>
                <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  id="workspaceName"
                  name="workspaceName"
                  value={formData.workspaceName}
                  onChange={handleChange}
                  placeholder="e.g., My Real Estate Team"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.workspaceName && (
                  <p className="mt-1 text-sm text-red-600">{errors.workspaceName}</p>
                )}
              </div>

              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g., Telluride Properties Inc"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

            <div className="space-y-4">
              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="MX">Mexico</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Colorado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Terms & Submit */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                defaultChecked
                className="mt-1 rounded border-gray-300"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/sign-in" className="text-orange-500 hover:text-orange-600 font-medium">
              Sign In
            </a>
          </p>
        </form>
      </div>

      <BottomNavigation />
    </div>
    </main>
  );
}

export default function CreateWorkspacePage() {
  return (
    <AuthProvider>
      <CreateWorkspacePageContent />
    </AuthProvider>
  );
}
