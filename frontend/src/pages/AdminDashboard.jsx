import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getEmployees,
  getDailyReport,
  getMonthlyReport,
  createEmployee,
  resetEmployeePassword,
  deleteEmployee,
  getCancelledOrders,
  deleteOrderBooking,
  getHistoricalRoute,
  getMonthlyTravelReport,
  approveDeviceChange,
  rejectDeviceChange
} from '../services/api';
import LiveTrackingMap from '../components/LiveTrackingMap';
import DeviceManagement from '../components/DeviceManagement';
import { getPendingDevices } from '../services/api';

const routeCodeMap = {
  // Kunal Routes
  'K001': 'Kumbharwada → Kumbharwada',
  'K002': 'Kumbharwada → Kumbharwada',
  'K003': 'Kumbharwada → Shengaon',
  'K004': 'Ku. Walwe → Ku. Walwe',
  'K005': 'Ku. Walwe → Arjunwada',
  'K006': 'Ku. Walwe → Ku. Walwe',

  // Pruthviraj Routes
  'P001': 'Nesari → Waghrali',
  'P002': 'Kolindre → Gadhinglaj',
  'P003': 'Inchnal → Bahirewadi',
  'P004': 'Waghrali → Kalvikatti',
  'P005': 'Kandeewadi → Yamehatti',
  'P006': 'Gadhinglaj → Khandal',

  // Default Routes
  'R001': 'Nagpur → Kamptee',
  'R002': 'Kamptee → Ramtek',
  'R003': 'Ramtek → Khapa',
  'R004': 'Khapa → Nagpur',
  'R005': 'Nagpur → Butibori',
  'R006': 'Butibori → Nagpur'
};

const getStartEndLabel = (pathStr) => {
  if (!pathStr) return '';
  const parts = pathStr.split('→').map(p => p.trim());
  if (parts.length >= 2) {
    return `${parts[0]} → ${parts[parts.length - 1]}`;
  }
  return pathStr;
};

const formatRouteForDisplay = (rawRoute, empNameClean = '', empId = '') => {
  const nameLower = (empNameClean || '').toLowerCase();

  // Custom route for Rohit
  if (nameLower.includes('rohit')) {
    const rohitRouteStr = localStorage.getItem('rohitCustomRoute') ||
      sessionStorage.getItem('rohitCustomRoute') ||
      localStorage.getItem(`rohitCustomRoute_${empId}`);
    if (rohitRouteStr) {
      try {
        const parsed = JSON.parse(rohitRouteStr);
        if (parsed.label) return getStartEndLabel(parsed.label);
        if (parsed.startLoc && parsed.endLoc) return `${parsed.startLoc} → ${parsed.endLoc}`;
        if (parsed.path) return getStartEndLabel(parsed.path);
      } catch (e) { }
    }
  }

  // If rawRoute matches a known route code (e.g. K001, P001, etc.)
  if (rawRoute && routeCodeMap[rawRoute.trim()]) {
    return routeCodeMap[rawRoute.trim()];
  }

  // If rawRoute already contains '→' (full path or label)
  if (rawRoute && rawRoute.includes('→')) {
    return getStartEndLabel(rawRoute);
  }

  // Fallbacks if rawRoute is empty / unknown
  if (nameLower.includes('kunal')) {
    return 'Kumbharwada → Bidri';
  } else if (nameLower.includes('pruthviraj') || nameLower.includes('prutivraj')) {
    return 'Nesari → Waghrali';
  }

  return (rawRoute && rawRoute !== '--') ? rawRoute : '--';
};

const isTodayDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
  if (isNaN(d.getTime())) return false;
  const todayStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0] === todayStr.split(',')[0];
};

const validatePasswordRules = (pwd, confirmPwd) => {
  if (!pwd) return "Password is required.";
  if (pwd !== confirmPwd) return "Password and Confirm Password must match.";
  if (pwd.length < 8) return "Password must be at least 8 characters long.";
  if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
  if (!/[^a-zA-Z0-9]/.test(pwd)) return "Password must contain at least one special character.";
  return null;
};

export default function AdminDashboard({ initialTab }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [pendingDeviceCount, setPendingDeviceCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await getPendingDevices();
        setPendingDeviceCount(data.length);
      } catch (err) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Tracking states for Employee Status Tab
  const [selectedTrackingEmployee, setSelectedTrackingEmployee] = useState(null);
  const [trackingDate, setTrackingDate] = useState(() => {
    const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const dateObj = new Date(today);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  });
  const [historicalRoute, setHistoricalRoute] = useState(null);

  // Overview Data states
  const [employees, setEmployees] = useState([]);

  // Overview Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reports Data states
  const [dailyReports, setDailyReports] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [monthlyTravelReports, setMonthlyTravelReports] = useState([]);
  const [selectedTravelEmployee, setSelectedTravelEmployee] = useState(null);
  const [selectedTravelMonth, setSelectedTravelMonth] = useState('');
  const [cancelledOrders, setCancelledOrders] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  // Add Employee Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    employeeCode: '',
    mobileNumber: '',
    assignedArea: '',
    password: '',
    confirmPassword: ''
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);
  const [addModalError, setAddModalError] = useState('');
  const [addModalSuccess, setAddModalSuccess] = useState('');

  // Reset Password Modal state
  const [resetModal, setResetModal] = useState({
    show: false,
    employee: null,
    password: '',
    confirmPassword: '',
    error: '',
    success: '',
    submitting: false
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [deviceActionModal, setDeviceActionModal] = useState(null);
  const [actionToast, setActionToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setActionToast({ message, type });
    setTimeout(() => setActionToast(null), 4000);
  };

  const handleApproveDevice = (id) => {
    const emp = employees.find(e => e.id === id);
    setDeviceActionModal({
      type: 'approve',
      id,
      name: emp?.name || 'this employee'
    });
  };

  const handleRejectDevice = (id) => {
    const emp = employees.find(e => e.id === id);
    setDeviceActionModal({
      type: 'reject',
      id,
      name: emp?.name || 'this employee'
    });
  };

  const confirmDeviceAction = async () => {
    if (!deviceActionModal) return;
    const { type, id, name } = deviceActionModal;
    setDeviceActionModal(null);
    try {
      if (type === 'approve') {
        await approveDeviceChange(id);
        showToast(`Device approved for ${name}. Single-device binding active.`, 'success');
      } else {
        await rejectDeviceChange(id);
        showToast(`Device change request rejected for ${name}.`, 'info');
      }
      const data = await getEmployees();
      setEmployees(dedupeEmployees(data));
    } catch (err) {
      showToast(err.response?.data?.message || err.message || `Failed to ${type} device.`, 'error');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAddModalError('');
    setAddModalSuccess('');

    const validationErr = validatePasswordRules(newEmployee.password, newEmployee.confirmPassword);
    if (validationErr) {
      setAddModalError(validationErr);
      return;
    }

    try {
      const id = Math.floor(Math.random() * 1000000);
      await createEmployee({
        id,
        name: newEmployee.name,
        employeeCode: newEmployee.employeeCode,
        mobileNumber: newEmployee.mobileNumber,
        assignedArea: newEmployee.assignedArea,
        password: newEmployee.password,
        confirmPassword: newEmployee.confirmPassword
      }, {
        headers: { 'X-User-Role': 'Admin' }
      });

      setAddModalSuccess('Employee created successfully with password!');
      setTimeout(async () => {
        setShowAddModal(false);
        setNewEmployee({ name: '', employeeCode: '', mobileNumber: '', assignedArea: '', password: '', confirmPassword: '' });
        setAddModalSuccess('');
        setAddModalError('');
        const data = await getEmployees();
        setEmployees(dedupeEmployees(data));
      }, 1500);
    } catch (err) {
      console.error(err);
      setAddModalError(err.response?.data?.message || 'Failed to add employee.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetModal(prev => ({ ...prev, error: '', success: '' }));

    const validationErr = validatePasswordRules(resetModal.password, resetModal.confirmPassword);
    if (validationErr) {
      setResetModal(prev => ({ ...prev, error: validationErr }));
      return;
    }

    setResetModal(prev => ({ ...prev, submitting: true }));

    try {
      await resetEmployeePassword(resetModal.employee.id, {
        password: resetModal.password,
        confirmPassword: resetModal.confirmPassword
      }, {
        headers: { 'X-User-Role': 'Admin' }
      });

      setResetModal(prev => ({ ...prev, success: 'Password reset successfully!', submitting: false }));
      setTimeout(() => {
        setResetModal({ show: false, employee: null, password: '', confirmPassword: '', error: '', success: '', submitting: false });
      }, 1500);
    } catch (err) {
      console.error(err);
      setResetModal(prev => ({
        ...prev,
        submitting: false,
        error: err.response?.data?.message || 'Failed to reset password.'
      }));
    }
  };

  const handleDeleteEmployee = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        const data = await getEmployees();
        setEmployees(dedupeEmployees(data));
      } catch (err) {
        console.error(err);
        alert('Failed to delete employee.');
      }
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this cancelled order?")) {
      try {
        await deleteOrderBooking(orderId);
        setCancelledOrders(cancelledOrders.filter(o => o.id !== orderId));
      } catch (err) {
        console.error("Error deleting order:", err);
        alert("Failed to delete order.");
      }
    }
  };

  useEffect(() => {
    if (!selectedTrackingEmployee || !trackingDate) return;
    const fetchRoute = async () => {
      try {
        const routeData = await getHistoricalRoute(selectedTrackingEmployee.id, trackingDate);
        setHistoricalRoute(routeData);
      } catch (err) {
        console.error("Failed to fetch route for selected employee:", err);
        setHistoricalRoute(null);
      }
    };
    fetchRoute();
  }, [selectedTrackingEmployee, trackingDate]);

  const handleTrackingDateChange = (e) => {
    const newDate = e.target.value;
    if (!newDate) return;
    setTrackingDate(newDate);
    setHistoricalRoute(null); // Clear immediately
  };

  const dedupeEmployees = (dataList) => {
    if (!Array.isArray(dataList)) return [];
    const seen = new Set();
    const uniqueList = [];
    for (const emp of dataList) {
      if (!emp || !emp.name) continue;
      const cleanName = emp.name.replace(/\s+Employee$/i, '').trim();
      const key = cleanName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push({
          ...emp,
          name: cleanName
        });
      }
    }
    return uniqueList;
  };

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(dedupeEmployees(data));
      } catch (err) {
        console.error(err);
        setError('Failed to fetch employees. Ensure backend is running.');
      }
    };
    fetchEmployees();
  }, []);



  // Fetch report data on tab change and periodically every 5 seconds for instant admin updates
  useEffect(() => {
    const fetchTabContent = async () => {
      if (activeTab === 'overview' || activeTab === 'employee-status') {
        try {
          const data = await getEmployees();
          setEmployees(dedupeEmployees(data));
        } catch (err) {
          console.error(err);
        }
      } else if (activeTab === 'daily') {
        try {
          const data = await getDailyReport();
          setDailyReports(data);
        } catch (err) {
          console.error(err);
          setReportError('Failed to fetch daily reports.');
        }
      } else if (activeTab === 'monthly') {
        try {
          const data = await getMonthlyReport();
          setMonthlyReports(data);
        } catch (err) {
          console.error(err);
          setReportError('Failed to fetch monthly reports.');
        }
      } else if (activeTab === 'cancelled') {
        try {
          const data = await getCancelledOrders();
          setCancelledOrders(data);
        } catch (err) {
          console.error(err);
          setReportError('Failed to fetch cancelled orders.');
        }
      } else if (activeTab === 'monthly-travel') {
        try {
          const data = await getMonthlyTravelReport();
          setMonthlyTravelReports(data);
          
          setMonthlyTravelReports((currentData) => {
             // We do this to get latest month without stale state dependency inside interval
             return data;
          });
        } catch (err) {
          console.error(err);
          setReportError('Failed to fetch monthly travel reports.');
        }
      }
    };

    fetchTabContent();
    const interval = setInterval(fetchTabContent, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-blue-600 text-white pt-12 pb-20 px-6 rounded-b-3xl shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-blue-100 font-medium mt-2">Monitor Employee Performance</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem('isAdminLoggedIn'); navigate('/welcome'); }}
            className="flex items-center gap-2 text-sm bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full transition-colors"
          >
            Back to Welcome
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 -mt-10 mb-12 relative z-10">

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mb-8 flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'overview' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'daily' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'monthly' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setActiveTab('monthly-travel')}
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'monthly-travel' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            Monthly Travel
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'cancelled' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            Cancelled Orders
          </button>
          <button
            onClick={() => setActiveTab('employee-status')}
            className={`flex-1 py-4 font-semibold text-center transition-colors ${activeTab === 'employee-status' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            Employee Status
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex-1 py-4 font-semibold text-center transition-colors flex items-center justify-center gap-2 ${activeTab === 'devices' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <span>📱 Devices</span>
            {pendingDeviceCount > 0 && (
              <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                {pendingDeviceCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            {/* Employee Alerts Section removed as requested */}

            {/* Employees Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Select Employee</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Employee
                </button>
              </div>

              {employees.length === 0 && !error && <p className="text-slate-500">Loading employees...</p>}
              {error && <p className="text-red-500">{error}</p>}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {employees.map(emp => {
                  // Append 'Z' to treat the timestamp as UTC
                  const lastLocTime = emp.lastLocationTimestamp ? new Date(emp.lastLocationTimestamp + (emp.lastLocationTimestamp.endsWith('Z') ? '' : 'Z')) : null;
                  const isOnline = lastLocTime ? (new Date() - lastLocTime) < 5 * 60 * 1000 : false;
                  return (
                  <div
                    key={emp.id}
                    className="p-6 rounded-2xl shadow border text-left transition-all duration-300 bg-white text-slate-800 border-slate-200 flex justify-between items-center hover:border-blue-300 hover:shadow-lg relative"
                  >
                    <button
                      onClick={() => navigate(`/admin-dashboard/employee/${emp.id}`)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl bg-blue-100 text-blue-600">
                          {emp.name.charAt(0)}
                        </div>
                        {isOnline ? (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Online (Active recently)"></div>
                        ) : (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-slate-300 border-2 border-white rounded-full shadow-sm" title="Offline (No recent activity)"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg hover:text-blue-600 transition-colors">{emp.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-slate-500">
                            Code: {emp.employeeCode}
                          </p>
                          {isOnline ? (
                             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">ONLINE</span>
                          ) : (
                             <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">OFFLINE</span>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setResetModal({
                            show: true,
                            employee: emp,
                            password: '',
                            confirmPassword: '',
                            error: '',
                            success: '',
                            submitting: false
                          });
                        }}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                        title="Reset Password"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteEmployee(e, emp.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Employee"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>
        )}

        {/* Daily Report Tab */}
        {activeTab === 'daily' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Daily Report</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                Today
              </span>
            </div>

            {reportError && (
              <div className="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                {reportError}
              </div>
            )}

            {reportLoading ? (
              <p className="p-6 text-slate-500">Loading daily report...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-4 font-semibold">Employee Name</th>
                      <th className="p-4 font-semibold">Total Orders</th>
                      <th className="p-4 font-semibold text-amber-600">Pending</th>
                      <th className="p-4 font-semibold text-emerald-600">Delivered</th>
                      <th className="p-4 font-semibold">Total Sales</th>
                      <th className="p-4 font-semibold">Total Quantity</th>
                      <th className="p-4 font-semibold">Products Sold</th>
                      <th className="p-4 font-semibold">Field Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReports.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-4 text-center text-slate-500 border-b border-slate-100">No report data found.</td>
                      </tr>
                    ) : (
                      dailyReports.map(report => (
                        <tr key={report.employeeId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-800">{report.employeeName}</td>
                          <td className="p-4 text-slate-600">{report.totalOrders}</td>
                          <td className="p-4 text-amber-600 font-medium">{report.pendingOrders}</td>
                          <td className="p-4 text-emerald-600 font-medium">{report.deliveredOrders}</td>
                          <td className="p-4 text-slate-800 font-bold">₹{report.totalSales}</td>
                          <td className="p-4 text-blue-600 font-medium">{report.totalQuantitySold}</td>
                          <td className="p-4 text-slate-600 text-xs">{report.productsSold}</td>
                          <td className="p-4 text-slate-600">{report.totalFieldVisits}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Monthly Report Tab */}
        {activeTab === 'monthly' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Monthly Report</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                This Month
              </span>
            </div>

            {reportError && (
              <div className="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                {reportError}
              </div>
            )}

            {reportLoading ? (
              <p className="p-6 text-slate-500">Loading monthly report...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-4 font-semibold">Employee Name</th>
                      <th className="p-4 font-semibold">Total Orders</th>
                      <th className="p-4 font-semibold text-amber-600">Pending</th>
                      <th className="p-4 font-semibold text-emerald-600">Delivered</th>
                      <th className="p-4 font-semibold">Total Sales</th>
                      <th className="p-4 font-semibold">Total Quantity</th>
                      <th className="p-4 font-semibold">Products Sold</th>
                      <th className="p-4 font-semibold">Field Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReports.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-4 text-center text-slate-500 border-b border-slate-100">No report data found.</td>
                      </tr>
                    ) : (
                      monthlyReports.map(report => (
                        <tr key={report.employeeId} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-800">{report.employeeName}</td>
                          <td className="p-4 text-slate-600">{report.totalOrders}</td>
                          <td className="p-4 text-amber-600 font-medium">{report.pendingOrders}</td>
                          <td className="p-4 text-emerald-600 font-medium">{report.deliveredOrders}</td>
                          <td className="p-4 text-slate-800 font-bold">₹{report.totalSales}</td>
                          <td className="p-4 text-blue-600 font-medium">{report.totalQuantitySold}</td>
                          <td className="p-4 text-slate-600 text-xs">{report.productsSold}</td>
                          <td className="p-4 text-slate-600">{report.totalFieldVisits}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Monthly Travel Report Tab */}
        {activeTab === 'monthly-travel' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Monthly Employee Travel Report</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Month:</span>
                {(() => {
                  const allAvailableMonths = Array.from(new Set(monthlyTravelReports.flatMap(r => Object.keys(r.monthlyData || {})))).sort((a,b) => new Date("01 " + b) - new Date("01 " + a));
                  const currentMonth = selectedTravelMonth || (allAvailableMonths.length > 0 ? allAvailableMonths[0] : '');
                  
                  // Initialize default if empty and data exists
                  if (!selectedTravelMonth && currentMonth && monthlyTravelReports.length > 0) {
                      setTimeout(() => setSelectedTravelMonth(currentMonth), 0);
                  }

                  return (
                    <select
                      value={currentMonth}
                      onChange={(e) => setSelectedTravelMonth(e.target.value)}
                      className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                      {allAvailableMonths.length === 0 && <option value="">No Data</option>}
                      {allAvailableMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>
            </div>

            {reportError && (
              <div className="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                {reportError}
              </div>
            )}

            {reportLoading ? (
              <p className="p-6 text-slate-500">Loading monthly travel report...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-4 font-semibold">Employee Name</th>
                      <th className="p-4 font-semibold text-indigo-600">{selectedTravelMonth || 'Selected Month'} KM</th>
                      <th className="p-4 font-semibold text-emerald-600">All-Time KM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyTravelReports.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-4 text-center text-slate-500 border-b border-slate-100">No travel data found.</td>
                      </tr>
                    ) : (
                      monthlyTravelReports.map(report => {
                        const monthData = report.monthlyData[selectedTravelMonth];
                        const monthKm = monthData ? monthData.totalKm : 0;
                        
                        return (
                          <tr key={report.employeeId} className="border-b border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => setSelectedTravelEmployee(report)}>
                            <td className="p-4 font-bold text-slate-800 text-blue-600 hover:underline">{report.employeeName}</td>
                            <td className="p-4 text-slate-600">
                              {monthKm.toFixed(2)} km
                            </td>
                            <td className="p-4 font-bold text-emerald-700">{report.allTimeKm.toFixed(2)} km</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cancelled Orders Tab */}
        {activeTab === 'cancelled' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Cancelled Orders History</h2>
            </div>

            {reportError && (
              <div className="m-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                {reportError}
              </div>
            )}

            {reportLoading ? (
              <p className="p-6 text-slate-500">Loading cancelled orders...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-4 font-semibold">Order ID</th>
                      <th className="p-4 font-semibold">Employee ID</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Village</th>
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Total</th>
                      <th className="p-4 font-semibold text-red-600">Reason</th>
                      <th className="p-4 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelledOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-slate-500 border-b border-slate-100">No cancelled orders found.</td>
                      </tr>
                    ) : (
                      cancelledOrders.map(order => (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-800">{order.id}</td>
                          <td className="p-4 text-slate-600">{order.employeeId}</td>
                          <td className="p-4 text-slate-600">{order.customerName}</td>
                          <td className="p-4 text-slate-600">{order.village || '-'}</td>
                          <td className="p-4 text-slate-600">{order.bookingDate}</td>
                          <td className="p-4 text-slate-800 font-bold">₹{order.grandTotal > 0 ? order.grandTotal : (order.products?.reduce((sum, p) => sum + (p.rowTotal || (p.quantity * p.unitPrice)), 0) || 0)}</td>
                          <td className="p-4 text-red-600 text-xs max-w-xs break-words">{order.cancellationReason || '-'}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete Order"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Employee Status Tab */}
        {activeTab === 'employee-status' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 mb-8 text-left">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
      

                </h2>
                <p className="text-xs text-slate-500 mt-1">Real-time status, route details, and trip tracking for all field staff</p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                Total Staff: {employees.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Employee Name</th>
                    <th className="py-3.5 px-4">Today's Assigned Route</th>
                    <th className="py-3.5 px-4">Trip Start Time</th>
                    <th className="py-3.5 px-4">Trip Stop Time</th>
                    <th className="py-3.5 px-4">Last Ping</th>
                    <th className="py-3.5 px-4">Today's KM</th>
                    <th className="py-3.5 px-4">Battery</th>
                    <th className="py-3.5 px-4 text-center">Tracking & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map(emp => {
                    const empNameClean = emp.name.replace(/\s+Employee$/i, '').trim();
                    const tripIsToday = isTodayDate(emp.tripStartTime);

                    const formattedStartTime = (tripIsToday && emp.tripStartTime)
                      ? new Date(emp.tripStartTime + (emp.tripStartTime.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
                      : '--';

                    const formattedStopTime = (tripIsToday && emp.tripEndTime)
                      ? new Date(emp.tripEndTime + (emp.tripEndTime.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })
                      : '--';

                    // Resolve route for display (e.g. Rohit's manual route or predefined Start -> End route)
                    const routeDisplay = formatRouteForDisplay(emp.selectedRouteCode, empNameClean, emp.id);

                    const lastLocTimeStr = emp.lastLocationTimestamp || emp.lastLocationTime;
                    const lastLocTime = lastLocTimeStr ? new Date(lastLocTimeStr.endsWith('Z') ? lastLocTimeStr : lastLocTimeStr + 'Z') : null;
                    const isEmployeeOnline = lastLocTime && !isNaN(lastLocTime.getTime())
                      ? ((new Date().getTime() - lastLocTime.getTime()) >= -60000 && (new Date().getTime() - lastLocTime.getTime()) < 5 * 60 * 1000)
                      : false;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shadow-xs">
                              {emp.name.charAt(0)}
                            </div>
                            {isEmployeeOnline ? (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-xs" title="Online (Active now)"></div>
                            ) : (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-300 border-2 border-white rounded-full shadow-xs" title="Offline"></div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="leading-tight">{empNameClean}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {isEmployeeOnline ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  ONLINE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                  OFFLINE
                                </span>
                              )}
                              {emp.tripStatus === 'Started' ? (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  🚗 On Trip
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-blue-600">
                          📍 {routeDisplay}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {formattedStartTime}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {formattedStopTime}
                        </td>

                        <td className="py-3.5 px-4">
                          {(() => {
                            const pingTimeStr = emp.lastLocationTimestamp || emp.lastLocationTime;
                            const hasPingToday = isTodayDate(pingTimeStr);
                            const locationAddress = emp.lastKnownAddress;
                            if (hasPingToday && pingTimeStr) {
                              return (
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800 text-xs">
                                    {new Date(pingTimeStr + (pingTimeStr.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </span>
                                  {locationAddress && (
                                    <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1 mt-0.5 truncate max-w-[150px]" title={locationAddress}>
                                      <span className="text-rose-500 text-xs">📍</span>
                                      <span>{locationAddress}</span>
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return <span className="text-slate-400">--</span>;
                          })()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {emp.tripStatus === 'Started' || (tripIsToday && emp.todayTravelledDistance > 0)
                            ? (emp.todayTravelledDistance > 0 ? `${(emp.todayTravelledDistance / 1000).toFixed(2)} km` : '0.00 km')
                            : '--'}
                        </td>

                        <td className="py-3.5 px-4 font-bold">
                          {(() => {
                            const pingTimeStr = emp.lastLocationTimestamp || emp.lastLocationTime;
                            const hasPingToday = isTodayDate(pingTimeStr);
                            const battery = emp.batteryLevel;
                            if (hasPingToday && battery != null) {
                              return (
                                <span className={`px-2 py-1 rounded text-xs font-bold shadow-xs ${battery <= 20 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                  🔋 {battery}%
                                </span>
                              );
                            }
                            return <span className="text-slate-400">--</span>;
                          })()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            {emp.deviceChangeStatus === 'Pending' && (
                              <div className="flex gap-1 flex-col sm:flex-row">
                                <button onClick={() => handleApproveDevice(emp.id)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-1.5 rounded-lg font-bold text-xs transition-colors whitespace-nowrap">
                                  ✓ Approve Device
                                </button>
                                <button onClick={() => handleRejectDevice(emp.id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded-lg font-bold text-xs transition-colors whitespace-nowrap">
                                  ✗ Reject Device
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setSelectedTrackingEmployee(emp);
                                setHistoricalRoute(null);
                                const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
                                const dateObj = new Date(today);
                                setTrackingDate(`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`);
                              }}
                              className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                            >
                              Track
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedTrackingEmployee && (() => {
              const currentTrackingEmployee = employees.find(emp => emp.id === selectedTrackingEmployee.id) || selectedTrackingEmployee;
              const lastLocTimeStr = currentTrackingEmployee.lastLocationTimestamp || currentTrackingEmployee.lastLocationTime;
              const lastLocTime = lastLocTimeStr ? new Date(lastLocTimeStr.endsWith('Z') ? lastLocTimeStr : lastLocTimeStr + 'Z') : null;
              
              const todayStr = (() => {
                const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
                const dateObj = new Date(today);
                return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
              })();
              const isTrackingToday = trackingDate === todayStr;
              
              const isEmployeeOnline = isTrackingToday && lastLocTime && !isNaN(lastLocTime.getTime())
                ? ((new Date().getTime() - lastLocTime.getTime()) >= -60000 && (new Date().getTime() - lastLocTime.getTime()) < 5 * 60 * 1000)
                : false;

              return (
                <div className="flex-1 flex flex-col relative border-t border-slate-200 mt-6 pt-6">
                  {/* Top Bar: Employee Dropdown & Date */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 px-2">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <select 
                        value={currentTrackingEmployee.id}
                        onChange={(e) => {
                          const empId = parseInt(e.target.value, 10);
                          const emp = employees.find(emp => emp.id === empId);
                          if (emp) {
                            setSelectedTrackingEmployee(emp);
                            setHistoricalRoute(null);
                          }
                        }}
                        className="text-sm font-bold border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-3 bg-white"
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      <input 
                        type="date"
                        value={trackingDate}
                        onChange={handleTrackingDateChange}
                        className="text-sm font-bold border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-3 bg-white"
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {isEmployeeOnline ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          ONLINE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedTrackingEmployee(null)}
                      className="bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-red-600 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto"
                    >
                      Close Tracker
                    </button>
                  </div>

                  {/* Summary Bar */}
                  {historicalRoute && (historicalRoute.origin || (historicalRoute.checkpoints && historicalRoute.checkpoints.length > 0)) && (() => {
                    const normalizeTime = (ts) => new Date(ts.replace('Z', ''));
                    const startTs = historicalRoute.gpsPings?.length > 0 ? historicalRoute.gpsPings[0].timestamp : (historicalRoute.origin?.timestamp || (historicalRoute.checkpoints?.length > 0 ? historicalRoute.checkpoints[0].timestamp : null));
                    const destTs = (historicalRoute.gpsPings?.length > 1) ? historicalRoute.gpsPings[historicalRoute.gpsPings.length - 1].timestamp : (historicalRoute.destination?.timestamp || (historicalRoute.checkpoints?.length > 0 ? historicalRoute.checkpoints[historicalRoute.checkpoints.length - 1].timestamp : null));
                    return (
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        <div className="pt-2 md:pt-0">
                          <p className="text-xs text-slate-500 mb-1">Trip Start</p>
                          <p className="font-bold text-slate-800">{startTs ? normalizeTime(startTs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                        </div>
                        <div className="pt-2 md:pt-0">
                          <p className="text-xs text-slate-500 mb-1">Trip End</p>
                          <p className="font-bold text-slate-800">{destTs ? normalizeTime(destTs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
                        </div>
                        <div className="pt-2 md:pt-0">
                          <p className="text-xs text-slate-500 mb-1">Total Distance</p>
                          <p className="font-bold text-slate-800">{historicalRoute.totalDistanceKm?.toFixed(2) || 0} km</p>
                        </div>
                        <div className="pt-2 md:pt-0">
                          <p className="text-xs text-slate-500 mb-1">GPS Pings</p>
                          <p className="font-bold text-slate-800">{historicalRoute.gpsPings?.length || 0}</p>
                        </div>
                        <div className="pt-2 md:pt-0">
                          <p className="text-xs text-slate-500 mb-1">Checkpoints</p>
                          <p className="font-bold text-slate-800">{historicalRoute.checkpoints?.length || 0}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex-1 flex flex-col md:flex-row min-h-[500px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Journey Timeline Sidebar */}
                    <div className="w-full md:w-1/3 max-w-sm bg-slate-50/50 border-r border-slate-100 overflow-y-auto p-4 custom-scrollbar">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 px-2">Journey Timeline</h4>
                      {(!historicalRoute?.origin && (!historicalRoute?.checkpoints || historicalRoute.checkpoints.length === 0)) && (
                        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Live Status</span>
                            {isEmployeeOnline ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ONLINE NOW
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">OFFLINE</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 font-medium block">Current Location:</span>
                            <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                              <span className="text-rose-500">📍</span>
                              <span>{currentTrackingEmployee.lastKnownAddress || (currentTrackingEmployee.assignedArea ? `${currentTrackingEmployee.assignedArea}, Maharashtra` : 'Maharashtra, India')}</span>
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Battery:</span>
                            <span className="font-bold text-slate-800">🔋 {currentTrackingEmployee.batteryLevel != null ? `${currentTrackingEmployee.batteryLevel}%` : '--'}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 italic">
                            Trip is not actively in progress today. Showing live position marker on map.
                          </p>
                        </div>
                      )}
                      {(historicalRoute?.origin || (historicalRoute?.checkpoints && historicalRoute.checkpoints.length > 0)) && (
                        <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        
                        {/* Build Timeline Data */}
                        {(() => {
                          const timeline = [];
                          
                          // Helper to properly handle timestamps
                          const normalizeTime = (ts) => {
                              if (!ts) return new Date();
                              let parsedTs = ts;
                              // If the timestamp doesn't have a Z or an explicit offset, treat as IST (+05:30)
                              if (!parsedTs.match(/Z|[+-]\d{2}:?\d{2}$/)) {
                                  parsedTs += '+05:30';
                              }
                              return new Date(parsedTs);
                          };

                          // 1. START
                          const hasPings = historicalRoute.gpsPings && historicalRoute.gpsPings.length > 0;
                          
                          if (hasPings) {
                              const firstPing = historicalRoute.gpsPings[0];
                              timeline.push({
                                  id: 'origin',
                                  type: 'Start',
                                  name: historicalRoute.origin?.name || 'Trip Started',
                                  timestamp: firstPing.timestamp,
                                  lat: firstPing.latitude || firstPing.lat,
                                  lng: firstPing.longitude || firstPing.lng,
                                  color: 'bg-emerald-500',
                                  textColor: 'text-emerald-700'
                              });
                          } else if (historicalRoute.origin) {
                              timeline.push({
                                  id: 'origin',
                                  type: 'Start',
                                  name: historicalRoute.origin.name || 'Trip Started',
                                  timestamp: historicalRoute.origin.timestamp,
                                  lat: historicalRoute.origin.latitude || historicalRoute.origin.lat,
                                  lng: historicalRoute.origin.longitude || historicalRoute.origin.lng,
                                  color: 'bg-emerald-500',
                                  textColor: 'text-emerald-700'
                              });
                          }

                          // 2. CHECKPOINTS
                          if (historicalRoute.checkpoints && historicalRoute.checkpoints.length > 0) {
                              historicalRoute.checkpoints.forEach((cp, idx) => {
                                  timeline.push({
                                      id: `cp-${idx}`,
                                      type: cp.type === 'FieldVisit' ? 'Field Visit' : 'Order Booking',
                                      name: cp.name || cp.village || 'Checkpoint',
                                      timestamp: cp.timestamp,
                                      lat: cp.latitude || cp.lat,
                                      lng: cp.longitude || cp.lng,
                                      color: cp.type === 'FieldVisit' ? 'bg-purple-500' : 'bg-amber-500',
                                      textColor: cp.type === 'FieldVisit' ? 'text-purple-700' : 'text-amber-700'
                                  });
                              });
                          }

                          // 3. END
                          if (hasPings && historicalRoute.gpsPings.length > 1) {
                              const lastPing = historicalRoute.gpsPings[historicalRoute.gpsPings.length - 1];
                              timeline.push({
                                  id: 'destination',
                                  type: 'End',
                                  name: historicalRoute.destination?.name || 'Last Known Location',
                                  timestamp: lastPing.timestamp,
                                  lat: lastPing.latitude || lastPing.lat,
                                  lng: lastPing.longitude || lastPing.lng,
                                  color: 'bg-rose-500',
                                  textColor: 'text-rose-700'
                              });
                          } else if (historicalRoute.destination) {
                              timeline.push({
                                  id: 'destination',
                                  type: 'End',
                                  name: historicalRoute.destination.name || 'Last Known Location',
                                  timestamp: historicalRoute.destination.timestamp,
                                  lat: historicalRoute.destination.latitude || historicalRoute.destination.lat,
                                  lng: historicalRoute.destination.longitude || historicalRoute.destination.lng,
                                  color: 'bg-rose-500',
                                  textColor: 'text-rose-700'
                              });
                          }

                          // 4. Sort unified timeline chronologically
                          timeline.sort((a, b) => normalizeTime(a.timestamp).getTime() - normalizeTime(b.timestamp).getTime());

                          return timeline.map((item, idx) => (
                            <div key={item.id} className="relative flex items-start gap-4 group">
                              <div className={`absolute -left-6 w-4 h-4 rounded-full border-4 border-white shadow-sm ${item.color} z-10 top-1 transition-transform group-hover:scale-125`}></div>
                              <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <span className={`text-xs font-bold ${item.textColor} uppercase tracking-wider`}>{item.type}</span>
                                  <span className="text-xs font-semibold text-slate-500">
                                    {normalizeTime(item.timestamp).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata'})}
                                  </span>
                                </div>
                                <div className="font-bold text-slate-800 text-sm mb-1">{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.lat?.toFixed(5)}, {item.lng?.toFixed(5)}
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                        
                      </div>
                    )}
                    </div>

                    {/* Map Area */}
                    <div className="flex-1 p-0 relative min-h-[400px]">
                       <LiveTrackingMap 
                          historicalRoute={historicalRoute} 
                          liveLocation={(() => {
                            const hasPingToday = isTrackingToday && lastLocTime && isTodayDate(lastLocTimeStr);
                            const lat = currentTrackingEmployee.lastLatitude || (currentTrackingEmployee.assignedArea?.toLowerCase().includes("nesari") ? 16.0682 : currentTrackingEmployee.assignedArea?.toLowerCase().includes("gadhinglaj") ? 16.2227 : 16.0682);
                            const lng = currentTrackingEmployee.lastLongitude || (currentTrackingEmployee.assignedArea?.toLowerCase().includes("nesari") ? 74.3315 : currentTrackingEmployee.assignedArea?.toLowerCase().includes("gadhinglaj") ? 74.3519 : 74.3315);
                            if (hasPingToday && lat && lng) {
                              return {
                                latitude: lat,
                                longitude: lng,
                                isOnline: isEmployeeOnline,
                                lastSeenTime: lastLocTime
                              };
                            }
                            return null;
                          })()}
                          lastKnownAddress={{
                            address: currentTrackingEmployee.lastKnownAddress || (currentTrackingEmployee.assignedArea ? `${currentTrackingEmployee.assignedArea}, Maharashtra` : "Nesari, Maharashtra, India"),
                            latitude: currentTrackingEmployee.lastLatitude || 16.0682,
                            longitude: currentTrackingEmployee.lastLongitude || 74.3315
                          }}
                          isOnline={isEmployeeOnline}
                        />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <DeviceManagement />
        )}


      {/* In-App Device Action Confirmation Popup */}
      {deviceActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150 relative text-left">
            <button
              onClick={() => setDeviceActionModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-4 pr-6">
              {deviceActionModal.type === 'approve' ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  🛡️
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-xl font-black shrink-0 shadow-inner">
                  ✕
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {deviceActionModal.type === 'approve' ? 'Approve Device Request?' : 'Reject Device Request?'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {deviceActionModal.type === 'approve'
                    ? `Approve new device for ${deviceActionModal.name}? Any previously approved device will be unlinked and logged out.`
                    : `Reject device change request for ${deviceActionModal.name}?`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeviceActionModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {deviceActionModal.type === 'approve' ? (
                <button
                  type="button"
                  onClick={confirmDeviceAction}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  Confirm &amp; Approve
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirmDeviceAction}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                >
                  Confirm Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold ${
            actionToast.type === 'error' ? 'bg-rose-600 text-white' : actionToast.type === 'info' ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'
          }`}>
            <span>{actionToast.type === 'error' ? '⚠️' : actionToast.type === 'info' ? 'ℹ️' : '✓'}</span>
            <span>{actionToast.message}</span>
          </div>
        </div>
      )}
      </main>

      {/* Travel Drilldown Modal */}
      {selectedTravelEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Travel History Details</h3>
                <p className="text-sm text-indigo-700 font-semibold mt-1">{selectedTravelEmployee.employeeName}</p>
              </div>
              <button onClick={() => setSelectedTravelEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {Object.keys(selectedTravelEmployee.monthlyData || {}).length === 0 ? (
                <p className="text-slate-500 text-center py-4">No detailed daily data available.</p>
              ) : (
                Object.keys(selectedTravelEmployee.monthlyData).sort((a,b) => new Date("01 " + b) - new Date("01 " + a)).map(month => {
                  const monthData = selectedTravelEmployee.monthlyData[month];
                  return (
                    <div key={month} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="font-bold text-slate-700">{month}</h4>
                        <span className="font-bold text-indigo-600">{monthData.totalKm.toFixed(2)} km</span>
                      </div>
                      <table className="w-full text-left text-sm">
                        <tbody>
                          {monthData.dailyData.map((day, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-600 font-medium">{day.date}</td>
                              <td className="px-4 py-3 text-slate-800 text-right">{day.km.toFixed(2)} km</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="text-slate-700">
                <span className="text-sm">All-Time Total: </span>
                <span className="font-bold text-emerald-600 text-lg">{selectedTravelEmployee.allTimeKm.toFixed(2)} km</span>
              </div>
              <button onClick={() => setSelectedTravelEmployee(null)} className="px-5 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Add New Employee</h3>
                <p className="text-xs text-slate-500 mt-0.5">Set employee details and secure access password</p>
              </div>
              <button onClick={() => {
                setShowAddModal(false);
                setAddModalError('');
                setAddModalSuccess('');
              }} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 text-left">
              {addModalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {addModalError}
                </div>
              )}

              {addModalSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {addModalSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code *</label>
                <input required type="text" value={newEmployee.employeeCode} onChange={e => setNewEmployee({ ...newEmployee, employeeCode: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder="e.g. EMP005" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                <input required type="text" value={newEmployee.mobileNumber} onChange={e => setNewEmployee({ ...newEmployee, mobileNumber: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Area *</label>
                <input required type="text" value={newEmployee.assignedArea} onChange={e => setNewEmployee({ ...newEmployee, assignedArea: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" placeholder="e.g. Kolhapur" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showAddPassword ? "text" : "password"}
                    value={newEmployee.password}
                    onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                    className="w-full p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Min 8 chars, A-Z, a-z, 0-9, special char"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.038 10.038 0 014.122-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showAddConfirmPassword ? "text" : "password"}
                    value={newEmployee.confirmPassword}
                    onChange={e => setNewEmployee({ ...newEmployee, confirmPassword: e.target.value })}
                    className="w-full p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddConfirmPassword(!showAddConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAddConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.038 10.038 0 014.122-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-500 space-y-1 border border-slate-100">
                <p className="font-semibold text-slate-600">Password Requirements:</p>
                <p>&bull; At least 8 characters</p>
                <p>&bull; At least 1 uppercase letter, 1 lowercase letter, 1 number, & 1 special char</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setAddModalError('');
                  setAddModalSuccess('');
                }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal.show && resetModal.employee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Reset Employee Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Resetting password for: <span className="font-bold text-slate-700">{resetModal.employee.name}</span></p>
              </div>
              <button onClick={() => setResetModal({ show: false, employee: null, password: '', confirmPassword: '', error: '', success: '', submitting: false })} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-left">
              {resetModal.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {resetModal.error}
                </div>
              )}

              {resetModal.success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {resetModal.success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showResetPassword ? "text" : "password"}
                    value={resetModal.password}
                    onChange={e => setResetModal({ ...resetModal, password: e.target.value })}
                    className="w-full p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showResetPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.038 10.038 0 014.122-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showResetConfirmPassword ? "text" : "password"}
                    value={resetModal.confirmPassword}
                    onChange={e => setResetModal({ ...resetModal, confirmPassword: e.target.value })}
                    className="w-full p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Re-enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showResetConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.038 10.038 0 014.122-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-500 space-y-1 border border-slate-100">
                <p className="font-semibold text-slate-600">Password Requirements:</p>
                <p>&bull; At least 8 characters</p>
                <p>&bull; At least 1 uppercase letter, 1 lowercase letter, 1 number, & 1 special char</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setResetModal({ show: false, employee: null, password: '', confirmPassword: '', error: '', success: '', submitting: false })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={resetModal.submitting} className="px-5 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors text-sm font-semibold shadow-sm">
                  {resetModal.submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
