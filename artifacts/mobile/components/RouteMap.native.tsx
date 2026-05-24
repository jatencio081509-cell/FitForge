import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { StyleSheet, View } from "react-native";

interface RoutePoint { lat: number; lng: number; ts: number }

interface RouteMapProps {
  routePoints: RoutePoint[];
  status: "active" | "paused" | "finished";
  style?: object;
}

export default function RouteMap({ routePoints, status, style }: RouteMapProps) {
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        showsUserLocation
        followsUserLocation={status === "active"}
        userInterfaceStyle="dark"
        showsCompass={false}
        showsScale={false}
        initialRegion={
          routePoints.length > 0
            ? {
                latitude: routePoints[routePoints.length - 1].lat,
                longitude: routePoints[routePoints.length - 1].lng,
                latitudeDelta: 0.004,
                longitudeDelta: 0.004,
              }
            : undefined
        }
      >
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints.map(p => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor="#00E6D2"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {routePoints.length > 0 && (
          <Marker
            coordinate={{ latitude: routePoints[0].lat, longitude: routePoints[0].lng }}
            pinColor="#22C55E"
            title="Start"
          />
        )}
        {status === "finished" && routePoints.length > 0 && (
          <Marker
            coordinate={{
              latitude: routePoints[routePoints.length - 1].lat,
              longitude: routePoints[routePoints.length - 1].lng,
            }}
            pinColor="#EF4444"
            title="Finish"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
