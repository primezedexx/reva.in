// Test Haversine Distance & Coordinate Matching
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm) {
  if (distKm < 0.1) return '< 100 m';
  if (distKm < 1) return `${Math.round(distKm * 1000)} m`;
  if (distKm < 10) return `${distKm.toFixed(1)} km`;
  if (distKm < 100) return `${distKm.toFixed(1)} km`;
  return `${Math.round(distKm)} km`;
}

function resolveStoreCoordinates(b) {
  if (b.latitude && b.longitude && !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude))) {
    return { lat: Number(b.latitude), lng: Number(b.longitude) };
  }
  const text = `${b.name || ''} ${b.address || ''} ${b.area || ''} ${b.city || ''} ${b.slug || ''}`.toLowerCase();
  if (text.includes('gokhiware') || text.includes('vasai east')) return { lat: 19.3919, lng: 72.8397 };
  if (text.includes('vasai')) return { lat: 19.3837, lng: 72.8282 };
  if (text.includes('virar')) return { lat: 19.4674, lng: 72.8041 };
  if (text.includes('andheri')) return { lat: 19.1136, lng: 72.8697 };
  if (text.includes('bandra')) return { lat: 19.0596, lng: 72.8295 };
  if (text.includes('indiranagar')) return { lat: 12.9784, lng: 77.6408 };
  if (text.includes('koramangala')) return { lat: 12.9352, lng: 77.6245 };
  return { lat: 12.9716, lng: 77.5946 };
}

const stores = [
  { name: "Down town bake house cafe", area: "Gokhiware", city: "Mumbai" },
  { name: "Bheem Pujari's Cafe", area: "Indiranagar", city: "Bengaluru" },
  { name: "Third Wave Coffee", area: "Andheri West", city: "Mumbai" },
  { name: "Subko Coffee", area: "Bandra", city: "Mumbai" }
];

console.log("=== Scenario 1: User is in Vasai (19.3837, 72.8282) ===");
const userInVasai = { lat: 19.3837, lng: 72.8282 };
const rankedVasai = stores.map(s => {
  const coords = resolveStoreCoordinates(s);
  const d = calculateDistanceKm(userInVasai.lat, userInVasai.lng, coords.lat, coords.lng);
  return { name: s.name, area: s.area, distance: formatDistance(d), distKm: d };
}).sort((a, b) => a.distKm - b.distKm);
console.log(JSON.stringify(rankedVasai, null, 2));

console.log("\n=== Scenario 2: User is in Indiranagar, Bengaluru (12.9784, 77.6408) ===");
const userInBlr = { lat: 12.9784, lng: 77.6408 };
const rankedBlr = stores.map(s => {
  const coords = resolveStoreCoordinates(s);
  const d = calculateDistanceKm(userInBlr.lat, userInBlr.lng, coords.lat, coords.lng);
  return { name: s.name, area: s.area, distance: formatDistance(d), distKm: d };
}).sort((a, b) => a.distKm - b.distKm);
console.log(JSON.stringify(rankedBlr, null, 2));
