import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getEmployeeOrderBookings,
  getEmployeePendingOrders,
  getEmployeeDeliveredOrders,
  getEmployeeCancelledOrders,
  sendLocation,
  logoutEmployee,
  startTrip,
  stopTrip,
  getEmployee
} from '../services/api';
import { reverseGeocode, getDeviceBattery } from '../utils/deviceHelper';
import BottomNav from '../components/BottomNav';
import DesktopSidebar from '../components/DesktopSidebar';

const PRESET_LOCATIONS = [
  { name: 'Nesari', lat: 16.0682, lng: 74.3315, address: 'Sarsenapati Prataprao Gujar Chowk, Nesari, Maharashtra' },
  { name: 'Gadhinglaj', lat: 16.2268, lng: 74.3496, address: 'Gadhinglaj City, Maharashtra' },
  { name: 'Chandgad', lat: 15.9328, lng: 74.3949, address: 'Chandgad, Maharashtra' },
  { name: 'Ajara', lat: 16.1172, lng: 74.2045, address: 'Ajara, Maharashtra' },
  { name: 'Kolhapur', lat: 16.7050, lng: 74.2433, address: 'Kolhapur City, Maharashtra' },
  { name: 'Kagal', lat: 16.5772, lng: 74.3168, address: 'Kagal, Maharashtra' },
];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, cancelled: 0 });

  // Trip tracking state
  const [tripStatus, setTripStatus] = useState(() => localStorage.getItem('tripStatus') || 'Not Started');
  const [tripStartTime, setTripStartTime] = useState(() => localStorage.getItem('tripStartTime') || null);
  const [todayTravelledMeters, setTodayTravelledMeters] = useState(0);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [tripLoading, setTripLoading] = useState(false);
  const [completedTripModal, setCompletedTripModal] = useState({
    isOpen: false,
    duration: '',
    tripKm: '0.00',
    totalKm: '0.00'
  });

  // Real battery state
  const [batteryLevel, setBatteryLevel] = useState(() => {
    const stored = localStorage.getItem('employeeBatteryLevel');
    if (stored && stored !== '69') {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val >= 1 && val <= 100) return val;
    }
    return null;
  });
  const [batteryModalOpen, setBatteryModalOpen] = useState(false);
  const [customBatteryInput, setCustomBatteryInput] = useState('');

  // Location search modal
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Live GPS state
  const [gpsStatus, setGpsStatus] = useState({
    latitude: parseFloat(localStorage.getItem('employeeLastLatitude') || '0') || null,
    longitude: parseFloat(localStorage.getItem('employeeLastLongitude') || '0') || null,
    address: localStorage.getItem('employeeLastAddress') || '',
    accuracy: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real GPS acquisition using hardware satellite chip
  const handleRefreshGps = useCallback(async () => {
    setGpsStatus(prev => ({ ...prev, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setGpsStatus(prev => ({ ...prev, loading: false, error: 'Geolocation is not supported by your browser.' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        let locName = await reverseGeocode(lat, lng);
        const address = locName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        setGpsStatus({
          latitude: lat,
          longitude: lng,
          address: address,
          accuracy: acc,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });

        localStorage.setItem('employeeLastLatitude', lat.toString());
        localStorage.setItem('employeeLastLongitude', lng.toString());
        localStorage.setItem('employeeLastAddress', address);

        const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
        if (empId) {
          const payload = {
            employeeId: parseInt(empId, 10),
            latitude: lat,
            longitude: lng,
            address: address,
            locationName: address,
            timestamp: new Date().toISOString()
          };
          const curBat = await getDeviceBattery();
          if (curBat !== null) {
            payload.batteryLevel = curBat;
            setBatteryLevel(curBat);
          } else if (batteryLevel !== null) {
            payload.batteryLevel = batteryLevel;
          }
          sendLocation(payload).catch(() => {});
        }

        showToast(`✓ Exact GPS synced: ${address}`);
      },
      (err) => {
        console.warn("GPS acquire error:", err);
        let msg = "Could not get GPS fix. Tap 'Change Area' to set manually.";
        if (err.code === 1) msg = "Location permission denied. Tap 'Change Area' to pick your location.";
        else if (err.code === 2) msg = "GPS satellites unavailable. Tap 'Change Area' to select location.";
        else if (err.code === 3) msg = "GPS request timed out. Please try refreshing again.";
        setGpsStatus(prev => ({ ...prev, loading: false, error: msg }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [batteryLevel]);

  // Handle setting location manually (by quick preset or search)
  const handleSetLocation = async (preset) => {
    let lat = preset?.lat;
    let lng = preset?.lng;
    let address = preset?.address || preset?.name;

    if (!lat || !lng) {
      if (!customLocationInput.trim()) return;
      setSearchingLocation(true);
      try {
        const query = encodeURIComponent(customLocationInput.trim() + ', Maharashtra, India');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
          headers: { 'User-Agent': 'NavbharatFieldTracker/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
          address = data[0].display_name.split(',').slice(0, 3).join(', ').trim();
        } else {
          showToast(`Location "${customLocationInput}" not found.`);
          setSearchingLocation(false);
          return;
        }
      } catch (e) {
        showToast("Search failed. Please try a preset below.");
        setSearchingLocation(false);
        return;
      }
      setSearchingLocation(false);
    }

    setGpsStatus({
      latitude: lat,
      longitude: lng,
      address: address,
      accuracy: 10,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });

    localStorage.setItem('employeeLastLatitude', lat.toString());
    localStorage.setItem('employeeLastLongitude', lng.toString());
    localStorage.setItem('employeeLastAddress', address);

    const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (empId) {
      const payload = {
        employeeId: parseInt(empId, 10),
        latitude: lat,
        longitude: lng,
        address: address,
        locationName: address,
        timestamp: new Date().toISOString()
      };
      const curBat = await getDeviceBattery();
      if (curBat !== null) payload.batteryLevel = curBat;
      else if (batteryLevel !== null) payload.batteryLevel = batteryLevel;
      sendLocation(payload).catch(() => {});
    }

    showToast(`✓ Location updated: ${address}`);
    setLocationModalOpen(false);
  };

  // Start Trip Tracking
  const handleStartTracking = async () => {
    const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (!empId) return;

    setTripLoading(true);
    try {
      const nowIso = new Date().toISOString();
      // Record starting meter mark for this specific trip segment
      localStorage.setItem('tripStartDistanceMeters', (todayTravelledMeters || 0).toString());

      const res = await startTrip(parseInt(empId, 10), 'FIELD_TRACKING');

      setTripStatus('Started');
      setTripStartTime(nowIso);
      localStorage.setItem('tripStatus', 'Started');
      localStorage.setItem('tripStartTime', nowIso);

      if (res?.todayTravelledDistance !== undefined) {
        setTodayTravelledMeters(res.todayTravelledDistance);
      }

      // Trigger background tracking immediate refresh
      window.dispatchEvent(new CustomEvent('tripStatusChanged'));

      // Send immediate starting GPS ping
      handleRefreshGps();

      showToast("🚀 Tracking Started! GPS route is recording in the background.");
    } catch (err) {
      console.error("Failed to start trip", err);
      showToast("âš ï¸ Could not start tracking. Please check connection.");
    } finally {
      setTripLoading(false);
    }
  };

  // Stop Trip Tracking
  const handleStopTracking = async () => {
    const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (!empId) return;

    setTripLoading(true);
    try {
      // Send final location ping before stopping
      if (gpsStatus.latitude && gpsStatus.longitude) {
        try {
          await sendLocation({
            employeeId: parseInt(empId, 10),
            latitude: gpsStatus.latitude,
            longitude: gpsStatus.longitude,
            address: gpsStatus.address,
            batteryLevel: batteryLevel,
            timestamp: new Date().toISOString()
          });
        } catch (e) {}
      }

      const res = await stopTrip(parseInt(empId, 10));

      const finalTotalMeters = res?.todayTravelledDistance ?? todayTravelledMeters;
      const startMeters = parseFloat(localStorage.getItem('tripStartDistanceMeters') || '0');
      const segmentMeters = Math.max(0, finalTotalMeters - startMeters);
      const segmentKm = (segmentMeters / 1000).toFixed(2);
      const totalKm = (finalTotalMeters / 1000).toFixed(2);

      const capturedDuration = elapsedTime;
      setTripStatus('Stopped');
      localStorage.setItem('tripStatus', 'Stopped');
      localStorage.removeItem('tripStartTime');
      localStorage.removeItem('tripStartDistanceMeters');

      if (res?.todayTravelledDistance !== undefined) {
        setTodayTravelledMeters(res.todayTravelledDistance);
      }

      // Trigger background tracking to stop watchPosition
      window.dispatchEvent(new CustomEvent('tripStatusChanged'));

      // Open Trip Summary dialog
      setCompletedTripModal({
        isOpen: true,
        duration: capturedDuration && capturedDuration !== '00:00:00' ? capturedDuration : 'Trip completed',
        tripKm: segmentKm,
        totalKm: totalKm
      });
      showToast(`â¹ï¸ Trip Stopped! Added: ${segmentKm} km | Total today: ${totalKm} km`);
    } catch (err) {
      console.error("Failed to stop trip", err);
      showToast("âš ï¸ Could not stop tracking. Please try again.");
    } finally {
      setTripLoading(false);
    }
  };

  // Handle setting real phone battery percentage
  const handleConfirmBattery = (val) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 100) {
      setBatteryLevel(num);
      localStorage.setItem('employeeBatteryLevel', num.toString());
      localStorage.setItem('employeeBatteryTimestamp', Date.now().toString());

      const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
      if (empId) {
        sendLocation({
          employeeId: parseInt(empId, 10),
          latitude: gpsStatus.latitude || undefined,
          longitude: gpsStatus.longitude || undefined,
          address: gpsStatus.address || undefined,
          locationName: gpsStatus.address || undefined,
          batteryLevel: num,
          timestamp: new Date().toISOString()
        }).catch(() => {});
      }

      showToast(`✓ Battery synced: ${num}%`);
      setBatteryModalOpen(false);
    }
  };

  // Elapsed Timer when trip is active
  useEffect(() => {
    if (tripStatus !== 'Started' || !tripStartTime) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateTimer = () => {
      const start = new Date(tripStartTime.endsWith('Z') ? tripStartTime : tripStartTime + 'Z').getTime();
      if (isNaN(start)) return;
      const diff = Math.max(0, Date.now() - start);
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tripStatus, tripStartTime]);

  // Load employee profile & orders on mount
  useEffect(() => {
    const name = localStorage.getItem('employeeName') || localStorage.getItem('rememberedEmployeeName');
    const employeeId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (!name || !employeeId) {
      navigate('/welcome');
      return;
    }

    setEmployeeName(name);

    // 1. Fetch live employee profile for trip status & today's distance
    const fetchEmployeeDetails = async () => {
      try {
        const emp = await getEmployee(employeeId);
        if (emp) {
          if (emp.tripStatus) {
            setTripStatus(emp.tripStatus);
            localStorage.setItem('tripStatus', emp.tripStatus);
          }
          if (emp.tripStartTime) {
            setTripStartTime(emp.tripStartTime);
            localStorage.setItem('tripStartTime', emp.tripStartTime);
          }
          if (emp.todayTravelledDistance !== undefined) {
            setTodayTravelledMeters(emp.todayTravelledDistance);
          }
          if (emp.lastKnownAddress) {
            setGpsStatus(prev => ({
              ...prev,
              address: prev.address || emp.lastKnownAddress,
              latitude: prev.latitude || emp.lastLatitude,
              longitude: prev.longitude || emp.lastLongitude
            }));
          }
        }
      } catch (e) {
        console.warn("Failed to fetch employee details", e);
      }
    };
    fetchEmployeeDetails();

    // 2. Auto-detect real hardware battery (e.g. laptop 57%)
    getDeviceBattery().then(pct => {
      if (pct !== null) {
        setBatteryLevel(pct);
        const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
        if (empId) {
          sendLocation({
            employeeId: parseInt(empId, 10),
            batteryLevel: pct,
            timestamp: new Date().toISOString()
          }).catch(() => {});
        }
      }
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.getBattery) {
        navigator.getBattery().then(bat => {
          const onLevelChange = () => {
            const pct = Math.round(bat.level * 100);
            setBatteryLevel(pct);
            localStorage.setItem('employeeBatteryLevel', pct.toString());
            const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
            if (empId) {
              sendLocation({
                employeeId: parseInt(empId, 10),
                batteryLevel: pct,
                timestamp: new Date().toISOString()
              }).catch(() => {});
            }
          };
          bat.addEventListener('levelchange', onLevelChange);
        }).catch(() => {});
      }
    } catch (e) {}

    // 3. Fetch order stats
    const fetchStats = async () => {
      try {
        const [total, pending, delivered, cancelled] = await Promise.all([
          getEmployeeOrderBookings(employeeId),
          getEmployeePendingOrders(employeeId),
          getEmployeeDeliveredOrders(employeeId),
          getEmployeeCancelledOrders(employeeId)
        ]);
        setStats({
          total: total.length,
          pending: pending.length,
          delivered: delivered.length,
          cancelled: cancelled.length
        });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();

    // 4. Acquire live GPS
    handleRefreshGps();
  }, [navigate, handleRefreshGps]);

  // Periodic distance refresh during active trip
  useEffect(() => {
    if (tripStatus !== 'Started') return;
    const employeeId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (!employeeId) return;

    const interval = setInterval(async () => {
      try {
        const emp = await getEmployee(employeeId);
        if (emp && emp.todayTravelledDistance !== undefined) {
          setTodayTravelledMeters(emp.todayTravelledDistance);
        }
      } catch (e) {}
    }, 15000);

    return () => clearInterval(interval);
  }, [tripStatus]);

  // Format today's date
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const handleLogout = async () => {
    const empId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (empId) {
      try {
        await sendLocation({
          employeeId: parseInt(empId, 10),
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        });
      } catch (err) {
        console.error("Failed to send offline ping", err);
      }
      try {
        const rToken = localStorage.getItem('refreshToken');
        await logoutEmployee({ employeeId: parseInt(empId, 10), refreshToken: rToken || '' });
      } catch (e) {}
    }

    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tripStatus');
    localStorage.removeItem('tripStartTime');
    localStorage.removeItem('userRole');
    localStorage.removeItem('employeeRoute');
    localStorage.removeItem('rememberedEmployeeName');
    localStorage.removeItem('rememberedEmployeeId');
    navigate('/welcome');
  };

  const isTripActive = tripStatus === 'Started';
  const todayKm = (todayTravelledMeters / 1000).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:pl-64 transition-all">
      {/* Desktop Sidebar Navigation */}
      <DesktopSidebar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 border border-white/20 animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Professional Header Section */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-8 sm:py-10 px-6 sm:px-10 lg:px-12 rounded-b-[2.5rem] shadow-xl shadow-blue-900/15 relative">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 lg:gap-10 relative">

          {/* Top-Right Action Row (Battery Chip + Universal Logout) */}
          <div className="absolute right-0 top-0 z-10 flex items-center gap-2">
            <button
              onClick={() => {
                setCustomBatteryInput(batteryLevel != null ? batteryLevel.toString() : "");
                setBatteryModalOpen(true);
              }}
              title="Click to adjust current phone battery %"
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/30 text-white text-xs font-bold bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-md active:scale-95"
            >
              <span>🔋</span>
              <span>{batteryLevel != null ? `${batteryLevel}%` : 'Set %'}</span>
              <span className="text-[10px] text-blue-200">âœŽ</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl border border-white/30 text-white text-xs font-medium bg-white/10 hover:bg-white/20 hover:border-red-300 hover:text-red-200 transition-all duration-200 cursor-pointer backdrop-blur-md active:scale-95 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/80 group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          {/* Left Side: Date, Greeting, Subtitle */}
          <div className="space-y-1.5 max-w-lg pr-32 md:pr-0">
            <p className="text-xs sm:text-sm font-medium text-blue-200/90 tracking-wide uppercase">{today}</p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Welcome, {employeeName ? employeeName.replace(/\s+Employee$/i, '').trim() : 'Employee'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-blue-100/90 font-medium pt-0.5">
              Field tracking, visit logging, and order management.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {isTripActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300 text-[11px] font-black text-emerald-100 backdrop-blur-xs animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                  Trip Tracking Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-medium text-blue-100 backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                  Tracking Idle (Ready to Start)
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div className="w-full md:w-auto self-stretch md:self-end mt-4 md:mt-0">
            <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2.5 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => navigate('/order-bookings')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 text-[13px] sm:text-sm font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white backdrop-blur-md px-2.5 sm:px-6 py-3 rounded-2xl shadow-lg shadow-emerald-950/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 cursor-pointer border border-white/30 min-h-[46px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="truncate">New Order</span>
              </button>

              <button
                onClick={() => navigate('/field-visits')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 text-[13px] sm:text-sm font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white backdrop-blur-md px-2.5 sm:px-6 py-3 rounded-2xl shadow-lg shadow-indigo-950/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 cursor-pointer border border-white/30 min-h-[46px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="truncate">New Field Visit</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8 space-y-6">

        {/* ============================================================== */}
        {/* START TRACKING & STOP TRACKING CONTROL CENTER (REQUESTED)      */}
        {/* ============================================================== */}
        <section className={`rounded-3xl p-5 sm:p-7 shadow-lg transition-all duration-300 border ${
          isTripActive 
            ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white border-emerald-400/30 shadow-emerald-950/20' 
            : 'bg-white text-slate-800 border-slate-200/90 shadow-slate-200/60'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            
            {/* Left Status & Trip Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                {isTripActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/25 border border-emerald-300 text-emerald-200 text-xs font-black tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    LIVE GPS TRACKING ACTIVE
                  </span>
                ) : (todayTravelledMeters || 0) > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    READY FOR NEXT TRIP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 uppercase">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    TRACKING IDLE
                  </span>
                )}
                
                {isTripActive && (
                  <span className="font-mono text-xs font-bold bg-black/30 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30">
                    â±ï¸ {elapsedTime}
                  </span>
                )}
              </div>

              <div>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isTripActive ? 'text-white' : 'text-slate-900'}`}>
                  {isTripActive 
                    ? 'Field Trip In Progress' 
                    : (todayTravelledMeters || 0) > 0 
                      ? 'Ready to Start Next Trip' 
                      : 'Ready to Start Travel Tracking'}
                </h2>
                <p className={`text-xs sm:text-sm mt-0.5 ${isTripActive ? 'text-emerald-100/80' : 'text-slate-500'}`}>
                  {isTripActive 
                    ? 'Your GPS travel distance and route are actively being recorded and calculated.' 
                    : (todayTravelledMeters || 0) > 0
                      ? 'Your next trip will add to today\'s cumulative distance. You can start and stop multiple times today.'
                      : 'Tap Start Tracking before you travel. You can start and stop multiple times today.'}
                </p>
              </div>

              {/* Today's Distance Meter */}
              <div className="flex items-center gap-4 pt-1">
                <div className={`flex items-baseline gap-1.5 ${isTripActive ? 'text-emerald-200' : 'text-slate-700'}`}>
                  <span className="text-xs uppercase font-bold tracking-wider opacity-75">Today's Distance:</span>
                  <span className={`text-2xl sm:text-3xl font-black ${isTripActive ? 'text-white' : 'text-emerald-600'}`}>
                    {todayKm} km
                  </span>
                </div>

                {tripStartTime && isTripActive && (
                  <div className="text-[11px] text-emerald-200/80 border-l border-white/20 pl-3">
                    Started at: {new Date(tripStartTime.endsWith('Z') ? tripStartTime : tripStartTime + 'Z').toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Big Prominent Action Button (Start Tracking / Stop Tracking) */}
            <div className="sm:self-center">
              {isTripActive ? (
                <button
                  onClick={handleStopTracking}
                  disabled={tripLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm sm:text-base shadow-xl shadow-red-950/30 active:scale-[0.98] transition-all cursor-pointer border border-red-300/40 min-h-[52px]"
                >
                  <span className="text-xl">â¹ï¸</span>
                  <span>{tripLoading ? 'Stopping...' : 'Stop Tracking'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartTracking}
                  disabled={tripLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/20 active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/40 min-h-[52px]"
                >
                  <span className="text-xl">🚀</span>
                  <span>
                    {tripLoading 
                      ? 'Starting...' 
                      : (todayTravelledMeters || 0) > 0 
                        ? 'Start Next Trip' 
                        : 'Start Tracking'}
                  </span>
                </button>
              )}
            </div>

          </div>
        </section>

        {/* Statistics Grid Section (2x2 on Mobile/Tablet, 4-Column Row on Laptop/Desktop) */}
        <section className="w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-6 w-full">

            {/* Card 1: Total Orders */}
            <div className="bg-white rounded-2xl sm:rounded-[22px] border border-slate-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.97] transition-all duration-300 p-3.5 sm:p-6 flex flex-col items-center justify-between text-center group select-none min-h-[160px] sm:min-h-[200px] lg:min-h-[220px] w-full">
              <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 sm:mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-500 tracking-wider uppercase">Total Orders</h3>
              <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-1 sm:my-2">{stats.total}</p>
              <span className="text-[10px] sm:text-xs font-medium text-slate-400">All Time</span>
            </div>

            {/* Card 2: Pending Orders */}
            <button
              onClick={() => navigate('/pending-orders')}
              className="bg-white rounded-2xl sm:rounded-[22px] border border-slate-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.97] transition-all duration-300 p-3.5 sm:p-6 flex flex-col items-center justify-between text-center group cursor-pointer select-none min-h-[160px] sm:min-h-[200px] lg:min-h-[220px] w-full"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 sm:mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-500 tracking-wider uppercase">Pending Orders</h3>
              <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-1 sm:my-2">{stats.pending}</p>
              <span className="text-[10px] sm:text-xs font-medium text-amber-600 group-hover:underline">Awaiting Delivery</span>
            </button>

            {/* Card 3: Delivered Orders */}
            <button
              onClick={() => navigate('/delivered-orders')}
              className="bg-white rounded-2xl sm:rounded-[22px] border border-slate-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.97] transition-all duration-300 p-3.5 sm:p-6 flex flex-col items-center justify-between text-center group cursor-pointer select-none min-h-[160px] sm:min-h-[200px] lg:min-h-[220px] w-full"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 sm:mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-500 tracking-wider uppercase">Delivered Orders</h3>
              <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-1 sm:my-2">{stats.delivered}</p>
              <span className="text-[10px] sm:text-xs font-medium text-emerald-600 group-hover:underline">Completed</span>
            </button>

            {/* Card 4: Cancelled Orders */}
            <button
              onClick={() => navigate('/cancelled-orders')}
              className="bg-white rounded-2xl sm:rounded-[22px] border border-slate-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.97] transition-all duration-300 p-3.5 sm:p-6 flex flex-col items-center justify-between text-center group cursor-pointer select-none min-h-[160px] sm:min-h-[200px] lg:min-h-[220px] w-full"
            >
              <div className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1.5 sm:mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[10px] sm:text-xs lg:text-xs font-bold text-slate-500 tracking-wider uppercase">Cancelled Orders</h3>
              <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight my-1 sm:my-2">{stats.cancelled}</p>
              <span className="text-[10px] sm:text-xs font-medium text-red-500 group-hover:underline">Cancelled</span>
            </button>

          </div>
        </section>

      </main>

      {/* Location Selection Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📍</span>
                <span>Select Current Area</span>
              </h3>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                âœ•
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pick your current operational area or type any village/chowk. This syncs to the Admin live tracking map.
            </p>

            {/* Quick Area Presets */}
            <div className="grid grid-cols-2 gap-2">
              {PRESET_LOCATIONS.map(loc => (
                <button
                  key={loc.name}
                  onClick={() => handleSetLocation(loc)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    gpsStatus.address?.toLowerCase().includes(loc.name.toLowerCase())
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">{loc.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{loc.address}</p>
                </button>
              ))}
            </div>

            {/* Custom Search Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                placeholder="Or type village / town..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSetLocation(null)}
                disabled={searchingLocation}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                {searchingLocation ? 'Searching...' : 'Set'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battery Adjustment Modal */}
      {batteryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scale-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🔋</span>
                <span>Set Phone Battery %</span>
              </h3>
              <button
                onClick={() => setBatteryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                âœ•
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select or enter your phone's current battery percentage. This syncs live to the Admin tracking view.
            </p>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[100, 90, 80, 75, 70, 60, 50, 40].map(pct => (
                <button
                  key={pct}
                  onClick={() => handleConfirmBattery(pct)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    batteryLevel === pct 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="number"
                min="1"
                max="100"
                value={customBatteryInput}
                onChange={(e) => setCustomBatteryInput(e.target.value)}
                placeholder="Custom %"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleConfirmBattery(customBatteryInput)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Completed Summary Modal */}
      {completedTripModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-scale-up space-y-5 text-center">
            
            {/* Top Icon */}
            <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-inner ring-8 ring-emerald-50">
              ðŸ
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Trip Stopped & Recorded!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Your GPS travel route and distance have been saved to your daily log and the admin panel.
              </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">This Trip</p>
                <p className="text-2xl font-black text-slate-800 mt-1">
                  +{completedTripModal.tripKm} <span className="text-xs font-semibold text-slate-500">km</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">â±ï¸ {completedTripModal.duration}</p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Today's Total</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {completedTripModal.totalKm} <span className="text-xs font-semibold text-emerald-600">km</span>
                </p>
                <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">Cumulative Daily</p>
              </div>
            </div>

            {/* Multi-Trip Info Banner */}
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 text-left flex items-start gap-2.5">
              <span className="text-base shrink-0">💡</span>
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                Traveling to another visit or customer? Tap <strong>Start Next Trip</strong> anytime today to continue tracking.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={() => {
                  setCompletedTripModal(prev => ({ ...prev, isOpen: false }));
                  handleStartTracking();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🚀</span>
                <span>Start Next Trip</span>
              </button>

              <button
                onClick={() => setCompletedTripModal(prev => ({ ...prev, isOpen: false }))}
                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-8 pb-24 md:pb-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Navbharat Agro Service
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}
