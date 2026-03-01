import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCategoryConfig } from '../lib/categoryIcons';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface ComplaintLocation {
  id: string;
  title: string;
  category: string;
  status: string;
  coordinates: [number, number]; // [lat, lng]
  buildingName?: string;
}

interface ComplaintMapProps {
  complaints: ComplaintLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  mapKey?: string; // Add unique key to prevent reinitialization
}

// ASTU Campus default location (Adama, Ethiopia)
const DEFAULT_CENTER: [number, number] = [8.5400, 39.2675];
const DEFAULT_ZOOM = 16;

// Campus buildings (example locations - adjust to actual ASTU campus)
export const CAMPUS_LOCATIONS = {
  'Main Building': [8.5400, 39.2675] as [number, number],
  'Library': [8.5405, 39.2680] as [number, number],
  'Cafeteria': [8.5395, 39.2670] as [number, number],
  'Hostel Block A': [8.5410, 39.2685] as [number, number],
  'Hostel Block B': [8.5415, 39.2690] as [number, number],
  'Academic Block 1': [8.5390, 39.2665] as [number, number],
  'Academic Block 2': [8.5385, 39.2660] as [number, number],
  'Sports Complex': [8.5420, 39.2695] as [number, number],
  'Administration': [8.5398, 39.2673] as [number, number],
};

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  complaints,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '500px',
  mapKey = 'default-map'
}) => {
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'pending_review':
        return '#22c55e'; // bright green for new items
      case 'open':
        return '#f97316'; // amber
      case 'in_progress':
        return '#eab308'; // yellow
      case 'resolved':
        return '#16a34a'; // green
      case 'rejected':
        return '#f97373'; // soft red
      default:
        return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (status: string) => {
    const color = getMarkerColor(status);
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
          <path fill="${color}" stroke="#fff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  return (
    <div
      key={mapKey}
      style={{
        height,
        width: '100%',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(15, 118, 110, 0.25)',
        border: '1px solid rgba(16, 185, 129, 0.28)',
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        key={mapKey}
      >
        <MapUpdater center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Campus building markers */}
        {Object.entries(CAMPUS_LOCATIONS).map(([name, coords]) => (
          <Marker
            key={name}
            position={coords}
            icon={new Icon({
              iconUrl: `data:image/svg+xml;base64,${btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
                  <path fill="#3b82f6" stroke="#fff" stroke-width="2" d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              `)}`,
              iconSize: [28, 28],
              iconAnchor: [14, 28],
              popupAnchor: [0, -28],
            })}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-blue-600">{name}</p>
                <p className="text-xs text-slate-500">Campus Building</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Complaint markers */}
        {complaints.map((complaint) => {
          const categoryConfig = getCategoryConfig(complaint.category);
          return (
            <Marker
              key={complaint.id}
              position={complaint.coordinates}
              icon={createCustomIcon(complaint.status)}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <p className="font-bold">{complaint.title}</p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Category:</span> {categoryConfig.label}
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={`font-semibold ${
                      complaint.status === 'open' ? 'text-red-600' :
                      complaint.status === 'in_progress' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                  {complaint.buildingName && (
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">Location:</span> {complaint.buildingName}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
