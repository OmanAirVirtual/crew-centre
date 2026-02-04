/**
 * Calculate earnings for a career PIREP
 * @param {Object} params - Calculation parameters
 * @param {Number} params.baseRate - Base hourly rate (₹/hr)
 * @param {Number} params.multiplier - Aircraft multiplier (e.g., 1.00, 1.15)
 * @param {Number} params.flightTimeHours - Flight hours
 * @param {Number} params.flightTimeMinutes - Flight minutes
 * @param {Number} params.passengers - Number of passengers
 * @param {Number} params.cargoKg - Cargo weight in kg
 * @returns {Object} Earnings breakdown
 */
function calculateEarnings({ baseRate, multiplier, flightTimeHours, flightTimeMinutes, passengers = 0, cargoKg = 0 }) {
    // Convert flight time to decimal hours
    const totalFlightHours = flightTimeHours + (flightTimeMinutes / 60);

    // Calculate base earnings
    const baseEarnings = baseRate * totalFlightHours;

    // Apply multiplier
    const flightEarnings = baseEarnings * multiplier;

    // Calculate payload bonus (simple calculation: ₹1 per passenger + ₹0.1 per kg cargo)
    const passengerBonus = passengers * 1;
    const cargoBonus = cargoKg * 0.1;
    const payloadBonus = passengerBonus + cargoBonus;

    // Calculate gross earnings
    const grossEarnings = flightEarnings + payloadBonus;

    // Calculate deductions (15% tax)
    const deductions = grossEarnings * 0.15;

    // Calculate grand total
    const grandTotal = grossEarnings - deductions;

    return {
        totalFlightHours: Number(totalFlightHours.toFixed(2)),
        baseEarnings: Number(baseEarnings.toFixed(2)),
        flightEarnings: Number(flightEarnings.toFixed(2)),
        payloadBonus: Number(payloadBonus.toFixed(2)),
        grossEarnings: Number(grossEarnings.toFixed(2)),
        deductions: Number(deductions.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
    };
}

module.exports = { calculateEarnings };
