import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getEmployeeMasters,
  getNextEmployeeCode,
  createEmployeeMaster,
  updateEmployeeMaster,
  deleteEmployeeMaster,
  updateEmployeeMasterStatus,
  getDepartmentLookups,
  getDesignationLookups,
  getRoleLookups,
  getBranchLookups
} from '../../services/api';

const INITIAL_FORM_STATE = {
  id: 0,
  employeeCode: '',
  employeeId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  gender: 'Male',
  dateOfBirth: '',
  mobileNumber: '',
  emailAddress: '',
  password: '',
  profilePhoto: '',
  departmentId: '',
  departmentName: '',
  designationId: '',
  designationName: '',
  roleId: '',
  roleName: '',
  branchId: '',
  branchName: '',
  reportingManager: '',
  dateOfJoining: '',
  employmentType: 'Permanent',
  employeeStatus: 'Active',
  currentAddress: '',
  permanentAddress: '',
  city: '',
  state: '',
  pincode: '',
  aadhaarNumber: '',
  panNumber: '',
  drivingLicenceNumber: '',
  emergencyContactName: '',
  relationship: '',
  emergencyContactNumber: ''
};

export default function EmployeeMaster() {
  const navigate = useNavigate();

  // Data states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch Lookups and Employees
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empData, depData, desData, roleData, branchData] = await Promise.allSettled([
        getEmployeeMasters(),
        getDepartmentLookups(),
        getDesignationLookups(),
        getRoleLookups(),
        getBranchLookups()
      ]);

      if (empData.status === 'fulfilled' && Array.isArray(empData.value)) {
        setEmployees(empData.value);
      } else {
        setEmployees([]);
      }

      if (depData.status === 'fulfilled' && Array.isArray(depData.value)) {
        setDepartments(depData.value);
      }
      if (desData.status === 'fulfilled' && Array.isArray(desData.value)) {
        setDesignations(desData.value);
      }
      if (roleData.status === 'fulfilled' && Array.isArray(roleData.value)) {
        setRoles(roleData.value);
      }
      if (branchData.status === 'fulfilled' && Array.isArray(branchData.value)) {
        setBranches(branchData.value);
      }
    } catch (err) {
      console.error('Error fetching HR Employee Master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle Add Employee click - open modal with auto-generated code
  const handleOpenAddModal = async () => {
    setIsEditing(false);
    setFormErrors({});
    let nextCode = 'EMP0001';
    try {
      const res = await getNextEmployeeCode();
      if (res && res.nextEmployeeCode) {
        nextCode = res.nextEmployeeCode;
      }
    } catch (e) {
      console.warn('Using default employee code');
    }

    const nextIdNum = nextCode.replace('EMP', '');
    setFormData({
      ...INITIAL_FORM_STATE,
      employeeCode: nextCode,
      employeeId: `EMP-${new Date().getFullYear()}-${nextIdNum}`
    });
    setShowModal(true);
  };

  // Handle Edit Employee click
  const handleOpenEditModal = (emp) => {
    setIsEditing(true);
    setFormErrors({});
    setFormData({
      id: emp.id,
      employeeCode: emp.employeeCode || '',
      employeeId: emp.employeeId || '',
      firstName: emp.firstName || '',
      middleName: emp.middleName || '',
      lastName: emp.lastName || '',
      gender: emp.gender || 'Male',
      dateOfBirth: emp.dateOfBirth || '',
      mobileNumber: emp.mobileNumber || '',
      emailAddress: emp.emailAddress || '',
      password: '', // Leave blank unless updating
      profilePhoto: emp.profilePhoto || '',
      departmentId: emp.departmentId || '',
      departmentName: emp.departmentName || '',
      designationId: emp.designationId || '',
      designationName: emp.designationName || '',
      roleId: emp.roleId || '',
      roleName: emp.roleName || '',
      branchId: emp.branchId || '',
      branchName: emp.branchName || '',
      reportingManager: emp.reportingManager || '',
      dateOfJoining: emp.dateOfJoining || '',
      employmentType: emp.employmentType || 'Permanent',
      employeeStatus: emp.employeeStatus || 'Active',
      currentAddress: emp.currentAddress || '',
      permanentAddress: emp.permanentAddress || '',
      city: emp.city || '',
      state: emp.state || '',
      pincode: emp.pincode || '',
      aadhaarNumber: emp.aadhaarNumber || '',
      panNumber: emp.panNumber || '',
      drivingLicenceNumber: emp.drivingLicenceNumber || '',
      emergencyContactName: emp.emergencyContactName || '',
      relationship: emp.relationship || '',
      emergencyContactNumber: emp.emergencyContactNumber || ''
    });
    setShowModal(true);
  };

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-update departmentName if departmentId changed
    if (name === 'departmentId') {
      const selectedDep = departments.find((d) => String(d.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        departmentId: value,
        departmentName: selectedDep ? selectedDep.name : ''
      }));
    }
    // Auto-update designationName if designationId changed
    if (name === 'designationId') {
      const selectedDes = designations.find((d) => String(d.id) === String(value));
      setFormData((prev) => ({
        ...prev,
        designationId: value,
        designationName: selectedDes ? selectedDes.name : ''
      }));
    }
    // Clear field-specific error on edit
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Form Validation (Relaxed for testing: Only Name, Employee ID, and Mobile Number are required)
  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'Employee Name (First Name) is required.';
    }

    if (!formData.employeeId.trim()) {
      errors.employeeId = 'Employee ID is required.';
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile Number is required.';
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = 'Mobile Number must be exactly 10 digits.';
    }

    if (formData.emailAddress && formData.emailAddress.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
        errors.emailAddress = 'Invalid Email Address format.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Prepare payload sanitizing empty strings to null for optional DateOnly/Lookup fields
      const payload = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName?.trim() || '.',
        employeeId: formData.employeeId.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        dateOfBirth: formData.dateOfBirth?.trim() ? formData.dateOfBirth.trim() : null,
        dateOfJoining: formData.dateOfJoining?.trim() ? formData.dateOfJoining.trim() : null,
        emailAddress: formData.emailAddress?.trim() ? formData.emailAddress.trim() : null,
        profilePhoto: formData.profilePhoto?.trim() ? formData.profilePhoto.trim() : null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        designationId: formData.designationId ? parseInt(formData.designationId) : null,
        roleId: formData.roleId ? parseInt(formData.roleId) : null,
        branchId: formData.branchId ? parseInt(formData.branchId) : null
      };

      if (isEditing) {
        await updateEmployeeMaster(formData.id, payload);
        alert('Employee Master record updated successfully!');
      } else {
        await createEmployeeMaster(payload);
        alert('Employee Master record created successfully!');
      }

      setShowModal(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save employee record.';
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateEmployeeMasterStatus(id, nextStatus);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, employeeStatus: nextStatus } : emp))
      );
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Delete Employee Handler
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete Employee record '${name}'?`)) {
      try {
        await deleteEmployeeMaster(id);
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      } catch (err) {
        alert('Failed to delete employee record.');
      }
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
  };

  // Computed Full Name in Form
  const computedFullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();

  // Filtered employees list based on search and dropdowns
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      (emp.fullName && emp.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.mobileNumber && emp.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.emailAddress && emp.emailAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.departmentName && emp.departmentName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDepartment =
      selectedDepartment === 'All' ||
      (emp.departmentName && emp.departmentName.toLowerCase() === selectedDepartment.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' ||
      (emp.employeeStatus && emp.employeeStatus.toLowerCase() === selectedStatus.toLowerCase());

    const matchesEmploymentType =
      selectedEmploymentType === 'All' ||
      (emp.employmentType && emp.employmentType.toLowerCase() === selectedEmploymentType.toLowerCase());

    return matchesSearch && matchesDepartment && matchesStatus && matchesEmploymentType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin-dashboard/masters')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Masters
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Employee Master</h1>
              <p className="text-sm text-slate-500 font-medium">HR Master Repository for All Company Employees</p>
            </div>
          </div>
        </div>

        {/* Add Employee Button */}
        <div>
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md border border-slate-100 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4 flex-wrap">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by code, ID, name, mobile, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dept:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type:</label>
            <select
              value={selectedEmploymentType}
              onChange={(e) => setSelectedEmploymentType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Probation">Probation</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Master Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading Employee Master records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Employee Code</th>
                  <th className="py-3.5 px-4 sm:px-6">Employee ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Full Name</th>
                  <th className="py-3.5 px-4 sm:px-6">Department</th>
                  <th className="py-3.5 px-4 sm:px-6">Designation</th>
                  <th className="py-3.5 px-4 sm:px-6">Employment Type</th>
                  <th className="py-3.5 px-4 sm:px-6">Mobile Number</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-10 text-center text-slate-400 font-medium">
                      No HR Employee Master records found. Click "+ Add Employee" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-semibold text-indigo-900">
                        {emp.employeeCode}
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-medium text-slate-600">
                        {emp.employeeId || '--'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                        {emp.fullName}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {emp.departmentName || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-medium text-slate-600">
                        {emp.designationName || '--'}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {emp.employmentType || 'Permanent'}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-medium text-slate-600">
                        {emp.mobileNumber}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <button
                          onClick={() => handleToggleStatus(emp.id, emp.employeeStatus)}
                          title="Click to toggle status"
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 ${emp.employeeStatus === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                        >
                          {emp.employeeStatus}
                        </button>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right space-x-1.5">
                        <button
                          onClick={() => setViewEmployee(emp)}
                          className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="text-slate-600 hover:text-slate-900 font-semibold text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, emp.fullName)}
                          className="text-rose-600 hover:text-rose-900 font-semibold text-xs px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT EMPLOYEE MASTER FORM MODAL */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full my-8 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-400/30">
                  👤
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {isEditing ? 'Edit Employee Master' : 'Add New Employee Master'}
                  </h3>
                  <p className="text-xs text-slate-400">Complete all required sections below</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <h4 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <span>1. Personal Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Employee Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Employee Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleInputChange}
                      placeholder="e.g. EMP0001"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Employee ID (Business ID)
                    </label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      placeholder="e.g. EMP-2026-001"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${formErrors.firstName ? 'border-rose-500' : 'border-slate-300'
                        }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-xs text-rose-500 mt-1">{formErrors.firstName}</p>
                    )}
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      placeholder="Middle Name"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${formErrors.lastName ? 'border-rose-500' : 'border-slate-300'
                        }`}
                    />
                    {formErrors.lastName && (
                      <p className="text-xs text-rose-500 mt-1">{formErrors.lastName}</p>
                    )}
                  </div>

                  {/* Full Name Preview */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Full Name (Auto Preview)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={computedFullName}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="10 digit mobile number"
                      maxLength="10"
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${formErrors.mobileNumber ? 'border-rose-500' : 'border-slate-300'
                        }`}
                    />
                    {formErrors.mobileNumber && (
                      <p className="text-xs text-rose-500 mt-1">{formErrors.mobileNumber}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      placeholder="email@company.com"
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${formErrors.emailAddress ? 'border-rose-500' : 'border-slate-300'
                        }`}
                    />
                    {formErrors.emailAddress && (
                      <p className="text-xs text-rose-500 mt-1">{formErrors.emailAddress}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isEditing ? 'New Password (Optional)' : 'Employee Password'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={isEditing ? 'Leave blank to keep unchanged' : 'Initial password'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Profile Photo URL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo URL</label>
                    <input
                      type="text"
                      name="profilePhoto"
                      value={formData.profilePhoto}
                      onChange={handleInputChange}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: COMPANY INFORMATION & MASTER LOOKUPS */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <h4 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <span>2. Company Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Department Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Designation Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                    <select
                      name="designationId"
                      value={formData.designationId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select Designation</option>
                      {designations.map((des) => (
                        <option key={des.id} value={des.id}>
                          {des.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                    <select
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select Role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                    <select
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reporting Manager */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Manager</label>
                    <input
                      type="text"
                      name="reportingManager"
                      value={formData.reportingManager}
                      onChange={handleInputChange}
                      placeholder="Manager Name"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Date of Joining */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Joining</label>
                    <input
                      type="date"
                      name="dateOfJoining"
                      value={formData.dateOfJoining}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                      <option value="Probation">Probation</option>
                    </select>
                  </div>

                  {/* Employee Status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Status</label>
                    <select
                      name="employeeStatus"
                      value={formData.employeeStatus}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ADDRESS INFORMATION */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <h4 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <span>3. Address Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Address</label>
                    <input
                      type="text"
                      name="currentAddress"
                      value={formData.currentAddress}
                      onChange={handleInputChange}
                      placeholder="Street address, apartment, locality"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Address</label>
                    <input
                      type="text"
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      placeholder="Permanent address details"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Pincode"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: IDENTITY DOCUMENTS */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <h4 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <span>4. Identity Documents</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      name="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      placeholder="12 digit Aadhaar"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="10 digit PAN"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Driving Licence Number</label>
                    <input
                      type="text"
                      name="drivingLicenceNumber"
                      value={formData.drivingLicenceNumber}
                      onChange={handleInputChange}
                      placeholder="DL Number"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: EMERGENCY CONTACT */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                <h4 className="text-sm font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <span>5. Emergency Contact</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder="Contact Name"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      placeholder="e.g. Father / Spouse / Brother"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Number</label>
                    <input
                      type="text"
                      name="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={handleInputChange}
                      placeholder="Mobile Number"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving Record...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW EMPLOYEE MASTER DETAILS MODAL */}
      {/* ========================================================================= */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-indigo-900 text-white px-6 py-5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-700 flex items-center justify-center font-extrabold text-xl text-white border border-indigo-500">
                  {viewEmployee.firstName ? viewEmployee.firstName[0].toUpperCase() : 'E'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewEmployee.fullName}</h3>
                  <p className="text-xs text-indigo-200">
                    {viewEmployee.employeeCode} • {viewEmployee.employeeId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewEmployee(null)}
                className="text-indigo-300 hover:text-white p-1 rounded-lg hover:bg-indigo-800 transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Badges Bar */}
              <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                  Dept: {viewEmployee.departmentName || 'General'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Designation: {viewEmployee.designationName || '--'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  Type: {viewEmployee.employmentType || 'Permanent'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  Status: {viewEmployee.employeeStatus}
                </span>
              </div>

              {/* Grid 1: Personal Details */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Gender</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.gender || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.dateOfBirth || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Mobile Number</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Email Address</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.emailAddress || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Reporting Manager</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.reportingManager || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Date of Joining</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.dateOfJoining || '--'}</span>
                  </div>
                </div>
              </div>

              {/* Grid 2: Address */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                  Address Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Current Address</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.currentAddress || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Permanent Address</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.permanentAddress || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">City / State / Pincode</span>
                    <span className="font-semibold text-slate-800">
                      {[viewEmployee.city, viewEmployee.state, viewEmployee.pincode].filter(Boolean).join(', ') || '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 3: Identity & Emergency */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                  Identity & Emergency Contact
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Aadhaar Number</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.aadhaarNumber || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">PAN Number</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.panNumber || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Driving Licence</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.drivingLicenceNumber || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Emergency Contact</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.emergencyContactName || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Relationship</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.relationship || '--'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium">Emergency Phone</span>
                    <span className="font-semibold text-slate-800">{viewEmployee.emergencyContactNumber || '--'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewEmployee(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
