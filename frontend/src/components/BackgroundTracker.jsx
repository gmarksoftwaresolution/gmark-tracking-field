import { useEffect } from 'react';
import { sendLocation } from '../services/api';
import { getCurrentCoordinates, getDeviceBattery, reverseGeocode } from '../utils/deviceHelper';

export default function BackgroundTracker() {
  useEffect(() => {
    let watchId = null;
    let heartbeatInterval = null;
    let wakeLock = null;

    const acquireWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && !wakeLock) {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => { wakeLock = null; });
        }
      } catch (e) {}
    };

    const releaseWakeLock = async () => {
      try {
        if (wakeLock) {
          await wakeLock.release();
          wakeLock = null;
        }
      } catch (e) {}
    };

    const shouldTrack = () => {
      // 1. Never track on admin screens or if admin token is present
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const userRole = localStorage.getItem('userRole');
      const pathname = window.location.pathname;
      if (adminToken || userRole === 'admin' || pathname.startsWith('/admin')) {
        return false;
      }

      // 2. Only track if employee is authenticated with a token
      const employeeId = localStorage.getItem('employeeId');
      const employeeToken = localStorage.getItem('employeeToken');
      if (!employeeId || !employeeToken) {
        return false;
      }

      return true;
    };

    const sendPresence = async () => {
      if (!shouldTrack()) return;
      const employeeId = localStorage.getItem('employeeId');
      if (!employeeId) return;

      const data = {
        employeeId: parseInt(employeeId, 10),
        timestamp: new Date().toISOString()
      };

      const level = await getDeviceBattery();
      if (level !== null) data.batteryLevel = level;

      try {
        const coords = await getCurrentCoordinates();
        if (coords && coords.latitude && coords.longitude) {
          data.latitude = coords.latitude;
          data.longitude = coords.longitude;
          data.locationName = coords.locationName;
          data.address = coords.locationName;
          localStorage.setItem('employeeLastLatitude', coords.latitude.toString());
          localStorage.setItem('employeeLastLongitude', coords.longitude.toString());
          if (coords.locationName) localStorage.setItem('employeeLastAddress', coords.locationName);
        }
      } catch (e) {
        console.warn("Coordinate retrieval in background tracker:", e);
      }

      try {
        const res = await sendLocation(data);
        const todayDist = res?.todayTravelledDistance ?? res?.data?.todayTravelledDistance;
        if (todayDist !== undefined) {
          window.dispatchEvent(new CustomEvent('gpsPositionUpdated', {
            detail: { todayTravelledDistance: todayDist }
          }));
        }
      } catch (e) {}
    };

    const syncGpsWatch = () => {
      if (!shouldTrack()) {
        releaseWakeLock();
        if (watchId && 'geolocation' in navigator) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        return;
      }

      const tripStatus = localStorage.getItem('tripStatus');
      
      // Continuous high-accuracy GPS movement tracking for active trips
      if (tripStatus === 'Started' && 'geolocation' in navigator && !watchId) {
        acquireWakeLock();
        let lastReportedLat = null;
        let lastReportedLng = null;
        let lastReportedTime = 0;

        watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            if (!shouldTrack()) {
              releaseWakeLock();
              if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
              }
              return;
            }
            const empId = localStorage.getItem('employeeId');
            if (!empId) return;

            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const now = Date.now();

            // Calculate distance from last reported coordinates (m)
            let distMoved = 0;
            if (lastReportedLat !== null && lastReportedLng !== null) {
              const dLat = (lat - lastReportedLat) * Math.PI / 180;
              const dLng = (lng - lastReportedLng) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lastReportedLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              distMoved = 6371000 * c;
            }

            // Send ping if moved at least 8 meters OR if at least 15 seconds elapsed since last movement ping
            const shouldSend = lastReportedLat === null || distMoved >= 8 || (now - lastReportedTime) >= 15000;
            if (!shouldSend) return;

            lastReportedLat = lat;
            lastReportedLng = lng;
            lastReportedTime = now;

            const data = {
              employeeId: parseInt(empId, 10),
              latitude: lat,
              longitude: lng,
              timestamp: new Date().toISOString()
            };
            const level = await getDeviceBattery();
            if (level !== null) data.batteryLevel = level;

            try {
              const addr = await reverseGeocode(lat, lng);
              if (addr) {
                data.address = addr;
                data.locationName = addr;
                localStorage.setItem('employeeLastAddress', addr);
              }
            } catch (e) {}

            localStorage.setItem('employeeLastLatitude', lat.toString());
            localStorage.setItem('employeeLastLongitude', lng.toString());

            try {
              const res = await sendLocation(data);
              const todayDist = res?.todayTravelledDistance ?? res?.data?.todayTravelledDistance;

              // Broadcast to EmployeeDashboard for live meter
              window.dispatchEvent(new CustomEvent('gpsPositionUpdated', {
                detail: {
                  latitude: lat,
                  longitude: lng,
                  speed: pos.coords.speed,
                  accuracy: pos.coords.accuracy,
                  distanceMoved: distMoved,
                  todayTravelledDistance: todayDist
                }
              }));
            } catch (err) {
              window.dispatchEvent(new CustomEvent('gpsPositionUpdated', {
                detail: {
                  latitude: lat,
                  longitude: lng,
                  speed: pos.coords.speed,
                  accuracy: pos.coords.accuracy,
                  distanceMoved: distMoved
                }
              }));
            }
          },
          (err) => {
            console.warn("Background watchPosition error:", err?.message);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      } else if (tripStatus !== 'Started' && watchId) {
        releaseWakeLock();
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    // Immediate presence ping on boot
    sendPresence();

    // Heartbeat every 25 seconds
    heartbeatInterval = setInterval(sendPresence, 25000);

    // Initial check for trip status
    syncGpsWatch();

    // Listen to custom tripStatusChanged events from EmployeeDashboard
    const handleTripStatusChange = () => {
      syncGpsWatch();
    };
    window.addEventListener('tripStatusChanged', handleTripStatusChange);

    return () => {
      releaseWakeLock();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (watchId && 'geolocation' in navigator) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('tripStatusChanged', handleTripStatusChange);
    };
  }, []);

  return null;
}
