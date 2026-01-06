/**
 * Canonical parcel types and paginated result contract.
 * Export from a central contracts folder so all components use the same shapes.
 *
 * Used by:
 * - app/parcels/page/[pageNum]/page.tsx (server)
 * - components/ParcelList.tsx (client, receives items only)
 * - lib/server/parcels.ts (DB query returns this shape)
 * - tests/parcel.test.ts
 */

import { z } from 'zod';

/**
 * Core Parcel domain model.
 * Represents a single geographic parcel with metadata.
 */
export interface Parcel {
  /** UUID, primary key */
  id: string;

  /** Workspace owner */
  workspaceId: string;

  /** User who created/owns this parcel */
  userId: string;

  /** Human-readable name */
  name: string;

  /** Parcel geometry (GeoJSON FeatureCollection or null if not yet mapped) */
  geometry: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: any; // GeoJSON geometry
      properties: Record<string, any>;
    }>;
  } | null;

  /** Parcel address (optional, for reference) */
  address?: string;

  /** Square footage or area (optional) */
  area?: number;

  /** Parcel status (draft, active, archived) */
  status: 'draft' | 'active' | 'archived';

  /** ISO timestamp when created */
  createdAt: Date;

  /** ISO timestamp when last modified */
  updatedAt: Date;

  /** User ID who last modified (for audit trail) */
  updatedBy?: string;

  /** Soft delete marker */
  deletedAt?: Date | null;

  /** Optional: number of items/reports associated with this parcel */
  itemCount?: number;
}

/**
 * Paginated result wrapper for list endpoints.
 * Used by server component to render page + pagination controls.
 */
export interface PaginatedResult<T> {
  /** Items on this page */
  items: T[];

  /** Current page number (1-indexed) */
  page: number;

  /** Total number of pages available */
  totalPages: number;

  /** Total number of items across all pages */
  total: number;

  /** Items per page (usually 20) */
  pageSize: number;

  /** Is there a next page? */
  hasNextPage: boolean;

  /** Is there a previous page? */
  hasPreviousPage: boolean;
}

/**
 * Query parameters for fetching paginated parcels.
 * Decoded from URL params and validated before DB query.
 */
export interface ParcelsQueryParams {
  /** Workspace ID (from auth/AppShell context) */
  workspaceId: string;

  /** Current page number (1-indexed) */
  page: number;

  /** Items per page (clamped to 1-100, default 20) */
  pageSize?: number;

  /** Sort column: 'name' | 'createdAt' | 'updatedAt' */
  sortBy?: 'name' | 'createdAt' | 'updatedAt';

  /** Sort direction: 'asc' | 'desc' */
  sortOrder?: 'asc' | 'desc';

  /** Optional: text search on name/address */
  search?: string;

  /** Optional: filter by status */
  status?: 'draft' | 'active' | 'archived';
}

/**
 * Zod schema for runtime validation of pageNum param.
 * Used in page.tsx to validate before calling getPaginatedParcels().
 */
export const PageNumberParamSchema = z.object({
  pageNum: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v >= 1, {
      message: 'Page number must be a positive integer',
    }),
});

/**
 * Zod schema for paginated query params validation.
 */
export const ParcelsQueryParamSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

/**
 * Zod schema for Parcel itself (useful for API validation, mapping, etc.)
 */
export const ParcelSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  geometry: z
    .object({
      type: z.literal('FeatureCollection'),
      features: z.array(
        z.object({
          type: z.literal('Feature'),
          geometry: z.any(),
          properties: z.record(z.any()),
        })
      ),
    })
    .nullable(),
  address: z.string().max(500).optional(),
  area: z.number().positive().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  updatedBy: z.string().uuid().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
  itemCount: z.number().nonnegative().optional(),
});

export type ParcelsQueryParamSchemaType = z.infer<typeof ParcelsQueryParamSchema>;
export type PageNumberParamSchemaType = z.infer<typeof PageNumberParamSchema>;
