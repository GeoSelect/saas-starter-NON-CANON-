// C046 UnlockDetails — Branded Report Types (CCP-06, CCP-14)

/**
 * BrandedReport type
 * Represents a single branded report entity
 */
export interface BrandedReport {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  logo?: string;
  branding?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Response types for API endpoints
 */
export interface CreateBrandedReportRequest {
  name: string;
  description?: string;
}

export interface CreateBrandedReportResponse {
  report: BrandedReport;
}

export interface ListBrandedReportsResponse {
  reports: BrandedReport[];
  total: number;
  page: number;
  limit: number;
}

export interface GetBrandedReportResponse {
  report: BrandedReport;
}

export interface UpdateBrandedReportRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  branding?: BrandedReport['branding'];
}

export interface UpdateBrandedReportResponse {
  report: BrandedReport;
}

export interface DeleteBrandedReportResponse {
  success: boolean;
  message: string;
}
