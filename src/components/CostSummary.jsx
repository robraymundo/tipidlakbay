function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function CostSummary({
  tripData,
  selectedSummary,
  cheapestRoute,
  darkMode,
  hasCalculated,
  loading,
}) {
  if (!hasCalculated) {
    return (
      <section
        className={`min-h-[190px] rounded-2xl p-4 shadow-sm ring-1 transition-all duration-300 ${
          darkMode ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
        }`}
      >
        <h2 className="mb-3 text-lg font-semibold">Trip Summary</h2>
        <div
          className={`rounded-xl p-4 text-sm ${
            darkMode
              ? "bg-slate-800 text-slate-300"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          Your trip summary will appear after you calculate the trip.
        </div>
      </section>
    );
  }

  return (
    <section
      className={`min-h-[190px] rounded-2xl p-4 shadow-sm ring-1 transition-all duration-300 ${
        darkMode ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Trip Summary</h2>

        {loading && (
          <span
            className={`text-xs ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Updating summary...
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div
          className={`rounded-xl p-3 ${
            darkMode ? "bg-slate-800" : "bg-slate-50"
          }`}
        >
          <p
            className={
              darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"
            }
          >
            Recommended Route
          </p>
          <p className="mt-1 text-base font-semibold">
            {cheapestRoute?.name || "N/A"}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div
            className={`rounded-xl border p-3 ${
              darkMode
                ? "border-emerald-800 bg-emerald-950/40"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <p
              className={
                darkMode
                  ? "text-sm text-emerald-300"
                  : "text-sm text-emerald-700"
              }
            >
              Total Cost
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatPeso(selectedSummary?.totalCost || 0)}
            </p>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              darkMode
                ? "border-amber-800 bg-amber-950/40"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p
              className={
                darkMode ? "text-sm text-amber-300" : "text-sm text-amber-700"
              }
            >
              Fuel Needed
            </p>
            <p className="mt-1 text-lg font-semibold">
              {selectedSummary?.litersNeeded?.toFixed(2)} L
            </p>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              darkMode
                ? "border-blue-800 bg-blue-950/40"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <p
              className={
                darkMode ? "text-sm text-blue-300" : "text-sm text-blue-700"
              }
            >
              Total Distance
            </p>
            <p className="mt-1 text-lg font-semibold">
              {selectedSummary?.totalDistance?.toFixed(1)} km
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl p-3 text-sm ${
            darkMode ? "bg-slate-950/40 text-slate-300" : "bg-slate-50 text-slate-600"
          }`}
        >
          This estimate is based on route distance, fuel price, and vehicle fuel
          efficiency.
          {tripData.roundTrip ? " Round-trip mode is enabled." : ""}
        </div>
      </div>
    </section>
  );
}

export default CostSummary;