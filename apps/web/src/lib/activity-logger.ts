import { ActivityLog, ActivityActionType } from '@/lib/types/workspace';

export interface LogActivityOptions {
  workspace_id: string;
  user_id?: string;
  action_type: ActivityActionType;
  action_description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log user activity to the activity_logs table
 * This is typically called from API endpoints or middleware
 */
export async function logActivity(options: LogActivityOptions): Promise<ActivityLog | null> {
  try {
    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      console.error('Failed to log activity:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
}

/**
 * Get activity logs for a workspace with optional filtering
 */
export async function getActivityLogs(
  workspace_id: string,
  options?: {
    action_type?: ActivityActionType;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ActivityLog[]> {
  const params = new URLSearchParams({
    workspace_id,
    ...Object.fromEntries(
      Object.entries(options || {}).filter(([, value]) => value !== undefined)
    ),
  });

  try {
    const response = await fetch(`/api/activity-logs?${params.toString()}`);
    if (!response.ok) {
      console.error('Failed to fetch activity logs:', response.statusText);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}

/**
 * Get activity statistics for a workspace
 */
export async function getActivityStats(
  workspace_id: string,
  days: number = 30
): Promise<{
  total_events: number;
  by_action: Record<ActivityActionType, number>;
  by_user: Record<string, number>;
  by_day: Record<string, number>;
}> {
  try {
    const response = await fetch(`/api/activity-logs/stats?workspace_id=${workspace_id}&days=${days}`);
    if (!response.ok) {
      console.error('Failed to fetch activity stats:', response.statusText);
      return { total_events: 0, by_action: {}, by_user: {}, by_day: {} };
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return { total_events: 0, by_action: {}, by_user: {}, by_day: {} };
  }
}

/**
 * Server-side activity logger for use in API routes and server actions
 * Directly logs to the database without making HTTP requests
 */
export async function logActivityServer(
  options: LogActivityOptions,
  supabaseClient: any
): Promise<ActivityLog | null> {
  try {
    const { data, error } = await supabaseClient
      .from('activity_logs')
      .insert([
        {
          workspace_id: options.workspace_id,
          user_id: options.user_id,
          action_type: options.action_type,
          action_description: options.action_description,
          metadata: options.metadata,
          ip_address: options.ip_address,
          user_agent: options.user_agent,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in logActivityServer:', error);
    return null;
  }
}
