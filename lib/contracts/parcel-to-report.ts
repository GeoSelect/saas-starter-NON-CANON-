import { ReportContext } from './report.schema';

export type ParcelFeature = {
  id?: string;
  lat?: number;
  lng?: number;
  [key: string]: any;
};

export type ParcelContext = ParcelFeature[];

/**
 * Project a ParcelContext into a frozen ReportContext shape.
 * This is intentionally minimal and deterministic so downstream
 * consumers (e.g., Builder.io templates) can rely on the shape.
 */
export function projectParcelToReportContext(parcel: ParcelContext, intent: Record<string, any>): ReportContext {
  const features = Array.isArray(parcel) ? parcel : [parcel];

  const count = features.length;

  const lats = features.map((f) => (typeof f.lat === 'number' ? f.lat : NaN)).filter(Number.isFinite);
  const lngs = features.map((f) => (typeof f.lng === 'number' ? f.lng : NaN)).filter(Number.isFinite);

  const bbox = (lats.length && lngs.length)
    ? [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)] as [number, number, number, number]
    : undefined;

  const center = (lats.length && lngs.length)
    ? { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2 }
    : undefined;

  return {
    intent: { ...(intent ?? {}) },
    parcel_summary: {
      count,
      bbox: bbox ?? null,
      center: center ?? null,
      sample: features[0] ?? null,
    },
    parcels: features,
  } as ReportContext;
}

export default { ParcelContext: null as any, projectParcelToReportContext };
