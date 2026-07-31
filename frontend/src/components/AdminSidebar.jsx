import { useLocation, useNavigate } from 'react-router-dom';

export default function AdminSidebar({ isMobileOpen, setIsMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const modules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin-dashboard',
      exact: true,
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    {
      id: 'masters',
      label: 'Masters',
      path: '/admin-dashboard/masters',
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
      )
    },
    {
      id: 'hr-management',
      label: 'HR Management',
      path: '/admin-dashboard/hr-management',
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    {
      id: 'sales-management',
      label: 'Sales Management',
      path: '/admin-dashboard/sales-management',
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/admin-dashboard/reports',
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/admin-dashboard/settings',
      icon: (
        <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Main ERP Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200/90 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Official Logo */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/gmark-logo.png"
              alt="G-Mark Logo"
              className="h-10 w-10 object-contain rounded-xl shadow-xs border border-slate-100 bg-white p-1"
            />
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
                G-Mark
              </h2>
            </div>
          </div>

          {/* Close button for mobile */}
          {setIsMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 custom-scrollbar">
          <div className="px-3 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Main Menu
            </p>
          </div>

          {modules.map((item) => {
            let isActive = false;
            if (item.exact) {
              isActive = currentPath === '/admin-dashboard' || currentPath === '/admin-dashboard/';
            } else {
              isActive = currentPath.startsWith(item.path);
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`group relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {/* Active Colored Left Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.2 bg-blue-600 rounded-r-full shadow-xs" />
                )}

                <div
                  className={`transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                >
                  {item.icon}
                </div>

                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile / Footer at Bottom */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
              AD
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">Administrator</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">System Manager</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/welcome')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Back to Welcome</span>
          </button>
        </div>
      </aside>
    </>
  );
}
