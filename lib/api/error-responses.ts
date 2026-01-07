/**
 * API Error Response Helper
 * 
 * Provides consistent error response functions aligned to frozen contract.
 * All responses follow the standard error shape.
 */

import { ERROR_CODES, HTTP_STATUS } from '../contracts/ccp06/error-codes';

export interface ErrorResponseBody {
  error: string;
  message: string;
  status: number;
  details?: any;
}

/**
 * Create a 401 Unauthorized response
 * Used when account_id header is missing
 */
export function unauthorized(
  message: string = 'Authentication required'
): Response {
  return new Response(
    JSON.stringify({
      error: ERROR_CODES.UNAUTHORIZED,
      message,
      status: HTTP_STATUS.UNAUTHORIZED,
    }),
    { status: HTTP_STATUS.UNAUTHORIZED }
  );
}

/**
 * Create a 403 Forbidden response - Admin required
 * Used when account is member but role is not admin/owner
 */
export function forbiddenAdminRequired(): Response {
  return new Response(
    JSON.stringify({
      error: ERROR_CODES.WORKSPACE_ADMIN_REQUIRED,
      message: 'Admin or owner role required to create reports',
      status: HTTP_STATUS.FORBIDDEN,
    }),
    { status: HTTP_STATUS.FORBIDDEN }
  );
}

/**
 * Create a 403 Forbidden response - Access denied
 * Used when account is not a workspace member
 */
export function forbiddenAccessDenied(
  message: string = 'Access denied to this workspace'
): Response {
  return new Response(
    JSON.stringify({
      error: ERROR_CODES.WORKSPACE_ACCESS_DENIED,
      message,
      status: HTTP_STATUS.FORBIDDEN,
    }),
    { status: HTTP_STATUS.FORBIDDEN }
  );
}

/**
 * Create a 404 Not Found response
 * Used for missing workspaces or reports
 * Note: We use 404 for non-members accessing reports to hide existence
 */
export function notFound(
  message: string = 'Report not found'
): Response {
  return new Response(
    JSON.stringify({
      error: ERROR_CODES.NOT_FOUND,
      message,
      status: HTTP_STATUS.NOT_FOUND,
    }),
    { status: HTTP_STATUS.NOT_FOUND }
  );
}

/**
 * Create a 400 Bad Request response - Validation error
 */
export function validationError(
  message: string,
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      error: ERROR_CODES.VALIDATION_ERROR,
      message,
      status: HTTP_STATUS.BAD_REQUEST,
      ...(details && { details }),
    }),
    { status: HTTP_STATUS.BAD_REQUEST }
  );
}

/**
 * Create a 409 Conflict response - Duplicate name
 */
export function conflict(
  message: string = 'Resource already exists'
): Response {
  return new Response(
    JSON.stringify({
      error: 'conflict',
      message,
      status: 409,
    }),
    { status: 409 }
  );
}

/**
 * Success response wrapper (200, 201, etc.)
 * Used for standardized success responses
 */
export function success(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status });
}
