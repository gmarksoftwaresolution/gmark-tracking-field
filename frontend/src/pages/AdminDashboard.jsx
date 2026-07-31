import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getEmployees,
  getDailyReport,
  getMonthlyReport,
  createEmployee,
  deleteEmployee,
  getCancelledOrders,
  deleteOrderBooking
} from '../services/api';
import Masters from '../components/master/Masters';
import EmployeeMaster from '../components/master/EmployeeMaster';
import CustomerMaster from '../components/master/CustomerMaster';
import AdminSidebar from '../components/AdminSidebar';

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

const MODULE_CARDS = [
  {
    id: 'masters',
    title: 'Masters',
    description: 'Manage all master records used throughout the application.',
    iconBg: 'bg-indigo-50 border-indigo-100',
    icon: (
      <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    )
  },
  {
    id: 'hr-management',
    title: 'HR Management',
    description: 'Manage employee HR operations.',
    iconBg: 'bg-emerald-50 border-emerald-100',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    id: 'sales-management',
    title: 'Sales Management',
    description: 'Manage sales operations and sales team activities.',
    iconBg: 'bg-blue-50 border-blue-100',
    icon: (
      <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Access real-time analytics, employee status, and business performance reports.',
    iconBg: 'bg-amber-50 border-amber-100',
    icon: (
      <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure system preferences, user roles, and permissions.',
    iconBg: 'bg-purple-50 border-purple-100',
    icon: (
      <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
];

export default function AdminDashboard({ initialModule = null, initialTab = 'overview' }) {
  const navigate = useNavigate();
  const params = useParams();

  // Active module state (null = dashboard home with 5 cards)
  const activeModule = params.module || initialModule;
  const activeSubmodule = params.submodule;

  // Existing Reports / Overview Tab state
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

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

  // Mobile sidebar open state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Add Employee Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', employeeCode: '', mobileNumber: '', assignedArea: '' });

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const id = Math.floor(Math.random() * 1000000);
      await createEmployee({ id, ...newEmployee });
      setShowAddModal(false);
      setNewEmployee({ name: '', employeeCode: '', mobileNumber: '', assignedArea: '' });
      // Refresh employees
      const data = await getEmployees();
      setEmployees(dedupeEmployees(data));
    } catch (err) {
      console.error(err);
      alert('Failed to add employee. Maybe Employee Code already exists.');
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

  // Fetch report data on tab change and periodically every 5 seconds for instant admin updates when inside reports module
  useEffect(() => {
    if (activeModule !== 'reports') return;

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
  }, [activeTab, activeModule]);

  const activeCardInfo = MODULE_CARDS.find(c => c.id === activeModule);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Modern ERP Left Sidebar */}
      <AdminSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Page Layout (offset for sidebar on desktop md:pl-72) */}
      <div className="flex-1 md:pl-72 min-w-0 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="bg-blue-600 text-white pt-8 pb-16 px-6 rounded-b-3xl shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Toggle Navigation Menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
                <p className="text-blue-100 font-medium mt-1 text-xs md:text-sm">
                  Enterprise Resource & Operations Portal
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/welcome')}
              className="flex items-center gap-2 text-xs md:text-sm font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3.5 py-2 md:px-4 md:py-2.5 rounded-full transition-all shadow-sm cursor-pointer"
            >
              Back to Welcome
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 -mt-8 mb-12 relative z-10">

        {/* Dashboard Home - 5 Module Launcher Cards Grid */}
        {!activeModule && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">System Modules</h2>
                <p className="text-sm text-slate-500">Select a module to access features and management tools</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {MODULE_CARDS.map((card) => (
                <div
                  key={card.id}
                  onClick={() => navigate(`/admin-dashboard/${card.id}`)}
                  className="bg-white/90 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-100 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:-translate-y-1.5 hover:border-blue-300"
                >
                  <div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border ${card.iconBg} transition-transform group-hover:scale-110 shadow-xs`}>
                      {card.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                      {card.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    <span>Open Module</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Module / Placeholder View Header navigation */}
        {activeModule && activeModule !== 'masters' && activeModule !== 'master-management' && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-2xl p-4 md:p-6 shadow-md border border-slate-100">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                {activeCardInfo ? activeCardInfo.title : 'Module'}
              </h2>
            </div>
          </div>
        )}

        {/* Masters Module */}
        {(activeModule === 'masters' || activeModule === 'master-management') && (
          <div className="space-y-4">
            {!activeSubmodule && (
              <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <button
                  onClick={() => navigate('/admin-dashboard')}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
              </div>
            )}
            {activeSubmodule === 'employee-master' || activeSubmodule === 'employee' ? (
              <EmployeeMaster />
            ) : activeSubmodule === 'customer-master' || activeSubmodule === 'customer' ? (
              <CustomerMaster />
            ) : (
              <Masters />
            )}
          </div>
        )}

        {/* Placeholder Module Page (for non-reports & non-masters modules) */}
        {activeModule && activeModule !== 'reports' && activeModule !== 'masters' && activeModule !== 'master-management' && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 md:p-16 text-center max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
              {activeCardInfo ? activeCardInfo.title : 'Module'}
            </h1>
            <p className="text-slate-600 text-lg font-medium">
              This module is under development.
            </p>
          </div>
        )}

        {/* Reports Module View (Under Development placeholder + Intact Existing Dashboard) */}
        {activeModule === 'reports' && (
          <div>
            <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 md:p-8 mb-8 text-center">
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Reports</h1>
              <p className="text-slate-600 font-medium">This module is under development.</p>
            </div>

            {/* Existing Dashboard Component Tabs */}
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

            {/* Existing Tab Content */}
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
                    {employees.map(emp => (
                      <div
                        key={emp.id}
                        className="p-6 rounded-2xl shadow border text-left transition-all duration-300 bg-white text-slate-800 border-slate-200 flex justify-between items-center hover:border-blue-300 hover:shadow-lg"
                      >
                        <button
                          onClick={() => navigate(`/admin-dashboard/employee/${emp.id}`)}
                          className="flex items-center gap-4 flex-1 text-left"
                        >
                          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl bg-blue-100 text-blue-600">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg hover:text-blue-600 transition-colors">{emp.name}</h3>
                            <p className="text-sm text-slate-500">
                              Code: {emp.employeeCode}
                            </p>
                          </div>
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
                    ))}
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
                            <td colSpan="8" className="p-4 text-center text-slate-500 border-b border-slate-100">No report data found.</td>
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
                            <td colSpan="8" className="p-4 text-center text-slate-500 border-b border-slate-100">No report data found.</td>
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input required type="text" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code</label>
                <input required type="text" value={newEmployee.employeeCode} onChange={e => setNewEmployee({ ...newEmployee, employeeCode: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <input required type="text" value={newEmployee.mobileNumber} onChange={e => setNewEmployee({ ...newEmployee, mobileNumber: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Area</label>
                <input required type="text" value={newEmployee.assignedArea} onChange={e => setNewEmployee({ ...newEmployee, assignedArea: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
