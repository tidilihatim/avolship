'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface ZoneData {
  latitude: number;
  longitude: number;
  total: number;
  failed: number;
  failurePercentage: number;
}

interface MapViewProps {
  data: ZoneData[];
}

// Component to fit bounds to all markers
function FitBounds({ data }: { data: ZoneData[] }) {
  const map = useMap();

  useEffect(() => {
    if (data.length > 0) {
      const bounds = L.latLngBounds(
        data.map((zone) => [zone.latitude, zone.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [data, map]);

  return null;
}

// Get color based on failure percentage
function getZoneColor(failurePercentage: number): string {
  if (failurePercentage >= 50) return '#ef4444'; // red-500
  if (failurePercentage >= 25) return '#f97316'; // orange-500
  if (failurePercentage >= 10) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
}

export default function ReturnsPerZoneMapView({ data }: MapViewProps) {
  // Default center (will be overridden by FitBounds)
  const defaultCenter: [number, number] = data.length > 0
    ? [data[0].latitude, data[0].longitude]
    : [0, 0];

  return (
    <div className="h-[500px] w-full rounded-md overflow-hidden border">
      <MapContainer
        center={defaultCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data.map((zone, index) => (
          <CircleMarker
            key={`${zone.latitude}-${zone.longitude}-${index}`}
            center={[zone.latitude, zone.longitude]}
            radius={Math.max(8, Math.min(zone.total * 2, 30))}
            fillColor={getZoneColor(zone.failurePercentage)}
            fillOpacity={0.7}
            color="#fff"
            weight={2}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-2">Zone Details</div>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">
                      {zone.latitude.toFixed(2)}, {zone.longitude.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Total Deliveries:</span>
                    <span className="font-medium">{zone.total}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-medium text-red-600">{zone.failed}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Failure Rate:</span>
                    <span
                      className="font-bold"
                      style={{ color: getZoneColor(zone.failurePercentage) }}
                    >
                      {zone.failurePercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <FitBounds data={data} />
      </MapContainer>
    </div>
  );
}
