import type { RoutePointDto } from '@repo/shared';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';

// Leaflet's default marker images resolve to broken URLs under a bundler,
// so the marker is a styled div instead.
const markerIcon = L.divIcon({
  className: 'rounded-full border-2 border-white bg-blue-600 shadow',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const SANTO_DOMINGO: [number, number] = [18.4861, -69.9312];

interface RouteMapProps {
  points: RoutePointDto[];
  /** When set, clicking the map reports the coordinates. */
  onPick?: (lat: number, lng: number) => void;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

export function RouteMap({ points, onPick }: RouteMapProps) {
  const positions = points.map(
    (point) => [point.lat, point.lng] as [number, number],
  );
  const bounds = positions.length > 1 ? L.latLngBounds(positions) : undefined;

  return (
    <MapContainer
      className="h-85 w-full rounded-lg border border-slate-200"
      center={positions[0] ?? SANTO_DOMINGO}
      zoom={13}
      bounds={bounds}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onPick && <ClickHandler onPick={onPick} />}
      <Polyline positions={positions} />
      {points.map((point) => (
        <Marker
          key={point.sequence}
          position={[point.lat, point.lng]}
          icon={markerIcon}
        >
          <Popup>
            {point.sequence + 1}. {point.name ?? 'Sin nombre'}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
