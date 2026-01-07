// Mock database for activity log sections: Events, Documents, Parcels

export const mockEvents = [
  { id: 'e1', type: 'Login', user: 'alice@example.com', date: '2026-01-03', status: 'Success' },
  { id: 'e2', type: 'Report Shared', user: 'bob@example.com', date: '2026-01-02', status: 'Success' },
  { id: 'e3', type: 'Export', user: 'carol@example.com', date: '2026-01-01', status: 'Failed' },
];

export const mockDocuments = [
  { id: 'd1', name: 'Q4 Audit Report', sharedWith: 'alice@example.com', date: '2026-01-03', status: 'Viewed' },
  { id: 'd2', name: 'Parcel Analysis', sharedWith: 'bob@example.com', date: '2026-01-02', status: 'Not Viewed' },
  { id: 'd3', name: 'Governance Summary', sharedWith: 'carol@example.com', date: '2026-01-01', status: 'Viewed' },
];

export const mockParcels = [
  { id: 'p1', parcelId: 'TX-001', action: 'Shared', contact: 'alice@example.com', date: '2026-01-03', status: 'Viewed' },
  { id: 'p2', parcelId: 'CO-002', action: 'Shared', contact: 'bob@example.com', date: '2026-01-02', status: 'Not Viewed' },
  { id: 'p3', parcelId: 'NM-003', action: 'Updated', contact: 'carol@example.com', date: '2026-01-01', status: 'Viewed' },
];

export const activityHeaders = {
  events: ['Type', 'User', 'Date', 'Status'],
  documents: ['Name', 'Shared With', 'Date', 'Status'],
  parcels: ['Parcel ID', 'Action', 'Contact', 'Date', 'Status'],
};
