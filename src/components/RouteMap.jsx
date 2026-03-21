import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { formatFuelPrice } from "../utils/fuelPrices";

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
  fuelPriceContext,
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

    const selectedExists = routesRef.current.some(
      (route) => route.id === selectedRouteIdRef.current
    );

    const activeRouteId = selectedExists
      ? selectedRouteIdRef.current
      : routesRef.current[0]?.id ?? null;

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
      padding: 32,
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

  const gasPanelClass = darkMode
    ? "rounded-xl p-3"
    : "rounded-xl bg-slate-50 p-3";

  const gasTitleClass = darkMode ? "text-white" : "text-slate-900";

  const gasLabelClass = darkMode ? "text-slate-200" : "text-slate-700";

  const gasItemClass = darkMode
    ? "rounded-md bg-emerald-950/40 px-1.5 py-0.5 font-semibold text-emerald-200 ring-1 ring-emerald-800/60"
    : "rounded-md bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200";

  const noteClass = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-3">
      <div className="relative h-[220px] overflow-hidden rounded-xl md:h-[240px]">
        <div ref={mapContainerRef} className="h-full w-full" />

        {!routes.length && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px]">
            <div className="rounded-lg bg-white/90 px-3.5 py-2.5 text-center text-sm font-medium text-slate-700 shadow">
              Enter your starting point and destination, then calculate your trip.
            </div>
          </div>
        )}
      </div>

      <div className={gasPanelClass}>
        <p className={`mb-2 text-sm font-semibold ${gasTitleClass}`}>
          Gas Prices
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs md:text-sm">
          <span className={`flex items-center gap-1 ${gasLabelClass}`}>
            <span className="font-medium">RON 91</span>
            <span className={gasItemClass}>
              {formatFuelPrice(fuelPriceContext.prices.ron91)}
            </span>
          </span>

          <span className={`flex items-center gap-1 ${gasLabelClass}`}>
            <span className="font-medium">RON 95</span>
            <span className={gasItemClass}>
              {formatFuelPrice(fuelPriceContext.prices.premium)}
            </span>
          </span>

          <span className={`flex items-center gap-1 ${gasLabelClass}`}>
            <span className="font-medium">DSL</span>
            <span className={gasItemClass}>
              {formatFuelPrice(fuelPriceContext.prices.diesel)}
            </span>
          </span>
        </div>

        {fuelPriceContext.note && (
          <p className={`mt-2 text-[11px] md:text-xs ${noteClass}`}>
            {fuelPriceContext.note}
          </p>
        )}
      </div>
    </div>
  );
}

export default RouteMap;