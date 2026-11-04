import { useState, useEffect, useRef } from 'react';
import { getDeviceStatus, submitDeviceReason } from '../services/api';
import { getCurrentCoordinates } from '../utils/deviceHelper';

/**
 * Custom Hook: useDeviceApproval
 * Manages the fast 2-second polling lifecycle for pending device approval.
 */
export function useDeviceApproval({ employeeId, deviceId, onApproved, onRejected }) {
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'NOTE_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED'
  const [reason, setReason] = useState('');
  const [reasonSaved, setReasonSaved] = useState(false);
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const onApprovedRef = useRef(onApproved);
  const onRejectedRef = useRef(onRejected);

  useEffect(() => {
    onApprovedRef.current = onApproved;
    onRejectedRef.current = onRejected;
  }, [onApproved, onRejected]);

  // Fast 2-second Polling when in PENDING state
  useEffect(() => {
    if (status !== 'PENDING' || !deviceId) return;

    let isMounted = true;

    const poll = async () => {
      try {
        const data = await getDeviceStatus({
          employeeId: employeeId ? parseInt(employeeId, 10) : 0,
          deviceId
        });

        if (!isMounted) return;

        setPollCount(prev => prev + 1);

        if (data.status === 'APPROVED') {
          setStatus('APPROVED');
          if (onApprovedRef.current) {
            onApprovedRef.current(data.session);
          }
        } else if (data.status === 'REJECTED') {
          setStatus('REJECTED');
          setErrorMessage(data.message || 'Device registration was rejected by administrator.');
          if (onRejectedRef.current) {
            onRejectedRef.current(data);
          }
        } else if (data.status === 'REVOKED') {
          setStatus('REVOKED');
          setErrorMessage(data.message || 'This device has been unlinked.');
        }
      } catch (err) {
        console.error("Device polling error:", err);
      }
    };

    // Run first check after 1 second, then every 2 seconds
    const initialTimer = setTimeout(poll, 1000);
    const interval = setInterval(poll, 2000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [status, employeeId, deviceId]);

  const sendReason = async (customReason, customCoords = null) => {
    const text = (customReason !== undefined ? customReason : reason).trim();
    if (!text || !deviceId) return;

    setIsSubmittingReason(true);
    setErrorMessage('');
    try {
      // Capture device coordinates/location when submitting the approval reason
      let coords = customCoords;
      if (!coords || !coords.latitude) {
        try {
          coords = await getCurrentCoordinates();
        } catch (locErr) {
          console.warn("Could not retrieve coordinates during reason submission:", locErr);
        }
      }

      await submitDeviceReason({
        employeeId: employeeId ? parseInt(employeeId, 10) : 0,
        deviceId,
        reason: text,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        locationName: coords?.locationName
      });
      setReason(text);
      setReasonSaved(true);
      setStatus('PENDING'); // Start live polling now that note is submitted to Admin!
    } catch (err) {
      console.error("Failed to submit device reason:", err);
      setErrorMessage(err.response?.data?.message || "Failed to submit device request to Admin.");
    } finally {
      setIsSubmittingReason(false);
    }
  };

  return {
    status,
    setStatus,
    reason,
    setReason,
    reasonSaved,
    setReasonSaved,
    isSubmittingReason,
    pollCount,
    errorMessage,
    submitReason: sendReason,
    sendReason
  };
}
