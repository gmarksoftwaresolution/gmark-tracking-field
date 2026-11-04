import React, { useState, useEffect } from 'react';
import { reverseGeocode } from '../utils/deviceHelper';

const REASON_PRESETS = [
  "📱 Upgraded to new phone",
  "🔧 Phone repaired / Screen replaced",
  "🔄 Temporary replacement phone",
  "💼 Factory reset device",
  "⚡ Switched to company device"
];

const LOCATION_PRESETS = [
  { name: "Sarsenapati Prataprao Gujar Chowk, Nesari, Maharashtra", lat: 16.0682, lng: 74.3315, label: "Nesari" },
  { name: "Gadhinglaj, Maharashtra", lat: 16.2227, lng: 74.3519, label: "Gadhinglaj" },
  { name: "Chandgad, Maharashtra", lat: 15.9328, lng: 74.3644, label: "Chandgad" },
  { name: "Ajara, Maharashtra", lat: 16.1172, lng: 74.2057, label: "Ajara" },
  { name: "Kolhapur, Maharashtra", lat: 16.7050, lng: 74.2433, label: "Kolhapur" },
  { name: "Kagal, Maharashtra", lat: 16.5772, lng: 74.3168, label: "Kagal" }
];

export default function DeviceApprovalModal({ 
  isOpen, 
  deviceName, 
  deviceId, 
  employeeName, 
  reason, 
  onReasonChange, 
  onSubmitReason, 
  isSubmittingReason, 
  reasonSaved, 
  onCancel,
  errorMessage,
  status
}) {
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(() => {
    const savedAddress = localStorage.getItem('employeeLastAddress');
    const savedLat = parseFloat(localStorage.getItem('employeeLastLatitude') || '0');
    const savedLng = parseFloat(localStorage.getItem('employeeLastLongitude') || '0');
    if (savedLat && savedLng && savedAddress) {
      return { latitude: savedLat, longitude: savedLng, locationName: savedAddress };
    }
    return {
      latitude: 16.0682,
      longitude: 74.3315,
      locationName: "Sarsenapati Prataprao Gujar Chowk, Nesari, Maharashtra"
    };
  });

  useEffect(() => {
    if (!isOpen) return;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const locName = await reverseGeocode(lat, lng);
            setSelectedLocation({
              latitude: lat,
              longitude: lng,
              locationName: locName || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
            });
          } catch (e) {
            setSelectedLocation({
              latitude: lat,
              longitude: lng,
              locationName: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
            });
          }
        },
        () => {},
        { timeout: 4000, enableHighAccuracy: true }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (deviceId && navigator.clipboard) {
      navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isRejected = status === 'REJECTED';
  const isPendingApproval = status === 'PENDING' && (reasonSaved || Boolean(reason?.trim())) && !isEditingNote;

  const handlePresetClick = (preset) => {
    setValidationError('');
    onReasonChange(preset);
  };

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (!reason || !reason.trim()) {
      setValidationError("Please enter or select a note explaining this phone change before submitting to Admin.");
      return;
    }
    setValidationError('');
    setIsEditingNote(false);
    onSubmitReason(reason.trim(), selectedLocation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transition-all scale-100 animate-in zoom-in-95 duration-150">
        
        {/* Top Header Graphic */}
        <div className={`p-6 text-center text-white ${
          isRejected 
            ? 'bg-gradient-to-br from-red-500 to-rose-700' 
            : isPendingApproval
              ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600'
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            {isRejected ? (
              <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : isPendingApproval ? (
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/40 absolute animate-ping"></div>
                <svg className="w-9 h-9 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            ) : (
              <span className="text-3xl">📝</span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            {isRejected 
              ? "Device Request Rejected" 
              : isPendingApproval 
                ? "Awaiting Admin Approval" 
                : "New Device Detected"}
          </h2>
          <p className="text-xs text-white/90 mt-1 max-w-xs mx-auto leading-relaxed">
            {isRejected 
              ? "Your administrator did not approve this device. Please contact support."
              : isPendingApproval
                ? `Request with note sent to Admin for ${employeeName || 'your account'}.`
                : `Fill in the note below to request device approval from Admin for ${employeeName || 'your account'}.`}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Device & Location Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">Phone Model:</span>
              <span className="font-extrabold text-slate-800 flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span>📱</span>
                <span>{deviceName || "Mobile Device"}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/80">
              <span className="text-slate-500 font-semibold">Hardware ID:</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                <span className="truncate max-w-[140px] font-bold">{deviceId}</span>
                <button 
                  type="button"
                  onClick={handleCopyId}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[10px] ml-1 bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                  title="Copy full Device ID"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Location Section */}
            <div className="pt-1.5 border-t border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <span className="text-rose-500">📍</span>
                  <span>Detected Location:</span>
                </span>
                <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg text-right truncate max-w-[180px]" title={selectedLocation.locationName}>
                  {selectedLocation.locationName}
                </span>
              </div>

              {!isPendingApproval && !isRejected && (
                <div className="pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-bold">Select / Confirm Area:</span>
                    <span className="text-slate-400 font-mono text-[9px]">{selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {LOCATION_PRESETS.map((loc) => (
                      <button
                        key={loc.label}
                        type="button"
                        onClick={() => setSelectedLocation({ latitude: loc.lat, longitude: loc.lng, locationName: loc.name })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          selectedLocation.locationName === loc.name
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STAGE 1: FILL NOTE FIRST (MANDATORY BEFORE SENDING TO ADMIN) */}
          {!isRejected && !isPendingApproval && (
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3 text-xs text-blue-900 leading-snug">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <span>🛡️</span>
                  <span>Single-Device Policy Enforced</span>
                </p>
                <p className="text-[11px] text-blue-800">
                  Your account is linked to your previous phone. <strong>You must provide a note/reason</strong> before your request is sent to the Administrator.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Reason for Phone Change *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Required</span>
                </label>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {REASON_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        reason === preset 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border-slate-200 text-slate-600'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-1">
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                      setValidationError('');
                      onReasonChange(e.target.value);
                    }}
                    placeholder="Enter details (e.g. Bought a new Samsung Galaxy phone, previous phone screen broke)..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 bg-white"
                  />

                  {validationError && (
                    <p className="text-red-600 font-bold text-[11px] flex items-center gap-1 animate-shake">
                      <span>⚠️</span>
                      <span>{validationError}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingReason || !reason?.trim()}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingReason ? (
                  <span>Submitting Request to Admin...</span>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Submit Request to Admin</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STAGE 2: AWAITING ADMIN APPROVAL (NOTE ALREADY SUBMITTED) */}
          {!isRejected && isPendingApproval && (
            <div className="space-y-3">
              {/* Submitted Reason Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <span>✓</span>
                    <span>Note Sent to Administrator:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Edit Note
                  </button>
                </div>
                <p className="text-emerald-950 font-bold italic text-xs leading-relaxed">
                  "{reason}"
                </p>
                <div className="pt-1 text-[11px] text-emerald-800 flex items-center gap-1">
                  <span>📍</span>
                  <span>Location sent: <strong>{selectedLocation.locationName}</strong></span>
                </div>
              </div>

              {/* Real-time Polling Status with Radar Effect */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="relative flex items-center justify-center shrink-0">
                  <span className="w-4 h-4 rounded-full bg-amber-500 animate-ping absolute"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 relative"></span>
                </div>
                <div className="text-xs text-amber-950">
                  <p className="font-extrabold flex items-center gap-1">
                    <span>Admin Review Pending (Polling live...)</span>
                  </p>
                  <p className="text-[11px] text-amber-800 mt-1 leading-snug">
                    Your request with the note above is on the Admin's screen. Once the Admin clicks <strong>Approve</strong>, you will automatically enter the app without re-typing your password.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors text-center cursor-pointer"
            >
              {isRejected ? "Back to Login" : "Cancel / Return to Login"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
