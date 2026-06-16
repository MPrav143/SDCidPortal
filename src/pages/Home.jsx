import React, { useRef, useState, useEffect } from 'react';
import { api, getApiUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { Camera, Scan, CheckCircle, AlertTriangle, RefreshCw, Smartphone, Play, Square, Volume2, Shield, LogIn, ChevronRight, Server, Terminal, User, BookOpen, Mail, Phone, Award } from 'lucide-react';

const LogoImage = ({ src, alt, fallbackText, className }) => {
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0); // 0: png, 1: svg, 2: jpg

  if (error || attempt >= 3) {
    return (
      <div className="inline-flex items-center justify-center bg-navy-900 border border-gold-500/30 rounded px-2.5 py-1 text-gold-500 text-[10px] font-bold uppercase tracking-wider select-none shrink-0">
        {fallbackText}
      </div>
    );
  }

  const extensions = ['.png', '.svg', '.jpg'];
  const currentSrc = `${src}${extensions[attempt]}`;

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      onError={() => {
        setAttempt(prev => prev + 1);
      }} 
      className={className} 
    />
  );
};

export default function Home({ onOpenSettings }) {
  const { 
    user, 
    adminRecord, 
    logout, 
    googleClientId, 
    handleGoogleLoginSuccess, 
    loginAsDemo, 
    error: authError, 
    setError: setAuthError,
    loading: authLoading 
  } = useAuth();
  
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Camera States
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // OCR & Verification States
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [detectedId, setDetectedId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedMember, setVerifiedMember] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  
  // Audio state
  const [audioFeedback, setAudioFeedback] = useState(true);



  // Load cameras on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn("Webcam listing issue:", err);
      }
    };
    getDevices();

    return () => {
      stopCamera();
    };
  }, []);

  // Google Sign-In Initialization
  useEffect(() => {
    let checkInterval;
    
    const initGoogleSignIn = () => {
      if (googleClientId && window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleLoginSuccess,
            auto_select: false,
          });
          
          const container = document.getElementById("googleSignInButton");
          if (container) {
            window.google.accounts.id.renderButton(container, {
              theme: "outline",
              size: "large",
              shape: "rectangular",
              width: 280,
            });
            clearInterval(checkInterval);
          }
        } catch (err) {
          console.error("Google button initialization error:", err);
        }
      }
    };

    if (googleClientId) {
      checkInterval = setInterval(initGoogleSignIn, 500);
      initGoogleSignIn();
    }

    return () => clearInterval(checkInterval);
  }, [googleClientId, user]); // Re-initialize if user signs out

  // Play audio beeps
  const playBeep = (type) => {
    if (!audioFeedback) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'error') {
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio API beep failure:", e);
    }
  };

  // Start video stream
  const startCamera = async (deviceId) => {
    stopCamera();
    setCameraError(null);
    setVerifyError(null);
    setVerifiedMember(null);
    setDetectedId("");
    
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
      setCameraError("Camera access blocked. Please enable webcam permissions or use the Simulator options below.");
    }
  };

  // Stop video stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  // Capture image and run OCR
  const captureAndScan = async () => {
    if (!videoRef.current || scanning || verifying) return;
    
    setScanning(true);
    setOcrStatus("Processing frame...");
    setScanProgress(10);
    setDetectedId("");
    setVerifyError(null);
    setVerifiedMember(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageSrc = canvas.toDataURL('image/jpeg');

      setOcrStatus("Running OCR engine...");
      setScanProgress(25);

      const result = await Tesseract.recognize(
        imageSrc,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrStatus(`Reading text: ${Math.round(m.progress * 100)}%`);
              setScanProgress(25 + Math.round(m.progress * 55));
            }
          }
        }
      );

      const text = result.data.text;
      setScanProgress(90);
      setOcrStatus("Analyzing SDC credentials...");
      
      const idMatch = text.match(/KCE-SDC-\d{2}-\d{3}/i);

      if (idMatch) {
        const foundId = idMatch[0].toUpperCase();
        setDetectedId(foundId);
        setScanProgress(100);
        setScanning(false);
        setOcrStatus("Card Identified!");
        await verifyMemberId(foundId);
      } else {
        throw new Error("Could not find a valid SDC Member ID format (KCE-SDC-YY-NNN) in the frame.");
      }
    } catch (err) {
      console.error(err);
      playBeep('error');
      setVerifyError(err.message || "Failed to scan member ID.");
      setScanning(false);
      setScanProgress(0);
      setOcrStatus("");
    }
  };

  // Query API to verify Member ID
  const verifyMemberId = async (id) => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.getMemberById(id);
      if (!res.error) {
        playBeep('success');
        setVerifiedMember(res.member);
      } else {
        throw new Error("No record found matching the scanned ID.");
      }
    } catch (err) {
      playBeep('error');
      setVerifyError(`This member is not registered in the Software Development Club database.`);
    } finally {
      setVerifying(false);
    }
  };



  return (
    <div className="min-h-screen bg-white text-navy-950 font-sans flex flex-col relative">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a192f08_1px,transparent_1px),linear-gradient(to_bottom,#0a192f08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Header Bar */}
      <header className="border-b border-navy-50 py-4 px-6 bg-white/95 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <LogoImage src="/kce" alt="KCE Logo" fallbackText="KCE" className="w-9 h-9 rounded-lg object-contain bg-navy-900 p-0.5 border border-gold-500/30 shrink-0" />
          <LogoImage src="/sdc" alt="SDC Logo" fallbackText="SDC" className="w-9 h-9 rounded-lg object-contain bg-navy-900 p-0.5 border border-gold-500/30 shrink-0 hidden xs:block" />
          <div>
            <h1 className="font-display font-bold text-sm text-navy-900 tracking-tight leading-none">
              Karpagam College of Engineering
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              SOFTWARE DEVELOPMENT CLUB
            </p>
          </div>
        </div>

        {/* Database Config Settings Trigger */}
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border border-navy-100 bg-navy-50/50 text-navy-700 hover:bg-navy-100 transition-colors cursor-pointer"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getApiUrl() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          {getApiUrl() ? 'Cloud Enabled' : 'Local Sandbox'}
          <Server size={10} className="text-navy-400" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-12 relative z-10">
        
        {/* PUBLIC BRANDING HEADER SECTION */}
        <section className="text-center space-y-4 py-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3.5 mx-auto">
            <LogoImage src="/kce" alt="KCE Logo" fallbackText="KCE" className="w-16 h-16 rounded-3xl object-contain bg-navy-950 p-2 border-2 border-gold-500 shadow-xl shadow-gold-500/10 shrink-0" />
            <LogoImage src="/sdc" alt="SDC Logo" fallbackText="SDC" className="w-16 h-16 rounded-3xl object-contain bg-navy-950 p-2 border-2 border-gold-500 shadow-xl shadow-gold-500/10 shrink-0" />
            <LogoImage src="/MyCampus" alt="MyCampus Logo" fallbackText="MyCampus" className="w-16 h-16 rounded-3xl object-contain bg-navy-950 p-2 border-2 border-gold-500 shadow-xl shadow-gold-500/10 hidden sm:block shrink-0" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-gold-600 tracking-[0.25em] uppercase">KARPAGAM COLLEGE OF ENGINEERING</h2>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-navy-950 uppercase tracking-tight">
              SOFTWARE DEVELOPMENT CLUB
            </h1>
            <div className="h-px w-24 bg-gold-500 mx-auto my-3"></div>
            <p className="text-xs font-bold font-mono tracking-widest text-navy-700 uppercase">
              "CODE • CREATE • INNOVATE"
            </p>
          </div>
        </section>

        {/* SCANNER CENTER SECTION (Primary Feature) */}
        <section className="flex flex-col items-center justify-center space-y-8">
          
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Live Camera Scanner Box */}
            <div className="md:col-span-7 bg-navy-950 border border-navy-850 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between text-white aspect-video md:aspect-auto md:min-h-[340px]">
              
              {/* Box Header */}
              <div className="px-4 py-3 bg-navy-900 border-b border-navy-800 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Scan size={12} className="text-gold-500" />
                  ID Card Scanner
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAudioFeedback(!audioFeedback)}
                    className={`p-1 rounded transition-colors ${audioFeedback ? 'text-gold-400 hover:text-gold-300' : 'text-slate-500 hover:text-slate-400'}`}
                    title="Toggle Audio Feedback"
                  >
                    <Volume2 size={12} />
                  </button>

                  {/* Camera Toggle Button */}
                  {cameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={() => startCamera(selectedCamera)}
                      className="bg-gold-500 hover:bg-gold-400 text-navy-950 text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      Enable Camera
                    </button>
                  )}
                </div>
              </div>

              {/* Feed Viewport */}
              <div className="bg-black flex-1 relative flex items-center justify-center min-h-[200px]">
                {cameraActive ? (
                  <>
                    <video ref={videoRef} playsInline muted className="w-full h-full object-cover"></video>
                    
                    {/* Laser Scanner overlays */}
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <div className="w-[85%] aspect-[5/3] border-2 border-dashed border-gold-500/50 rounded-xl relative">
                        <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-t-2 border-l-2 border-gold-500"></div>
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 border-t-2 border-r-2 border-gold-500"></div>
                        <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 border-b-2 border-l-2 border-gold-500"></div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-b-2 border-r-2 border-gold-500"></div>
                        
                        {scanning && <div className="scan-line"></div>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-500">
                    <Camera size={36} className="stroke-[1.25] text-slate-700" />
                    <p className="text-xs font-bold text-slate-400">Camera Feed Off</p>
                    <p className="text-[10px] text-slate-600 max-w-[200px] leading-normal">
                      Enable your webcam to read physical card member IDs.
                    </p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>

              {/* Action Trigger */}
              <div className="p-3 bg-navy-900 border-t border-navy-800 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {scanning ? (
                    <span className="text-[9px] text-gold-400 font-medium animate-pulse">{ocrStatus}</span>
                  ) : (
                    <span className="text-[9px] text-slate-400 truncate block">
                      {detectedId ? `Scanned ID: ${detectedId}` : "Press Trigger to capture and identify"}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={captureAndScan}
                  disabled={!cameraActive || scanning || verifying}
                  className="bg-gold-500 hover:bg-gold-400 disabled:bg-navy-800 text-navy-950 disabled:text-slate-500 text-[10px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Scan size={12} />}
                  <span>Trigger Scan</span>
                </button>
              </div>
            </div>

            {/* Verification Results Panel (md:col-span-5) */}
            <div className="md:col-span-5 flex flex-col justify-between">
              
              {/* Main Card View */}
              <div className="bg-white border border-navy-100 rounded-3xl p-5 shadow-sm flex-1 flex flex-col justify-center min-h-[300px]">
                
                {verifying && (
                  <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                    <RefreshCw size={28} className="text-gold-500 animate-spin" />
                    <p className="text-[10px] font-bold text-navy-800 uppercase tracking-wider">Verifying with sheets database...</p>
                  </div>
                )}

                {!verifying && !verifiedMember && !verifyError && (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center mx-auto text-navy-900">
                      <Scan size={20} className="stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wide">Awaiting Verification</h4>
                      <p className="text-[10px] text-navy-400 mt-1 max-w-[180px] mx-auto leading-normal">
                        Place a member ID card in front of your camera and trigger the scanner, or use simulated cards.
                      </p>
                    </div>
                  </div>
                )}

                {/* INVALID MEMBER CARD */}
                {verifyError && !verifying && (
                  <div className="py-6 text-center space-y-4 border border-red-100 rounded-2xl bg-red-50/20 p-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                      <span className="text-base font-bold">❌</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-red-600 uppercase tracking-wider">INVALID MEMBER ID</h4>
                      <p className="text-[10px] text-red-800 font-semibold mt-1.5 leading-relaxed">
                        {verifyError}
                      </p>
                    </div>
                  </div>
                )}

                {/* VALID MEMBER PROFILE CARD */}
                {verifiedMember && !verifying && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    {/* Verification Badge */}
                    <div className="flex items-center gap-2 p-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center justify-center">
                      <span className="text-[11px] font-bold">✓ MEMBER VERIFIED</span>
                    </div>

                    {/* Mini Physical Card Rendering */}
                    <div className="border border-navy-950 rounded-2xl overflow-hidden bg-white shadow-md text-left text-xs flex flex-col">
                      {/* Top Header */}
                      <div className="bg-navy-950 text-white p-3 text-center border-b-2 border-gold-500">
                        <p className="text-[7px] font-bold tracking-widest text-gold-500 uppercase">SOFTWARE DEVELOPMENT CLUB</p>
                        <p className="text-[8px] font-semibold tracking-wide uppercase leading-none mt-0.5">KARPAGAM COLLEGE OF ENGINEERING</p>
                      </div>

                      {/* Photo + Detail Grid */}
                      <div className="p-4 bg-gradient-to-b from-white to-slate-50 flex flex-col items-center">
                        <img 
                          src={verifiedMember["Photo URL"] || `https://ui-avatars.com/api/?name=${encodeURIComponent(verifiedMember.Name)}&background=0f172a&color=e2c58a&bold=true`} 
                          alt="Photo" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(verifiedMember.Name)}&background=0f172a&color=e2c58a&bold=true`;
                          }}
                          className="w-20 h-20 rounded-xl border border-navy-950 object-cover shadow-sm bg-slate-100 mb-3"
                        />
                        
                        <div className="text-center w-full space-y-1.5">
                          <h3 className="font-display font-extrabold text-sm text-navy-950 uppercase leading-none">{verifiedMember.Name}</h3>
                          <p className="text-[10px] font-bold text-gold-600 tracking-wide uppercase">{verifiedMember.Position}</p>
                          <p className="font-mono text-[9px] text-navy-500 bg-navy-50 border border-navy-100 rounded px-1 py-0.5 inline-block mt-0.5">
                            ID: {verifiedMember["Member ID"]}
                          </p>
                        </div>

                        <div className="w-full border-t border-navy-100 mt-3.5 pt-3.5 grid grid-cols-2 gap-y-2 gap-x-3 text-[9px] text-navy-700">
                          <div>
                            <span className="text-slate-400 font-bold block uppercase text-[7px] tracking-wider">Year</span>
                            <span className="font-bold text-navy-900">{verifiedMember.Year} Year</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 font-bold block uppercase text-[7px] tracking-wider">Department</span>
                            <span className="font-bold text-navy-900 truncate block">{verifiedMember.Department}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Badge */}
                      <div className="bg-navy-900 text-white px-3 py-1.5 text-center text-[7px] flex justify-between border-t border-navy-800">
                        <span className="text-slate-500 font-bold">STATUS:</span>
                        <span className="font-bold text-emerald-400 uppercase">Active Member ✓</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>



            </div>

          </div>

        </section>

        {/* SECURE ADMIN AUTHENTICATION SECTION (Below Scanner) */}
        <section className="bg-navy-50/50 border border-navy-100 rounded-3xl p-6 md:p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-display font-bold text-lg text-navy-950 tracking-tight flex items-center justify-center gap-1.5">
              <Shield className="text-gold-500" size={18} />
              Administrator Access
            </h3>
            <p className="text-xs text-navy-600 max-w-sm mx-auto leading-relaxed">
              Authorized administrators can sign in to manage club members, system security, and analytics.
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3 flex gap-2 max-w-md mx-auto">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Render Block */}
          {user ? (
            // Already Authenticated
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-3 bg-white border border-navy-100 rounded-full p-1.5 pr-4">
                <img 
                  src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover border border-gold-500/20"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-navy-950 leading-none">{user.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{adminRecord?.Role || 'Admin'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-navy-900 hover:bg-gold-500 text-white hover:text-navy-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>Enter Admin Dashboard</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={logout}
                  className="border border-navy-200 bg-white hover:bg-navy-50 text-navy-700 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            // Needs Authentication
            <div className="space-y-4 flex flex-col items-center">
              {googleClientId ? (
                // Google Login Button
                <div className="flex flex-col items-center gap-4">
                  <div id="googleSignInButton" className="min-h-[44px]"></div>
                </div>
              ) : (
                <div className="text-[11px] text-navy-600 bg-amber-50/70 border border-amber-200/50 rounded-2xl p-4 max-w-md text-center leading-relaxed">
                  <p className="font-semibold text-amber-800 mb-1">Google Access Portal Offline</p>
                  Google Login is unconfigured on this machine. To test the administrative portal, open the <strong>Database Configuration</strong> panel at the top-right and use the <strong>Sandbox Login Bypass</strong> tool, or configure a Google Client ID.
                </div>
              )}
            </div>
          )}
        </section>

      </main>

      {/* Footer Info */}
      <footer className="border-t border-navy-50 py-6 text-center text-xs text-navy-500 space-y-4">
        <div className="flex items-center justify-center gap-6">
          <LogoImage src="/kce" alt="KCE Logo" fallbackText="KCE" className="h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
          <LogoImage src="/sdc" alt="SDC Logo" fallbackText="SDC" className="h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
          <LogoImage src="/MyCampus" alt="MyCampus Logo" fallbackText="MyCampus" className="h-8 object-contain opacity-80 hover:opacity-100 transition-opacity" />
        </div>
        <p>&copy; {new Date().getFullYear()} Karpagam College of Engineering. All rights reserved.</p>
        <p className="font-mono text-[9px] text-slate-400">Powered by Google Sheets database integration & Tesseract OCR engine</p>
      </footer>
    </div>
  );
}
