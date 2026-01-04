/**
 * CCP-06 Report Routes: Frozen Error Contract
 * 
 * Defines exact HTTP status codes and error codes for all report endpoints.
 * Used in route handlers and test assertions.
 */

// ============================================================================
// POST /api/workspace/:workspace_id/report/create
// ============================================================================
/**
 * Create a new branded report in workspace
 * 
 * Access Control:
 *   - Owner/Admin: 200 OK (create succeeds)
 *   - Member:      403 WORKSPACE_ADMIN_REQUIRED
 *   - Non-member:  403 WORKSPACE_ACCESS_DENIED
 *   - Unauth:      401 UNAUTHORIZED
 *
 * Success Response (200):
 *   {
 *     "id": "uuid",
 *     "workspace_id": "uuid",
 *     "name": "Report Name",
 *     "status": "draft",
 *     "projection": { "parcel_id", "location", "intent" },
 *     "branding": { "workspace_name", "color_primary", "logo_url" },
 *     "created_at": "2026-01-03T00:00:00Z",
 *     "updated_at": "2026-01-03T00:00:00Z"
 *   }
 *
 * Error: Member tries to create (403)
 *   {
 *     "error": "WORKSPACE_ADMIN_REQUIRED",
 *     "message": "Admin or owner role required to create reports",
 *     "status": 403
 *   }
 *
 * Error: Non-member tries to create (403)
 *   {
 *     "error": "WORKSPACE_ACCESS_DENIED",
 *     "message": "Access denied to this workspace",
 *     "status": 403
 *   }
 *
 * Error: Unauthenticated (401)
 *   {
 *     "error": "UNAUTHORIZED",
 *     "message": "Authentication required",
 *     "status": 401
 *   }
 *
 * Error: Validation failure (400)
 *   {
 *     "error": "VALIDATION_ERROR",
 *     "message": "Invalid parcel_context: missing required fields",
 *     "status": 400
 *   }
 */
export const CREATE_REPORT_RESPONSE = {
  SUCCESS_200: {
    status: 200,
    body: {
      id: 'uuid',
      workspace_id: 'uuid',
      name: 'string',
      status: 'draft',
      projection: {
        parcel_id: 'string',
        location: { lat: 'number', lng: 'number' },
        intent: 'string',
      },
      branding: {
        workspace_name: 'string',
        color_primary: 'string?',
        logo_url: 'string?',
      },
      created_at: 'ISO8601',
      updated_at: 'ISO8601',
    },
  },
  ERROR_ADMIN_REQUIRED_403: {
    status: 403,
    error: 'WORKSPACE_ADMIN_REQUIRED',
    message: 'Admin or owner role required to create reports',
  },
  ERROR_ACCESS_DENIED_403: {
    status: 403,
    error: 'WORKSPACE_ACCESS_DENIED',
    message: 'Access denied to this workspace',
  },
  ERROR_UNAUTHORIZED_401: {
    status: 401,
    error: 'UNAUTHORIZED',
    message: 'Authentication required',
  },
};

// ============================================================================
// GET /api/workspace/:workspace_id/report (List)
// ============================================================================
/**
 * List all reports in workspace
 *
 * Access Control:
 *   - Owner/Admin: 200 OK (list all)
 *   - Member:      200 OK (list all)
 *   - Non-member:  403 WORKSPACE_ACCESS_DENIED
 *   - Unauth:      401 UNAUTHORIZED
 *
 * Success Response (200):
 *   {
 *     "reports": [
 *       {
 *         "id": "uuid",
 *         "workspace_id": "uuid",
 *         "name": "Report Name",
 *         "status": "draft",
 *         "created_at": "2026-01-03T00:00:00Z"
 *       }
 *     ],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 50,
 *       "total": 123
 *     }
 *   }
 *
 * Error: Non-member tries to list (403)
 *   {
 *     "error": "WORKSPACE_ACCESS_DENIED",
 *     "message": "Access denied to this workspace",
 *     "status": 403
 *   }
 *
 * Error: Unauthenticated (401)
 *   {
 *     "error": "UNAUTHORIZED",
 *     "message": "Authentication required",
 *     "status": 401
 *   }
 */
export const LIST_REPORTS_RESPONSE = {
  SUCCESS_200: {
    status: 200,
    body: {
      reports: [
        {
          id: 'uuid',
          workspace_id: 'uuid',
          name: 'string',
          status: 'draft | published | archived',
          created_at: 'ISO8601',
        },
      ],
      pagination: {
        page: 'number',
        limit: 'number',
        total: 'number',
      },
    },
  },
  ERROR_ACCESS_DENIED_403: {
    status: 403,
    error: 'WORKSPACE_ACCESS_DENIED',
    message: 'Access denied to this workspace',
  },
  ERROR_UNAUTHORIZED_401: {
    status: 401,
    error: 'UNAUTHORIZED',
    message: 'Authentication required',
  },
};

// ============================================================================
// GET /api/workspace/:workspace_id/report/:report_id (Get Single)
// ============================================================================
/**
 * Retrieve a specific report
 *
 * Access Control:
 *   - Owner/Admin: 200 OK (if report exists)
 *   - Member:      200 OK (if report exists)
 *   - Non-member:  404 NOT_FOUND (regardless of existence)
 *   - Unauth:      401 UNAUTHORIZED
 *
 * Success Response (200):
 *   {
 *     "id": "uuid",
 *     "workspace_id": "uuid",
 *     "name": "Report Name",
 *     "status": "draft",
 *     "projection": { "parcel_id", "location", "intent" },
 *     "branding": { "workspace_name", "color_primary", "logo_url" },
 *     "created_at": "2026-01-03T00:00:00Z",
 *     "updated_at": "2026-01-03T00:00:00Z"
 *   }
 *
 * Error: Non-member or report not found (404)
 *   Note: Return 404 for both non-member AND missing report (indistinguishable)
 *   {
 *     "error": "NOT_FOUND",
 *     "message": "Report not found",
 *     "status": 404
 *   }
 *
 * Error: Unauthenticated (401)
 *   {
 *     "error": "UNAUTHORIZED",
 *     "message": "Authentication required",
 *     "status": 401
 *   }
 *
 * Error: Invalid report_id format (400)
 *   {
 *     "error": "VALIDATION_ERROR",
 *     "message": "Invalid report ID format",
 *     "status": 400
 *   }
 */
export const GET_REPORT_RESPONSE = {
  SUCCESS_200: {
    status: 200,
    body: {
      id: 'uuid',
      workspace_id: 'uuid',
      name: 'string',
      status: 'draft | published | archived',
      projection: {
        parcel_id: 'string',
        location: { lat: 'number', lng: 'number' },
        intent: 'string',
      },
      branding: {
        workspace_name: 'string',
        color_primary: 'string?',
        logo_url: 'string?',
      },
      created_at: 'ISO8601',
      updated_at: 'ISO8601',
    },
  },
  ERROR_NOT_FOUND_404: {
    status: 404,
    error: 'NOT_FOUND',
    message: 'Report not found',
  },
  ERROR_UNAUTHORIZED_401: {
    status: 401,
    error: 'UNAUTHORIZED',
    message: 'Authentication required',
  },
};

// ============================================================================
// Error Code Constants
// ============================================================================
export const ERROR_CODES = {
  UNAUTHORIZED: 'unauthorized',
  WORKSPACE_ADMIN_REQUIRED: 'forbidden',
  WORKSPACE_ACCESS_DENIED: 'forbidden',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error',
  CONFLICT: 'conflict',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;

// ============================================================================
// Test Assertion Helpers
// ============================================================================

export function assertErrorResponse(
  response: any,
  expectedStatus: number,
  expectedErrorCode: string
) {
  const data = response;
  if (!data || typeof data !== 'object') {
    throw new Error(`Expected error response object, got: ${data}`);
  }
  if (data.error !== expectedErrorCode) {
    throw new Error(
      `Expected error code "${expectedErrorCode}", got "${data.error}"`
    );
  }
  return data;
}

/**
 * Test Matrix: Access Control by Endpoint
 *
 * ┌─────────────┬────────┬────────┬────────────┬────────────┐
 * │ Endpoint    │ Admin  │ Member │ Non-member │ Unauth     │
 * ├─────────────┼────────┼────────┼────────────┼────────────┤
 * │ POST create │ 200 ✓  │ 403 ✗  │ 403 ✗      │ 401 ✗      │
 * │ Error Code  │        │ADMIN.. │ACCESS_..   │UNAUTH..    │
 * ├─────────────┼────────┼────────┼────────────┼────────────┤
 * │ GET list    │ 200 ✓  │ 200 ✓  │ 403 ✗      │ 401 ✗      │
 * │ Error Code  │        │        │ACCESS_..   │UNAUTH..    │
 * ├─────────────┼────────┼────────┼────────────┼────────────┤
 * │ GET single  │ 200 ✓  │ 200 ✓  │ 404 ✗      │ 401 ✗      │
 * │ Error Code  │        │        │NOT_FOUND   │UNAUTH..    │
 * └─────────────┴────────┴────────┴────────────┴────────────┘
 *
 * Key Differences:
 * - CREATE: Admin-only write (member = WORKSPACE_ADMIN_REQUIRED)
 * - LIST:   Member-readable (non-member = WORKSPACE_ACCESS_DENIED)
 * - GET:    Member-readable (non-member = NOT_FOUND, not 403)
 *           Note: 404 hides existence from non-members
 */
