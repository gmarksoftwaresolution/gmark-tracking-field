import { useLocation, useNavigate } from 'react-router-dom';

export default function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const employeeName = localStorage.getItem('employeeName') || localStorage.getItem('rememberedEmployeeName') || 'Employee';

  const handleLogout = () => {
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeRoute');
    localStorage.removeItem('rememberedEmployeeName');
    localStorage.removeItem('rememberedEmployeeId');
    navigate('/welcome');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/employee-dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'order-booking',
      label: 'Order Booking',
      path: '/order-bookings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'route',
      label: 'Route',
      path: '/routes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      id: 'visit',
      label: 'Visit',
      path: '/field-visits',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <aside className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200/80 z-40 p-6 shadow-sm">
      {/* Branding Header */}
      <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100 mb-6">
        <img src="/gmark-logo.png" alt="Navbharat Logo" className="h-10 w-10 object-contain rounded-xl shadow-sm border border-slate-100 bg-white" />
        <div>
          <h2 className="font-extrabold text-slate-900 text-sm leading-snug">Navbharat Agro</h2>
          <p className="text-xs text-blue-600 font-semibold">Employee System</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-2.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
              }`}
            >
              <div className={isActive ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout at Bottom */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shadow-inner">
            {employeeName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {employeeName.replace(/\s+Employee$/i, '').trim()}
            </p>
            <p className="text-[11px] text-slate-500 truncate">Field Staff</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
