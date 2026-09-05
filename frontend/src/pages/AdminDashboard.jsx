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
  getHistoricalRoute
} from '../services/api';
import LiveTrackingMap from '../components/LiveTrackingMap';

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
      if (activeTab === 'overview') {
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
            onClick={() => navigate('/welcome')}
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
        </div>

        {activeTab === 'overview' && (
          <div>
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
                  Employee Status
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
                    <th className="py-3.5 px-4 text-center">Tracking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map(emp => {
                    const empNameClean = emp.name.replace(/\s+Employee$/i, '').trim();
                    const isTodayDate = (dateStr) => {
                      if (!dateStr) return false;
                      const d = new Date(dateStr);
                      if (isNaN(d.getTime())) return false;
                      const today = new Date();
                      return d.getFullYear() === today.getFullYear() &&
                        d.getMonth() === today.getMonth() &&
                        d.getDate() === today.getDate();
                    };

                    const tripIsToday = isTodayDate(emp.tripStartTime);

                    const formattedStartTime = (tripIsToday && emp.tripStartTime)
                      ? new Date(emp.tripStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : '--';

                    const formattedStopTime = (tripIsToday && emp.tripEndTime)
                      ? new Date(emp.tripEndTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : '--';

                    // Resolve route for display (e.g. Rohit's manual route or predefined Start -> End route)
                    const routeDisplay = formatRouteForDisplay(emp.selectedRouteCode, empNameClean, emp.id);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shadow-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <span>{empNameClean}</span>
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
                          {emp.lastLocationTime ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-xs">
                                {new Date(emp.lastLocationTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                              {emp.lastKnownAddress && (
                                <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={emp.lastKnownAddress}>
                                  {emp.lastKnownAddress}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {emp.todayTravelledDistance > 0 ? `${emp.todayTravelledDistance.toFixed(2)} km` : '--'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedTrackingEmployee && (
                <div className="flex-1 flex flex-col md:flex-row relative">
                  {/* Journey Timeline Sidebar */}
                  <div className="w-full md:w-1/3 max-w-sm bg-slate-50/50 border-r border-slate-100 overflow-y-auto p-4 custom-scrollbar">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 px-2">Journey Timeline</h4>
                    {!historicalRoute?.origin && (
                      <div className="text-sm text-slate-500 px-2">No journey data available for this date.</div>
                    )}
                    {historicalRoute?.origin && (
                      <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        
                        {/* Build Timeline Data */}
                        {(() => {
                          const timeline = [];
                          
                          // Helper to ensure all timestamps are treated as local time
                          // The backend returns GPS pings with 'Z' (UTC) and Checkpoints without 'Z' (Local).
                          // This normalizes them so they all display as intended local times.
                          const normalizeTime = (ts) => new Date(ts.replace('Z', ''));

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
                              const sortedCheckpoints = [...historicalRoute.checkpoints].sort((a, b) => normalizeTime(a.timestamp) - normalizeTime(b.timestamp));
                              sortedCheckpoints.forEach((cp, idx) => {
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

                          return timeline.map((item, idx) => (
                            <div key={item.id} className="relative flex items-start gap-4 group">
                              <div className={`absolute -left-6 w-4 h-4 rounded-full border-4 border-white shadow-sm ${item.color} z-10 top-1 transition-transform group-hover:scale-125`}></div>
                              <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <span className={`text-xs font-bold ${item.textColor} uppercase tracking-wider`}>{item.type}</span>
                                  <span className="text-xs font-semibold text-slate-500">
                                    {normalizeTime(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                  <div className="flex-1 p-2 relative min-h-[400px]">
                     <button 
                       onClick={() => setSelectedTrackingEmployee(null)}
                       className="absolute top-4 right-4 z-[1000] bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                     >
                       Close Map
                     </button>
                     <LiveTrackingMap 
                       historicalRoute={historicalRoute} 
                       liveLocation={selectedTrackingEmployee.lastLatitude && selectedTrackingEmployee.lastLongitude ? { latitude: selectedTrackingEmployee.lastLatitude, longitude: selectedTrackingEmployee.lastLongitude } : null}
                       lastKnownAddress={selectedTrackingEmployee.lastKnownAddress ? { address: selectedTrackingEmployee.lastKnownAddress, latitude: selectedTrackingEmployee.lastLatitude, longitude: selectedTrackingEmployee.lastLongitude } : null}
                     />
                  </div>
                </div>
            )}
          </div>
        )}

      </main>

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
