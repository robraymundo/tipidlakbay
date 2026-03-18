import { useEffect, useState } from "react";
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

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setTripData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

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
  };

  const handleSuggestionClick = (fieldName, placeName) => {
    setTripData((prev) => ({
      ...prev,
      [fieldName]: placeName,
    }));
    setSuggestions([]);
    setActiveField(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !tripData.origin.trim() ||
      !tripData.destination.trim() ||
      !tripData.fuelEfficiency ||
      !tripData.fuelPrice
    ) {
      alert("Please complete the required fields first.");
      return;
    }

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

  const inputClass = `w-full rounded-xl border px-4 py-3 outline-none transition ${
    darkMode
      ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-slate-500"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
  }`;

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

  const clearField = (fieldName) => {
  setTripData((prev) => ({
    ...prev,
    [fieldName]: "",
  }));
  setSuggestions([]);
  setActiveField(fieldName);
  };
  
  return (
    <section
      className={`rounded-2xl p-5 shadow-sm ring-1 ${
        darkMode ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      }`}
    >
      <h2 className="mb-4 text-xl font-semibold">Trip Details</h2>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="relative md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Starting Point</label>

          <div className="relative">
            <input
              type="text"
              name="origin"
              value={tripData.origin}
              onChange={handleChange}
              onFocus={() => setActiveField("origin")}
              placeholder="e.g. Quezon City"
              className={`${inputClass} pr-14`}
              autoComplete="off"
            />

            {tripData.origin && (
              <button
                type="button"
                onClick={() => clearField("origin")}
                className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition ${
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
                  className="h-5 w-5"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {activeField === "origin" && (suggestions.length > 0 || isFetchingSuggestions) && (
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

        <div className="relative md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Destination</label>

          <div className="relative">
            <input
              type="text"
              name="destination"
              value={tripData.destination}
              onChange={handleChange}
              onFocus={() => setActiveField("destination")}
              placeholder="e.g. Tagaytay"
              className={`${inputClass} pr-14`}
              autoComplete="off"
            />

            {tripData.destination && (
              <button
                type="button"
                onClick={() => clearField("destination")}
                className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition ${
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
                  className="h-5 w-5"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {activeField === "destination" && (suggestions.length > 0 || isFetchingSuggestions) && (
            <div className={dropdownClass}>
              {isFetchingSuggestions ? (
                <div className={dropdownItemClass}>Searching places...</div>
              ) : (
                suggestions.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    className={dropdownItemClass}
                    onClick={() => handleSuggestionClick("destination", place.name)}
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
            className={inputClass}
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
          <input
            type="number"
            name="fuelEfficiency"
            value={tripData.fuelEfficiency}
            onChange={handleChange}
            placeholder="e.g. 14"
            min="1"
            step="0.1"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Fuel Price (₱ / L)
          </label>
          <input
            type="number"
            name="fuelPrice"
            value={tripData.fuelPrice}
            onChange={handleChange}
            placeholder="e.g. 65"
            min="0"
            step="0.01"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl px-4 py-3 font-semibold transition ${
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