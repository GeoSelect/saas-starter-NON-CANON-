export type ReportVersion = 'rpt-0.1';

export const REPORT_VERSION: ReportVersion = 'rpt-0.1';

export type ReportBlockBase = {
  id?: string;
  type: string;
  [key: string]: any;
};

export type EvidenceListBlock = ReportBlockBase & {
  type: 'evidence_list';
  items: Array<Record<string, any>>;
};

export type ParagraphBlock = ReportBlockBase & {
  type: 'paragraph';
  text: string;
};

export type Block = EvidenceListBlock | ParagraphBlock | ReportBlockBase;

export type ReportSection = {
  id?: string;
  type: 'overview' | 'restrictions' | 'process' | 'deadlines' | 'risks' | 'sources';
  title?: string;
  blocks: Block[];
};

export type Report = {
  // compatibility fields
  id?: string;
  report_id: string;
  request_id?: string | null;
  version: ReportVersion;
  status?: string;
  created_at?: string;
  // contract
  sections: ReportSection[];
  // optional attach: original context for diagnostics
  context?: Record<string, any> | null;
};

/**
 * Create the frozen report skeleton expected by templates/tests.
 */
export function createReportSkeleton(report_id: string, request_id?: string | null, context?: Record<string, any>): Report {
  const sections: ReportSection[] = [
    { type: 'overview', blocks: [] },
    { type: 'restrictions', blocks: [] },
    { type: 'process', blocks: [] },
    { type: 'deadlines', blocks: [] },
    { type: 'risks', blocks: [] },
    { type: 'sources', blocks: [{ type: 'evidence_list', items: [] } as EvidenceListBlock] },
  ];

  return {
    // compatibility fields
    id: report_id,
    report_id,
    request_id: request_id ?? null,
    version: REPORT_VERSION,
    status: 'created',
    created_at: new Date().toISOString(),
    sections,
    context: context ?? null,
  };
}

export default { createReportSkeleton };
