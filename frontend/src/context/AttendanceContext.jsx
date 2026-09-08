import { createContext, useContext, useState, useEffect } from 'react';
import { getTodayAttendance, getAttendanceConfig, punchIn, punchOut } from '../services/api';
import CameraModal from '../components/CameraModal';

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const [employeeId, setEmployeeId] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [config, setConfig] = useState({
    officeLatitude: 16.056028,
    officeLongitude: 74.324472,
    attendanceRadiusMeters: 5000000.0,
    maxLocationAccuracyMeters: 5000.0
  });

  const [location, setLocation] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [useTestLocation, setUseTestLocation] = useState(false); // Default false for live GPS location

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [showCamera, setShowCamera] = useState(false);
  const [punchType, setPunchType] = useState('PUNCH_IN'); // PUNCH_IN or PUNCH_OUT

  // Update employeeId from local storage
  useEffect(() => {
    const id = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (id) {
      setEmployeeId(id);
    }
  }, []);

  // Fetch initial data when employeeId changes
  useEffect(() => {
    if (employeeId) {
      loadAttendanceData(employeeId);
    }
  }, [employeeId]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const loadAttendanceData = async (empId = employeeId) => {
    if (!empId) return;
    setLoading(true);
    try {
      const [attData, cfgData] = await Promise.all([
        getTodayAttendance(empId),
        getAttendanceConfig()
      ]);
      setAttendance(attData);
      if (cfgData) setConfig(cfgData);
    } catch (err) {
      console.error("Error loading attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Reverse Geocoding helper via Google API on frontend or fallback
  const fetchAddress = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBgAGSOsOUz82WxRA9X7yyiFts21kgQ2gI";
    if (apiKey) {
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
        const data = await res.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          return data.results[0].formatted_address;
        }
      } catch (e) {
        console.warn("Frontend geocoding fetch error:", e);
      }
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Action triggered when employee taps Punch In / Punch Out round button
  const handlePunchClick = async (targetType) => {
    setMessage({ text: '', type: '' });
    const currentEmpId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (!currentEmpId) {
      showToast("Please log in as an employee first.", "error");
      return;
    }

    const typeToUse = targetType || (attendance?.status === 'PUNCHED_IN' ? 'PUNCH_OUT' : 'PUNCH_IN');
    setPunchType(typeToUse);

    // Checking GPS Location
    if (!navigator.geolocation) {
      showToast("Location permission is required to punch in.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(coords);

        const dist = calculateHaversineDistance(
          coords.latitude,
          coords.longitude,
          config.officeLatitude,
          config.officeLongitude
        );
        const roundedDist = Math.round(dist);
        setDistanceMeters(roundedDist);

        // Validate accuracy
        if (coords.accuracy > config.maxLocationAccuracyMeters && coords.accuracy > 0) {
          showToast(`Unable to determine your location accurately (${Math.round(coords.accuracy)}m). Please move to an open area and try again.`, "error");
          return;
        }

        // Validate Geofence Radius
        if (roundedDist > config.attendanceRadiusMeters) {
          showToast(`You are outside the allowed attendance area. Distance: ${roundedDist}m (Allowed radius: ${config.attendanceRadiusMeters}m).`, "error");
          return;
        }

        // Fetch Address for Camera Overlay
        const address = await fetchAddress(coords.latitude, coords.longitude);
        setLocationAddress(address);

        // Passed Geofence -> DIRECTLY OPEN CAMERA
        setShowCamera(true);
      },
      (err) => {
        console.error("Geolocation error during punch:", err);
        showToast("Location permission is required to punch in.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Automatic submission when photo is captured in camera
  const handlePhotoCaptured = async (photoBase64) => {
    if (!location) {
      showToast("Location unavailable. Please refresh location and try again.", "error");
      return;
    }

    const currentEmpId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    setSubmitting(true);
    try {
      const payload = {
        employeeId: parseInt(currentEmpId),
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        photoBase64: photoBase64
      };

      let result;
      if (punchType === 'PUNCH_IN') {
        result = await punchIn(payload);
        showToast("Punch In Successful!", "success");
      } else {
        result = await punchOut(payload);
        showToast("Punch Out Successful!", "success");
      }

      setAttendance(result);
      setShowCamera(false);
    } catch (err) {
      console.error("Attendance submission error:", err);
      const errMsg = err.response?.data?.message || err.message || "Unable to mark attendance. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        employeeId,
        attendance,
        config,
        location,
        distanceMeters,
        locationAddress,
        useTestLocation,
        setUseTestLocation,
        loading,
        submitting,
        message,
        showCamera,
        setShowCamera,
        punchType,
        handlePunchClick,
        loadAttendanceData,
        showToast
      }}
    >
      {children}

      {/* Global Camera Modal when triggered */}
      {showCamera && (
        <CameraModal
          type={punchType}
          locationAddress={locationAddress}
          onClose={() => setShowCamera(false)}
          onSubmit={handlePhotoCaptured}
          submitting={submitting}
        />
      )}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
