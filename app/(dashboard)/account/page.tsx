// app/(dashboard)/account/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = await response.json()
          setUser(data)
          setFormData({ name: data.name || '', email: data.email || '' })
          
          // Fetch subscription plan
          const planResponse = await fetch('/api/subscription/current-plan')
          if (planResponse.ok) {
            const planData = await planResponse.json()
            setPlan(planData)
          }
        }
      } catch (error) {
        console.error('Error fetching account:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccount()
  }, [])

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setUser({ ...user, ...formData })
        setEditing(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8">Account Settings</h1>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Profile Information</h2>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-2"><strong>Name:</strong> {user?.name || 'Not set'}</p>
              <p className="text-gray-700 mb-6"><strong>Email:</strong> {user?.email}</p>
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Subscription Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Subscription</h2>
          
          {plan ? (
            <div>
              <p className="text-gray-700 mb-2"><strong>Current Plan:</strong> {plan.name}</p>
              <p className="text-gray-700 mb-2"><strong>Price:</strong> {plan.price}</p>
              <p className="text-gray-700 mb-6"><strong>Status:</strong> <span className="text-green-600 font-semibold">Active</span></p>
              
              <div className="flex gap-4">
                <Link href="/choose-plan" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Change Plan
                </Link>
                <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Cancel Subscription
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-6">No active subscription</p>
              <Link href="/choose-plan" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Choose a Plan
              </Link>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-gray-700 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
          <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}