import axios from 'axios';

// Debug environment variable
console.log("VITE_API_URL is:", import.meta.env.VITE_API_URL);

// Get the URL from env, fallback to the current hostname for local network access
let rawUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5159/api`;

// Ensure the URL always ends with /api to prevent missing path issues
if (!rawUrl.endsWith('/api')) {
  // Remove trailing slash if present, then append /api
  rawUrl = rawUrl.replace(/\/$/, '') + '/api';
}

const BASE_URL = rawUrl;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Products API ---
export const getProducts = () => api.get('/products').then(res => res.data);

// --- Employees API ---
export const getEmployees = () => api.get('/employees').then(res => res.data);
export const getEmployee = (id) => api.get(`/employees/${id}`).then(res => res.data);
export const createEmployee = (data) => api.post('/employees', data).then(res => res.data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data).then(res => res.data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`).then(res => res.data);
export const startTrip = (id, routeCode) => api.put(`/employees/${id}/start-trip`, { routeCode }).then(res => res.data);
export const stopTrip = (id) => api.put(`/employees/${id}/stop-trip`).then(res => res.data);
export const saveEmployeeRoute = (id, routeCode) => api.put(`/employees/${id}/save-route`, { routeCode }).then(res => res.data);

// --- Auth API ---
export const loginEmployee = (data) => api.post('/auth/employee-login', data).then(res => res.data);

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
export const getEmployeeMonthlyReport = (employeeId) => api.get(`/reports/monthly/${employeeId}`).then(res => res.data);

// --- HR Employee Master API ---
export const getEmployeeMasters = (params = {}) => api.get('/employeemaster', { params }).then(res => res.data);
export const getEmployeeMaster = (id) => api.get(`/employeemaster/${id}`).then(res => res.data);
export const getNextEmployeeCode = () => api.get('/employeemaster/next-code').then(res => res.data);
export const createEmployeeMaster = (data) => api.post('/employeemaster', data).then(res => res.data);
export const updateEmployeeMaster = (id, data) => api.put(`/employeemaster/${id}`, data).then(res => res.data);
export const deleteEmployeeMaster = (id) => api.delete(`/employeemaster/${id}`).then(res => res.data);
export const updateEmployeeMasterStatus = (id, status) => api.put(`/employeemaster/${id}/status`, { employeeStatus: status }).then(res => res.data);

// --- Master Lookups API ---
export const getDepartmentLookups = () => api.get('/lookups/departments').then(res => res.data);
export const getDesignationLookups = () => api.get('/lookups/designations').then(res => res.data);
export const getRoleLookups = () => api.get('/lookups/roles').then(res => res.data);
export const getBranchLookups = () => api.get('/lookups/branches').then(res => res.data);

// --- Customer Master API ---
export const getCustomerMasters = (params = {}) => api.get('/customermaster', { params }).then(res => res.data);
export const getCustomerMaster = (id) => api.get(`/customermaster/${id}`).then(res => res.data);
export const getNextCustomerCode = () => api.get('/customermaster/next-code').then(res => res.data);
export const createCustomerMaster = (data) => api.post('/customermaster', data).then(res => res.data);
export const updateCustomerMaster = (id, data) => api.put(`/customermaster/${id}`, data).then(res => res.data);
export const deleteCustomerMaster = (id) => api.delete(`/customermaster/${id}`).then(res => res.data);

export default api;
