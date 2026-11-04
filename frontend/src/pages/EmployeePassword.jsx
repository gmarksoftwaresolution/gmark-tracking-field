import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginEmployee } from '../services/api';
import { getDeviceId, getDeviceName, getCurrentCoordinates } from '../utils/deviceHelper';
import { useDeviceApproval } from '../hooks/useDeviceApproval';
import DeviceApprovalModal from '../components/DeviceApprovalModal';

export default function EmployeePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const locationState = location.state || {};
  const employeeId = locationState.employeeId || localStorage.getItem('rememberedEmployeeId') || localStorage.getItem('employeeId');
  const employeeName = locationState.employeeName || localStorage.getItem('rememberedEmployeeName') || localStorage.getItem('employeeName');

  // Persistent login: stay logged in!
  useEffect(() => {
    const activeToken = localStorage.getItem('employeeToken');
    const activeId = localStorage.getItem('employeeId');
    if (activeId && activeToken) {
      navigate('/employee-dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    // If no employee is selected or remembered, redirect back to Welcome
    if (!employeeId || !employeeName) {
      navigate('/welcome', { replace: true });
    }
  }, [employeeId, employeeName, navigate]);

  const onDeviceApproved = (session) => {
    if (!session) return;
    const empIdStr = session.employeeId.toString();
    const empName = session.employeeName;

    localStorage.setItem('employeeId', empIdStr);
    localStorage.setItem('employeeName', empName);
    localStorage.setItem('rememberedEmployeeId', empIdStr);
    localStorage.setItem('rememberedEmployeeName', empName);

    if (session.token) {
      localStorage.setItem('employeeToken', session.token);
    }
    if (session.refreshToken) {
      localStorage.setItem('refreshToken', session.refreshToken);
    }

    setIsApprovalModalOpen(false);
    window.alert("Device Approved! Please allow location permission 'Allow all the time' in your device settings.");
    navigate('/employee-dashboard', { replace: true });
  };

  const {
    status: deviceStatus,
    setStatus: setDeviceStatus,
    reason: deviceReason,
    setReason: setDeviceReason,
    reasonSaved,
    isSubmittingReason,
    submitReason,
    errorMessage: deviceErrorMessage
  } = useDeviceApproval({
    employeeId,
    deviceId: getDeviceId(),
    onApproved: onDeviceApproved
  });

  const handleSwitchProfile = () => {
    localStorage.removeItem('rememberedEmployeeName');
    localStorage.removeItem('rememberedEmployeeId');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('employeeRoute');
    navigate('/welcome');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    
    try {
      const cleanPassword = password.trim();
      const deviceId = getDeviceId();
      const deviceName = getDeviceName();
      const coords = await getCurrentCoordinates();
      
      const payload = { 
        employeeId: parseInt(employeeId, 10), 
        password: cleanPassword, 
        deviceId,
        deviceName,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        locationName: coords?.locationName
      };
      
      const response = await loginEmployee(payload);
      
      // Handle NOTE_REQUIRED or REVOKED (Device needs approval note)
      if (response.status === 'NOTE_REQUIRED' || response.status === 'REVOKED') {
        setDeviceStatus('NOTE_REQUIRED');
        if (response.reason) {
          setDeviceReason(response.reason);
        }
        setIsApprovalModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      if (response.status === 'PENDING' || response.isDeviceChangePending) {
        setDeviceStatus('PENDING');
        if (response.reason) {
          setDeviceReason(response.reason);
        }
        setIsApprovalModalOpen(true);
        setIsSubmitting(false);
        return;
      }

      if (response.status === 'REJECTED') {
        setDeviceStatus('REJECTED');
        setIsApprovalModalOpen(true);
        setIsSubmitting(false);
        return;
      }
      
      // Save info on success
      localStorage.setItem('employeeId', response.employeeId.toString());
      localStorage.setItem('employeeName', response.employeeName);
      localStorage.setItem('rememberedEmployeeId', response.employeeId.toString());
      localStorage.setItem('rememberedEmployeeName', response.employeeName);

      if (response.token) {
        localStorage.setItem('employeeToken', response.token);
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      
      window.alert("Please allow location permission 'Allow all the time' in your device settings so that background tracking works properly.");
      
      navigate('/employee-dashboard', { replace: true });
    } catch (err) {
      const errData = err.response?.data;
      if (errData && (errData.status === 'REVOKED' || errData.status === 'NOTE_REQUIRED' || errData.status === 'PENDING' || errData.isDeviceRevoked)) {
        setDeviceStatus(errData.status === 'PENDING' ? 'PENDING' : 'NOTE_REQUIRED');
        if (errData.reason) setDeviceReason(errData.reason);
        setIsApprovalModalOpen(true);
      } else {
        setAuthError(errData?.message || `Network Error: ${err.message}`);
      }
      setIsSubmitting(false);
    }
  };

  if (!employeeId || !employeeName) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      {/* Device Approval Modal */}
      <DeviceApprovalModal
        isOpen={isApprovalModalOpen}
        deviceName={getDeviceName()}
        deviceId={getDeviceId()}
        employeeName={employeeName}
        reason={deviceReason}
        onReasonChange={setDeviceReason}
        onSubmitReason={submitReason}
        isSubmittingReason={isSubmittingReason}
        reasonSaved={reasonSaved}
        status={deviceStatus}
        errorMessage={deviceErrorMessage}
        onCancel={() => {
          setIsApprovalModalOpen(false);
          setDeviceStatus('IDLE');
        }}
      />

      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center border border-slate-100">
        
        <img src="/gmark-logo.png" alt="Navbharat Agro Service Logo" className="h-28 w-28 mx-auto mb-6 rounded-2xl shadow-lg object-contain bg-white" />

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Employee Login
        </h1>
        <p className="text-slate-500 mb-8 text-sm">Please verify your password to continue</p>

        {authError && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {authError}
          </div>
        )}

        <div className="space-y-6 text-left">
          
          {/* Selected Employee Display */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Employee Profile</label>
              <div className="text-lg font-bold text-slate-900">{employeeName ? employeeName.replace(/\s+Employee$/i, '').trim() : ''}</div>
            </div>
            <button
              type="button"
              onClick={handleSwitchProfile}
              className="text-xs text-blue-600 font-semibold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
            >
              Switch Profile
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input 
                  autoFocus
                  required 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-xl tracking-[0.25em] transition-shadow" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                type="button" 
                onClick={handleSwitchProfile}
                disabled={isSubmitting}
                className="flex-1 py-4 px-6 rounded-xl text-lg font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex justify-center items-center gap-2"
              >
                Back
              </button>
              
              <button 
                type="submit" 
                disabled={isSubmitting || !password}
                className={`flex-[2] py-4 px-6 rounded-xl text-lg font-semibold shadow-md transition-all flex justify-center items-center gap-2 ${
                  isSubmitting || !password
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
