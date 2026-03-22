import { useEffect, useMemo, useRef, useState } from "react";
import { getPlaceSuggestions } from "../services/mapbox";
import {
  vehicleOptions,
  vehicleEfficiencyDatabase,
} from "../utils/vehicleEfficiencyData";

function normalizeVehicleText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDefaultEfficiency(vehicleType) {
  return (
    vehicleOptions.find((vehicle) => vehicle.value === vehicleType)
      ?.defaultEfficiency ?? 14
  );
}

function getExactVehicleMatch(vehicleType, vehicleModel) {
  const normalizedInput = normalizeVehicleText(vehicleModel);
  if (!normalizedInput) return null;

  const candidates = vehicleEfficiencyDatabase[vehicleType] ?? [];

  return (
    candidates.find((candidate) => {
      const normalizedLabel = normalizeVehicleText(candidate.label);
      if (normalizedInput === normalizedLabel) return true;

      return candidate.keywords.some(
        (keyword) => normalizeVehicleText(keyword) === normalizedInput
      );
    }) ?? null
  );
}

function getVehicleSuggestions(vehicleType, vehicleModel) {
  const normalizedInput = normalizeVehicleText(vehicleModel);
  if (!normalizedInput) return [];

  const candidates = vehicleEfficiencyDatabase[vehicleType] ?? [];

  const scoredCandidates = candidates
    .map((candidate) => {
      const normalizedLabel = normalizeVehicleText(candidate.label);
      let score = 0;

      if (normalizedLabel.startsWith(normalizedInput)) {
        score = 1000 - normalizedLabel.length;
      } else if (normalizedLabel.includes(normalizedInput)) {
        score = 800 - normalizedLabel.length;
      }

      candidate.keywords.forEach((keyword) => {
        const normalizedKeyword = normalizeVehicleText(keyword);

        if (normalizedKeyword.startsWith(normalizedInput)) {
          score = Math.max(score, 900 - normalizedKeyword.length);
        } else if (normalizedKeyword.includes(normalizedInput)) {
          score = Math.max(score, 700 - normalizedKeyword.length);
        } else {
          const inputTokens = normalizedInput.split(" ");
          const keywordTokens = normalizedKeyword.split(" ");
          const overlap = keywordTokens.filter((token) =>
            inputTokens.some((inputToken) => token.startsWith(inputToken))
          ).length;

          if (overlap > 0) {
            score = Math.max(score, overlap * 100);
          }
        }
      });

      return { ...candidate, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  const uniqueSuggestions = [];
  const seenLabels = new Set();

  scoredCandidates.forEach((candidate) => {
    if (!seenLabels.has(candidate.label)) {
      seenLabels.add(candidate.label);
      uniqueSuggestions.push(candidate);
    }
  });

  return uniqueSuggestions.slice(0, 5);
}

function TripForm({
  tripData,
  setTripData,
  darkMode,
  onCalculate,
  loading,
  embedded = false,
}) {
  const [activeField, setActiveField] = useState(null);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [errors, setErrors] = useState({});

  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const vehicleModelRef = useRef(null);

  const origin = tripData?.origin ?? "";
  const destination = tripData?.destination ?? "";
  const vehicleType = tripData?.vehicleType ?? "car";
  const vehicleModel = tripData?.vehicleModel ?? "";
  const fuelEfficiency =
    tripData?.fuelEfficiency ?? String(getDefaultEfficiency(vehicleType));
  const fuelPrice = tripData?.fuelPrice ?? "";

  const matchedVehicle = useMemo(() => {
    return getExactVehicleMatch(vehicleType, vehicleModel);
  }, [vehicleType, vehicleModel]);

  const validateForm = () => {
    const newErrors = {};

    if (!origin.trim()) {
      newErrors.origin = "Please enter a starting point.";
    }

    if (!destination.trim()) {
      newErrors.destination = "Please enter a destination.";
    }

    if (!fuelEfficiency || Number(fuelEfficiency) <= 0) {
      newErrors.fuelEfficiency = "Please enter a valid fuel efficiency.";
    }

    if (!fuelPrice || Number(fuelPrice) <= 0) {
      newErrors.fuelPrice = "Please enter a valid fuel price.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setTripData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (name === "origin" || name === "destination") {
      setActiveField(name);
    }
  };

  const handleVehicleChange = (event) => {
    const nextVehicleType = event.target.value;
    const selectedVehicle = vehicleOptions.find(
      (vehicle) => vehicle.value === nextVehicleType
    );
    const exactMatch = getExactVehicleMatch(nextVehicleType, vehicleModel);

    setTripData((prev) => ({
      ...prev,
      vehicleType: nextVehicleType,
      fuelEfficiency: String(
        exactMatch?.efficiency ?? selectedVehicle?.defaultEfficiency ?? 14
      ),
    }));

    if (vehicleModel.trim()) {
      setVehicleSuggestions(
        getVehicleSuggestions(nextVehicleType, vehicleModel)
      );
    } else {
      setVehicleSuggestions([]);
    }

    if (errors.fuelEfficiency) {
      setErrors((prev) => ({
        ...prev,
        fuelEfficiency: "",
      }));
    }
  };

  const handleVehicleModelChange = (event) => {
    const value = event.target.value;
    const exactMatch = getExactVehicleMatch(vehicleType, value);
    const nextSuggestions = getVehicleSuggestions(vehicleType, value);

    setTripData((prev) => ({
      ...prev,
      vehicleModel: value,
      fuelEfficiency:
        value.trim().length === 0
          ? String(getDefaultEfficiency(prev?.vehicleType ?? "car"))
          : exactMatch
            ? String(exactMatch.efficiency)
            : prev.fuelEfficiency,
    }));

    setVehicleSuggestions(nextSuggestions);
    setActiveField("vehicleModel");

    if (errors.fuelEfficiency) {
      setErrors((prev) => ({
        ...prev,
        fuelEfficiency: "",
      }));
    }
  };

  const handleVehicleSuggestionClick = (vehicle) => {
    setTripData((prev) => ({
      ...prev,
      vehicleModel: vehicle.label,
      fuelEfficiency: String(vehicle.efficiency),
    }));

    setVehicleSuggestions([]);
    setActiveField(null);

    if (errors.fuelEfficiency) {
      setErrors((prev) => ({
        ...prev,
        fuelEfficiency: "",
      }));
    }
  };

  const clearField = (fieldName) => {
    if (fieldName === "vehicleModel") {
      setTripData((prev) => ({
        ...prev,
        vehicleModel: "",
        fuelEfficiency: String(getDefaultEfficiency(prev?.vehicleType ?? "car")),
      }));
      setVehicleSuggestions([]);
      setActiveField(null);
    } else {
      setTripData((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }

    if (fieldName === "origin" || fieldName === "destination") {
      setPlaceSuggestions([]);
      setActiveField(fieldName);
    }

    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }
  };

  const handlePlaceSuggestionClick = (fieldName, placeName) => {
    setTripData((prev) => ({
      ...prev,
      [fieldName]: placeName,
    }));
    setPlaceSuggestions([]);
    setActiveField(null);

    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    await onCalculate();
  };

  useEffect(() => {
    const currentValue =
      activeField === "origin"
        ? origin
        : activeField === "destination"
          ? destination
          : "";

    if (
      (activeField !== "origin" && activeField !== "destination") ||
      currentValue.trim().length < 2
    ) {
      setPlaceSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);
        const results = await getPlaceSuggestions(currentValue);
        setPlaceSuggestions(results);
      } catch (error) {
        console.error(error);
        setPlaceSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [origin, destination, activeField]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideOrigin =
        originRef.current && !originRef.current.contains(event.target);

      const clickedOutsideDestination =
        destinationRef.current &&
        !destinationRef.current.contains(event.target);

      const clickedOutsideVehicleModel =
        vehicleModelRef.current &&
        !vehicleModelRef.current.contains(event.target);

      if (clickedOutsideOrigin && clickedOutsideDestination) {
        setPlaceSuggestions([]);
      }

      if (clickedOutsideVehicleModel) {
        setVehicleSuggestions([]);
      }

      if (
        clickedOutsideOrigin &&
        clickedOutsideDestination &&
        clickedOutsideVehicleModel
      ) {
        setActiveField(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const baseInputClass =
  "w-full min-h-[46px] rounded-lg border px-3.5 py-2.5 text-base leading-normal outline-none transition md:text-[15px]";

  const defaultInputClass = darkMode
    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-slate-500"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-500";

  const errorInputClass = "border-red-500 focus:border-red-500";

  const getInputClass = (fieldName, extra = "") =>
    `${baseInputClass} ${
      errors[fieldName] ? errorInputClass : defaultInputClass
    } ${extra}`;

  const dropdownClass = `absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border shadow-lg ${
    darkMode
      ? "border-slate-700 bg-slate-900"
      : "border-slate-200 bg-white"
  }`;

  const dropdownItemClass = `w-full px-3.5 py-2.5 text-left text-sm transition ${
    darkMode
      ? "text-slate-200 hover:bg-slate-800"
      : "text-slate-700 hover:bg-slate-50"
  }`;

  const errorTextClass = "mt-1 text-xs text-red-500";
  const labelClass = "mb-1 block text-[13px] font-semibold";

  const clearButtonClass = `absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition ${
    darkMode
      ? "text-slate-200 hover:bg-slate-700 hover:text-white"
      : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
  }`;

  const matchedTextClass = darkMode
    ? "mt-1 text-xs text-emerald-300"
    : "mt-1 text-xs text-emerald-700";

  const mutedTextClass = darkMode ? "text-slate-400" : "text-slate-500";

  const formContent = (
    <>
      {!embedded && <h2 className="mb-3 text-lg font-semibold">Trip Details</h2>}

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <div ref={originRef} className="relative md:col-span-2">
          <label className={labelClass}>Starting Point</label>

          <div className="relative">
            <input
              type="text"
              name="origin"
              value={origin}
              onChange={handleChange}
              onFocus={() => setActiveField("origin")}
              placeholder="e.g. Ilagan, Isabela"
              className={getInputClass("origin", "pr-10")}
              autoComplete="off"
            />

            {origin && (
              <button
                type="button"
                onClick={() => clearField("origin")}
                className={clearButtonClass}
                aria-label="Clear origin"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {errors.origin && <p className={errorTextClass}>{errors.origin}</p>}

          {activeField === "origin" &&
            (placeSuggestions.length > 0 || isFetchingSuggestions) && (
              <div className={dropdownClass}>
                {isFetchingSuggestions ? (
                  <div className={dropdownItemClass}>Searching places...</div>
                ) : (
                  placeSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      className={dropdownItemClass}
                      onClick={() =>
                        handlePlaceSuggestionClick("origin", place.name)
                      }
                    >
                      {place.name}
                    </button>
                  ))
                )}
              </div>
            )}
        </div>

        <div ref={destinationRef} className="relative md:col-span-2">
          <label className={labelClass}>Destination</label>

          <div className="relative">
            <input
              type="text"
              name="destination"
              value={destination}
              onChange={handleChange}
              onFocus={() => setActiveField("destination")}
              placeholder="e.g. Tuguegarao City, Cagayan"
              className={getInputClass("destination", "pr-10")}
              autoComplete="off"
            />

            {destination && (
              <button
                type="button"
                onClick={() => clearField("destination")}
                className={clearButtonClass}
                aria-label="Clear destination"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {errors.destination && (
            <p className={errorTextClass}>{errors.destination}</p>
          )}

          {activeField === "destination" &&
            (placeSuggestions.length > 0 || isFetchingSuggestions) && (
              <div className={dropdownClass}>
                {isFetchingSuggestions ? (
                  <div className={dropdownItemClass}>Searching places...</div>
                ) : (
                  placeSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      className={dropdownItemClass}
                      onClick={() =>
                        handlePlaceSuggestionClick("destination", place.name)
                      }
                    >
                      {place.name}
                    </button>
                  ))
                )}
              </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <div>
            <label className={labelClass}>Vehicle Type</label>
            <select
              name="vehicleType"
              value={vehicleType}
              onChange={handleVehicleChange}
              className={getInputClass("vehicleType")}
            >
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.value} value={vehicle.value}>
                  {vehicle.label}
                </option>
              ))}
            </select>
          </div>

          <div ref={vehicleModelRef} className="relative">
            <label className={labelClass}>Model</label>

            <div className="relative">
              <input
                type="text"
                name="vehicleModel"
                value={vehicleModel}
                onChange={handleVehicleModelChange}
                onFocus={() => {
                  setActiveField("vehicleModel");
                  if (vehicleModel.trim()) {
                    setVehicleSuggestions(
                      getVehicleSuggestions(vehicleType, vehicleModel)
                    );
                  }
                }}
                placeholder="e.g. Vios"
                className={getInputClass("vehicleModel", "pr-10")}
                autoComplete="off"
              />

              {vehicleModel && (
                <button
                  type="button"
                  onClick={() => clearField("vehicleModel")}
                  className={clearButtonClass}
                  aria-label="Clear vehicle model"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>

            {activeField === "vehicleModel" &&
              vehicleModel.trim() &&
              !matchedVehicle &&
              vehicleSuggestions.length > 0 && (
                <div className={dropdownClass}>
                  {vehicleSuggestions.map((vehicle) => (
                    <button
                      key={`${vehicle.label}-${vehicle.efficiency}`}
                      type="button"
                      className={dropdownItemClass}
                      onClick={() => handleVehicleSuggestionClick(vehicle)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{vehicle.label}</span>
                        <span className={`text-xs ${mutedTextClass}`}>
                          {vehicle.efficiency} km/L
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Fuel Efficiency (km/L)</label>

          <div className="relative">
            <input
              type="number"
              name="fuelEfficiency"
              value={fuelEfficiency}
              onChange={handleChange}
              placeholder="e.g. 14"
              min="1"
              step="0.1"
              className={getInputClass("fuelEfficiency", "pr-10")}
            />

            {fuelEfficiency && (
              <button
                type="button"
                onClick={() => clearField("fuelEfficiency")}
                className={clearButtonClass}
                aria-label="Clear fuel efficiency"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {errors.fuelEfficiency && (
            <p className={errorTextClass}>{errors.fuelEfficiency}</p>
          )}

          {matchedVehicle && (
            <p className={matchedTextClass}>
              Estimated {matchedVehicle.efficiency} km/L based on{" "}
              {matchedVehicle.label}.
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Fuel Price (PHP / L)</label>

          <div className="relative">
            <input
              type="number"
              name="fuelPrice"
              value={fuelPrice}
              onChange={handleChange}
              placeholder="e.g. 65"
              min="0"
              step="0.01"
              className={getInputClass("fuelPrice", "pr-10")}
            />

            {fuelPrice && (
              <button
                type="button"
                onClick={() => clearField("fuelPrice")}
                className={clearButtonClass}
                aria-label="Clear fuel price"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {errors.fuelPrice && (
            <p className={errorTextClass}>{errors.fuelPrice}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className={`mt-2 flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${
              darkMode
                ? "bg-red-700 text-white hover:bg-red-900"
                : "bg-red-700 text-white hover:bg-red-900"
            }`}
          >
            <span className="inline-flex min-w-[120px] items-center justify-center gap-2">
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {loading ? "Calculating..." : "Calculate Trip"}
            </span>
          </button>
        </div>
      </form>
    </>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <section
      className={`rounded-2xl p-4 shadow-sm ring-1 ${
        darkMode ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      }`}
    >
      {formContent}
    </section>
  );
}

export default TripForm;