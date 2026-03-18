function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

function RouteCard({
  route,
  isCheapest,
  isFastest,
  isMostEfficient,
  darkMode,
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        darkMode
          ? "border-slate-700 bg-slate-900"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{route.name}</h3>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
            {route.label}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isCheapest && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              Cheapest
            </span>
          )}
          {isFastest && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              Fastest
            </span>
          )}
          {isMostEfficient && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              Most Efficient
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div className={`rounded-xl p-3 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>Distance</p>
          <p className="mt-1 font-semibold">{route.distance.toFixed(1)} km</p>
        </div>

        <div className={`rounded-xl p-3 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>Estimated Time</p>
          <p className="mt-1 font-semibold">{route.duration} mins</p>
        </div>

        <div className={`rounded-xl p-3 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>Fuel Needed</p>
          <p className="mt-1 font-semibold">
            {route.result ? `${route.result.litersNeeded.toFixed(2)} L` : "--"}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${darkMode ? "bg-slate-800" : "bg-slate-50"}`}>
          <p className={darkMode ? "text-slate-400" : "text-slate-500"}>Estimated Total Cost</p>
          <p className="mt-1 font-semibold">
            {route.result ? formatPeso(route.result.totalCost) : "--"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RouteCard;