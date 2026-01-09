'use client'

import { useState } from 'react'
import { Card } from '../../../components/Card'
import { useRouter } from 'next/navigation'

export default function CCP06PreviewPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    primary_color: '#000000',
    secondary_color: '#ffffff',
    footer_text: '',
  })
  const [reports, setReports] = useState([
    {
      id: '1',
      name: 'Q1 2026 Report',
      version: 2,
      is_active: true,
      created_at: '2026-01-01',
    },
    {
      id: '2',
      name: 'Q2 2026 Report',
      version: 1,
      is_active: false,
      created_at: '2026-01-05',
    },
  ])
  const [loading, setLoading] = useState(false)

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(
        '/api/workspaces/telluride-demo/branded-reports',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )
      if (response.ok) {
        const newReport = await response.json()
        setReports([newReport.data, ...reports])
        setFormData({
          name: '',
          primary_color: '#000000',
          secondary_color: '#ffffff',
          footer_text: '',
        })
        alert('Report created!')
      }
    } catch (error) {
      console.error('Error creating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (reportId: string) => {
    try {
      const response = await fetch(
        `/api/workspaces/telluride-demo/branded-reports/${reportId}/activate`,
        { method: 'POST' }
      )
      if (response.ok) {
        setReports(
          reports.map((r) => ({
            ...r,
            is_active: r.id === reportId,
          }))
        )
        alert('Report activated!')
      }
    } catch (error) {
      console.error('Error activating report:', error)
    }
  }

  const handlePatch = async (reportId: string) => {
    const newName = prompt('New name:')
    if (!newName) return

    try {
      const response = await fetch(
        `/api/workspaces/telluride-demo/branded-reports/${reportId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        }
      )
      if (response.ok) {
        const updated = await response.json()
        setReports(
          reports.map((r) =>
            r.id === reportId
              ? { ...r, name: updated.data.name, version: updated.data.version }
              : r
          )
        )
        alert('Report updated!')
      }
    } catch (error) {
      console.error('Error updating report:', error)
    }
  }

  const handleDelete = async (reportId: string) => {
    if (!confirm('Delete this report?')) return

    try {
      const response = await fetch(
        `/api/workspaces/telluride-demo/branded-reports/${reportId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        setReports(reports.filter((r) => r.id !== reportId))
        alert('Report deleted!')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">CCP-06: Branded Reports</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage branded report versions with immutable versioning and single-active constraint
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Create Card */}
        <Card
          title="Create Report"
          description="Add a new branded report"
          footer={
            <button
              onClick={handleCreateReport}
              disabled={loading || !formData.name}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          }
        >
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Report Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Q1 2026 Report"
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Primary Color</label>
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) =>
                  setFormData({ ...formData, primary_color: e.target.value })
                }
                className="w-full h-10 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Secondary Color
              </label>
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) =>
                  setFormData({ ...formData, secondary_color: e.target.value })
                }
                className="w-full h-10 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Footer Text</label>
              <input
                type="text"
                value={formData.footer_text}
                onChange={(e) =>
                  setFormData({ ...formData, footer_text: e.target.value })
                }
                placeholder="© 2026 Telluride Analytics"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </form>
        </Card>

        {/* List Card */}
        <Card
          title="Active Reports"
          description={`${reports.length} total report${reports.length !== 1 ? 's' : ''}`}
          footer={
            <button
              onClick={() =>
                router.push('/api/workspaces/telluride-demo/branded-reports')
              }
              className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              View All
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">V</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">{report.name}</td>
                    <td className="py-2 px-2">{report.version}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          report.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {report.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 px-2 space-x-2">
                      {!report.is_active && (
                        <button
                          onClick={() => handleActivate(report.id)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handlePatch(report.id)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Patch
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="What is Immutable Versioning?"
          description="How PATCH creates new versions"
        >
          <ul className="space-y-2 text-sm">
            <li>✓ PATCH creates v2 (original v1 unchanged)</li>
            <li>✓ Version auto-increments</li>
            <li>✓ Checksum changes on every update</li>
            <li>✓ Full audit trail maintained</li>
          </ul>
        </Card>

        <Card
          title="Single-Active Constraint"
          description="Only one report per workspace"
        >
          <ul className="space-y-2 text-sm">
            <li>✓ Only 1 report can be active</li>
            <li>✓ Activating new one deactivates others</li>
            <li>✓ Audit trail: activated_at, activated_by</li>
            <li>✓ Enforced at DB layer with RLS</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
