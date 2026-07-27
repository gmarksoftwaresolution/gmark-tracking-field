import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getEmployeeOrderBookings, getEmployeePendingOrders, getEmployeeDeliveredOrders, getEmployeeCancelledOrders } from '../services/api';
import BottomNav from '../components/BottomNav';
import DesktopSidebar from '../components/DesktopSidebar';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, cancelled: 0 });

  useEffect(() => {
    const name = localStorage.getItem('employeeName') || localStorage.getItem('rememberedEmployeeName');
    const employeeId = localStorage.getItem('employeeId') || localStorage.getItem('rememberedEmployeeId');
    if (!name || !employeeId) {
      navigate('/welcome');
    } else {
      setEmployeeName(name);

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
    }
  }, [navigate]);

  // Format today's date
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeRoute');
    localStorage.removeItem('rememberedEmployeeName');
    localStorage.removeItem('rememberedEmployeeId');
    navigate('/welcome');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:pl-64 transition-all">
      {/* Desktop Sidebar Navigation (Visible on MD and Desktop) */}
      <DesktopSidebar />

      {/* Professional Header Section */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-8 sm:py-10 px-6 sm:px-10 lg:px-12 rounded-b-[2.5rem] shadow-xl shadow-blue-900/15 relative">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 lg:gap-10 relative">

          {/* Top-Right Logout Ghost Button (Universal Mobile & Desktop) */}
          <div className="absolute right-0 top-0 z-10">
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

          {/* Left Side: Date, Greeting, Subtitle (pr-20 on mobile to prevent overlap with top-right logout) */}
          <div className="space-y-1.5 max-w-lg pr-20 md:pr-0">
            <p className="text-xs sm:text-sm font-medium text-blue-200/90 tracking-wide uppercase">{today}</p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Welcome, {employeeName ? employeeName.replace(/\s+Employee$/i, '').trim() : 'Employee'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-blue-100/90 font-medium pt-1">
              Manage your orders efficiently.
            </p>
          </div>

          {/* Right Side: Single Horizontal Action Row ([+ New Order] [+ New Field Visit]) */}
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

      {/* Main Content (2x2 Statistics Cards Grid with Generous Spacing) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-10 sm:py-12">

        {/* Statistics Grid Section (2x2 on Mobile/Tablet, 4-Column Row on Laptop/Desktop) */}
        <section className="w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-6 w-full">

            {/* Card 1: Total Orders */}
            <div className="bg-white rounded-2xl sm:rounded-[22px] border border-slate-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.97] transition-all duration-300 p-3.5 sm:p-6 flex flex-col items-center justify-between text-center group select-none min-h-[160px] sm:min-h-[200px] lg:min-h-[220px] w-full">
              {/* Top Center Circular Icon Badge */}
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
              {/* Top Center Circular Icon Badge */}
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
              {/* Top Center Circular Icon Badge */}
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
              {/* Top Center Circular Icon Badge */}
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

      {/* Footer */}
      <footer className="mt-auto py-8 pb-24 md:pb-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Navbharat Agro Service
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
}
