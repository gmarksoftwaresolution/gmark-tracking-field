import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  getEmployee, 
  getEmployeePendingOrders, 
  getEmployeeDeliveredOrders, 
  getFieldVisits,
  getEmployeeDailyReport,
  getEmployeeMonthlyReport,
  deleteOrderBooking,
  deleteFieldVisit,
  resetEmployeePassword
} from '../services/api';

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

const resolveSelectedRoute = (emp) => {
  if (!emp) return 'Not Set';
  const nameLower = (emp.name || '').toLowerCase();

  // Check Rohit's manual route first if employee is Rohit
  if (nameLower.includes('rohit')) {
    const rohitRouteStr = localStorage.getItem('rohitCustomRoute') ||
                           sessionStorage.getItem('rohitCustomRoute') ||
                           localStorage.getItem(`rohitCustomRoute_${emp.id}`);
    if (rohitRouteStr) {
      try {
        const parsed = JSON.parse(rohitRouteStr);
        if (parsed.label) return getStartEndLabel(parsed.label);
        if (parsed.startLoc && parsed.endLoc) return `${parsed.startLoc} → ${parsed.endLoc}`;
        if (parsed.path) return getStartEndLabel(parsed.path);
      } catch (e) {}
    }
  }

  const rawRoute = emp.selectedRouteCode;
  if (!rawRoute || rawRoute.trim() === '' || rawRoute === '--') {
    return 'Not Set';
  }

  // If rawRoute matches a known route code (e.g. K001, P001, P002, etc.)
  if (routeCodeMap[rawRoute.trim()]) {
    return routeCodeMap[rawRoute.trim()];
  }

  // If rawRoute contains '→' (path string or custom route label)
  if (rawRoute.includes('→')) {
    return getStartEndLabel(rawRoute);
  }

  return rawRoute;
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

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [fieldVisits, setFieldVisits] = useState([]);
  
  const [dailyReport, setDailyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reset Password Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPasswordState] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const validationErr = validatePasswordRules(resetPassword, resetConfirmPassword);
    if (validationErr) {
      setResetError(validationErr);
      return;
    }

    setIsResetting(true);

    try {
      await resetEmployeePassword(employee.id, {
        password: resetPassword,
        confirmPassword: resetConfirmPassword
      }, {
        headers: { 'X-User-Role': 'Admin' }
      });

      setResetSuccess('Password reset successfully!');
      setTimeout(() => {
        setShowResetModal(false);
        setResetPasswordState('');
        setResetConfirmPassword('');
        setResetError('');
        setResetSuccess('');
        setIsResetting(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsResetting(false);
      setResetError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true);
      setError('');
      try {
        const empId = parseInt(id, 10);
        
        let empData;
        try {
          empData = await getEmployee(empId);
        } catch (err) {
          console.error("Employee not found:", err);
          setError(`Employee not found.`);
          setLoading(false);
          return;
        }

        // Use Promise.all to fetch the rest of the data simultaneously
        const [
          pendingData, 
          deliveredData, 
          allVisits,
          dailyData,
          monthlyData
        ] = await Promise.all([
          getEmployeePendingOrders(empId).catch(() => []),
          getEmployeeDeliveredOrders(empId).catch(() => []),
          getFieldVisits().catch(() => []),
          getEmployeeDailyReport(empId).catch(() => null), // Catch in case report is empty/404
          getEmployeeMonthlyReport(empId).catch(() => null)
        ]);
        
        setEmployee(empData);
        setPendingOrders(pendingData);
        setDeliveredOrders(deliveredData);
        
        // Filter field visits by selected employee ID
        const empVisits = allVisits.filter(v => v.employeeId === empId);
        setFieldVisits(empVisits);

        setDailyReport(dailyData);
        setMonthlyReport(monthlyData);
        
      } catch (err) {
        console.error("Error fetching employee details:", err);
        setError(`Failed to fetch data for this employee.`);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchEmployeeData();
  }, [id]);

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrderBooking(orderId);
        setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
        setDeliveredOrders(deliveredOrders.filter(o => o.id !== orderId));
      } catch (err) {
        console.error("Error deleting order:", err);
        alert("Failed to delete order.");
      }
    }
  };

  const handleDeleteVisit = async (visitId) => {
    if (window.confirm("Are you sure you want to delete this field visit?")) {
      try {
        await deleteFieldVisit(visitId);
        setFieldVisits(fieldVisits.filter(v => v.id !== visitId));
      } catch (err) {
        console.error("Error deleting field visit:", err);
        alert("Failed to delete field visit.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium animate-pulse">Loading employee details...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow border border-red-100 flex flex-col items-start gap-4">
          <p className="text-red-500 font-medium">{error || "Employee not found."}</p>
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Derive currently selected route for this employee
  const selectedRoute = resolveSelectedRoute(employee);
  
  // Extract values, fallback to 0 if report missing
  const todaysOrders = dailyReport?.totalOrders || 0;
  const todaysSales = dailyReport?.totalSales || 0;
  const monthlySales = monthlyReport?.totalSales || 0;

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const pendingData = pendingOrders.map(order => ({
      'Order ID': order.id,
      'Customer Name': order.customerName,
      'Mobile Number': order.mobileNumber,
      'Village': order.village,
      'Category': order.customerCategory,
      'Route': order.route,
      'Booking Date': order.bookingDate,
      'Products': order.products?.map(p => `${p.productName} (${p.quantity})`).join(', ') || '-',
      'Grand Total': order.grandTotal
    }));
    const wsPending = XLSX.utils.json_to_sheet(pendingData);
    XLSX.utils.book_append_sheet(wb, wsPending, "Pending Orders");

    const deliveredData = deliveredOrders.map(order => ({
      'Order ID': order.id,
      'Customer Name': order.customerName,
      'Mobile Number': order.mobileNumber,
      'Village': order.village,
      'Category': order.customerCategory,
      'Route': order.route,
      'Booking Date': order.bookingDate,
      'Products': order.products?.map(p => `${p.productName} (${p.quantity})`).join(', ') || '-',
      'Grand Total': order.grandTotal
    }));
    const wsDelivered = XLSX.utils.json_to_sheet(deliveredData);
    XLSX.utils.book_append_sheet(wb, wsDelivered, "Delivered Orders");

    const visitsData = fieldVisits.map(visit => ({
      'Visit ID': visit.id,
      'Customer Name': visit.customerName,
      'Mobile Number': visit.mobileNumber,
      'Village': visit.village,
      'Product Name': visit.productName,
      'Discussion': visit.discussion,
      'Visit Date': visit.visitDate,
      'Visit Time': visit.visitTime
    }));
    const wsVisits = XLSX.utils.json_to_sheet(visitsData);
    XLSX.utils.book_append_sheet(wb, wsVisits, "Field Visits");

    XLSX.writeFile(wb, `${employee.name.replace(/\s+/g, '_')}_History.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in">
      <header className="bg-blue-600 text-white pt-12 pb-20 px-6 rounded-b-3xl shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin-dashboard')}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors active:scale-95"
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{employee.name}</h1>
            <p className="text-blue-100 font-medium mt-2">Employee Detail View &bull; Code: {employee.employeeCode}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/90 hover:bg-amber-500 backdrop-blur-sm text-white rounded-xl font-medium transition-colors active:scale-95 shadow-sm text-sm"
              title="Reset Password"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="hidden sm:inline">Reset Password</span>
            </button>
            <button 
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-medium transition-colors active:scale-95 text-sm"
              title="Download Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export to Excel</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 -mt-10 mb-12 relative z-10 space-y-8">
        
        {/* Info & Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 flex flex-col justify-center items-center sm:col-span-2 lg:col-span-2 transform transition-transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Selected Route</h3>
            <p className="text-xl font-bold text-slate-800 text-center truncate w-full">{selectedRoute}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 flex flex-col justify-center items-center transform transition-transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Today's Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{todaysOrders}</p>
          </div>

          <div className="bg-amber-500 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-center items-center transform transition-transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-amber-100 mb-1">Pending Orders</h3>
            <p className="text-4xl font-bold">{pendingOrders.length}</p>
          </div>

          <div className="bg-emerald-600 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-center items-center transform transition-transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-emerald-100 mb-1">Delivered Orders</h3>
            <p className="text-4xl font-bold">{deliveredOrders.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 flex flex-col justify-center items-center transform transition-transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Today's Sales</h3>
            <p className="text-3xl font-bold text-slate-800">₹{todaysSales}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 flex flex-col justify-center items-center transform transition-transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Monthly Sales</h3>
            <p className="text-3xl font-bold text-slate-800">₹{monthlySales}</p>
          </div>

          <div className="bg-purple-600 rounded-2xl shadow-lg p-6 text-white flex flex-col justify-center items-center transform transition-transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-purple-100 mb-1">Total Field Visits</h3>
            <p className="text-4xl font-bold">{fieldVisits.length}</p>
          </div>

        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pending Orders Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-50 p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                Pending Orders
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96 flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                  <tr className="text-slate-600">
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Products</th>
                    <th className="p-4 font-semibold text-right">Total</th>
                    <th className="p-4 font-semibold text-center">Location</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 border-b border-slate-100">No pending orders.</td>
                    </tr>
                  ) : (
                    pendingOrders.map(order => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">#{order.id}</td>
                        <td className="p-4 text-slate-600">{order.customerName}</td>
                        <td className="p-4 text-slate-600">{order.bookingDate}</td>
                        <td className="p-4 text-slate-600 text-xs">{order.products?.map(p => `${p.productName} (${p.quantity})`).join(', ') || '-'}</td>
                        <td className="p-4 text-amber-600 font-medium text-right">₹{order.grandTotal > 0 ? order.grandTotal : (order.products?.reduce((sum, p) => sum + (p.rowTotal || (p.quantity * p.unitPrice)), 0) || 0)}</td>
                        <td className="p-4 text-slate-600 text-xs text-center">
                          {order.latitude && order.longitude ? (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline inline-flex items-center gap-1 justify-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View Map
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
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
          </div>

          {/* Delivered Orders Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-50 p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Delivered Orders
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96 flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                  <tr className="text-slate-600">
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Products</th>
                    <th className="p-4 font-semibold text-right">Total</th>
                    <th className="p-4 font-semibold text-center">Location</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500 border-b border-slate-100">No delivered orders.</td>
                    </tr>
                  ) : (
                    deliveredOrders.map(order => (
                      <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">#{order.id}</td>
                        <td className="p-4 text-slate-600">{order.customerName}</td>
                        <td className="p-4 text-slate-600">{order.bookingDate}</td>
                        <td className="p-4 text-slate-600 text-xs">{order.products?.map(p => `${p.productName} (${p.quantity})`).join(', ') || '-'}</td>
                        <td className="p-4 text-emerald-600 font-medium text-right">₹{order.grandTotal > 0 ? order.grandTotal : (order.products?.reduce((sum, p) => sum + (p.rowTotal || (p.quantity * p.unitPrice)), 0) || 0)}</td>
                        <td className="p-4 text-slate-600 text-xs text-center">
                          {order.latitude && order.longitude ? (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline inline-flex items-center gap-1 justify-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View Map
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
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
          </div>

          {/* Field Visit History Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden lg:col-span-2 flex flex-col">
            <div className="bg-slate-50 p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Field Visit History
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96 flex-1">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                  <tr className="text-slate-600">
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Contact</th>
                    <th className="p-4 font-semibold">Village</th>
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Location</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldVisits.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500 border-b border-slate-100">No field visits recorded.</td>
                    </tr>
                  ) : (
                    fieldVisits.map(visit => (
                      <tr key={visit.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-800">#{visit.id}</td>
                        <td className="p-4 text-slate-600">{visit.customerName}</td>
                        <td className="p-4 text-slate-600">{visit.mobileNumber}</td>
                        <td className="p-4 text-slate-600">{visit.village || '-'}</td>
                        <td className="p-4 text-blue-600 font-medium">{visit.productName || 'N/A'}</td>
                        <td className="p-4 text-slate-600">{visit.visitDate} {visit.visitTime}</td>
                        <td className="p-4 text-slate-600 text-xs">
                          {visit.latitude && visit.longitude ? (
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${visit.latitude},${visit.longitude}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View Map
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDeleteVisit(visit.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Visit"
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
          </div>

        </div>
      </main>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Reset Employee Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Resetting password for: <span className="font-bold text-slate-700">{employee.name}</span></p>
              </div>
              <button onClick={() => {
                setShowResetModal(false);
                setResetPasswordState('');
                setResetConfirmPassword('');
                setResetError('');
                setResetSuccess('');
              }} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-left">
              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {resetSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showResetPassword ? "text" : "password"}
                    value={resetPassword}
                    onChange={e => setResetPasswordState(e.target.value)}
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
                    value={resetConfirmPassword}
                    onChange={e => setResetConfirmPassword(e.target.value)}
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
                <button type="button" onClick={() => {
                  setShowResetModal(false);
                  setResetPasswordState('');
                  setResetConfirmPassword('');
                  setResetError('');
                  setResetSuccess('');
                }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancel</button>
                <button type="submit" disabled={isResetting} className="px-5 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors text-sm font-semibold shadow-sm">
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
