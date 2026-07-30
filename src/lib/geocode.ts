// Google Geocoding API wrapper
// Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local

const API_KEY = typeof window !== 'undefined'
  ? (window as any).__env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  : process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null;

  const key = API_KEY;

  if (!key) {
    console.warn('[geocode] GOOGLE_MAPS_API_KEY not configured, falling back to Nominatim');
    return geocodeWithNominatim(address);
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    if (data.status === 'ZERO_RESULTS') return null;
    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
      console.warn('[geocode] Google Geocoding API error:', data.status, data.error_message);
      return geocodeWithNominatim(address);
    }

    return null;
  } catch (err) {
    console.warn('[geocode] Google Geocoding API failed, falling back to Nominatim', err);
    return geocodeWithNominatim(address);
  }
}

// Graceful fallback to Nominatim (OpenStreetMap)
async function geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'ProtLife/1.0 (personal life app)' } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
