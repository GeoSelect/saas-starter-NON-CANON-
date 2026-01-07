'use client';

import * as React from 'react';
import { use } from 'react';
import {
  parcelService,
  type ParcelData,
  type RiskOverlay,
} from '@/lib/services/parcel-service';
import { InteractiveMap } from '@/components/parcel/InteractiveMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Home,
  AlertTriangle,
  FileText,
  TrendingUp,
  Download,
  Share2,
} from 'lucide-react';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ParcelSummaryPage({ params }: PageProps) {
  const { id } = use(params);
  const [parcel, setParcel] = React.useState<ParcelData | null>(null);
  const [risks, setRisks] = React.useState<RiskOverlay[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadParcel = async () => {
      setLoading(true);
      try {
        // 🎯 TODO: Replace with actual data fetching
        // For now, using mock data
        const mockParcel: ParcelData = {
          id,
          apn: '123-456-789',
          address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
          jurisdiction: 'Santa Clara County',
          zoning: 'M-1 (Light Industrial)',
          landUse: 'Office/Research & Development',
          acreage: 26.0,
          owner: 'Google LLC',
          assessedValue: 15000000,
          coordinates: { lat: 37.422, lng: -122.0841 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-122.085, 37.421],
                [-122.083, 37.421],
                [-122.083, 37.423],
                [-122.085, 37.423],
                [-122.085, 37.421],
              ],
            ],
          },
          attributes: {
            yearBuilt: 2004,
            totalBuildings: 8,
            parkingSpaces: 2000,
            squareFeet: 250000,
          },
          sources: ['County Assessor', 'ESRI', 'Public Records'],
          lastUpdated: new Date().toISOString(),
        };

        setParcel(mockParcel);

        // Load risks
        const parcelRisks = await parcelService.getRiskOverlays(mockParcel);
        setRisks(parcelRisks);
      } catch (error) {
        console.error('Failed to load parcel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadParcel();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading parcel data...</p>
        </div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Parcel Not Found</h2>
          <p className="text-muted-foreground">The requested parcel could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{parcel.address}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">APN: {parcel.apn}</Badge>
            <Badge variant="secondary">{parcel.jurisdiction}</Badge>
            <Badge>{parcel.zoning}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Interactive Map */}
      <InteractiveMap
        parcel={parcel}
        risks={risks}
        showBoundaries={true}
        showRisks={true}
        height={500}
      />

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Home className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="risks">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Risks</span>
          </TabsTrigger>
          <TabsTrigger value="details">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Analysis</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Land Use</p>
                    <p className="font-semibold">{parcel.landUse || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Acreage</p>
                    <p className="font-semibold">{parcel.acreage?.toFixed(2) || 'N/A'} acres</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Owner</p>
                    <p className="font-semibold truncate">{parcel.owner || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assessed Value</p>
                    <p className="font-semibold">
                      ${parcel.assessedValue?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Building Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(parcel.attributes || {}).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{parcel.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {parcel.coordinates.lat.toFixed(6)}, {parcel.coordinates.lng.toFixed(6)}
                  </p>
                  <p className="text-sm text-muted-foreground">{parcel.jurisdiction}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              {risks.length > 0 ? (
                <div className="space-y-4">
                  {risks.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div
                        className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                          risk.severity === 'high'
                            ? 'bg-red-500'
                            : risk.severity === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold capitalize">{risk.type} Risk</p>
                          <Badge
                            variant={
                              risk.severity === 'high'
                                ? 'destructive'
                                : risk.severity === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {risk.description}
                        </p>
                        <p className="text-xs text-muted-foreground">Source: {risk.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No risk data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {parcel.sources.map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span>{source}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(parcel.lastUpdated).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Raw Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(parcel, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Market analysis and comparable properties</p>
                <p className="text-sm mt-2">This feature will be available soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
