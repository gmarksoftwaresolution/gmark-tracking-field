import { useEffect } from 'react';
import { sendLocation } from '../services/api';

export default function BackgroundTracker() {
  useEffect(() => {
    let watchId;
    
    const startTracking = () => {
      const employeeId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
      
      if (!employeeId) return;

      // Send initial heartbeat so they appear online immediately
      sendLocation({
        employeeId: parseInt(employeeId, 10),
        timestamp: new Date().toISOString()
      }).catch(err => console.error("Initial heartbeat error:", err));

      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const data = {
              employeeId: parseInt(employeeId, 10),
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString()
            };
            sendLocation(data).catch(err => console.error("Background tracking error:", err));
          },
          (error) => {
            console.error("Background tracking geolocation error:", error);
            // Send heartbeat even if location fails so they appear online
            sendLocation({
              employeeId: parseInt(employeeId, 10),
              timestamp: new Date().toISOString()
            }).catch(err => console.error("Heartbeat error:", err));
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
          }
        );
      }
    };

    startTracking();

    // Re-check periodically in case employeeId was added to localStorage after initial load
    const interval = setInterval(() => {
      const employeeId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
      if (employeeId) {
        if (!watchId) {
          startTracking();
        }
        // Send a periodic heartbeat every 60 seconds (interval is 60k ms now) to keep online status
        // if stationary, watchPosition might not fire
        sendLocation({
          employeeId: parseInt(employeeId, 10),
          timestamp: new Date().toISOString()
        }).catch(err => console.error("Heartbeat error:", err));
      } else if (!employeeId && watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    }, 60000); // Check and heartbeat every 60 seconds

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything
}
