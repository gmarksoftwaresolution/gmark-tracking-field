import { useAttendance } from '../context/AttendanceContext';

export default function AttendanceCard() {
  const {
    attendance,
    config,
    distanceMeters,
    loading,
    message
  } = useAttendance();

  const isInsideArea = distanceMeters !== null ? distanceMeters <= config.attendanceRadiusMeters : true;

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    return new Date(timeStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100/80 space-y-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-inner">
            🕒
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-snug">Attendance Punch Portal</h2>
            <p className="text-xs text-slate-500 font-medium">GPS Geofenced & Camera Verified Summary</p>
          </div>
        </div>

        {/* Status Badge */}
        {attendance && (
          <div className="self-start sm:self-auto">
            {attendance.status === 'PUNCHED_IN' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                PUNCHED IN (Active Shift)
              </span>
            )}
            {attendance.status === 'PUNCHED_OUT' && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                PUNCHED OUT (Completed)
              </span>
            )}
            {(!attendance.status || attendance.status === 'NOT_PUNCHED_IN') && (
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                NOT PUNCHED IN
              </span>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {message?.text && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in duration-150 ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          <span>{message.type === 'error' ? '🚫' : '🎉'}</span>
          <span className="flex-1">{message.text}</span>
        </div>
      )}

      {/* Live Distance & Geofence Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance Status</p>
          <p className="text-sm font-black text-slate-900 mt-1">
            {attendance?.status === 'PUNCHED_IN' ? 'Punched In' : attendance?.status === 'PUNCHED_OUT' ? 'Punched Out' : 'Not Punched In'}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Distance</p>
          <p className="text-sm font-black text-blue-600 mt-1">
            {distanceMeters !== null ? `${distanceMeters} meters` : '0 meters (Test Mode)'}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Allowed Radius</p>
          <p className="text-sm font-black text-slate-900 mt-1">{config.attendanceRadiusMeters} meters</p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Geofence Status</p>
          <span className={`inline-block mt-1 text-xs font-extrabold px-2.5 py-0.5 rounded-md ${isInsideArea ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {isInsideArea ? '✓ Inside Area' : '✕ Outside Area'}
          </span>
        </div>
      </div>

      {/* Punch Times Display Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Punch In Info Box */}
        <div className={`p-4 rounded-2xl border transition-all ${attendance?.punchInTime ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-blue-900 tracking-wider">Punch In</span>
            {attendance?.punchInTime && (
              <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                {formatTime(attendance.punchInTime)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600">
            {attendance?.punchInTime ? (
              <>
                <span className="font-semibold block text-slate-800 truncate">📍 {attendance.punchInAddress || 'Location Captured'}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Distance: {attendance.punchInDistance}m | Accuracy: {Math.round(attendance.punchInAccuracy || 0)}m</span>
              </>
            ) : (
              <span className="text-slate-400 font-medium">Not punched in yet</span>
            )}
          </p>
        </div>

        {/* Punch Out Info Box */}
        <div className={`p-4 rounded-2xl border transition-all ${attendance?.punchOutTime ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-indigo-900 tracking-wider">Punch Out</span>
            {attendance?.punchOutTime && (
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                {formatTime(attendance.punchOutTime)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600">
            {attendance?.punchOutTime ? (
              <>
                <span className="font-semibold block text-slate-800 truncate">📍 {attendance.punchOutAddress || 'Location Captured'}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Distance: {attendance.punchOutDistance}m | Accuracy: {Math.round(attendance.punchOutAccuracy || 0)}m</span>
              </>
            ) : (
              <span className="text-slate-400 font-medium">Not punched out yet</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
