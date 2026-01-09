import { useEffect, useState, useCallback } from 'react';

export interface SeedResult {
  success: boolean;
  message: string;
  entriesCreated?: number;
  alreadyExists?: boolean;
  error?: string;
}

/**
 * Hook to seed demo audit data for first-time users
 * Automatically checks if workspace has data and seeds if empty
 */
export function useSeedDemoAuditData(workspaceId?: string) {
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);

  // Check if workspace has audit data
  const checkAuditData = useCallback(async (wsId: string) => {
    try {
      const response = await fetch(`/api/audit/seed-demo?workspaceId=${wsId}`);
      const data = await response.json();
      setHasData(data.hasData);
      return data.hasData;
    } catch (error) {
      console.error('Error checking audit data:', error);
      return null;
    }
  }, []);

  // Seed demo data
  const seedDemo = useCallback(
    async (wsId: string) => {
      setLoading(true);
      try {
        const response = await fetch('/api/audit/seed-demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId: wsId }),
        });

        const data: SeedResult = await response.json();
        setResult(data);

        if (data.success) {
          setHasData(true);
        }

        return data;
      } catch (error) {
        const errorResult: SeedResult = {
          success: false,
          message: 'Failed to seed demo data',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        setResult(errorResult);
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-check on mount
  useEffect(() => {
    if (workspaceId) {
      checkAuditData(workspaceId);
    }
  }, [workspaceId, checkAuditData]);

  return {
    loading,
    hasData,
    result,
    checkAuditData,
    seedDemo,
  };
}

/**
 * React component to display seed demo data button
 */
export function SeedDemoDataButton({ workspaceId }: { workspaceId: string }) {
  const { loading, hasData, result, seedDemo } = useSeedDemoAuditData(workspaceId);

  if (hasData === null) {
    return null; // Still checking
  }

  if (hasData) {
    return null; // Already has data
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
      <h4 className="font-semibold text-blue-900">Demo Data Available</h4>
      <p className="text-sm text-blue-800">
        Load sample audit logs to see how the dashboard works with realistic data.
      </p>
      <button
        onClick={() => seedDemo(workspaceId)}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Loading Demo Data...
          </>
        ) : (
          'Load Demo Data'
        )}
      </button>
      {result && (
        <p
          className={`text-sm ${
            result.success ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
