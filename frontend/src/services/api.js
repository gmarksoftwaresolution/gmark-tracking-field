import axios from 'axios';

// Debug environment variable
console.log("VITE_API_URL is:", import.meta.env.VITE_API_URL);

// Get the URL from env, fallback to the current hostname for local network access
let rawUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8085/api`;

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
export const createEmployee = (data, options = {}) => api.post('/employees', data, options).then(res => res.data);
export const resetEmployeePassword = (id, data, options = {}) => api.post(`/employees/${id}/reset-password`, data, options).then(res => res.data);
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

// --- Master Data Foundation APIs ---
export const getRoles = () => api.get('/master/roles').then(res => res.data);
export const getRole = (id) => api.get(`/master/roles/${id}`).then(res => res.data);
export const createRole = (data) => api.post('/master/roles', data).then(res => res.data);
export const updateRole = (id, data) => api.put(`/master/roles/${id}`, data).then(res => res.data);
export const toggleRoleActive = (id) => api.put(`/master/roles/${id}/toggle-active`).then(res => res.data);
export const assignRolePermissions = (id, permissionIds) => api.post(`/master/roles/${id}/permissions`, { permissionIds }).then(res => res.data);

export const getPermissions = () => api.get('/master/permissions').then(res => res.data);

export const getBranches = () => api.get('/master/branches').then(res => res.data);
export const getBranch = (id) => api.get(`/master/branches/${id}`).then(res => res.data);
export const createBranch = (data) => api.post('/master/branches', data).then(res => res.data);
export const updateBranch = (id, data) => api.put(`/master/branches/${id}`, data).then(res => res.data);
export const toggleBranchActive = (id) => api.put(`/master/branches/${id}/toggle-active`).then(res => res.data);

export const getDepartments = () => api.get('/master/departments').then(res => res.data);
export const getDepartment = (id) => api.get(`/master/departments/${id}`).then(res => res.data);
export const createDepartment = (data) => api.post('/master/departments', data).then(res => res.data);
export const updateDepartment = (id, data) => api.put(`/master/departments/${id}`, data).then(res => res.data);
export const toggleDepartmentActive = (id) => api.put(`/master/departments/${id}/toggle-active`).then(res => res.data);

export const getDesignations = () => api.get('/master/designations').then(res => res.data);
export const getDesignation = (id) => api.get(`/master/designations/${id}`).then(res => res.data);
export const createDesignation = (data) => api.post('/master/designations', data).then(res => res.data);
export const updateDesignation = (id, data) => api.put(`/master/designations/${id}`, data).then(res => res.data);
export const toggleDesignationActive = (id) => api.put(`/master/designations/${id}/toggle-active`).then(res => res.data);

export const getShifts = () => api.get('/master/shifts').then(res => res.data);
export const getShift = (id) => api.get(`/master/shifts/${id}`).then(res => res.data);
export const createShift = (data) => api.post('/master/shifts', data).then(res => res.data);
export const updateShift = (id, data) => api.put(`/master/shifts/${id}`, data).then(res => res.data);
export const toggleShiftActive = (id) => api.put(`/master/shifts/${id}/toggle-active`).then(res => res.data);

export const getLeaveTypes = () => api.get('/master/leave-types').then(res => res.data);
export const getLeaveType = (id) => api.get(`/master/leave-types/${id}`).then(res => res.data);
export const createLeaveType = (data) => api.post('/master/leave-types', data).then(res => res.data);
export const updateLeaveType = (id, data) => api.put(`/master/leave-types/${id}`, data).then(res => res.data);
export const toggleLeaveTypeActive = (id) => api.put(`/master/leave-types/${id}/toggle-active`).then(res => res.data);

export const getHolidays = () => api.get('/master/holidays').then(res => res.data);
export const getHoliday = (id) => api.get(`/master/holidays/${id}`).then(res => res.data);
export const createHoliday = (data) => api.post('/master/holidays', data).then(res => res.data);
export const updateHoliday = (id, data) => api.put(`/master/holidays/${id}`, data).then(res => res.data);
export const toggleHolidayActive = (id) => api.put(`/master/holidays/${id}/toggle-active`).then(res => res.data);

// --- Attendance Punch IN / Punch OUT API ---
export const getTodayAttendance = (employeeId) => api.get(`/attendance/today/${employeeId}`).then(res => res.data);
export const getAllTodayAttendance = () => api.get('/attendance/today-all').then(res => res.data);
export const getAttendanceConfig = () => api.get('/attendance/config').then(res => res.data);
export const punchIn = (data) => api.post('/attendance/punch-in', data).then(res => res.data);
export const punchOut = (data) => api.post('/attendance/punch-out', data).then(res => res.data);

export default api;
