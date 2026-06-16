import React, { useRef, useState, useEffect } from 'react';
import { api } from '../services/api';
import Tesseract from 'tesseract.js';
import { Camera, Scan, CheckCircle, AlertTriangle, RefreshCw, Smartphone, Play, Square, Volume2, Search, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Scanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // States
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  // OCR & Verification States
  const [scanProgress, setScanProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [scanning, setScanning] = useState(false);
  const [detectedId, setDetectedId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedMember, setVerifiedMember] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [audioFeedback, setAudioFeedback] = useState(true);

  // Load cameras on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permissions first to get device labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Camera list error:", err);
        setCameraError("Camera access denied or no camera found. Feel free to use the Sandbox Simulators below.");
      }
    };
    getDevices();

    return () => {
      stopCamera();
    };
  }, []);

  // Play synthetic feedback beep
  const playBeep = (type) => {
    if (!audioFeedback) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch (A5)
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'error') {
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // Low buzz (A3)
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

  // Start Camera Stream
  const startCamera = async (deviceId) => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Failed to start camera:", err);
      setCameraError("Unable to activate camera stream. Check permissions.");
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  // Capture image snapshot from video stream and run OCR
  const captureAndScan = async () => {
    if (!videoRef.current || scanning || verifying) return;
    
    setScanning(true);
    setOcrStatus("Capturing snapshot...");
    setScanProgress(5);
    setDetectedId("");
    setVerifyError(null);
    setVerifiedMember(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size matching the video feed dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get base64 image representation
      const imageSrc = canvas.toDataURL('image/jpeg');

      setOcrStatus("Initializing Tesseract OCR...");
      setScanProgress(20);

      // Run Tesseract OCR on the snapshot image
      const result = await Tesseract.recognize(
        imageSrc,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`Reading text: ${Math.round(m.progress * 100)}%`);
              setScanProgress(20 + Math.round(m.progress * 60));
            }
          }
        }
      );

      const parsedText = result.data.text;
      setScanProgress(90);
      setOcrStatus("Analyzing pattern matches...");
      
      // Regex pattern to extract KCE SDC member IDs: KCE-SDC-YY-NNN
      const idMatch = parsedText.match(/KCE-SDC-\d{2}-\d{3}/i);

      if (idMatch) {
        const foundId = idMatch[0].toUpperCase();
        setDetectedId(foundId);
        setScanProgress(100);
        setScanning(false);
        setOcrStatus("ID Identified successfully!");
        
        // Auto trigger database lookup
        await verifyMemberId(foundId);
      } else {
        throw new Error("No valid SDC Member ID detected. Ensure ID card is clear and centered.");
      }

    } catch (err) {
      console.error(err);
      playBeep('error');
      setVerifyError(err.message || "Failed to parse text from card.");
      setScanning(false);
      setScanProgress(0);
      setOcrStatus("");
    }
  };

  // Perform member verification lookup in database
  const verifyMemberId = async (id) => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.getMemberById(id);
      if (!res.error) {
        playBeep('success');
        setVerifiedMember(res.member);
      } else {
        throw new Error(`ID "${id}" detected, but it does not exist in the Karpagam database registry.`);
      }
    } catch (err) {
      playBeep('error');
      setVerifyError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Simulator for evaluating the feature instantly
  const handleSimulation = async (simulatedId) => {
    setScanning(true);
    setOcrStatus("Simulating physical scan...");
    setScanProgress(30);
    setDetectedId("");
    setVerifyError(null);
    setVerifiedMember(null);

    setTimeout(async () => {
      setScanProgress(80);
      setOcrStatus("Tesseract read text: " + simulatedId);
      
      setTimeout(async () => {
        setDetectedId(simulatedId);
        setScanProgress(100);
        setScanning(false);
        setOcrStatus("ID detected in OCR!");
        await verifyMemberId(simulatedId);
      }, 500);
    }, 800);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-navy-900 tracking-tight flex items-center gap-2">
          <Scan className="text-gold-500" size={24} />
          Smart ID Verification
        </h2>
        <p className="text-xs text-navy-500 font-medium">
          Verify physical SDC membership cards in real time without QR codes, using browser-level optical character recognition (OCR).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live camera feed card (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-navy-950 border border-navy-800 rounded-3xl overflow-hidden shadow-xl text-white relative">
          
          {/* Camera Controls Header */}
          <div className="px-5 py-4 border-b border-navy-800 bg-navy-900/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-gold-500" />
              <span className="text-xs font-bold font-display uppercase tracking-wider">OCR Scan Console</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Audio feedback checkbox */}
              <button
                onClick={() => setAudioFeedback(!audioFeedback)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  audioFeedback 
                    ? 'border-gold-500/20 bg-gold-500/15 text-gold-400' 
                    : 'border-navy-700 bg-navy-950 text-slate-500'
                }`}
                title={audioFeedback ? "Beeps On" : "Beeps Muted"}
              >
                <Volume2 size={14} />
              </button>

              {/* Camera selection dropdown */}
              <select
                value={selectedCamera}
                onChange={(e) => {
                  setSelectedCamera(e.target.value);
                  if (cameraActive) startCamera(e.target.value);
                }}
                className="bg-navy-950 border border-navy-700 rounded-lg text-[10px] px-2 py-1 focus:outline-none text-slate-300"
              >
                <option value="">Default Feed</option>
                {cameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Camera ${cameras.indexOf(cam)+1}`}</option>
                ))}
              </select>

              {/* Toggle Start/Stop */}
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <Square size={10} />
                  <span>Disable Video</span>
                </button>
              ) : (
                <button
                  onClick={() => startCamera(selectedCamera)}
                  className="flex items-center gap-1 bg-gold-500 hover:bg-gold-400 text-navy-950 px-3 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <Play size={10} className="fill-navy-950" />
                  <span>Enable Video</span>
                </button>
              )}
            </div>
          </div>

          {/* Camera Feed Area */}
          <div className="aspect-video w-full bg-black relative flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                ></video>
                
                {/* SCANNER GRID TARGET OVERLAY */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  {/* Scan target frame */}
                  <div className="w-[80%] max-w-[340px] aspect-[4/2.5] border-2 border-dashed border-gold-500/60 rounded-2xl relative flex flex-col justify-between p-3">
                    {/* Glowing corners */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-gold-500"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-gold-500"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-gold-500"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-gold-500"></div>
                    
                    {/* Scan line animation inside target */}
                    {scanning && <div className="scan-line"></div>}
                    
                    <p className="text-[8px] text-gold-400 font-bold uppercase tracking-widest text-center self-center bg-navy-950/80 px-2 py-0.5 rounded-full border border-gold-500/20">
                      Align Member ID text here
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500 p-8 text-center">
                <Camera size={44} className="stroke-[1.5] text-slate-700" />
                <div>
                  <p className="text-sm font-semibold">Live Camera Feed Inactive</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm">
                    Activate your webcam to read physical ID cards, or use the simulated sandbox tool below to test the database verification flow immediately.
                  </p>
                </div>
                <button
                  onClick={() => startCamera(selectedCamera)}
                  className="mt-2 bg-navy-900 border border-navy-700 hover:border-gold-500 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Start Webcam
                </button>
              </div>
            )}
            
            {/* hidden canvas for snapshot processing */}
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>

          {/* Scan Action Bar */}
          <div className="p-4 bg-navy-900/60 border-t border-navy-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              {scanning ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gold-400">
                    <span className="animate-pulse">{ocrStatus}</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-navy-950 h-1.5 rounded-full overflow-hidden border border-navy-800">
                    <div 
                      className="bg-gold-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 leading-normal">
                  {detectedId ? (
                    <span className="text-emerald-400 font-semibold">Identified Member ID: <code className="bg-navy-950 px-1.5 py-0.5 rounded border border-emerald-900/50">{detectedId}</code></span>
                  ) : (
                    <span>Ready for scan. Align physical card code and click "Trigger OCR Scan".</span>
                  )}
                </p>
              )}
            </div>

            <button
              onClick={captureAndScan}
              disabled={!cameraActive || scanning || verifying}
              className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 disabled:bg-navy-800 text-navy-950 disabled:text-slate-600 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-gold-500/5 disabled:shadow-none cursor-pointer"
            >
              {scanning ? <RefreshCw size={14} className="animate-spin" /> : <Scan size={14} />}
              <span>Trigger OCR Scan</span>
            </button>
          </div>
        </div>

        {/* Right Column: Verification Status (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Status Box */}
          <div className="bg-white border border-navy-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-sm text-navy-900 uppercase tracking-wider border-b border-navy-50 pb-2 mb-4">
              Verification Result
            </h3>
            
            {verifying && (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <RefreshCw size={36} className="text-gold-500 animate-spin" />
                <p className="text-xs font-semibold text-navy-700">Checking registry database...</p>
              </div>
            )}

            {!verifying && !verifiedMember && !verifyError && (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-navy-100 rounded-2xl bg-slate-50/50">
                <Scan size={36} className="text-navy-300 stroke-[1.5]" />
                <div>
                  <p className="text-xs font-bold text-navy-700">Awaiting ID Scan</p>
                  <p className="text-[10px] text-navy-400 mt-1 max-w-[200px] mx-auto">
                    Use OCR camera or the Sandbox triggers to read card information.
                  </p>
                </div>
              </div>
            )}

            {verifyError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex gap-3 text-xs">
                <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold text-red-950">Verification Denied</p>
                  <p className="mt-0.5 leading-relaxed">{verifyError}</p>
                </div>
              </div>
            )}

            {/* Verified Member Details */}
            {verifiedMember && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex gap-3 items-center">
                  <CheckCircle size={24} className="shrink-0 text-emerald-600 fill-emerald-100" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950">✓ Member verified</h4>
                    <p className="text-[10px] font-semibold mt-0.5">Access Granted • Karpagam SDC Member</p>
                  </div>
                </div>

                {/* mini card detail display */}
                <div className="bg-navy-950 border border-gold-500/20 text-white rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#102a43_1px,transparent_1px),linear-gradient(to_bottom,#102a43_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-5"></div>
                  
                  <div className="flex gap-4 items-center relative z-10">
                    <img
                      src={verifiedMember["Photo URL"] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                      alt={verifiedMember.Name}
                      className="w-16 h-16 rounded-xl border border-gold-500/20 object-cover bg-slate-800"
                    />
                    <div className="min-w-0">
                      <p className="text-[8px] font-mono text-gold-500 font-bold tracking-widest leading-none">{verifiedMember["Member ID"]}</p>
                      <h4 className="font-display font-extrabold text-sm text-white truncate mt-1 leading-tight uppercase">{verifiedMember.Name}</h4>
                      <p className="text-xs text-slate-300 truncate mt-0.5">{verifiedMember.Position}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-navy-800 pt-3.5 mt-3.5 text-[10px] relative z-10 text-slate-300">
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Department</span>
                      <span className="font-semibold text-white truncate block">{verifiedMember.Department}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Year</span>
                      <span className="font-bold text-white">Year {verifiedMember.Year}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Email ID</span>
                      <span className="truncate block font-mono text-[9px]">{verifiedMember.Email}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Phone</span>
                      <span>{verifiedMember.Phone}</span>
                    </div>
                  </div>
                </div>

                <Link 
                  to={`/members/${verifiedMember["Member ID"]}`}
                  className="w-full flex items-center justify-center gap-1 bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <span>View Complete Profile Card</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* Sandbox Simulators (Crucial for evaluation!) */}
          <div className="bg-navy-900 border border-navy-800 text-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={16} className="text-gold-500" />
              <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">
                ID Scanner Simulator
              </h4>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal mb-4">
              Evaluate the verification engine instantly using our simulated card scan injectors.
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleSimulation("KCE-SDC-26-001")}
                className="w-full text-left bg-navy-950/60 border border-navy-800 hover:border-gold-500/40 p-2.5 rounded-xl hover:bg-navy-950 text-[10px] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="font-bold text-slate-200">Inject: KCE-SDC-26-001</p>
                  <p className="text-[9px] text-slate-500">Praveen M • Active Technical Director</p>
                </div>
                <Search size={12} className="text-slate-600" />
              </button>

              <button
                type="button"
                onClick={() => handleSimulation("KCE-SDC-26-003")}
                className="w-full text-left bg-navy-950/60 border border-navy-800 hover:border-gold-500/40 p-2.5 rounded-xl hover:bg-navy-950 text-[10px] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="font-bold text-slate-200">Inject: KCE-SDC-26-003</p>
                  <p className="text-[9px] text-slate-500">Sanjay Kumar K • Active Vice President</p>
                </div>
                <Search size={12} className="text-slate-600" />
              </button>

              <button
                type="button"
                onClick={() => handleSimulation("KCE-SDC-26-999")}
                className="w-full text-left bg-navy-950/60 border border-navy-800 hover:border-gold-500/40 p-2.5 rounded-xl hover:bg-navy-950 text-[10px] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="font-bold text-slate-200">Inject Invalid: KCE-SDC-26-999</p>
                  <p className="text-[9px] text-slate-500">Simulate unregistered card rejection</p>
                </div>
                <Search size={12} className="text-slate-600" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
