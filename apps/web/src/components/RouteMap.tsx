import type { RoutePointDto } from "@repo/shared";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";

// Leaflet's default marker images resolve to broken URLs under a bundler,
// so the marker is a numbered div instead.
const markerIcon = (sequence: number) =>
  L.divIcon({
    className: "",
    html: `<div class="grid size-5 place-items-center rounded-full border-2 border-zinc-950 bg-lime-400 font-display text-[11px] font-bold text-zinc-950 shadow-lg shadow-lime-400/30">${sequence + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const CARACAS: [number, number] = [10.4806, -66.9036];

interface RouteMapProps {
  points: RoutePointDto[];
  /** When set, clicking the map reports the coordinates. */
  onPick?: (lat: number, lng: number) => void;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
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
      className="h-96 w-full overflow-hidden rounded-xl border border-zinc-800"
      center={positions[0] ?? CARACAS}
      zoom={15}
      bounds={bounds}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {onPick && <ClickHandler onPick={onPick} />}
      <Polyline
        positions={positions}
        pathOptions={{ color: "#a3e635", weight: 1, opacity: 0.85 }}
      />
      {points.map((point) => (
        <Marker
          key={point.sequence}
          position={[point.lat, point.lng]}
          icon={markerIcon(point.sequence)}
        >
          <Popup>
            {point.sequence + 1}. {point.name ?? "Sin nombre"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
