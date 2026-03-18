export function calculateTripCost(
  routeDistance,
  fuelEfficiency,
  fuelPrice,
  tollFee,
  parkingFee,
  roundTrip
) {
  const multiplier = roundTrip ? 2 : 1;
  const totalDistance = routeDistance * multiplier;
  const litersNeeded = totalDistance / fuelEfficiency;
  const fuelCost = litersNeeded * fuelPrice;
  const extraCosts = Number(tollFee || 0) + Number(parkingFee || 0);
  const totalCost = fuelCost + extraCosts;

  return {
    totalDistance,
    litersNeeded,
    fuelCost,
    totalCost,
  };
}