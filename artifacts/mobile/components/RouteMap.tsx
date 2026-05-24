interface RoutePoint { lat: number; lng: number; ts: number }

interface RouteMapProps {
  routePoints: RoutePoint[];
  status: "active" | "paused" | "finished";
  style?: object;
}

export default function RouteMap(_props: RouteMapProps) {
  return null;
}
