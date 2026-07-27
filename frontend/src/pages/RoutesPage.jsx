import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import DesktopSidebar from '../components/DesktopSidebar';
import { startTrip, getEmployee } from '../services/api';

export default function RoutesPage() {
  const navigate = useNavigate();

  const loggedEmployee = localStorage.getItem('employeeName') || localStorage.getItem('rememberedEmployeeName') || 'Employee';
  const employeeId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
  const displayEmployeeName = loggedEmployee.replace(/\s+Employee$/i, '').trim();

  // Employee Route Definitions
  const kunalRoutes = [
    { code: 'K001', day: 'Wednesday', path: 'Kumbharwada → Bhogavati → Hasur → Shahuwadi → Digawade → Therwad → Mhalunge → Chore → Kote → Vitthalwadi → Koyarwada → Kumbharwada' },
    { code: 'K002', day: 'Thursday', path: 'Kumbharwada → Minche → Kur → Shirgaon → Margoli → Waghapurwadi → Kut → Kenavade → Patane → Mudal → Bidri → Kumbharwada' },
    { code: 'K003', day: 'Friday', path: 'Kumbharwada → Margoli → Yamakar → Kurundwad → Mhasave → Arale → Nendurkarwadi → Shengaon → Kumbharwada' },
    { code: 'K004', day: 'Monday', path: 'Ku. Walwe → Mu. Nitta → Sarawade → Solankur → Digawade → Borbet → Nathawade → Bhangoli → Kapileshwar → Turumb → Mhalunge → Borawade → Bidri → Ku. Walwe' },
    { code: 'K005', day: 'Tuesday', path: 'Ku. Walwe → Chalobachi Wadi → Ma. Sarawade → Panundre → Radhanagari → Ghotawade → Keloshi → Phejiwade → Kaulav → Bha. Harawade → Hirase → Bhanaje → Tarale → Pendurkarwadi → Baradwadi → Talyachi → Yede → Arjunwada ' },
    { code: 'K006', day: 'Saturday', path: 'Ku. Walwe → Margoli → Waghapur → Madilage → Madilage Budruk → Murud → Chimgaon → Gangapur → Solankur → Pimpalwadi → Ku. Walwe' }
  ];

  const pruthvirajRoutes = [
    { code: 'P001', day: 'Monday', path: 'Nesari → Batakanagle → Mahagaon → Hasurvadi → Halkarni → Terani → Mungurvadi → Hebbal Jal → Bidrewadi → Waghrali' },
    { code: 'P002', day: 'Tuesday', path: 'Kolindre → Sule → Umbarwadi → Harli → Bhadgaon → Gadhinglaj' },
    { code: 'P003', day: 'Wednesday', path: 'Inchnal → Gajargaon → Atyal → Karmbali → Aynapur → Bhadwan → Kadgaon → Wadarge → Bahirewadi' },
    { code: 'P004', day: 'Thursday', path: 'Waghrali → Bidrewadi → Hebbal Jal → Shattyahalli → Salamvadi → Modge → Daddi → Kalvikatti' },
    { code: 'P005', day: 'Friday', path: 'Kandeewadi → Kupe → Saroli → Sambre → Kumari → Yamehatti' },
    { code: 'P006', day: 'Saturday', path: 'Gadhinglaj → Dundge → Nul → Nilji → Hebbal → Khandal' }
  ];

  const defaultRoutes = [
    { code: 'R001', day: 'Monday', path: 'Nagpur → Kapsi → Koradi → Kamptee' },
    { code: 'R002', day: 'Tuesday', path: 'Kamptee → Kanhan → Mouda → Ramtek' },
    { code: 'R003', day: 'Wednesday', path: 'Ramtek → Mansar → Deolapar → Khapa' },
    { code: 'R004', day: 'Thursday', path: 'Khapa → Saoner → Kalameshwar → Nagpur' },
    { code: 'R005', day: 'Friday', path: 'Nagpur → Hingna → Wadi → Butibori' },
    { code: 'R006', day: 'Saturday', path: 'Butibori → Umred → Kuhi → Nagpur' }
  ];

  const getEmployeeRoutes = () => {
    const name = loggedEmployee.toLowerCase();
    if (name.includes('kunal')) return kunalRoutes;
    if (name.includes('pruthviraj') || name.includes('prutivraj')) return pruthvirajRoutes;
    return defaultRoutes;
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Detect today's weekday
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayDay = currentDayName;

  const employeeRoutes = getEmployeeRoutes();

  // Order routes so TODAY is first, followed by 7-day sequence
  const getOrderedRoutes = () => {
    const todayIndex = weekDays.indexOf(todayDay);
    const validTodayIndex = todayIndex !== -1 ? todayIndex : 0;
    const orderedDays = [];
    for (let i = 0; i < weekDays.length; i++) {
      orderedDays.push(weekDays[(validTodayIndex + i) % weekDays.length]);
    }
    return orderedDays.map(day => {
      if (day === 'Sunday') {
        return { code: 'SUN', day: 'Sunday', isWeekend: true };
      }
      return employeeRoutes.find(r => r.day === day);
    }).filter(Boolean);
  };

  const orderedRoutes = getOrderedRoutes();
  const todayRoute = employeeRoutes.find(r => r.day === todayDay) || orderedRoutes[0];

  const isRohit = loggedEmployee.toLowerCase().includes('rohit');

  // Selected route state
  const [selectedCode, setSelectedCode] = useState(isRohit ? '' : (todayRoute?.code || ''));
  
  // Trip status & start modal states
  const [tripStatus, setTripStatus] = useState('Not Started');
  const [tripStartTime, setTripStartTime] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [targetRoute, setTargetRoute] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for Rohit's manual route entry (Current session/day only)
  const [rohitStartLoc, setRohitStartLoc] = useState('');
  const [rohitEndLoc, setRohitEndLoc] = useState('');
  const [rohitFullRoute, setRohitFullRoute] = useState('');
  const [rohitSavedRoute, setRohitSavedRoute] = useState(null);
  const [rohitFeedback, setRohitFeedback] = useState('');

  // Load existing trip status & Rohit session route on mount
  useEffect(() => {
    const savedStatus = localStorage.getItem(`tripStatus_${employeeId}`) || 'Not Started';
    const savedTime = localStorage.getItem(`tripStartTime_${employeeId}`) || '';
    setTripStatus(savedStatus);
    setTripStartTime(savedTime);

    if (isRohit) {
      const sessionRouteStr = sessionStorage.getItem('rohitCustomRoute') || localStorage.getItem('rohitCustomRoute');
      if (sessionRouteStr) {
        try {
          const parsed = JSON.parse(sessionRouteStr);
          setRohitSavedRoute(parsed);
          setRohitStartLoc(parsed.startLoc || '');
          setRohitEndLoc(parsed.endLoc || '');
          setRohitFullRoute(parsed.path || '');
        } catch (e) {
          console.error("Failed to parse custom route", e);
        }
      }
    }

    if (employeeId) {
      getEmployee(employeeId).then(data => {
        if (data && data.tripStatus) {
          setTripStatus(data.tripStatus);
          if (data.tripStartTime) {
            const formatted = new Date(data.tripStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            setTripStartTime(formatted);
          }
        }
      }).catch(err => console.error("Error fetching trip status:", err));
    }
  }, [employeeId, isRohit]);

  // Helper to extract Start → End
  const getStartEndLabel = (pathStr) => {
    if (!pathStr) return '';
    const parts = pathStr.split('→').map(p => p.trim());
    if (parts.length >= 2) {
      return `${parts[0]} → ${parts[parts.length - 1]}`;
    }
    return pathStr;
  };

  const handleCardClick = (route) => {
    setSelectedCode(route.code);
    setTargetRoute(route);
    
    // Do NOT open Start Trip modal if it's Sunday / Weekend
    if (route.isWeekend || route.day === 'Sunday') {
      return;
    }

    // Open confirmation modal if trip is not started
    if (tripStatus !== 'Started') {
      setShowStartModal(true);
    }
  };

  const handleSaveRohitOnly = async (e) => {
    if (e) e.preventDefault();
    if (!rohitStartLoc.trim() || !rohitEndLoc.trim()) {
      alert("Please enter both Start Location and End Location.");
      return;
    }

    const start = rohitStartLoc.trim();
    const end = rohitEndLoc.trim();
    const fullPath = rohitFullRoute.trim() || `${start} → ${end}`;
    const routeLabel = `${start} → ${end}`;

    const customRouteObj = {
      code: 'R-CUSTOM',
      day: todayDay,
      startLoc: start,
      endLoc: end,
      path: fullPath,
      label: routeLabel
    };

    setRohitSavedRoute(customRouteObj);
    sessionStorage.setItem('rohitCustomRoute', JSON.stringify(customRouteObj));
    localStorage.setItem('rohitCustomRoute', JSON.stringify(customRouteObj));
    localStorage.setItem(`rohitCustomRoute_${employeeId}`, JSON.stringify(customRouteObj));
    localStorage.setItem('employeeRoute', routeLabel);
    if (employeeId) localStorage.setItem(`activeRoute_${employeeId}`, routeLabel);
    setSelectedCode('R-CUSTOM');

    if (employeeId) {
      try {
        await saveEmployeeRoute(employeeId, routeLabel);
      } catch (err) {
        console.error("Failed to save route to backend", err);
      }
    }

    setRohitFeedback("Route Saved Successfully! Trip Status: Not Started");
    navigate('/employee-dashboard');
  };

  const handleStartTripRohitDirect = async (e) => {
    if (e) e.preventDefault();
    if (!rohitStartLoc.trim() || !rohitEndLoc.trim()) {
      alert("Please enter both Start Location and End Location before starting the trip.");
      return;
    }

    const start = rohitStartLoc.trim();
    const end = rohitEndLoc.trim();
    const fullPath = rohitFullRoute.trim() || `${start} → ${end}`;
    const routeLabel = `${start} → ${end}`;

    const customRouteObj = {
      code: 'R-CUSTOM',
      day: todayDay,
      startLoc: start,
      endLoc: end,
      path: fullPath,
      label: routeLabel
    };

    setRohitSavedRoute(customRouteObj);
    sessionStorage.setItem('rohitCustomRoute', JSON.stringify(customRouteObj));
    localStorage.setItem('rohitCustomRoute', JSON.stringify(customRouteObj));
    localStorage.setItem(`rohitCustomRoute_${employeeId}`, JSON.stringify(customRouteObj));
    localStorage.setItem('employeeRoute', routeLabel);
    if (employeeId) localStorage.setItem(`activeRoute_${employeeId}`, routeLabel);
    setSelectedCode('R-CUSTOM');

    setIsSubmitting(true);
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    try {
      if (employeeId) {
        await startTrip(employeeId, routeLabel);
      }
      setTripStatus('Started');
      setTripStartTime(nowTimeStr);
      localStorage.setItem(`tripStatus_${employeeId}`, 'Started');
      localStorage.setItem(`tripStartTime_${employeeId}`, nowTimeStr);
      setRohitFeedback(`Trip Started at ${nowTimeStr}!`);
      navigate('/employee-dashboard');
    } catch (err) {
      console.error("Failed to start trip", err);
      setTripStatus('Started');
      setTripStartTime(nowTimeStr);
      localStorage.setItem(`tripStatus_${employeeId}`, 'Started');
      localStorage.setItem(`tripStartTime_${employeeId}`, nowTimeStr);
      setRohitFeedback(`Trip Started at ${nowTimeStr}!`);
      navigate('/employee-dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaterRohitOnly = (e) => {
    if (e) e.preventDefault();
    setRohitFeedback("Route details kept. Trip Status remains Not Started.");
    navigate('/employee-dashboard');
  };

  const handleConfirmStartTrip = async () => {
    setIsSubmitting(true);
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const selectedRouteStr = targetRoute?.path || targetRoute?.code || selectedCode;
    localStorage.setItem('employeeRoute', selectedRouteStr);
    if (employeeId) localStorage.setItem(`activeRoute_${employeeId}`, selectedRouteStr);

    try {
      if (employeeId) {
        await startTrip(employeeId, targetRoute?.code || selectedCode);
      }
      setTripStatus('Started');
      setTripStartTime(nowTimeStr);
      localStorage.setItem(`tripStatus_${employeeId}`, 'Started');
      localStorage.setItem(`tripStartTime_${employeeId}`, nowTimeStr);
      setShowStartModal(false);
      navigate('/employee-dashboard');
    } catch (err) {
      console.error("Failed to record start trip", err);
      // Fallback local update
      setTripStatus('Started');
      setTripStartTime(nowTimeStr);
      localStorage.setItem(`tripStatus_${employeeId}`, 'Started');
      localStorage.setItem(`tripStartTime_${employeeId}`, nowTimeStr);
      setShowStartModal(false);
      navigate('/employee-dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:pl-64 pb-24 md:pb-12 transition-all">
      {/* Desktop Sidebar Navigation */}
      <DesktopSidebar />

      {/* Header Section */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white pt-10 pb-20 px-6 sm:px-10 rounded-b-[2.5rem] shadow-lg shadow-blue-900/15">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-200/90 tracking-wider uppercase">
                {displayEmployeeName}'s Schedule
              </span>
              {tripStatus === 'Started' && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Trip Started {tripStartTime ? `at ${tripStartTime}` : ''}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isRohit ? "Today's Custom Route" : "Assigned Routes"}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
              {isRohit ? "Enter your start location, end location, and route details" : "Select any weekday to view complete village path"}
            </p>
          </div>
          <button
            onClick={() => navigate('/employee-dashboard')}
            className="text-xs sm:text-sm font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-4 py-2.5 rounded-xl transition-all cursor-pointer active:scale-95 border border-white/20"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        
        {/* ROHIT MANUAL ROUTE ENTRY SECTION */}
        {isRohit ? (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 text-left space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <span>✍️ Enter Today's Route</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your manual route details for today's session</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {todayDay}
                </span>
              </div>

              {rohitFeedback && (
                <div className="p-3.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <span>{rohitFeedback}</span>
                  <button onClick={() => setRohitFeedback('')} className="text-blue-500 hover:text-blue-700 font-bold ml-2">✕</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolhapur"
                    value={rohitStartLoc}
                    onChange={(e) => setRohitStartLoc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sangli"
                    value={rohitEndLoc}
                    onChange={(e) => setRohitEndLoc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Complete Route
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Kolhapur → Hatkanangale → Jaysingpur → Sangli"
                  value={rohitFullRoute}
                  onChange={(e) => setRohitFullRoute(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 resize-none"
                />
              </div>

              {/* THREE BUTTONS IN ONE ROW */}
              <div className="flex flex-row items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSaveRohitOnly}
                  className="flex-1 py-3 px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-xs sm:text-sm"
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={handleStartTripRohitDirect}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-1"
                >
                  <span>🚀</span>
                  <span>{isSubmitting ? 'Starting...' : 'Start Trip'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLaterRohitOnly}
                  className="flex-1 py-3 px-3 sm:px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95 text-xs sm:text-sm"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* KUNAL, PRUTHVIRAJ & EXISTING EMPLOYEES AUTOMATIC DAY-WISE ROUTE CARDS */
          <div className="space-y-4">
            {orderedRoutes.map((route) => {
              const isToday = !isRohit && route.day === todayDay;
              const isSelected = route.code === selectedCode;

              if (route.isWeekend || route.day === 'Sunday') {
                return (
                  <div
                    key="SUN"
                    onClick={() => handleCardClick(route)}
                    className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 cursor-pointer select-none text-left relative overflow-hidden ${
                      isSelected
                        ? 'bg-blue-50/80 border-2 border-blue-500 shadow-md'
                        : 'bg-slate-100/90 border border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                          <span>📅</span>
                          <span>Sunday</span>
                        </h3>
                        {isToday ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            TODAY (WEEKEND)
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-slate-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Weekend
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Weekend Message Box */}
                    <div className="bg-white/90 p-4 rounded-xl border border-slate-200 my-1 space-y-1">
                      <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <span>🏖️</span>
                        <span>Today is Weekend</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        No route is assigned for today. Enjoy your day off.
                      </p>
                    </div>
                  </div>
                );
              }

              const startEnd = getStartEndLabel(route.path);

              return (
                <div
                  key={route.code}
                  onClick={() => handleCardClick(route)}
                  className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 cursor-pointer select-none text-left relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl active:-translate-y-1 active:scale-[1.01] active:shadow-xl ${
                    isSelected
                      ? 'bg-blue-50/70 border-2 border-blue-600 shadow-md'
                      : 'bg-white border border-slate-200 hover:border-blue-300 shadow-sm'
                  } ${isToday ? 'animate-subtle-pulse' : ''}`}
                >
                  {/* Header Row */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                        {route.day}
                      </h3>
                      {isToday && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs animate-badge-pulse uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          TODAY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlighted Start → End Route */}
                  <div className="my-2">
                    <div className="text-lg sm:text-xl font-black text-blue-600 tracking-tight leading-snug">
                      📍 {startEnd}
                    </div>
                  </div>

                  {/* Full Route Details */}
                  <div className="mt-3 pt-3 border-t border-slate-100/90">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Full Route:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                      {route.path}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modern Confirmation Modal Dialog */}
      {showStartModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 transform transition-all duration-300 scale-100 text-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <span className="text-2xl">🚀</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
              Start Today's Trip
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium mb-6">
              Would you like to start your trip now?
            </p>

            {/* Selected Route Summary Box */}
            {targetRoute && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-6 text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-blue-600">{targetRoute.day || 'Today'} Route</span>
                  <span className="text-xs font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {targetRoute.code || 'CUSTOM'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  📍 {getStartEndLabel(targetRoute.path)}
                </p>
              </div>
            )}

            {/* Modal Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowStartModal(false);
                  navigate('/employee-dashboard');
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
              >
                Later
              </button>
              <button
                type="button"
                onClick={handleConfirmStartTrip}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? 'Starting...' : 'Start Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}

