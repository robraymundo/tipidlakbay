import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const EMPTY_GEOJSON = {
  type: "FeatureCollection",
  features: [],
};

function ensureRouteLayers(map) {
  if (!map.getSource("routes")) {
    map.addSource("routes", {
      type: "geojson",
      data: EMPTY_GEOJSON,
    });
  }

  if (!map.getLayer("route-alternatives")) {
    map.addLayer({
      id: "route-alternatives",
      type: "line",
      source: "routes",
      filter: ["==", ["get", "isSelected"], false],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#94a3b8",
        "line-width": 4,
        "line-opacity": 0.7,
      },
    });
  }

  if (!map.getLayer("route-selected-outline")) {
    map.addLayer({
      id: "route-selected-outline",
      type: "line",
      source: "routes",
      filter: ["==", ["get", "isSelected"], true],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#1e293b",
        "line-width": 8,
        "line-opacity": 0.95,
      },
    });
  }

  if (!map.getLayer("route-selected")) {
    map.addLayer({
      id: "route-selected",
      type: "line",
      source: "routes",
      filter: ["==", ["get", "isSelected"], true],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 5,
        "line-opacity": 1,
      },
    });
  }
}

function RouteMap({
  routes = [],
  originCoords,
  destinationCoords,
  selectedRouteId,
  darkMode,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);

  const routesRef = useRef(routes);
  const originRef = useRef(originCoords);
  const destinationRef = useRef(destinationCoords);
  const selectedRouteIdRef = useRef(selectedRouteId);

  routesRef.current = routes;
  originRef.current = originCoords;
  destinationRef.current = destinationCoords;
  selectedRouteIdRef.current = selectedRouteId;

  const renderMapData = () => {
    const map = mapRef.current;
    if (!map) return;

    ensureRouteLayers(map);

    const activeRouteId =
      selectedRouteIdRef.current ?? routesRef.current[0]?.id ?? null;

    const features = routesRef.current.map((route) => ({
      type: "Feature",
      properties: {
        id: route.id,
        name: route.name,
        isSelected: route.id === activeRouteId,
      },
      geometry: route.geometry,
    }));

    const source = map.getSource("routes");
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features,
      });
    }

    originMarkerRef.current?.remove();
    destinationMarkerRef.current?.remove();

    if (originRef.current) {
      originMarkerRef.current = new mapboxgl.Marker({ color: "#16a34a" })
        .setLngLat([originRef.current.lng, originRef.current.lat])
        .addTo(map);
    }

    if (destinationRef.current) {
      destinationMarkerRef.current = new mapboxgl.Marker({ color: "#dc2626" })
        .setLngLat([destinationRef.current.lng, destinationRef.current.lat])
        .addTo(map);
    }

    if (
      !routesRef.current.length ||
      !originRef.current ||
      !destinationRef.current
    ) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    routesRef.current.forEach((route) => {
      route.geometry.coordinates.forEach((coord) => bounds.extend(coord));
    });

    bounds.extend([originRef.current.lng, originRef.current.lat]);
    bounds.extend([destinationRef.current.lng, destinationRef.current.lat]);

    map.fitBounds(bounds, {
      padding: 40,
      duration: 800,
    });
  };

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: darkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/streets-v12",
      center: [121.774, 12.8797],
      zoom: 5,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      ensureRouteLayers(mapRef.current);
      renderMapData();
    });

    return () => {
      originMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const nextStyle = darkMode
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";

    map.setStyle(nextStyle);

    map.once("style.load", () => {
      ensureRouteLayers(map);
      renderMapData();
    });
  }, [darkMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!map.isStyleLoaded()) return;
    renderMapData();
  }, [routes, originCoords, destinationCoords, selectedRouteId]);

  return (
    <div className="relative h-[250px] overflow-hidden rounded-2xl md:h-[280px]">
      <div ref={mapContainerRef} className="h-full w-full" />

      {!routes.length && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
          <div className="rounded-xl bg-white/90 px-4 py-3 text-center text-sm font-medium text-slate-700 shadow">
            Enter your starting point and destination, then calculate your trip.
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteMap;