import { useEffect } from 'react';
import { sendLocation } from '../services/api';

export default function BackgroundTracker() {
  useEffect(() => {
    let watchId;
    
    const startTracking = () => {
      const employeeId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
      
      if (!employeeId) return;

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
      if (employeeId && !watchId) {
        startTracking();
      } else if (!employeeId && watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    }, 10000);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything
}
