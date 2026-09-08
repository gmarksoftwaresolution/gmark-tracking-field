import { useLocation, useNavigate } from 'react-router-dom';
import { useAttendance } from '../context/AttendanceContext';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { attendance, handlePunchClick } = useAttendance();

  const status = attendance?.status || 'NOT_PUNCHED_IN';

  const leftNavItems = [
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
      id: 'route',
      label: 'Route',
      path: '/routes',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    }
  ];

  const rightNavItems = [
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-2 py-1.5">
      <div className="flex justify-around items-center max-w-md mx-auto relative">
        {/* Left Nav Links */}
        {leftNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* Central Prominent Round Attendance Action Button */}
        <div className="flex flex-col items-center justify-center -mt-5">
          {status === 'NOT_PUNCHED_IN' && (
            <button
              onClick={() => handlePunchClick('PUNCH_IN')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 hover:from-blue-800 hover:to-indigo-700 text-white flex flex-col items-center justify-center shadow-lg shadow-blue-600/40 border-2 border-white transition-all duration-200 cursor-pointer active:scale-95 group"
              title="Tap to Punch In"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping mb-0.5" />
              <span className="text-[9px] font-black uppercase tracking-tighter">PUNCH IN</span>
            </button>
          )}

          {status === 'PUNCHED_IN' && (
            <button
              onClick={() => handlePunchClick('PUNCH_OUT')}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 hover:from-amber-700 hover:to-orange-700 text-white flex flex-col items-center justify-center shadow-lg shadow-amber-600/40 border-2 border-white transition-all duration-200 cursor-pointer active:scale-95 group"
              title="Tap to Punch Out"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse mb-0.5" />
              <span className="text-[9px] font-black uppercase tracking-tighter">PUNCH OUT</span>
            </button>
          )}

          {status === 'PUNCHED_OUT' && (
            <div
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex flex-col items-center justify-center shadow-md border-2 border-white opacity-95"
              title="Attendance Shift Completed for Today"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[8px] font-black uppercase tracking-tighter">DONE</span>
            </div>
          )}

          <span className="text-[10px] font-extrabold text-slate-700 mt-1">
            {status === 'PUNCHED_IN' ? 'Punch Out' : status === 'PUNCHED_OUT' ? 'Completed' : 'Punch In'}
          </span>
        </div>

        {/* Right Nav Links */}
        {rightNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
