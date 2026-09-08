import { useState, useEffect, useRef } from 'react';

export default function CameraModal({ type, locationAddress, onClose, onSubmit, submitting }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? "Camera permission was denied. Please allow camera access in your browser settings to take an attendance selfie."
          : "Unable to access device camera. Please make sure a camera is connected and available."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Capture live video frame & submit
  const handleCaptureAndSubmit = () => {
    if (submitting) return;

    if (!videoRef.current || !canvasRef.current) {
      alert("Camera stream is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    // Flip horizontally so captured image matches selfie mirror view
    context.translate(width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, width, height);

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    if (onSubmit) {
      onSubmit(photoDataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 text-white z-10 backdrop-blur-md border-b border-slate-800">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="flex items-center gap-2 text-slate-300 hover:text-white font-bold text-sm py-1.5 px-3 rounded-xl hover:bg-white/10 transition cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Cancel</span>
        </button>

        <span className="text-xs font-bold px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-full">
          {type === 'PUNCH_IN' ? 'Punch In Selfie' : 'Punch Out Selfie'}
        </span>
      </div>

      {/* Main Camera View Container */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-400 font-extrabold text-3xl flex items-center justify-center border border-red-500/30 mb-4 animate-bounce">
              📷
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Camera Access Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {cameraError}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => { stopCamera(); onClose(); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Bottom Overlay Address */}
            <div className="absolute bottom-4 inset-x-4 bg-slate-950/85 backdrop-blur-md text-white border border-white/10 p-3.5 rounded-2xl flex items-start gap-2.5 shadow-2xl z-10 text-left">
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-400/30">
                📍
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Live GPS Location</p>
                <p className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2 mt-0.5">
                  {locationAddress || "Fetching current address..."}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Bottom Shutter Controls Bar */}
      <div className="bg-slate-950 py-6 px-4 flex flex-col items-center justify-center relative border-t border-slate-900">
        {submitting ? (
          <div className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-full font-extrabold text-sm shadow-xl shadow-blue-500/30 animate-pulse">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Marking Attendance...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-8 w-full max-w-xs">
            <button
              type="button"
              onClick={() => { stopCamera(); onClose(); }}
              className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center text-sm font-semibold hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close camera"
            >
              ✕
            </button>

            {/* Large Round Shutter Button (Capture = Direct Automatic Submission) */}
            <button
              type="button"
              onClick={handleCaptureAndSubmit}
              disabled={submitting || !!cameraError}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center shadow-2xl transition duration-150 group ${
                cameraError ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 active:scale-95 cursor-pointer'
              }`}
              title="Tap to capture selfie and submit attendance"
            >
              <div className="w-14 h-14 rounded-full bg-white group-hover:scale-90 transition transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

