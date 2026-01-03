export type Ccp03Record = {
  id: string;
  lat?: number;
  lng?: number;
  note?: string;
  [key: string]: any;
};

export const CONTRACT = 'ccp03';

export function parse(input: any): Ccp03Record {
  const id = input.id ?? input.gid ?? input.uuid ?? `${input.lat ?? 'n'}:${input.lng ?? 'n'}`;
  return {
    id: String(id),
    lat: input.lat !== undefined ? Number(input.lat) : undefined,
    lng: input.lng !== undefined ? Number(input.lng) : undefined,
    note: input.note ?? input.payload?.note ?? undefined,
    ...('payload' in input ? input.payload : {})
  };
}

export default { CONTRACT, parse };
