import {
  Report,
  SharedReport,
  CreateReportRequest,
  ShareReportRequest,
} from '@/lib/types/workspace';

/**
 * Create a new report
 */
export async function createReport(data: CreateReportRequest): Promise<Report | null> {
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to create report:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating report:', error);
    return null;
  }
}

/**
 * Get all reports for a workspace
 */
export async function getWorkspaceReports(
  workspace_id: string,
  limit = 50,
  offset = 0
): Promise<Report[]> {
  try {
    const params = new URLSearchParams({
      workspace_id,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(`/api/reports?${params.toString()}`);
    if (!response.ok) {
      console.error('Failed to fetch reports:', response.statusText);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

/**
 * Get a specific report
 */
export async function getReport(report_id: string): Promise<Report | null> {
  try {
    const response = await fetch(`/api/reports/${report_id}`);
    if (!response.ok) {
      console.error('Failed to fetch report:', response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

/**
 * Update a report
 */
export async function updateReport(
  report_id: string,
  updates: Partial<Report>
): Promise<Report | null> {
  try {
    const response = await fetch(`/api/reports/${report_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      console.error('Failed to update report:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating report:', error);
    return null;
  }
}

/**
 * Delete a report
 */
export async function deleteReport(report_id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/reports/${report_id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Failed to delete report:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    return false;
  }
}

/**
 * Share a report and get a public link
 */
export async function shareReport(
  report_id: string,
  options?: {
    password?: string;
    expires_in_days?: number;
    max_downloads?: number;
  }
): Promise<(SharedReport & { share_url: string }) | null> {
  try {
    const response = await fetch(`/api/reports/${report_id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });

    if (!response.ok) {
      console.error('Failed to share report:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error sharing report:', error);
    return null;
  }
}

/**
 * Get a shared report by token (public endpoint)
 */
export async function getSharedReport(
  share_token: string,
  password?: string
): Promise<Report | null> {
  try {
    const params = new URLSearchParams();
    if (password) {
      params.set('password', password);
    }

    const response = await fetch(`/api/reports/shared/${share_token}?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch shared report');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shared report:', error);
    return null;
  }
}

/**
 * Download a report file (create a downloadable format)
 */
export async function downloadReport(
  report: Report,
  format: 'pdf' | 'csv' | 'json' = 'pdf'
): Promise<Blob | null> {
  try {
    const response = await fetch(`/api/reports/${report.id}/download?format=${format}`);
    if (!response.ok) {
      console.error('Failed to download report:', response.statusText);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading report:', error);
    return null;
  }
}

/**
 * Export report as CSV
 */
export async function exportReportAsCSV(report: Report): Promise<string | null> {
  try {
    if (!report.data_json) {
      console.error('Report has no data');
      return null;
    }

    const data = report.data_json;
    let csv = '';

    // Handle different report types
    if (Array.isArray(data)) {
      // If data is array of objects
      const keys = Object.keys(data[0] || {});
      csv = keys.join(',') + '\n';
      csv += data
        .map(row => keys.map(key => JSON.stringify(row[key])).join(','))
        .join('\n');
    } else if (typeof data === 'object') {
      // If data is object
      csv = Object.entries(data)
        .map(([key, value]) => `"${key}","${value}"`)
        .join('\n');
    }

    return csv;
  } catch (error) {
    console.error('Error exporting as CSV:', error);
    return null;
  }
}

/**
 * Export report as JSON
 */
export async function exportReportAsJSON(report: Report): Promise<string | null> {
  try {
    if (!report.data_json) {
      console.error('Report has no data');
      return null;
    }

    return JSON.stringify(
      {
        id: report.id,
        title: report.title,
        created_at: report.created_at,
        data: report.data_json,
      },
      null,
      2
    );
  } catch (error) {
    console.error('Error exporting as JSON:', error);
    return null;
  }
}

/**
 * Download shared report (public)
 */
export async function downloadSharedReport(
  share_token: string,
  format: 'pdf' | 'csv' | 'json' = 'pdf',
  password?: string
): Promise<Blob | null> {
  try {
    const params = new URLSearchParams({
      format,
    });
    if (password) {
      params.set('password', password);
    }

    const response = await fetch(
      `/api/reports/shared/${share_token}/download?${params.toString()}`
    );
    if (!response.ok) {
      console.error('Failed to download shared report:', response.statusText);
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading shared report:', error);
    return null;
  }
}
