/**
 * Device Helper Utilities
 * Generates and persists unique device identification and detects device metadata.
 */

export function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    }
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

export function getDeviceName() {
  const ua = navigator.userAgent || '';
  let os = 'Unknown Device';
  let browser = 'Browser';

  // Detect OS / Device
  if (/android/i.test(ua)) {
    const match = ua.match(/;\s*([^;]+)\s+Build\//i);
    if (match && match[1]) {
      os = match[1].trim();
    } else {
      os = 'Android Device';
    }
  } else if (/iphone/i.test(ua)) {
    os = 'iPhone';
  } else if (/ipad/i.test(ua)) {
    os = 'iPad';
  } else if (/windows/i.test(ua)) {
    os = 'Windows PC';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'Mac';
  } else if (/linux/i.test(ua)) {
    os = 'Linux Device';
  }

  // Detect Browser
  if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  }

  return `${os} (${browser})`;
}

/**
 * High-accuracy reverse geocoding:
 * 1. Checks Google Maps Client-side Geocoder in browser
 * 2. Checks Google Maps Geocoding Web API
 * 3. Falls back to OpenStreetMap Nominatim
 * 4. Falls back to BigDataCloud
 */
export async function reverseGeocode(latitude, longitude) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC9-50lwsUipQ9txoB9OoRnJd8HeCNXzrI';

  // 1. Try Google Maps JavaScript Geocoder in browser (if loaded)
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve) => {
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            resolve(null);
          }
        });
      });
      if (response) return response;
    } catch (e) {
      console.warn("Client Google Geocoder notice:", e?.message);
    }
  }

  // 2. Try Google Geocoding REST endpoint
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results && data.results[0]) {
          return data.results[0].formatted_address;
        }
      }
    } catch (e) {}
  }

  // 3. Fallback: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { 
        signal: controller.signal, 
        headers: { 
          'Accept-Language': 'en',
          'User-Agent': 'NavbharatFieldTracker/1.0'
        } 
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const landmark = addr.attraction || addr.amenity || addr.historic || addr.road || addr.hamlet;
        const village = addr.village || addr.suburb || addr.neighbourhood || addr.town || addr.city;
        const district = addr.county || addr.state_district;
        const state = addr.state;
        const parts = [landmark, village, district, state].filter(Boolean);
        const unique = [...new Set(parts)];
        if (unique.length > 0) return unique.join(', ');
      }
      if (data && data.display_name) {
        const parts = data.display_name.split(',').map(s => s.trim()).slice(0, 3);
        return parts.join(', ');
      }
    }
  } catch (e) {}

  // 4. Fallback: BigDataCloud
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const city = data.locality || data.city || data.principalSubdivision;
      const state = data.principalSubdivision;
      const parts = [city, state, data.countryName].filter(Boolean);
      const unique = [...new Set(parts)];
      if (unique.length > 0) {
        return unique.join(', ');
      }
    }
  } catch (e) {}

  return `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;
}

export async function getCurrentCoordinates() {
  // 1. Try Real Hardware Browser Geolocation with force fresh satellite lock
  const gpsCoords = await new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      () => {
        // Fallback: cellular / Wi-Fi positioning if initial high-accuracy timed out
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
          },
          () => resolve(null),
          { timeout: 6000, enableHighAccuracy: false, maximumAge: 10000 }
        );
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 } // maximumAge: 0 forces fresh GPS acquisition
    );
  });

  if (gpsCoords && gpsCoords.latitude && gpsCoords.longitude) {
    const locName = await reverseGeocode(gpsCoords.latitude, gpsCoords.longitude);
    return {
      latitude: gpsCoords.latitude,
      longitude: gpsCoords.longitude,
      accuracy: gpsCoords.accuracy,
      locationName: locName || `${gpsCoords.latitude.toFixed(5)}, ${gpsCoords.longitude.toFixed(5)}`
    };
  }

  return null;
}

export async function getDeviceBattery() {
  // 1. Purge any stale 69 stored from old simulation formulas
  if (localStorage.getItem('employeeBatteryLevel') === '69') {
    localStorage.removeItem('employeeBatteryLevel');
  }

  // 2. Try real hardware Battery API (Chrome on Windows / Laptops)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
      const bat = await navigator.getBattery();
      if (bat && typeof bat.level === 'number' && !isNaN(bat.level)) {
        const pct = Math.round(bat.level * 100);
        localStorage.setItem('employeeBatteryLevel', pct.toString());
        return pct;
      }
    }
  } catch (err) {
    console.warn("navigator.getBattery error:", err);
  }

  // 3. Check confirmed battery set by employee
  const stored = localStorage.getItem('employeeBatteryLevel');
  if (stored && stored !== '69') {
    const val = parseInt(stored, 10);
    if (!isNaN(val) && val >= 1 && val <= 100) {
      return val;
    }
  }

  return null;
}
