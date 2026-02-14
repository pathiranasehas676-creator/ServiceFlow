export interface Coordinates {
    lat: number;
    lng: number;
}

/**
 * Calculates the great-circle distance between two points on a sphere
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
    point1: Coordinates,
    point2: Coordinates
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(point2.lat - point1.lat);
    const dLng = toRad(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.lat)) *
        Math.cos(toRad(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Returns distance in km
}

function toRad(value: number): number {
    return (value * Math.PI) / 180;
}

/**
 * Formats distance for display
 * < 1km: "Xm"
 * >= 1km: "X.Xkm"
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
}
