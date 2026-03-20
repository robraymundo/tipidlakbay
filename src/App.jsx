import { useEffect, useMemo, useState } from "react";
import TripForm from "./components/TripForm";
import RouteCard from "./components/RouteCard";
import CostSummary from "./components/CostSummary";
import RouteMap from "./components/RouteMap";
import { calculateTripCost } from "./utils/calculateTrip";
import { geocodePlace, getRoutes } from "./services/mapbox";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [liveRoutes, setLiveRoutes] = useState([]);
  const [appliedTripData, setAppliedTripData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [mapLocations, setMapLocations] = useState({
    origin: null,
    destination: null,
  });

  const [tripData, setTripData] = useState({
    origin: "",
    destination: "",
    vehicleType: "car",
    fuelEfficiency: "14",
    fuelPrice: "",
    tollFee: "",
    parkingFee: "",
    roundTrip: false,
  });

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setRouteError("");
      setHasCalculated(false);
      setLiveRoutes([]);
      setSelectedRouteId(null);
      setMapLocations({ origin: null, destination: null });

      const submittedTripData = { ...tripData };

      const originCoords = await geocodePlace(submittedTripData.origin);
      const destinationCoords = await geocodePlace(submittedTripData.destination);

      const fetchedRoutes = await getRoutes(originCoords, destinationCoords);

      const labeledRoutes = fetchedRoutes.map((route, index) => ({
        ...route,
        label:
          index === 0
            ? "Recommended Route"
            : index === 1
            ? "Alternative Route"
            : "Extra Route",
      }));

      setLiveRoutes(labeledRoutes);
      setMapLocations({
        origin: originCoords,
        destination: destinationCoords,
      });
      setAppliedTripData(submittedTripData);
      setHasCalculated(true);
    } catch (error) {
      console.error(error);
      setRouteError(error.message || "Unable to calculate trip.");
    } finally {
      setLoading(false);
    }
  };

  const computedRoutes = useMemo(() => {
    if (!appliedTripData) return [];

    const fuelEfficiency = Number(appliedTripData.fuelEfficiency);
    const fuelPrice = Number(appliedTripData.fuelPrice);
    const tollFee = Number(appliedTripData.tollFee || 0);
    const parkingFee = Number(appliedTripData.parkingFee || 0);

    return liveRoutes.map((route) => ({
      ...route,
      result:
        fuelEfficiency && fuelPrice
          ? calculateTripCost(
              route.distance,
              fuelEfficiency,
              fuelPrice,
              tollFee,
              parkingFee,
              appliedTripData.roundTrip
            )
          : null,
    }));
  }, [liveRoutes, appliedTripData]);

  const cheapestRouteId = useMemo(() => {
    const validRoutes = computedRoutes.filter((route) => route.result);
    if (!validRoutes.length) return null;

    return validRoutes.reduce((minRoute, currentRoute) =>
      currentRoute.result.totalCost < minRoute.result.totalCost
        ? currentRoute
        : minRoute
    ).id;
  }, [computedRoutes]);

  const fastestRouteId = useMemo(() => {
    if (!computedRoutes.length) return null;

    return computedRoutes.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    ).id;
  }, [computedRoutes]);

  const mostEfficientRouteId = useMemo(() => {
    if (!computedRoutes.length) return null;

    return computedRoutes.reduce((best, current) =>
      current.distance < best.distance ? current : best
    ).id;
  }, [computedRoutes]);

  useEffect(() => {
    if (!hasCalculated || !computedRoutes.length) {
      setSelectedRouteId(null);
      return;
    }

    const selectedStillExists = computedRoutes.some(
      (route) => route.id === selectedRouteId
    );

    if (!selectedStillExists) {
      setSelectedRouteId(cheapestRouteId ?? computedRoutes[0].id);
    }
  }, [hasCalculated, computedRoutes, cheapestRouteId, selectedRouteId]);

  const selectedSummary = useMemo(() => {
    if (!hasCalculated) return null;
    const route = computedRoutes.find((item) => item.id === cheapestRouteId);
    return route?.result || null;
  }, [computedRoutes, cheapestRouteId, hasCalculated]);

  return (
    <main
      className={`min-h-screen w-full px-4 py-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">TipidLakbay</h1>
            <p
              className={`mt-2 max-w-2xl ${
                darkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Smart trip budgeting in the midst of rising fuel prices.
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`rounded-xl px-4 py-2 font-medium transition ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200"
                : "bg-slate-900 text-white hover:bg-slate-700"
            }`}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section
              className={`rounded-2xl p-5 shadow-sm ring-1 ${
                darkMode
                  ? "bg-slate-900 ring-slate-800"
                  : "bg-white ring-slate-200"
              }`}
            >
              <h2 className="mb-4 text-xl font-semibold">Route Map</h2>

              <RouteMap
                routes={hasCalculated ? liveRoutes : []}
                originCoords={mapLocations.origin}
                destinationCoords={mapLocations.destination}
                selectedRouteId={selectedRouteId}
                darkMode={darkMode}
              />
            </section>
            
            <TripForm
              tripData={tripData}
              setTripData={setTripData}
              darkMode={darkMode}
              onCalculate={handleCalculate}
              loading={loading}
            />
          </div>

          <div className="space-y-6">
            <div
              className={`rounded-2xl p-5 shadow-sm ring-1 ${
                darkMode
                  ? "bg-slate-900 ring-slate-800"
                  : "bg-white ring-slate-200"
              }`}
            >
              <h2 className="mb-4 text-xl font-semibold">Route Comparison</h2>

              {routeError ? (
                <div
                  className={`rounded-xl p-4 text-sm ${
                    darkMode
                      ? "bg-red-950 text-red-200"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {routeError}
                </div>
              ) : loading ? (
                <div
                  className={`rounded-xl p-4 text-sm ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  Calculating routes...
                </div>
              ) : !hasCalculated ? (
                <div
                  className={`rounded-xl p-4 text-sm ${
                    darkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-50 text-slate-600"
                  }`}
                >
                  Fill in the trip details and click{" "}
                  <span className="font-semibold">Calculate Trip</span>.
                </div>
              ) : (
                <div className="grid gap-4">
                  {computedRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      isSelected={route.id === selectedRouteId}
                      isCheapest={route.id === cheapestRouteId}
                      isFastest={route.id === fastestRouteId}
                      isMostEfficient={route.id === mostEfficientRouteId}
                      darkMode={darkMode}
                      onSelect={() => setSelectedRouteId(route.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <CostSummary
              tripData={appliedTripData || tripData}
              selectedSummary={selectedSummary}
              cheapestRoute={
                hasCalculated
                  ? computedRoutes.find((route) => route.id === cheapestRouteId) ||
                    null
                  : null
              }
              darkMode={darkMode}
              hasCalculated={hasCalculated}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;