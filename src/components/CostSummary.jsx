function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function CostSummary({ tripData, selectedSummary, cheapestRoute, darkMode }) {
  const isReady =
    Number(tripData.fuelEfficiency) > 0 && Number(tripData.fuelPrice) > 0;

  return (
    <section
      className={`rounded-2xl p-5 shadow-sm ring-1 ${
        darkMode ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      }`}
    >
      <h2 className="mb-4 text-xl font-semibold">Trip Summary</h2>

      {!isReady ? (
        <div
          className={`rounded-xl p-4 text-sm ${
            darkMode
              ? "bg-slate-800 text-slate-300"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          Enter fuel efficiency and fuel price to generate trip cost estimates.
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
            <p className={darkMode ? "text-slate-400 text-sm" : "text-slate-500 text-sm"}>
              Recommended Route
            </p>
            <p className="mt-1 text-lg font-semibold">
              {cheapestRoute?.name || "N/A"}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <p className={darkMode ? "text-slate-400 text-sm" : "text-slate-500 text-sm"}>
                Total Distance
              </p>
              <p className="mt-1 text-lg font-semibold">
                {selectedSummary?.totalDistance.toFixed(1)} km
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <p className={darkMode ? "text-slate-400 text-sm" : "text-slate-500 text-sm"}>
                Fuel Needed
              </p>
              <p className="mt-1 text-lg font-semibold">
                {selectedSummary?.litersNeeded.toFixed(2)} L
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <p className={darkMode ? "text-slate-400 text-sm" : "text-slate-500 text-sm"}>
                Fuel Cost
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatPeso(selectedSummary?.fuelCost || 0)}
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
              <p className={darkMode ? "text-slate-400 text-sm" : "text-slate-500 text-sm"}>
                Estimated Total Cost
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatPeso(selectedSummary?.totalCost || 0)}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            This estimate includes fuel cost, toll fee, and parking fee.
            {tripData.roundTrip ? " Round-trip mode is enabled." : ""}
          </div>
        </div>
      )}
    </section>
  );
}

export default CostSummary;