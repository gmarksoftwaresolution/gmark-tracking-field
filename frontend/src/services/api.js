import axios from 'axios';
import { getDeviceId } from '../utils/deviceHelper';

// Debug environment variable
console.log("VITE_API_URL is:", import.meta.env.VITE_API_URL);

// Get the URL from env, fallback to the current hostname for local network access
let rawUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5160/api`;

// Ensure the URL always ends with /api to prevent missing path issues
if (!rawUrl.endsWith('/api')) {
  rawUrl = rawUrl.replace(/\/$/, '') + '/api';
}

const BASE_URL = rawUrl;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach DeviceId & Authorization Token
api.interceptors.request.use((config) => {
  const isAdmin = window.location.pathname.startsWith('/admin') ||
                  config.url?.includes('/admin') ||
                  localStorage.getItem('isAdminLoggedIn') === 'true';

  if (isAdmin) {
    config.headers['X-User-Role'] = 'Admin';
    // Admin is NOT an employee and must never be constrained by employee device binding
  } else {
    const deviceId = getDeviceId();
    if (deviceId) {
      config.headers['X-Device-Id'] = deviceId;
    }

    const token = localStorage.getItem('employeeToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle Token Refresh & Device Revocation
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if device was unlinked/revoked (STRICTLY for Employees, NEVER for Admin!)
    const isAdmin = window.location.pathname.startsWith('/admin') ||
                    originalRequest?.url?.includes('/admin') ||
                    originalRequest?.headers?.['X-User-Role'] === 'Admin' ||
                    localStorage.getItem('isAdminLoggedIn') === 'true';

    // Auth endpoints (/auth/login, /auth/employee-login, /auth/device-status) handle their own states
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && error.response?.data?.isDeviceRevoked) {
      if (isAdmin) {
        console.warn("Ignored employee device revocation event in Admin session.");
        return Promise.reject(error);
      }

      localStorage.removeItem('employeeId');
      localStorage.removeItem('employeeName');
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('employeeRoute');

      window.alert("This phone has been unlinked because a new device was approved by your administrator. Please log in again.");
      window.location.href = '/welcome';
      return Promise.reject(error);
    }

    // Auto-refresh token if 401 and refresh token available
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedEmpId = localStorage.getItem('employeeId');
      const deviceId = getDeviceId();

      if (storedRefreshToken && storedEmpId && deviceId) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh-token`, {
            employeeId: parseInt(storedEmpId, 10),
            deviceId,
            refreshToken: storedRefreshToken
          });

          if (res.data?.token) {
            localStorage.setItem('employeeToken', res.data.token);
            if (res.data.refreshToken) {
              localStorage.setItem('refreshToken', res.data.refreshToken);
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            processQueue(null, res.data.token);
            originalRequest.headers['Authorization'] = `Bearer ${res.data.token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          console.error("Token refresh failed:", refreshErr);
          // If refresh token invalid or revoked, force logout
          if (refreshErr.response?.status === 401) {
            localStorage.removeItem('employeeId');
            localStorage.removeItem('employeeName');
            localStorage.removeItem('employeeToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/welcome';
          }
        } finally {
          isRefreshing = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

// --- Products API ---
export const getProducts = () => api.get('/products').then(res => res.data);

// --- Employees API ---
export const getEmployees = () => api.get('/employees').then(res => res.data);
export const getEmployee = (id) => api.get(`/employees/${id}`).then(res => res.data);
export const createEmployee = (data, options = {}) => api.post('/employees', data, options).then(res => res.data);
export const resetEmployeePassword = (id, data, options = {}) => api.post(`/employees/${id}/reset-password`, data, options).then(res => res.data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data).then(res => res.data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`).then(res => res.data);
export const startTrip = (id, routeCode) => api.put(`/employees/${id}/start-trip`, { routeCode }).then(res => res.data);
export const stopTrip = (id) => api.put(`/employees/${id}/stop-trip`).then(res => res.data);
export const saveEmployeeRoute = (id, routeCode) => api.put(`/employees/${id}/save-route`, { routeCode }).then(res => res.data);
export const approveDeviceChange = (id) => api.post(`/employees/${id}/approve-device`, {}, { headers: { 'X-User-Role': 'Admin' } }).then(res => res.data);
export const rejectDeviceChange = (id) => api.post(`/employees/${id}/reject-device`, {}, { headers: { 'X-User-Role': 'Admin' } }).then(res => res.data);
export const sendLocation = (data) => api.post('/tracking/location', data).then(res => res.data);

// --- Auth & Device Binding API ---
export const loginEmployee = (data) => api.post('/auth/login', data).then(res => res.data);
export const getDeviceStatus = (data) => api.post('/auth/device-status', data).then(res => res.data);
export const submitDeviceReason = (data) => api.post('/auth/submit-device-reason', data).then(res => res.data);
export const refreshToken = (data) => api.post('/auth/refresh-token', data).then(res => res.data);
export const logoutEmployee = (data) => api.post('/auth/logout', data).then(res => res.data);

// --- Admin Devices API ---
export const getPendingDevices = () => api.get('/admin/devices/pending').then(res => res.data);
export const getDeviceHistory = (status = null) => api.get('/admin/devices/history', { params: status ? { status } : {} }).then(res => res.data);
export const approveDevice = (id) => api.patch(`/admin/devices/${id}/approve`).then(res => res.data);
export const rejectDevice = (id) => api.patch(`/admin/devices/${id}/reject`).then(res => res.data);

// --- OrderBookings API ---
export const getOrderBookings = () => api.get('/orderbookings').then(res => res.data);
export const getOrderBooking = (id) => api.get(`/orderbookings/${id}`).then(res => res.data);
export const createOrderBooking = (data) => api.post('/orderbookings', data).then(res => res.data);
export const updateOrderBooking = (id, data) => api.put(`/orderbookings/${id}`, data).then(res => res.data);
export const deleteOrderBooking = (id) => api.delete(`/orderbookings/${id}`).then(res => res.data);
export const deliverOrderBooking = (id) => api.put(`/orderbookings/${id}/deliver`).then(res => res.data);
export const cancelOrderBooking = (id, reason) => api.put(`/orderbookings/${id}/cancel`, { reason }).then(res => res.data);
export const updateOrderTotal = (id, total) => api.put(`/orderbookings/${id}/total`, { total }).then(res => res.data);
export const getCancelledOrders = () => api.get('/orderbookings/cancelled').then(res => res.data);

export const getEmployeeOrderBookings = (employeeId) => api.get(`/orderbookings/employee/${employeeId}`).then(res => res.data);
export const getEmployeePendingOrders = (employeeId) => api.get(`/orderbookings/employee/${employeeId}/pending`).then(res => res.data);
export const getEmployeeDeliveredOrders = (employeeId) => api.get(`/orderbookings/employee/${employeeId}/delivered`).then(res => res.data);
export const getEmployeeCancelledOrders = (employeeId) => api.get(`/orderbookings/employee/${employeeId}/cancelled`).then(res => res.data);

// --- FieldVisits API ---
export const getFieldVisits = () => api.get('/fieldvisits').then(res => res.data);
export const getFieldVisit = (id) => api.get(`/fieldvisits/${id}`).then(res => res.data);
export const createFieldVisit = (data) => api.post('/fieldvisits', data).then(res => res.data);
export const updateFieldVisit = (id, data) => api.put(`/fieldvisits/${id}`, data).then(res => res.data);
export const deleteFieldVisit = (id) => api.delete(`/fieldvisits/${id}`).then(res => res.data);

// --- Reports API ---
export const getDailyReport = () => api.get('/reports/daily').then(res => res.data);
export const getEmployeeDailyReport = (employeeId) => api.get(`/reports/daily/${employeeId}`).then(res => res.data);
export const getMonthlyReport = () => api.get('/reports/monthly').then(res => res.data);
export const getMonthlyTravelReport = () => api.get('/reports/travel-history').then(res => res.data);
export const getEmployeeMonthlyReport = (employeeId) => api.get(`/reports/monthly/${employeeId}`).then(res => res.data);

export const getHistoricalRoute = (employeeId, date = null) => {
    let dateStr = date;
    if (!dateStr) {
        const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const dateObj = new Date(today);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
    }
    
    return api.get(`/tracking/route/${employeeId}?date=${dateStr}`).then(res => res.data);
};

export default api;
