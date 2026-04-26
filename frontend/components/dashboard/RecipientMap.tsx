'use client';

import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Recipient interface for stress testing
 * Matches the design document specification
 */
export interface Recipient {
  id: number;
  address: string;
  label: string;
  amount: string;
  token: string;
  taxId?: string;
  transactions: number;
  lastActive: string;
  lat?: number;
  lng?: number;
}

/**
 * Helper function to generate random coordinates for recipients without lat/lng
 * Generates coordinates within [-60, 60] lat and [-150, 150] lng for demo purposes
 */
function getRecipientCoordinates(recipient: Recipient): [number, number] {
  if (recipient.lat !== undefined && recipient.lng !== undefined) {
    return [recipient.lat, recipient.lng];
  }

  // Generate random coordinates within the specified bounds for demo
  const lat = Math.random() * 120 - 60; // [-60, 60]
  const lng = Math.random() * 300 - 150; // [-150, 150]
  return [lat, lng];
}

/**
 * Map content component - rendered inside dynamic import
 * This component is only rendered on the client side
 */
function RecipientMapContent({ recipients }: { recipients: Recipient[] }) {
  // Dynamically import react-leaflet components to avoid SSR issues
  const MapContainer = React.lazy(() =>
    import('react-leaflet').then((mod) => ({ default: mod.MapContainer }))
  );
  const TileLayer = React.lazy(() =>
    import('react-leaflet').then((mod) => ({ default: mod.TileLayer }))
  );
  const Marker = React.lazy(() =>
    import('react-leaflet').then((mod) => ({ default: mod.Marker }))
  );
  const Popup = React.lazy(() =>
    import('react-leaflet').then((mod) => ({ default: mod.Popup }))
  );

  // Try to import MarkerClusterGroup, but provide fallback if not available
  let MarkerClusterGroup: any = null;
  try {
    // This will be undefined if react-leaflet-markercluster is not installed
    // In that case, we'll render markers without clustering
    MarkerClusterGroup = React.lazy(() =>
      import('react-leaflet-markercluster').then((mod) => ({
        default: mod.MarkerClusterGroup,
      }))
    );
  } catch {
    // Clustering not available, will render markers directly
  }

  // Calculate center of map based on recipient coordinates
  const coordinates = recipients.map((r) => getRecipientCoordinates(r));
  const centerLat =
    coordinates.length > 0
      ? coordinates.reduce((sum, [lat]) => sum + lat, 0) / coordinates.length
      : 0;
  const centerLng =
    coordinates.length > 0
      ? coordinates.reduce((sum, [, lng]) => sum + lng, 0) / coordinates.length
      : 0;

  return (
    <React.Suspense
      fallback={
        <div className="w-full h-[600px] flex items-center justify-center bg-stellar-glass-card rounded-lg border border-stellar-glass-border">
          <div className="text-stellar-text-secondary">Loading map...</div>
        </div>
      }
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={3}
        style={{ height: '600px', width: '100%' }}
        className="rounded-lg border border-stellar-glass-border"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {MarkerClusterGroup ? (
          <MarkerClusterGroup>
            {recipients.map((recipient) => {
              const [lat, lng] = getRecipientCoordinates(recipient);
              return (
                <Marker key={recipient.id} position={[lat, lng]}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{recipient.label}</div>
                      <div className="text-xs text-gray-600">
                        {recipient.address.slice(0, 10)}...
                      </div>
                      <div className="text-xs text-gray-600">
                        {recipient.amount} {recipient.token}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        ) : (
          // Fallback: render markers without clustering if MarkerClusterGroup not available
          recipients.map((recipient) => {
            const [lat, lng] = getRecipientCoordinates(recipient);
            return (
              <Marker key={recipient.id} position={[lat, lng]}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{recipient.label}</div>
                    <div className="text-xs text-gray-600">
                      {recipient.address.slice(0, 10)}...
                    </div>
                    <div className="text-xs text-gray-600">
                      {recipient.amount} {recipient.token}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </React.Suspense>
  );
}

/**
 * RecipientMap component
 * Renders a map with recipient markers using react-leaflet and react-leaflet-markercluster
 * Uses dynamic import with ssr: false to avoid SSR issues with Leaflet
 */
export const RecipientMap = dynamic(
  () =>
    Promise.resolve(({ recipients }: { recipients: Recipient[] }) => (
      <RecipientMapContent recipients={recipients} />
    )),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center bg-stellar-glass-card rounded-lg border border-stellar-glass-border">
        <div className="text-stellar-text-secondary">Loading map...</div>
      </div>
    ),
  }
);

RecipientMap.displayName = 'RecipientMap';
