import { Source, Layer } from '@vis.gl/react-maplibre';
import { zoningOverlay, floodOverlay } from './zoning-flood-overlay';

export function AwesomeOverlayLayers() {
  return (
    <>
      {/* Zoning Overlay */}
      <Source id="zoning" type="geojson" data={zoningOverlay}>
        <Layer
          id="zoning-fill"
          type="fill"
          paint={{
            'fill-color': '#f59e42',
            'fill-opacity': 0.35,
          }}
        />
        <Layer
          id="zoning-outline"
          type="line"
          paint={{
            'line-color': '#b45309',
            'line-width': 2,
          }}
        />
      </Source>
      {/* Flood Overlay */}
      <Source id="flood" type="geojson" data={floodOverlay}>
        <Layer
          id="flood-fill"
          type="fill"
          paint={{
            'fill-color': '#2563eb',
            'fill-opacity': 0.22,
          }}
        />
        <Layer
          id="flood-outline"
          type="line"
          paint={{
            'line-color': '#1e40af',
            'line-width': 2,
          }}
        />
      </Source>
    </>
  );
}
