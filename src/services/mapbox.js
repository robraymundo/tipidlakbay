const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function geocodePlace(query) {
  if (!query?.trim()) {
    throw new Error("Place query is required.");
  }

  const encodedQuery = encodeURIComponent(query.trim());

  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodedQuery}&limit=1&access_token=${MAPBOX_TOKEN}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to geocode location.");
  }

  const data = await response.json();

  const firstResult = data.features?.[0];
  if (!firstResult) {
    throw new Error(`No location found for "${query}".`);
  }

  const [lng, lat] = firstResult.geometry.coordinates;

  return {
    name: firstResult.properties?.full_address || firstResult.properties?.name || query,
    lng,
    lat,
  };
}

export async function getRoutes(originCoords, destinationCoords) {
  const { lng: originLng, lat: originLat } = originCoords;
  const { lng: destLng, lat: destLat } = destinationCoords;

  const coordinates = `${originLng},${originLat};${destLng},${destLat}`;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}` +
    `?alternatives=true&geometries=geojson&overview=simplified&steps=false&access_token=${MAPBOX_TOKEN}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch route directions.");
  }

  const data = await response.json();

  if (!data.routes?.length) {
    throw new Error("No routes found.");
  }

  return data.routes.map((route, index) => ({
    id: index + 1,
    name: `Route ${String.fromCharCode(65 + index)}`,
    distance: route.distance / 1000,
    duration: Math.round(route.duration / 60),
    geometry: route.geometry,
    label: "Available Route",
  }));
}