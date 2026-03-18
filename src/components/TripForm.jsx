import { useEffect, useRef, useState } from "react";
import { getPlaceSuggestions } from "../services/mapbox";

const vehicleOptions = [
  { label: "Motorcycle", value: "motorcycle", defaultEfficiency: 35 },
  { label: "Car", value: "car", defaultEfficiency: 14 },
  { label: "SUV", value: "suv", defaultEfficiency: 10 },
  { label: "Truck", value: "truck", defaultEfficiency: 8 },
];

function TripForm({ tripData, setTripData, darkMode, onCalculate, loading }) {
  const [activeField, setActiveField] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [errors, setErrors] = useState({});

  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};

    if (!tripData.origin.trim()) {
      newErrors.origin = "Please enter a starting point.";
    }

    if (!tripData.destination.trim()) {
      newErrors.destination = "Please enter a destination.";
    }

    if (!tripData.fuelEfficiency || Number(tripData.fuelEfficiency) <= 0) {
      newErrors.fuelEfficiency = "Please enter a valid fuel efficiency.";
    }

    if (!tripData.fuelPrice || Number(tripData.fuelPrice) <= 0) {
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
    const selectedVehicle = vehicleOptions.find(
      (vehicle) => vehicle.value === event.target.value
    );

    setTripData((prev) => ({
      ...prev,
      vehicleType: event.target.value,
      fuelEfficiency: selectedVehicle.defaultEfficiency.toString(),
    }));

    if (errors.fuelEfficiency) {
      setErrors((prev) => ({
        ...prev,
        fuelEfficiency: "",
      }));
    }
  };

  const clearField = (fieldName) => {
    setTripData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));

    if (fieldName === "origin" || fieldName === "destination") {
      setSuggestions([]);
      setActiveField(fieldName);
    }

    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }
  };

  const handleSuggestionClick = (fieldName, placeName) => {
    setTripData((prev) => ({
      ...prev,
      [fieldName]: placeName,
    }));
    setSuggestions([]);
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
        ? tripData.origin
        : activeField === "destination"
        ? tripData.destination
        : "";

    if (!activeField || currentValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);
        const results = await getPlaceSuggestions(currentValue);
        setSuggestions(results);
      } catch (error) {
        console.error(error);
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [tripData.origin, tripData.destination, activeField]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideOrigin =
        originRef.current && !originRef.current.contains(event.target);

      const clickedOutsideDestination =
        destinationRef.current &&
        !destinationRef.current.contains(event.target);

      if (clickedOutsideOrigin && clickedOutsideDestination) {
        setSuggestions([]);
        setActiveField(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const baseInputClass =
    "w-full rounded-xl border px-4 py-3 outline-none transition";

  const defaultInputClass = darkMode
    ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-slate-500"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-500";

  const errorInputClass = "border-red-500 focus:border-red-500";

  const getInputClass = (fieldName, extra = "") =>
    `${baseInputClass} ${
      errors[fieldName] ? errorInputClass : defaultInputClass
    } ${extra}`;

  const dropdownClass = `absolute z-20 mt-2 w-full overflow-hidden rounded-xl border shadow-lg ${
    darkMode
      ? "border-slate-700 bg-slate-900"
      : "border-slate-200 bg-white"
  }`;

  const dropdownItemClass = `w-full px-4 py-3 text-left text-sm transition ${
    darkMode
      ? "text-slate-200 hover:bg-slate-800"
      : "text-slate-700 hover:bg-slate-50"
  }`;

  const errorTextClass = "mt-1 text-sm text-red-500";

  return (
    <section
      className={`rounded-2xl p-5 shadow-sm ring-1 ${
        darkMode ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      }`}
    >
      <h2 className="mb-4 text-xl font-semibold">Trip Details</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div ref={originRef} className="relative md:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Starting Point
          </label>

          <div className="relative">
            <input
              type="text"
              name="origin"
              value={tripData.origin}
              onChange={handleChange}
              onFocus={() => setActiveField("origin")}
              placeholder="e.g. Ilagan, Isabela"
              className={getInputClass("origin", "pr-12")}
              autoComplete="off"
            />

            {tripData.origin && (
              <button
                type="button"
                onClick={() => clearField("origin")}
                className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition ${
                  darkMode
                    ? "text-slate-200 hover:bg-slate-700 hover:text-white"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
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
            (suggestions.length > 0 || isFetchingSuggestions) && (
              <div className={dropdownClass}>
                {isFetchingSuggestions ? (
                  <div className={dropdownItemClass}>Searching places...</div>
                ) : (
                  suggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      className={dropdownItemClass}
                      onClick={() => handleSuggestionClick("origin", place.name)}
                    >
                      {place.name}
                    </button>
                  ))
                )}
              </div>
            )}
        </div>

        <div ref={destinationRef} className="relative md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Destination</label>

          <div className="relative">
            <input
              type="text"
              name="destination"
              value={tripData.destination}
              onChange={handleChange}
              onFocus={() => setActiveField("destination")}
              placeholder="e.g. Tuguegarao City, Cagayan"
              className={getInputClass("destination", "pr-12")}
              autoComplete="off"
            />

            {tripData.destination && (
              <button
                type="button"
                onClick={() => clearField("destination")}
                className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition ${
                  darkMode
                    ? "text-slate-200 hover:bg-slate-700 hover:text-white"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
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
            (suggestions.length > 0 || isFetchingSuggestions) && (
              <div className={dropdownClass}>
                {isFetchingSuggestions ? (
                  <div className={dropdownItemClass}>Searching places...</div>
                ) : (
                  suggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      className={dropdownItemClass}
                      onClick={() =>
                        handleSuggestionClick("destination", place.name)
                      }
                    >
                      {place.name}
                    </button>
                  ))
                )}
              </div>
            )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Vehicle Type</label>
          <select
            name="vehicleType"
            value={tripData.vehicleType}
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

        <div>
          <label className="mb-1 block text-sm font-medium">
            Fuel Efficiency (km/L)
          </label>

          <div className="relative">
            <input
              type="number"
              name="fuelEfficiency"
              value={tripData.fuelEfficiency}
              onChange={handleChange}
              placeholder="e.g. 14"
              min="1"
              step="0.1"
              className={getInputClass("fuelEfficiency", "pr-12")}
            />

            {tripData.fuelEfficiency && (
              <button
                type="button"
                onClick={() => clearField("fuelEfficiency")}
                className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition ${
                  darkMode
                    ? "text-slate-200 hover:bg-slate-700 hover:text-white"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
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
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Fuel Price (₱ / L)
          </label>

          <div className="relative">
            <input
              type="number"
              name="fuelPrice"
              value={tripData.fuelPrice}
              onChange={handleChange}
              placeholder="e.g. 65"
              min="0"
              step="0.01"
              className={getInputClass("fuelPrice", "pr-12")}
            />

            {tripData.fuelPrice && (
              <button
                type="button"
                onClick={() => clearField("fuelPrice")}
                className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition ${
                  darkMode
                    ? "text-slate-200 hover:bg-slate-700 hover:text-white"
                    : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
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
            className={`my-5 w-full rounded-xl px-4 py-3 font-semibold transition ${
              darkMode
                ? "bg-white text-slate-900 hover:bg-slate-200 disabled:bg-slate-300"
                : "bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400"
            }`}
          >
            {loading ? "Calculating..." : "Calculate Trip"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default TripForm;