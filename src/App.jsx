import { useMemo, useState } from "react";
import TripForm from "./components/TripForm";
import RouteCard from "./components/RouteCard";
import CostSummary from "./components/CostSummary";
import routes from "./data/routes";
import { calculateTripCost } from "./utils/calculateTrip";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const [tripData, setTripData] = useState({
    origin: "",
    destination: "",
    vehicleType: "Sedan",
    fuelEfficiency: "",
    fuelPrice: "",
    tollFee: "",
    parkingFee: "",
    roundTrip: false,
  });

  const computedRoutes = useMemo(() => {
    const fuelEfficiency = Number(tripData.fuelEfficiency);
    const fuelPrice = Number(tripData.fuelPrice);
    const tollFee = Number(tripData.tollFee || 0);
    const parkingFee = Number(tripData.parkingFee || 0);

    if (!fuelEfficiency || !fuelPrice) {
      return routes.map((route) => ({
        ...route,
        result: null,
      }));
    }

    return routes.map((route) => ({
      ...route,
      result: calculateTripCost(
        route.distance,
        fuelEfficiency,
        fuelPrice,
        tollFee,
        parkingFee,
        tripData.roundTrip
      ),
    }));
  }, [tripData]);

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
    return routes.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    ).id;
  }, []);

  const mostEfficientRouteId = useMemo(() => {
    return routes.reduce((best, current) =>
      current.distance < best.distance ? current : best
    ).id;
  }, []);

  const selectedSummary = useMemo(() => {
    const route = computedRoutes.find((item) => item.id === cheapestRouteId);
    return route?.result || null;
  }, [computedRoutes, cheapestRouteId]);

  return (
    <main
      className={`min-h-screen w-full px-4 py-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">
              TipidLakbay
            </h1>
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
          <TripForm
            tripData={tripData}
            setTripData={setTripData}
            darkMode={darkMode}
          />

          <div className="space-y-6">
            <div
              className={`rounded-2xl p-5 shadow-sm ring-1 ${
                darkMode
                  ? "bg-slate-900 ring-slate-800"
                  : "bg-white ring-slate-200"
              }`}
            >
              <h2 className="mb-4 text-xl font-semibold">Route Comparison</h2>

              <div className="grid gap-4">
                {computedRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isCheapest={route.id === cheapestRouteId}
                    isFastest={route.id === fastestRouteId}
                    isMostEfficient={route.id === mostEfficientRouteId}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            </div>

            <CostSummary
              tripData={tripData}
              selectedSummary={selectedSummary}
              cheapestRoute={
                computedRoutes.find((route) => route.id === cheapestRouteId) ||
                null
              }
              darkMode={darkMode}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;