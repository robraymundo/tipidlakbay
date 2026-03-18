const vehicleOptions = [
  { label: "Motorcycle", value: "Motorcycle", defaultEfficiency: 35 },
  { label: "Sedan", value: "Sedan", defaultEfficiency: 14 },
  { label: "SUV", value: "SUV", defaultEfficiency: 10 },
  { label: "Van", value: "Van", defaultEfficiency: 8 },
];

function TripForm({ tripData, setTripData, darkMode }) {
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setTripData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVehicleChange = (event) => {
    const selectedVehicle = vehicleOptions.find(
      (vehicle) => vehicle.value === event.target.value
    );

    setTripData((prev) => ({
      ...prev,
      vehicleType: event.target.value,
      fuelEfficiency:
        prev.fuelEfficiency && Number(prev.fuelEfficiency) > 0
          ? prev.fuelEfficiency
          : selectedVehicle.defaultEfficiency.toString(),
    }));
  };

  const inputClass = `w-full rounded-xl border px-4 py-3 outline-none transition ${
    darkMode
      ? "border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-slate-500"
      : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-500"
  }`;

  return (
    <section
      className={`rounded-2xl p-5 shadow-sm ring-1 ${
        darkMode ? "bg-slate-900 ring-slate-800" : "bg-white ring-slate-200"
      }`}
    >
      <h2 className="mb-4 text-xl font-semibold">Trip Details</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Origin</label>
          <input
            type="text"
            name="origin"
            value={tripData.origin}
            onChange={handleChange}
            placeholder="e.g. Quezon City"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Destination</label>
          <input
            type="text"
            name="destination"
            value={tripData.destination}
            onChange={handleChange}
            placeholder="e.g. Tagaytay"
            className={inputClass}
          />
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

        <div>
          <label className="mb-1 block text-sm font-medium">Toll Fee (₱)</label>
          <input
            type="number"
            name="tollFee"
            value={tripData.tollFee}
            onChange={handleChange}
            placeholder="e.g. 120"
            min="0"
            step="0.01"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Parking Fee (₱)
          </label>
          <input
            type="number"
            name="parkingFee"
            value={tripData.parkingFee}
            onChange={handleChange}
            placeholder="e.g. 50"
            min="0"
            step="0.01"
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
              darkMode ? "bg-slate-800" : "bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              name="roundTrip"
              checked={tripData.roundTrip}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Compute as round trip
          </label>
        </div>
      </div>
    </section>
  );
}

export default TripForm;