import { useEffect, useMemo, useRef, useState } from "react";
import TripForm from "./components/TripForm";
import RouteCard from "./components/RouteCard";
import CostSummary from "./components/CostSummary";
import RouteMap from "./components/RouteMap";
import { calculateTripCost } from "./utils/calculateTrip";
import { geocodePlace, getRoutes } from "./services/mapbox";
import { getFuelPriceContext } from "./utils/fuelPrices";
import { Analytics } from "@vercel/analytics/react";

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
  const [resultAnimationKey, setResultAnimationKey] = useState(0);

  const summarySectionRef = useRef(null);

  const [tripData, setTripData] = useState({
    origin: "",
    destination: "",
    vehicleType: "car",
    vehicleModel: "",
    fuelEfficiency: "14",
    fuelPrice: "",
    tollFee: "",
    parkingFee: "",
    roundTrip: false,
  });

  const fuelPriceContext = useMemo(() => {
    return getFuelPriceContext(tripData.origin);
  }, [tripData.origin]);

  const getRecommendedRouteId = (routes, submittedTripData) => {
    if (!routes.length) return null;

    const fuelEfficiency = Number(submittedTripData.fuelEfficiency);
    const fuelPrice = Number(submittedTripData.fuelPrice);
    const tollFee = Number(submittedTripData.tollFee || 0);
    const parkingFee = Number(submittedTripData.parkingFee || 0);

    const routesWithResults = routes.map((route) => ({
      ...route,
      result:
        fuelEfficiency && fuelPrice
          ? calculateTripCost(
              route.distance,
              fuelEfficiency,
              fuelPrice,
              tollFee,
              parkingFee,
              submittedTripData.roundTrip
            )
          : null,
    }));

    const validRoutes = routesWithResults.filter((route) => route.result);

    if (!validRoutes.length) {
      return routes[0]?.id ?? null;
    }

    return validRoutes.reduce((minRoute, currentRoute) =>
      currentRoute.result.totalCost < minRoute.result.totalCost
        ? currentRoute
        : minRoute
    ).id;
  };

  const handleCalculate = async () => {
    try {
      setLoading(true);
      setRouteError("");

      const submittedTripData = { ...tripData };

      const minimumDelay = new Promise((resolve) => setTimeout(resolve, 1000));

      const calculationPromise = (async () => {
        const originCoords = await geocodePlace(submittedTripData.origin);
        const destinationCoords = await geocodePlace(
          submittedTripData.destination
        );

        const fetchedRoutes = await getRoutes(originCoords, destinationCoords);
        const recommendedRouteId = getRecommendedRouteId(
          fetchedRoutes,
          submittedTripData
        );

        return {
          originCoords,
          destinationCoords,
          fetchedRoutes,
          recommendedRouteId,
        };
      })();

      const [, result] = await Promise.all([minimumDelay, calculationPromise]);

      setLiveRoutes(result.fetchedRoutes);
      setMapLocations({
        origin: result.originCoords,
        destination: result.destinationCoords,
      });
      setAppliedTripData(submittedTripData);
      setSelectedRouteId(result.recommendedRouteId);
      setHasCalculated(true);
      setRouteError("");
      setResultAnimationKey((prev) => prev + 1);
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

    return liveRoutes.map((route, index) => ({
      ...route,
      name: route.name || `Route ${String.fromCharCode(65 + index)}`,
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

  const displayRoutes = useMemo(() => {
    return computedRoutes.map((route) => ({
      ...route,
      label:
        route.id === cheapestRouteId
          ? "Recommended Route"
          : "Alternative Route",
    }));
  }, [computedRoutes, cheapestRouteId]);

  useEffect(() => {
    if (!hasCalculated || !displayRoutes.length) {
      setSelectedRouteId(null);
      return;
    }

    const selectedStillExists = displayRoutes.some(
      (route) => route.id === selectedRouteId
    );

    if (!selectedStillExists) {
      setSelectedRouteId(cheapestRouteId ?? displayRoutes[0]?.id ?? null);
    }
  }, [hasCalculated, displayRoutes, cheapestRouteId, selectedRouteId]);

  useEffect(() => {
    if (!hasCalculated || !resultAnimationKey || routeError) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;

    const timeoutId = window.setTimeout(() => {
      summarySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [hasCalculated, resultAnimationKey, routeError]);

  const selectedSummary = useMemo(() => {
    if (!hasCalculated) return null;

    const route = displayRoutes.find((item) => item.id === cheapestRouteId);
    return route?.result || null;
  }, [displayRoutes, cheapestRouteId, hasCalculated]);

  return (
    <>
      <style>
        {`
          @keyframes fadeSlideUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>

      <div
        className={`flex min-h-screen flex-col transition-colors duration-300 ${
          darkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
        }`}
      >
        <header
          className={`sticky top-0 z-50 border-b backdrop-blur ${
            darkMode
              ? "border-slate-800 bg-slate-950 text-white"
              : "border-slate-200 bg-slate-100/85 text-slate-900"
          }`}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="TipidLakbay logo"
                className="h-10 w-10 rounded-lg object-contain md:h-11 md:w-11"
              />

              <div>
                <h1 className="text-xl font-bold md:text-2xl">TipidLakbay</h1>
                <p
                  className={`mt-0.5 text-xs md:text-sm ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Smart trip budgeting in the midst of rising fuel prices.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                darkMode
                  ? "bg-white text-slate-900 hover:bg-slate-200"
                  : "bg-slate-900 text-white hover:bg-slate-700"
              }`}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full">
          <div className="mx-auto w-full max-w-5xl px-4 py-4 md:py-5">
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <section
                className={`rounded-xl p-3.5 shadow-sm ring-1 transition-all duration-300 ${
                  darkMode
                    ? "bg-slate-900 ring-slate-800"
                    : "bg-white ring-slate-200"
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <RouteMap
                      routes={hasCalculated ? displayRoutes : []}
                      originCoords={mapLocations.origin}
                      destinationCoords={mapLocations.destination}
                      selectedRouteId={selectedRouteId}
                      darkMode={darkMode}
                      fuelPriceContext={fuelPriceContext}
                    />
                  </div>

                  <div>
                    <TripForm
                      tripData={tripData}
                      setTripData={setTripData}
                      darkMode={darkMode}
                      onCalculate={handleCalculate}
                      loading={loading}
                      embedded
                    />
                  </div>
                </div>
              </section>

              <div className="space-y-4">
                <div
                  ref={summarySectionRef}
                  className="scroll-mt-20"
                  key={`summary-${resultAnimationKey}`}
                  style={
                    hasCalculated
                      ? {
                          animation: "fadeSlideUp 480ms ease-out 80ms both",
                        }
                      : undefined
                  }
                >
                  <CostSummary
                    tripData={appliedTripData || tripData}
                    selectedSummary={selectedSummary}
                    cheapestRoute={
                      hasCalculated
                        ? displayRoutes.find(
                            (route) => route.id === cheapestRouteId
                          ) || null
                        : null
                    }
                    darkMode={darkMode}
                    hasCalculated={hasCalculated}
                    loading={loading}
                  />
                </div>

                <section
                  className={`h-fit rounded-xl p-3.5 shadow-sm ring-1 transition-all duration-300 ${
                    darkMode
                      ? "bg-slate-900 ring-slate-800"
                      : "bg-white ring-slate-200"
                  }`}
                >
                  {routeError ? (
                    <>
                      <h2 className="mb-2.5 text-base font-semibold md:text-lg">
                        Route Comparison
                      </h2>
                      <div
                        className={`rounded-lg p-3.5 text-sm ${
                          darkMode
                            ? "bg-red-950 text-red-200"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {routeError}
                      </div>
                    </>
                  ) : !hasCalculated ? (
                    <>
                      <h2 className="mb-2.5 text-base font-semibold md:text-lg">
                        Route Comparison
                      </h2>
                      <div
                        className={`rounded-lg p-3.5 text-sm ${
                          darkMode
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        Fill in the trip details and click{" "}
                        <span className="font-semibold">Calculate Trip</span>.
                      </div>
                    </>
                  ) : (
                    <div
                      key={`comparison-${resultAnimationKey}`}
                      style={{
                        animation: "fadeSlideUp 520ms ease-out 260ms both",
                      }}
                    >
                      <h2 className="mb-2.5 text-base font-semibold md:text-lg">
                        Route Comparison
                      </h2>

                      <div className="grid gap-3">
                        {displayRoutes.map((route, index) => (
                          <div
                            key={route.id}
                            style={{
                              animation: `fadeSlideUp 420ms ease-out ${
                                420 + index * 100
                              }ms both`,
                            }}
                          >
                            <RouteCard
                              route={route}
                              isSelected={route.id === selectedRouteId}
                              isCheapest={route.id === cheapestRouteId}
                              isFastest={route.id === fastestRouteId}
                              isMostEfficient={route.id === mostEfficientRouteId}
                              darkMode={darkMode}
                              onSelect={() => setSelectedRouteId(route.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </main>

        <footer
          className={`${
            darkMode
              ? "bg-slate-950 text-slate-400"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <div className="mx-auto mt-6 w-full max-w-5xl px-4">
            <div
              className={`mx-auto w-full max-w-3xl border-t py-4 text-center text-sm ${
                darkMode ? "border-slate-800" : "border-slate-200"
              }`}
            >
              © {new Date().getFullYear()} TipidLakbay
            </div>
          </div>
        </footer>
      </div>
      <Analytics />
    </>
  );
}

export default App;