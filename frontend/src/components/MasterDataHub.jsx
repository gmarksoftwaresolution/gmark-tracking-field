import { useState, useEffect } from 'react';
import {
  getRoles, createRole, updateRole, toggleRoleActive, assignRolePermissions, getPermissions,
  getBranches, createBranch, updateBranch, toggleBranchActive,
  getDepartments, createDepartment, updateDepartment, toggleDepartmentActive,
  getDesignations, createDesignation, updateDesignation, toggleDesignationActive,
  getShifts, createShift, updateShift, toggleShiftActive,
  getLeaveTypes, createLeaveType, updateLeaveType, toggleLeaveTypeActive,
  getHolidays, createHoliday, updateHoliday, toggleHolidayActive
} from '../services/api';

export default function MasterDataHub() {
  const [subTab, setSubTab] = useState('roles');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Data states
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, [subTab]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (subTab === 'roles') {
        const [rData, pData] = await Promise.all([getRoles(), getPermissions()]);
        setRoles(rData || []);
        setPermissions(pData || []);
      } else if (subTab === 'branches') {
        const data = await getBranches();
        setBranches(data || []);
      } else if (subTab === 'departments') {
        const data = await getDepartments();
        setDepartments(data || []);
      } else if (subTab === 'designations') {
        const data = await getDesignations();
        setDesignations(data || []);
      } else if (subTab === 'shifts') {
        const data = await getShifts();
        setShifts(data || []);
      } else if (subTab === 'leave-types') {
        const data = await getLeaveTypes();
        setLeaveTypes(data || []);
      } else if (subTab === 'holidays') {
        const [hData, bData] = await Promise.all([getHolidays(), getBranches()]);
        setHolidays(hData || []);
        setBranches(bData || []);
      }
    } catch (err) {
      showToast('Error loading master data: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    if (subTab === 'roles') {
      setFormData({ roleName: '', roleCode: '', description: '', isActive: true });
    } else if (subTab === 'branches') {
      setFormData({ branchName: '', branchCode: '', city: '', state: '', isActive: true });
    } else if (subTab === 'departments') {
      setFormData({ departmentName: '', departmentCode: '', isActive: true });
    } else if (subTab === 'designations') {
      setFormData({ designationName: '', designationCode: '', isActive: true });
    } else if (subTab === 'shifts') {
      setFormData({
        shiftName: '', shiftCode: '', startTime: '09:00', endTime: '18:00',
        breakDurationMinutes: 60, gracePeriodMinutes: 15,
        halfDayHoursThreshold: 4.5, fullDayHoursThreshold: 8.0,
        isOvernight: false, isActive: true
      });
    } else if (subTab === 'leave-types') {
      setFormData({ leaveTypeName: '', leaveTypeCode: '', maxDaysPerYear: 12, isPaid: true, isActive: true });
    } else if (subTab === 'holidays') {
      setFormData({ holidayName: '', holidayDate: new Date().toISOString().split('T')[0], holidayType: 'Company', branchId: '', isActive: true });
    }
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    if (subTab === 'roles') {
      setFormData({ roleName: item.roleName, roleCode: item.roleCode, description: item.description || '', isActive: item.isActive });
    } else if (subTab === 'branches') {
      setFormData({ branchName: item.branchName, branchCode: item.branchCode, city: item.city || '', state: item.state || '', isActive: item.isActive });
    } else if (subTab === 'departments') {
      setFormData({ departmentName: item.departmentName, departmentCode: item.departmentCode, isActive: item.isActive });
    } else if (subTab === 'designations') {
      setFormData({ designationName: item.designationName, designationCode: item.designationCode, isActive: item.isActive });
    } else if (subTab === 'shifts') {
      setFormData({
        shiftName: item.shiftName, shiftCode: item.shiftCode,
        startTime: item.startTime, endTime: item.endTime,
        breakDurationMinutes: item.breakDurationMinutes, gracePeriodMinutes: item.gracePeriodMinutes,
        halfDayHoursThreshold: item.halfDayHoursThreshold, fullDayHoursThreshold: item.fullDayHoursThreshold,
        isOvernight: item.isOvernight, isActive: item.isActive
      });
    } else if (subTab === 'leave-types') {
      setFormData({ leaveTypeName: item.leaveTypeName, leaveTypeCode: item.leaveTypeCode, maxDaysPerYear: item.maxDaysPerYear, isPaid: item.isPaid, isActive: item.isActive });
    } else if (subTab === 'holidays') {
      setFormData({
        holidayName: item.holidayName,
        holidayDate: item.holidayDate ? new Date(item.holidayDate).toISOString().split('T')[0] : '',
        holidayType: item.holidayType,
        branchId: item.branchId || '',
        isActive: item.isActive
      });
    }
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (subTab === 'roles') {
        if (editingItem) await updateRole(editingItem.id, formData);
        else await createRole(formData);
      } else if (subTab === 'branches') {
        if (editingItem) await updateBranch(editingItem.id, formData);
        else await createBranch(formData);
      } else if (subTab === 'departments') {
        if (editingItem) await updateDepartment(editingItem.id, formData);
        else await createDepartment(formData);
      } else if (subTab === 'designations') {
        if (editingItem) await updateDesignation(editingItem.id, formData);
        else await createDesignation(formData);
      } else if (subTab === 'shifts') {
        const payload = {
          ...formData,
          breakDurationMinutes: parseInt(formData.breakDurationMinutes),
          gracePeriodMinutes: parseInt(formData.gracePeriodMinutes),
          halfDayHoursThreshold: parseFloat(formData.halfDayHoursThreshold),
          fullDayHoursThreshold: parseFloat(formData.fullDayHoursThreshold)
        };
        if (editingItem) await updateShift(editingItem.id, payload);
        else await createShift(payload);
      } else if (subTab === 'leave-types') {
        const payload = { ...formData, maxDaysPerYear: parseInt(formData.maxDaysPerYear) };
        if (editingItem) await updateLeaveType(editingItem.id, payload);
        else await createLeaveType(payload);
      } else if (subTab === 'holidays') {
        const payload = {
          ...formData,
          holidayDate: new Date(formData.holidayDate).toISOString(),
          branchId: formData.branchId ? parseInt(formData.branchId) : null
        };
        if (editingItem) await updateHoliday(editingItem.id, payload);
        else await createHoliday(payload);
      }

      showToast(`${editingItem ? 'Updated' : 'Created'} successfully!`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      if (subTab === 'roles') await toggleRoleActive(id);
      else if (subTab === 'branches') await toggleBranchActive(id);
      else if (subTab === 'departments') await toggleDepartmentActive(id);
      else if (subTab === 'designations') await toggleDesignationActive(id);
      else if (subTab === 'shifts') await toggleShiftActive(id);
      else if (subTab === 'leave-types') await toggleLeaveTypeActive(id);
      else if (subTab === 'holidays') await toggleHolidayActive(id);

      showToast('Status updated successfully');
      fetchData();
    } catch (err) {
      showToast('Status update failed', 'error');
    }
  };

  const subTabs = [
    {
      id: 'roles',
      label: 'Roles & Permissions',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    },
    {
      id: 'branches',
      label: 'Branch / Area',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6m-6-14h.01M10 7h.01M10 11h.01M10 15h.01M14 7h.01M14 11h.01M14 15h.01" />
        </svg>
      )
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    {
      id: 'designations',
      label: 'Designations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387M3.75 14.15c-.75 0-1.411-.37-1.8-.938a2.18 2.18 0 01-.45-1.328V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m4.5 8.006h4.5m-4.5 0v2.25m4.5-2.25v2.25M9 6.146V4.75C9 3.784 9.784 3 10.75 3h2.5c.966 0 1.75.784 1.75 1.75v1.396m-6 0a48.108 48.108 0 016 0" />
        </svg>
      )
    },
    {
      id: 'shifts',
      label: 'Shift Master',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'leave-types',
      label: 'Leave Types',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm-3 0h.008v.008H9V15zm0-2.25h.008v.008H9v-.008zM15 15h.008v.008H15V15zm0-2.25h.008v.008H15v-.008z" />
        </svg>
      )
    },
    {
      id: 'holidays',
      label: 'Holiday Calendar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-10.5-1.5l2.25 2.25 4.5-4.5" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Master Data Hub</h2>
          <p className="text-sm text-slate-500">Configure core organizational entities, shifts, leaves, and roles</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New {subTabs.find(t => t.id === subTab)?.label.split(' ')[0]}</span>
        </button>
      </div>

      {/* Toast Notification */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              subTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading master records...</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Roles Table */}
            {subTab === 'roles' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Role Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{r.roleName}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs"><span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold">{r.roleCode}</span></td>
                      <td className="px-6 py-4 text-slate-500">{r.description || '--'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenEditModal(r)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer">Edit</button>
                        <button onClick={() => handleToggleActive(r.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition cursor-pointer">Toggle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Branches Table */}
            {subTab === 'branches' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Branch Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">City / State</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No branches added yet. Click "Add New Branch" to create one.</td></tr>
                  ) : (
                    branches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{b.branchName}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs"><span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold">{b.branchCode}</span></td>
                        <td className="px-6 py-4 text-slate-500">{[b.city, b.state].filter(Boolean).join(', ') || '--'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {b.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleOpenEditModal(b)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer">Edit</button>
                          <button onClick={() => handleToggleActive(b.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition cursor-pointer">Toggle</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Departments Table */}
            {subTab === 'departments' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Department Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No departments added yet. Click "Add New Department" to create one.</td></tr>
                  ) : (
                    departments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{d.departmentName}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs"><span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold">{d.departmentCode}</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${d.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleOpenEditModal(d)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer">Edit</button>
                          <button onClick={() => handleToggleActive(d.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition cursor-pointer">Toggle</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Designations Table */}
            {subTab === 'designations' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Designation Name</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {designations.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No designations added yet. Click "Add New Designation" to create one.</td></tr>
                  ) : (
                    designations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{d.designationName}</td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs"><span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold">{d.designationCode}</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${d.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {d.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleOpenEditModal(d)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer">Edit</button>
                          <button onClick={() => handleToggleActive(d.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition cursor-pointer">Toggle</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Shift Master Table */}
            {subTab === 'shifts' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Shift Name</th>
                    <th className="px-6 py-4">Timing</th>
                    <th className="px-6 py-4">Grace Period</th>
                    <th className="px-6 py-4">Thresholds (Half/Full)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{s.shiftName} <span className="text-xs font-mono font-normal text-slate-400">({s.shiftCode})</span></td>
                      <td className="px-6 py-4 font-semibold text-blue-600">{s.startTime} - {s.endTime}</td>
                      <td className="px-6 py-4 text-slate-600">{s.gracePeriodMinutes} mins</td>
                      <td className="px-6 py-4 text-slate-600">{s.halfDayHoursThreshold} hrs / {s.fullDayHoursThreshold} hrs</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenEditModal(s)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer">Edit</button>
                        <button onClick={() => handleToggleActive(s.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition cursor-pointer">Toggle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Leave Types Table */}
            {subTab === 'leave-types' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Leave Type</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Max Days / Year</th>
                    <th className="px-6 py-4">Paid / Unpaid</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveTypes.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{l.leaveTypeName}</td>
                      <td className="px-6 py-4 font-mono text-xs"><span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold">{l.leaveTypeCode}</span></td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{l.maxDaysPerYear} days</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${l.isPaid ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                          {l.isPaid ? 'Paid' : 'Unpaid (LOP)'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${l.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {l.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenEditModal(l)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer">Edit</button>
                        <button onClick={() => handleToggleActive(l.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition cursor-pointer">Toggle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Holidays Table */}
            {subTab === 'holidays' && (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Holiday Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holidays.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No holidays added yet. Click "Add New Holiday" to add one.</td></tr>
                  ) : (
                    holidays.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{h.holidayName}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600">{new Date(h.holidayDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-6 py-4 text-slate-600"><span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold text-xs">{h.holidayType}</span></td>
                        <td className="px-6 py-4 text-slate-500">{h.branchName || 'All Branches'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${h.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {h.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleOpenEditModal(h)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition cursor-pointer">Edit</button>
                          <button onClick={() => handleToggleActive(h.id)} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-semibold text-xs transition cursor-pointer">Toggle</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingItem ? 'Edit' : 'Add New'} {subTabs.find(t => t.id === subTab)?.label}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-sm">
              {/* Dynamic inputs based on subTab */}
              {subTab === 'roles' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role Name *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData.roleName || ''} onChange={e => setFormData({ ...formData, roleName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role Code *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs uppercase" value={formData.roleCode || ''} onChange={e => setFormData({ ...formData, roleCode: e.target.value.toUpperCase() })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea rows="2" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </>
              )}

              {subTab === 'branches' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData.branchName || ''} onChange={e => setFormData({ ...formData, branchName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch Code *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs uppercase" value={formData.branchCode || ''} onChange={e => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                      <input type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                      <input type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {(subTab === 'departments' || subTab === 'designations') && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{subTab === 'departments' ? 'Department' : 'Designation'} Name *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData[subTab === 'departments' ? 'departmentName' : 'designationName'] || ''} onChange={e => setFormData({ ...formData, [subTab === 'departments' ? 'departmentName' : 'designationName']: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{subTab === 'departments' ? 'Department' : 'Designation'} Code *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs uppercase" value={formData[subTab === 'departments' ? 'departmentCode' : 'designationCode'] || ''} onChange={e => setFormData({ ...formData, [subTab === 'departments' ? 'departmentCode' : 'designationCode']: e.target.value.toUpperCase() })} />
                  </div>
                </>
              )}

              {subTab === 'shifts' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift Name *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData.shiftName || ''} onChange={e => setFormData({ ...formData, shiftName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift Code *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs uppercase" value={formData.shiftCode || ''} onChange={e => setFormData({ ...formData, shiftCode: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Start Time (HH:mm)</label>
                      <input required type="text" placeholder="09:00" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold" value={formData.startTime || ''} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">End Time (HH:mm)</label>
                      <input required type="text" placeholder="18:00" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Grace Period (Mins)</label>
                      <input required type="number" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.gracePeriodMinutes || 15} onChange={e => setFormData({ ...formData, gracePeriodMinutes: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Break Duration (Mins)</label>
                      <input required type="number" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.breakDurationMinutes || 60} onChange={e => setFormData({ ...formData, breakDurationMinutes: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Half-Day Threshold (Hrs)</label>
                      <input required type="number" step="0.5" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.halfDayHoursThreshold || 4.5} onChange={e => setFormData({ ...formData, halfDayHoursThreshold: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full-Day Threshold (Hrs)</label>
                      <input required type="number" step="0.5" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.fullDayHoursThreshold || 8.0} onChange={e => setFormData({ ...formData, fullDayHoursThreshold: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {subTab === 'leave-types' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type Name *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData.leaveTypeName || ''} onChange={e => setFormData({ ...formData, leaveTypeName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type Code *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs uppercase" value={formData.leaveTypeCode || ''} onChange={e => setFormData({ ...formData, leaveTypeCode: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Max Days / Year</label>
                      <input required type="number" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.maxDaysPerYear || 12} onChange={e => setFormData({ ...formData, maxDaysPerYear: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Paid Status</label>
                      <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.isPaid ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isPaid: e.target.value === 'true' })}>
                        <option value="true">Paid Leave</option>
                        <option value="false">Unpaid (LOP)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {subTab === 'holidays' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name *</label>
                    <input required type="text" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData.holidayName || ''} onChange={e => setFormData({ ...formData, holidayName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Date *</label>
                    <input required type="date" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium" value={formData.holidayDate || ''} onChange={e => setFormData({ ...formData, holidayDate: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Type</label>
                      <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.holidayType || 'Company'} onChange={e => setFormData({ ...formData, holidayType: e.target.value })}>
                        <option value="Company">Company</option>
                        <option value="National">National</option>
                        <option value="Regional">Regional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Branch (Optional)</label>
                      <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900" value={formData.branchId || ''} onChange={e => setFormData({ ...formData, branchId: e.target.value })}>
                        <option value="">All Branches</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.branchName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer">{editingItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
