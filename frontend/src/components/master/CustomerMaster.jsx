import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerMasters, getNextCustomerCode, createCustomerMaster } from '../../services/api';

const MOCK_CUSTOMERS = [
  {
    id: 201,
    customerCode: 'CUST-001',
    customerId: 'CUST-2026-001',
    name: 'Ramesh Patil Traders',
    mobileNumber: '+91 98220 44556',
    villageCity: 'Kolhapur',
    status: 'Active'
  },
  {
    id: 202,
    customerCode: 'CUST-002',
    customerId: 'CUST-2026-002',
    name: 'Shree Ganesh Agro Agency',
    mobileNumber: '+91 97631 88990',
    villageCity: 'Bidri',
    status: 'Active'
  },
  {
    id: 203,
    customerCode: 'CUST-003',
    customerId: 'CUST-2026-003',
    name: 'Maheshwari Enterprise',
    mobileNumber: '+91 94211 22334',
    villageCity: 'Kumbharwada',
    status: 'Active'
  },
  {
    id: 204,
    customerCode: 'CUST-004',
    customerId: 'CUST-2026-004',
    name: 'Kadam General Store',
    mobileNumber: '+91 98905 66778',
    villageCity: 'Nesari',
    status: 'Inactive'
  },
  {
    id: 205,
    customerCode: 'CUST-005',
    customerId: 'CUST-2026-005',
    name: 'Waghrali Agro Center',
    mobileNumber: '+91 91582 33445',
    villageCity: 'Waghrali',
    status: 'Active'
  }
];

export default function CustomerMaster() {
  const navigate = useNavigate();
  const [dbCustomers, setDbCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    customerCode: '',
    customerId: '',
    customerName: '',
    mobileNumber: '',
    email: '',
    customerCategory: 'Dealer',
    address: '',
    village: '',
    taluka: '',
    district: '',
    state: '',
    pincode: '',
    status: 'Active'
  });

  // Fetch DB customers
  const fetchDbCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomerMasters();
      if (Array.isArray(data)) {
        setDbCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch DB customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbCustomers();
  }, []);

  // Combine mock data and DB data
  const combinedCustomers = [
    ...dbCustomers.map((c) => ({
      id: c.id,
      customerCode: c.customerCode,
      customerId: c.customerId,
      name: c.customerName,
      mobileNumber: c.mobileNumber,
      villageCity: c.village || c.city || 'N/A',
      status: c.status || 'Active',
      isDbRecord: true,
      raw: c
    })),
    ...MOCK_CUSTOMERS
  ];

  // Open Add Customer Modal
  const handleAddCustomerClick = async () => {
    setFormErrors({});
    setFormData({
      customerCode: '',
      customerId: '',
      customerName: '',
      mobileNumber: '',
      email: '',
      customerCategory: 'Dealer',
      address: '',
      village: '',
      taluka: '',
      district: '',
      state: '',
      pincode: '',
      status: 'Active'
    });

    setShowModal(true);

    try {
      const codeRes = await getNextCustomerCode();
      if (codeRes) {
        setFormData((prev) => ({
          ...prev,
          customerCode: codeRes.nextCode || '',
          customerId: codeRes.nextBusinessId || ''
        }));
      }
    } catch (err) {
      console.error('Failed to fetch next customer code:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Temporary validation for testing only. Full validation will be restored later.
  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer Name is required.';
    }
    if (!formData.customerId.trim()) {
      errors.customerId = 'Customer ID is required.';
    }
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile Number is required.';
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = 'Mobile Number must be exactly 10 digits.';
    }

    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = 'Invalid Email format.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        customerCode: formData.customerCode?.trim() || null,
        customerId: formData.customerId.trim(),
        customerName: formData.customerName.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email?.trim() || null,
        customerCategory: formData.customerCategory?.trim() || null,
        address: formData.address?.trim() || null,
        village: formData.village?.trim() || null,
        taluka: formData.taluka?.trim() || null,
        district: formData.district?.trim() || null,
        state: formData.state?.trim() || null,
        pincode: formData.pincode?.trim() || null,
        status: formData.status || 'Active'
      };

      await createCustomerMaster(payload);
      alert('Customer record saved successfully!');
      setShowModal(false);
      fetchDbCustomers();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to save customer record.';
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Extract unique locations for filter dropdown
  const locationOptions = Array.from(new Set(combinedCustomers.map((c) => c.villageCity)));

  // Filtered customer list
  const filteredCustomers = combinedCustomers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust.customerId && cust.customerId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cust.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.villageCity.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All' ||
      cust.status.toLowerCase() === selectedStatus.toLowerCase();

    const matchesLocation =
      selectedLocation === 'All' ||
      cust.villageCity.toLowerCase() === selectedLocation.toLowerCase();

    return matchesSearch && matchesStatus && matchesLocation;
  });

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Header */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin-dashboard/masters')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Masters
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Customer Master</h1>
              <p className="text-sm text-slate-500 font-medium">Customer Master Records</p>
            </div>
          </div>
        </div>

        {/* Add Customer Button */}
        <div>
          <button
            onClick={handleAddCustomerClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by Code, ID, Name, Mobile or Village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
          >
            <option value="All">All Locations</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100">
              {filteredCustomers.length} Total
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Customer Code</th>
                <th className="py-3.5 px-6">Customer ID</th>
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-6">Mobile Number</th>
                <th className="py-3.5 px-6">Village / City</th>
                <th className="py-3.5 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Loading customer directory...
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-emerald-600">
                      {cust.customerCode}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-600">
                      {cust.customerId || '--'}
                    </td>
                    <td className="py-4 px-6 text-slate-900 font-bold">
                      {cust.name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono">
                      {cust.mobileNumber}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {cust.villageCity}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          cust.status.toLowerCase() === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            cust.status.toLowerCase() === 'active'
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                        ></span>
                        {cust.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No customers found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal Drawer */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Customer</h3>
                  <p className="text-xs text-slate-500">Enter customer master details below</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Code
                  </label>
                  <input
                    type="text"
                    name="customerCode"
                    value={formData.customerCode}
                    onChange={handleInputChange}
                    placeholder="e.g. CUST0001"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      formErrors.customerCode
                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.customerCode && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.customerCode}</p>
                  )}
                </div>

                {/* Customer ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    placeholder="e.g. CUST-2026-001"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      formErrors.customerId
                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.customerId && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.customerId}</p>
                  )}
                </div>

                {/* Customer Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Full Customer / Firm Name"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      formErrors.customerName
                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.customerName && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.customerName}</p>
                  )}
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobileNumber"
                    maxLength={10}
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    placeholder="10-digit Mobile Number"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      formErrors.mobileNumber
                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.mobileNumber && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.mobileNumber}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="customer@example.com"
                    className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                      formErrors.email
                        ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{formErrors.email}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Category
                  </label>
                  <select
                    name="customerCategory"
                    value={formData.customerCategory}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
                  >
                    <option value="Dealer">Dealer</option>
                    <option value="Agency">Agency</option>
                    <option value="Dairy Farmer">Dairy Farmer</option>
                    <option value="Retailer">Retailer</option>
                  </select>
                </div>

                {/* Village */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Village / City
                  </label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Village or City Name"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Taluka */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Taluka
                  </label>
                  <input
                    type="text"
                    name="taluka"
                    value={formData.taluka}
                    onChange={handleInputChange}
                    placeholder="Taluka"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="District"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit Pincode"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Full Street Address"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
