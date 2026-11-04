import React, { useState, useEffect } from 'react';
import { getPendingDevices, getDeviceHistory, approveDevice, rejectDevice } from '../services/api';

export default function DeviceManagement() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [pendingDevices, setPendingDevices] = useState([]);
  const [historyDevices, setHistoryDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingData, histData] = await Promise.all([
        getPendingDevices(),
        getDeviceHistory(historyFilter === 'ALL' ? null : historyFilter)
      ]);
      setPendingDevices(pendingData || []);
      setHistoryDevices(histData || []);
    } catch (err) {
      console.error("Failed to fetch device data:", err);
      showToast(err.response?.data?.message || "Failed to load device data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [historyFilter]);

  // Periodic polling every 4 seconds for pending approvals so incoming requests pop up live!
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getPendingDevices();
        setPendingDevices(data || []);
      } catch (err) {
        // silent polling catch
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const executeApprove = async () => {
    if (!confirmModal) return;
    const { id, employeeName } = confirmModal;
    setConfirmModal(null);

    setActionLoadingId(id);
    try {
      const res = await approveDevice(id);
      showToast(res.message || `Device approved for ${employeeName}. Previous device unlinked.`, "success");
      setPendingDevices(prev => prev.filter(d => d.id !== id));
      const histData = await getDeviceHistory(historyFilter === 'ALL' ? null : historyFilter);
      setHistoryDevices(histData || []);
    } catch (err) {
      console.error("Error approving device:", err);
      showToast(err.response?.data?.message || "Failed to approve device.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const executeReject = async () => {
    if (!confirmModal) return;
    const { id, employeeName } = confirmModal;
    setConfirmModal(null);

    setActionLoadingId(id);
    try {
      const res = await rejectDevice(id);
      showToast(res.message || `Device request rejected for ${employeeName}.`, "info");
      setPendingDevices(prev => prev.filter(d => d.id !== id));
      const histData = await getDeviceHistory(historyFilter === 'ALL' ? null : historyFilter);
      setHistoryDevices(histData || []);
    } catch (err) {
      console.error("Error rejecting device:", err);
      showToast(err.response?.data?.message || "Failed to reject device.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopy = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filter items
  const filteredPending = pendingDevices.filter(d => {
    const term = searchTerm.toLowerCase();
    return (
      (d.employeeName && d.employeeName.toLowerCase().includes(term)) ||
      (d.employeeCode && d.employeeCode.toLowerCase().includes(term)) ||
      (d.deviceName && d.deviceName.toLowerCase().includes(term)) ||
      (d.deviceId && d.deviceId.toLowerCase().includes(term))
    );
  });

  const filteredHistory = historyDevices.filter(d => {
    const term = searchTerm.toLowerCase();
    return (
      (d.employeeName && d.employeeName.toLowerCase().includes(term)) ||
      (d.employeeCode && d.employeeCode.toLowerCase().includes(term)) ||
      (d.deviceName && d.deviceName.toLowerCase().includes(term)) ||
      (d.deviceId && d.deviceId.toLowerCase().includes(term))
    );
  });

  // Calculate statistics
  const approvedCount = historyDevices.filter(d => d.status === 'Approved').length;
  const revokedCount = historyDevices.filter(d => d.status === 'Revoked').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">✓ APPROVED</span>;
      case 'Pending':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">⏳ PENDING</span>;
      case 'Rejected':
        return <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">✗ REJECTED</span>;
      case 'Revoked':
        return <span className="bg-slate-200 text-slate-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-slate-300">🔄 REVOKED (UNLINKED)</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getDeviceIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('iphone') || n.includes('ipad') || n.includes('apple')) return '🍎';
    if (n.includes('android') || n.includes('samsung') || n.includes('xiaomi') || n.includes('redmi') || n.includes('vivo') || n.includes('oppo') || n.includes('realme') || n.includes('oneplus')) return '🤖';
    if (n.includes('windows') || n.includes('mac') || n.includes('pc')) return '💻';
    return '📱';
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-red-600 text-white border-red-700' 
            : (toast.type === 'info' ? 'bg-slate-800 text-white border-slate-900' : 'bg-emerald-600 text-white border-emerald-700')
        }`}>
          <span className="text-base">{toast.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div 
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            activeTab === 'pending'
              ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-orange-400 shadow-md ring-2 ring-orange-200'
              : 'bg-white border-slate-200 hover:border-orange-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">Pending Requests</span>
            <span className="text-xl">⏳</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{pendingDevices.length}</span>
            {pendingDevices.length > 0 && (
              <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">
                Needs Attention
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Unapproved devices waiting for admin verification</p>
        </div>

        {/* Approved Card */}
        <div 
          onClick={() => { setActiveTab('history'); setHistoryFilter('Approved'); }}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            activeTab === 'history' && historyFilter === 'Approved'
              ? 'bg-emerald-50 border-emerald-400 shadow-md ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Active Bound Devices</span>
            <span className="text-xl">📱</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{approvedCount}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              Single-Device Bound
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Verified devices permitted for field attendance</p>
        </div>

        {/* Revoked / Unlinked Card */}
        <div 
          onClick={() => { setActiveTab('history'); setHistoryFilter('Revoked'); }}
          className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
            activeTab === 'history' && historyFilter === 'Revoked'
              ? 'bg-slate-100 border-slate-400 shadow-md ring-2 ring-slate-300'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Unlinked (Revoked)</span>
            <span className="text-xl">🔄</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{revokedCount}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
              Auto-Revoked
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Previous phones automatically logged out</p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">

        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
              <span>🛡️</span> Device Approval &amp; Single-Device Binding
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enforcing strict <strong>1-Employee = 1-Approved-Phone</strong> security to eliminate buddy punching and unauthorized logins.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/80">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                  activeTab === 'pending'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pending Approvals</span>
                {pendingDevices.length > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                    {pendingDevices.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Device History &amp; Audit
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
              title="Refresh Data"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee, employee code, phone model, device ID..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-slate-400 font-medium"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {activeTab === 'history' && (
            <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
              <span className="font-bold text-slate-600">Filter Status:</span>
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="Approved">Approved Only</option>
                <option value="Revoked">Revoked (Unlinked)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: PENDING APPROVALS */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {filteredPending.length === 0 ? (
              <div className="bg-slate-50/60 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
                  ✓
                </div>
                <h3 className="font-black text-slate-800 text-lg">No Pending Device Requests</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  All employee accounts are safely bound to their verified phones. When an employee logs in from an unapproved phone, their request will appear here instantly in real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPending.map(dev => (
                  <div 
                    key={dev.id}
                    className="bg-white rounded-3xl border-2 border-amber-300 shadow-md hover:shadow-xl transition-all p-6 flex flex-col justify-between relative overflow-hidden group"
                  >
                    {/* Top alert bar */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500"></div>

                    <div className="space-y-4 pt-1">
                      {/* Employee Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getDeviceIcon(dev.deviceName)}</span>
                            <h4 className="font-black text-slate-900 text-lg tracking-tight">
                              {dev.employeeName}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold border border-slate-200">
                              Code: {dev.employeeCode}
                            </span>
                            {dev.assignedArea && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">
                                {dev.assignedArea}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                          Pending
                        </span>
                      </div>

                      {/* Device Details Box */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">New Device Model:</span>
                          <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            {dev.deviceName || "Unspecified Model"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80">
                          <span className="text-slate-500 font-medium">Hardware Device ID:</span>
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <span className="truncate max-w-[150px] font-bold">{dev.deviceId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(dev.deviceId, dev.id)}
                              className="text-blue-600 hover:text-blue-800 font-extrabold ml-1 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                              title="Copy full Device ID"
                            >
                              {copiedId === dev.id ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 text-[11px]">
                          <span className="text-slate-500 font-medium">Requested At:</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(dev.requestedAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>

                        {/* Request Location Section - Always Visible */}
                        <div className="pt-2 border-t border-slate-200/80 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-medium flex items-center gap-1">
                              <span className="text-rose-500">📍</span>
                              <span>Request Location:</span>
                            </span>
                            <span className="font-extrabold text-slate-900 text-right truncate max-w-[190px]">
                              {dev.locationName || (dev.assignedArea ? `${dev.assignedArea}, Maharashtra` : "Maharashtra, India")}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span className="font-mono text-slate-600">
                              {dev.latitude && dev.longitude ? (
                                `${dev.latitude.toFixed(4)}° N, ${dev.longitude.toFixed(4)}° E`
                              ) : (
                                "Area Location"
                              )}
                            </span>

                            <a
                              href={
                                dev.latitude && dev.longitude
                                  ? `https://www.google.com/maps/search/?api=1&query=${dev.latitude},${dev.longitude}`
                                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((dev.locationName || dev.assignedArea || 'Maharashtra') + ', India')}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-50/80 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                              title="Open location on Google Maps"
                            >
                              <span>🗺️ View on Map ↗</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Submitted Reason Box */}
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 text-xs space-y-1">
                        <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <span>💬</span>
                          <span>Employee Reason for Phone Change</span>
                        </span>
                        <p className="text-amber-950 font-medium italic text-xs leading-relaxed">
                          "{dev.reason || 'Login attempted from an unapproved device.'}"
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmModal({
                          type: 'reject',
                          id: dev.id,
                          employeeName: dev.employeeName,
                          deviceName: dev.deviceName,
                          reason: dev.reason,
                          location: dev.locationName || (dev.assignedArea ? `${dev.assignedArea}, Maharashtra` : "Maharashtra, India")
                        })}
                        disabled={actionLoadingId === dev.id}
                        className="px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Reject Request
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmModal({
                          type: 'approve',
                          id: dev.id,
                          employeeName: dev.employeeName,
                          deviceName: dev.deviceName,
                          reason: dev.reason,
                          location: dev.locationName || (dev.assignedArea ? `${dev.assignedArea}, Maharashtra` : "Maharashtra, India")
                        })}
                        disabled={actionLoadingId === dev.id}
                        className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {actionLoadingId === dev.id ? (
                          <span>Binding device...</span>
                        ) : (
                          <>
                            <span className="text-sm">✓</span>
                            <span>Approve &amp; Bind Device</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEVICE HISTORY & AUDIT */}
        {activeTab === 'history' && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-4 px-4">Employee</th>
                    <th className="py-4 px-4">Device Model &amp; ID</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4">Reason / Notes</th>
                    <th className="py-4 px-4">Requested At</th>
                    <th className="py-4 px-4">Action By</th>
                    <th className="py-4 px-4">Action Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No device history matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(dev => (
                      <tr key={dev.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{getDeviceIcon(dev.deviceName)}</span>
                            <span>{dev.employeeName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{dev.employeeCode}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-800">{dev.deviceName || "Unspecified"}</div>
                          <div className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={dev.deviceId}>
                            {dev.deviceId}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {getStatusBadge(dev.status)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <span className="text-rose-500">📍</span>
                            <span className="truncate max-w-[130px]" title={dev.locationName || (dev.assignedArea ? `${dev.assignedArea}, Maharashtra` : 'Maharashtra, India')}>
                              {dev.locationName || (dev.assignedArea ? `${dev.assignedArea}, Maharashtra` : 'Maharashtra, India')}
                            </span>
                          </div>
                          {dev.latitude && dev.longitude ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${dev.latitude},${dev.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:underline font-mono inline-block mt-0.5"
                            >
                              {dev.latitude.toFixed(3)}, {dev.longitude.toFixed(3)} ↗
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">Assigned Area</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 truncate" title={dev.reason || '--'}>
                            {dev.reason || '--'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(dev.requestedAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" })}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {dev.actionBy || '--'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {dev.actionAt 
                            ? new Date(dev.actionAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" }) 
                            : '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* IN-APP POPUP CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150 relative text-left"
            role="dialog"
            aria-modal="true"
          >
            {/* Top Close Button */}
            <button
              onClick={() => setConfirmModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon & Title */}
            <div className="flex items-start gap-4 pr-6">
              {confirmModal.type === 'approve' ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  🛡️
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-xl font-black shrink-0 shadow-inner">
                  ✕
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {confirmModal.type === 'approve' ? 'Approve Device Request?' : 'Reject Device Request?'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {confirmModal.type === 'approve'
                    ? `Approve this new device for ${confirmModal.employeeName}? Any previous approved phone will be immediately unlinked and logged out.`
                    : `Reject this device request for ${confirmModal.employeeName}?`}
                </p>
              </div>
            </div>

            {/* Target details card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Employee Name:</span>
                <span className="font-bold text-slate-900">{confirmModal.employeeName}</span>
              </div>
              {confirmModal.deviceName && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Device Model:</span>
                  <span className="font-semibold text-slate-800">{confirmModal.deviceName}</span>
                </div>
              )}
              {confirmModal.location && (
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Request Location:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <span className="text-rose-500">📍</span>
                    <span>{confirmModal.location}</span>
                  </span>
                </div>
              )}
              {confirmModal.reason && (
                <div className="pt-1.5 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium block mb-0.5">Submitted Reason:</span>
                  <span className="text-slate-700 italic font-medium">"${confirmModal.reason}"</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              {confirmModal.type === 'approve' ? (
                <button
                  type="button"
                  onClick={executeApprove}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Confirm &amp; Bind Device</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={executeReject}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <span>✕</span>
                  <span>Confirm Reject</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
