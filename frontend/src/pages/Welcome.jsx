import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginEmployee } from '../services/api';
import { resolveTodayRoute } from '../utils/routeHelper';

export default function Welcome() {
  const navigate = useNavigate();
  const clickCount = useRef(0);
  const clickTimeout = useRef(null);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Clear any remembered employee storage on mount
  useEffect(() => {
    localStorage.removeItem('rememberedEmployeeName');
    localStorage.removeItem('rememberedEmployeeId');
  }, []);

  const handleLogoClick = () => {
    clickCount.current += 1;

    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }

    if (clickCount.current >= 5) {
      clickCount.current = 0;
      const pwd = window.prompt('Admin Access: Enter Password');
      if (pwd === 'admin123') {
        navigate('/admin-dashboard');
      } else if (pwd !== null) {
        alert('Incorrect password. Access denied.');
      }
    } else {
      clickTimeout.current = setTimeout(() => {
        clickCount.current = 0;
      }, 1000);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');

    const cleanPassword = password.trim();
    if (!cleanPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginEmployee({ employeeId: 0, password: cleanPassword });

      // Save active session info on success
      const empIdStr = response.employeeId.toString();
      const empName = response.employeeName;

      localStorage.setItem('employeeId', empIdStr);
      localStorage.setItem('employeeName', empName);
      if (response.token) {
        localStorage.setItem('employeeToken', response.token);
      }

      const assignedRoute = resolveTodayRoute(empName, empIdStr);
      localStorage.setItem('employeeRoute', assignedRoute);

      navigate('/employee-dashboard');
    } catch (err) {
      console.error("Login Error:", err);
      setAuthError(err.response?.data?.message || 'Invalid Password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center border border-slate-100">

        {/* Company Logo with Hidden Admin Trigger */}
        <div
          onClick={handleLogoClick}
          className="cursor-pointer active:scale-95 transition-transform inline-block"
          title="Navbharat Agro Service"
        >
          <img src="/gmark-logo.png" alt="Navbharat Agro Service Logo" className="h-24 w-24 md:h-28 md:w-28 mx-auto mb-6 rounded-2xl shadow-lg object-contain bg-white" />
        </div>

        {/* Header Section */}
        <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Navbharat Agro Service
        </h1>
        <h2 className="text-base md:text-xl font-semibold text-blue-600 mb-6">
          Employee Management System
        </h2>

        {/* Welcome Message */}
        <p className="text-slate-600 mb-8 leading-relaxed text-sm md:text-base">
          Welcome to the centralized hub for all your employee management needs.
          Enter your password below to access your dashboard and daily tasks.
        </p>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{authError}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) setAuthError('');
                }}
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base text-slate-900 placeholder-slate-400 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.038 10.038 0 014.122-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.692-4.692a3 3 0 00-4.243-4.243" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Action Button: Login */}
          <button
            type="submit"
            disabled={!password.trim() || isSubmitting}
            className={`w-full font-semibold py-4 px-6 rounded-xl shadow-md transition-all text-base md:text-lg flex justify-center items-center gap-2 cursor-pointer active:scale-95 ${!password.trim() || isSubmitting
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
              <>
                Done
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
