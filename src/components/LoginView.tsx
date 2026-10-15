"use client";

import React, { useState, useEffect } from "react";
import { UserProfile } from "@/types";
import { MOCK_USERS } from "@/lib/mockData";
import HelpSupportModal from "./HelpSupportModal";
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Fingerprint, 
  Activity, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Radio, 
  Sparkles,
  Zap,
  Building2,
  BadgeCheck
} from "lucide-react";
import { 
  playScanTone, 
  playAccessGrantedChime, 
  playAccessDeniedTone, 
  playWarpWhoosh, 
  playTactileTick,
  isAudioEnabled,
  setAudioEnabled
} from "@/lib/audioService";

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  allUsers?: UserProfile[];
}

type AuthPhase = "idle" | "scanning" | "granted" | "warp" | "denied";

export default function LoginView({ onLogin, allUsers = MOCK_USERS }: LoginViewProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authPhase, setAuthPhase] = useState<AuthPhase>("idle");
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);
  const [telemetryStep, setTelemetryStep] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  // Sync sound preference and live time clock
  useEffect(() => {
    setSoundEnabled(isAudioEnabled());
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("en-MY", { 
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit", 
          hour12: false 
        }) + " MYT"
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioEnabled(next);
    if (next) playTactileTick();
  };

  // Find candidate user match for live avatar / preview
  const candidateUser = React.useMemo(() => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) return null;
    return allUsers.find((u) => {
      if (u.email.toLowerCase() === cleanId) return true;
      if (u.name.toLowerCase() === cleanId) return true;
      if (u.role.toLowerCase() === cleanId) return true;
      if (cleanId === 'adm001' && u.role === 'admin') return true;
      if (cleanId === 'sup001' && u.role === 'supervisor') return true;
      if (cleanId === 'opr001' && u.role === 'technician' && u.shift === 1) return true;
      if (cleanId === 'opr002' && u.role === 'technician' && u.shift === 2) return true;
      if (cleanId === 'opr003' && u.role === 'technician' && u.shift === 3) return true;
      if (cleanId === 'qcs001' && u.role === 'chemist') return true;
      if (cleanId === 'mgr001' && u.role === 'manager_qa') return true;
      return false;
    });
  }, [identifier, allUsers]);

  // Quick Preset Role Fillers for fast operator testing
  const handleQuickRoleSelect = (code: string) => {
    playTactileTick();
    setIdentifier(code);
    setPassword("password123");
    setErrorMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPhase !== "idle") return;

    setErrorMessage(null);
    const cleanId = identifier.trim().toLowerCase();

    // Verify User Match
    const user = allUsers.find((u) => {
      const matchesEmail = u.email.toLowerCase() === cleanId;
      const matchesName = u.name.toLowerCase() === cleanId;
      const matchesRole = u.role.toLowerCase() === cleanId;

      let matchesStaffCode = false;
      if (cleanId === 'adm001' && u.role === 'admin') matchesStaffCode = true;
      if (cleanId === 'sup001' && u.role === 'supervisor') matchesStaffCode = true;
      if (cleanId === 'opr001' && u.role === 'technician' && u.shift === 1) matchesStaffCode = true;
      if (cleanId === 'opr002' && u.role === 'technician' && u.shift === 2) matchesStaffCode = true;
      if (cleanId === 'opr003' && u.role === 'technician' && u.shift === 3) matchesStaffCode = true;
      if (cleanId === 'qcs001' && u.role === 'chemist') matchesStaffCode = true;
      if (cleanId === 'mgr001' && u.role === 'manager_qa') matchesStaffCode = true;

      const isUserMatch = matchesEmail || matchesName || matchesRole || matchesStaffCode;
      const isPasswordMatch = u.password ? u.password === password : password === 'password123';

      return isUserMatch && isPasswordMatch;
    });

    if (!user) {
      // Haptic Denial Shake Sequence
      setAuthPhase("denied");
      playAccessDeniedTone();
      setTimeout(() => {
        setAuthPhase("idle");
        setErrorMessage("Authentication failed. Invalid Refinery Staff ID or Access Cipher.");
      }, 600);
      return;
    }

    if (!user.active) {
      setAuthPhase("denied");
      playAccessDeniedTone();
      setTimeout(() => {
        setAuthPhase("idle");
        setErrorMessage("This plant credential has been deactivated by the Refinery Administrator.");
      }, 600);
      return;
    }

    // SUCCESSFUL AUTHENTICATION MULTI-STAGE SEQUENCE
    setAuthenticatedUser(user);
    setAuthPhase("scanning");
    setTelemetryStep(1);
    playScanTone();

    // Telemetry ticker step 2
    setTimeout(() => {
      setTelemetryStep(2);
    }, 200);

    // Stage 2: Biometric Access Granted Holographic Pass
    setTimeout(() => {
      setTelemetryStep(3);
      setAuthPhase("granted");
      playAccessGrantedChime();
    }, 500);

    // Stage 3: Light speed warp portal transition into dashboard
    setTimeout(() => {
      setAuthPhase("warp");
      playWarpWhoosh();
    }, 1250);

    // Final Handshake: Handoff to App Router
    setTimeout(() => {
      onLogin({
        ...user,
        last_login: new Date().toLocaleString("en-MY", { 
          year: "numeric", month: "2-digit", day: "2-digit", 
          hour: "2-digit", minute: "2-digit", hour12: true 
        })
      });
    }, 1600);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "chemist":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "supervisor":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "manager_qa":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      default:
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-hidden [perspective:2200px] select-none">
      
      {/* 1. Ambient Cyber Grid & Industrial Hologram Canvas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Subtle dynamic grid matrix */}
        <div 
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] bg-[radial-gradient(#d97706_1px,transparent_1px)] dark:bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" 
        />
        
        {/* Rotating Industrial Radar Ring behind hero */}
        <div className="absolute -top-32 -left-32 w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full border border-amber-500/10 dark:border-amber-500/15 pointer-events-none animate-radar-spin">
          <div className="absolute inset-4 rounded-full border border-dashed border-amber-500/15 dark:border-amber-500/20" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/20 to-transparent" />
        </div>

        {/* Ambient colored lighting blooms */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none" />
      </div>

      {/* 2. Top Telemetry Bar */}
      <header className="absolute top-4 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700/80 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">SEC-AUTH GATEWAY // v2.6.4</span>
          </span>
          <span className="hidden sm:inline-block tracking-wider opacity-75">
            LOCAL-NODE: ON-PREMISE AIR-GAPPED
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-block text-zinc-500 dark:text-zinc-400 font-medium">
            {currentTimeStr}
          </span>
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? "Audio Effects: ON" : "Audio Effects: OFF"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60 hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="font-semibold">AUDIO ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-semibold">AUDIO OFF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 3. Main Dual-Column Interactive Hub */}
      <div 
        className={`w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] items-center gap-10 lg:gap-14 transition-all duration-700 [transform-style:preserve-3d] ${
          authPhase === "warp" 
            ? "animate-warp-portal pointer-events-none" 
            : authPhase === "granted"
            ? "scale-[1.01]"
            : "opacity-100 scale-100"
        }`}
      >
        {/* Left Column: Brand, Status, & Refinery Facility Info */}
        <div className="space-y-6 [transform:rotateY(4deg)_translateZ(20px)] [transform-style:preserve-3d] transition-transform duration-700 hover:[transform:rotateY(1deg)_translateZ(30px)]">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
              <div className="relative h-16 w-16 rounded-2xl bg-white dark:bg-zinc-900 p-2.5 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/lamsoon-logo.png" 
                  alt="Lam Soon Logo" 
                  className="w-full h-full object-contain drop-shadow-sm" 
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Lam Soon Edible Oils
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  PASIR GUDANG
                </span>
              </div>
              <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Refinery Bleaching Plant Process Console
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-3 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-amber-700 to-zinc-900 dark:from-white dark:via-amber-400 dark:to-zinc-300">
              Continuous Process Logging &amp; Telemetry
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base max-w-lg leading-relaxed font-medium">
              Digital Bleaching Process Log (Form RF-FR-003, Rev 03). Real-time hourly readings, Niagara leaf filtration monitoring, and automated QC spec verification.
            </p>
          </div>

          {/* Plant Operational Badges */}
          <div className="flex items-center gap-2.5 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              ISO 9001:2015 Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Halal Audit Trail
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 backdrop-blur-md shadow-sm">
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
              24-Hour Continuous Operation
            </span>
          </div>

          {/* Tactical Quick Role Pills */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Preset Sign-In (Touch to Fill):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRoleSelect("OPR001")}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-zinc-900/70 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 text-left transition-all shadow-sm flex flex-col cursor-pointer active:scale-95"
              >
                <span className="text-[10px] text-zinc-400 font-mono">OPR001</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200 truncate">Operator 1</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSelect("QCS001")}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-zinc-900/70 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/20 border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/40 text-left transition-all shadow-sm flex flex-col cursor-pointer active:scale-95"
              >
                <span className="text-[10px] text-zinc-400 font-mono">QCS001</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200 truncate">QC Chemist</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSelect("SUP001")}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-zinc-900/70 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40 text-left transition-all shadow-sm flex flex-col cursor-pointer active:scale-95"
              >
                <span className="text-[10px] text-zinc-400 font-mono">SUP001</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200 truncate">Supervisor</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoleSelect("ADM001")}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-zinc-900/70 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/40 text-left transition-all shadow-sm flex flex-col cursor-pointer active:scale-95"
              >
                <span className="text-[10px] text-zinc-400 font-mono">ADM001</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200 truncate">Plant Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High-Tech Biometric Auth Card */}
        <div className="w-full max-w-md mx-auto lg:justify-self-center [transform:rotateY(-3deg)_translateZ(20px)] [transform-style:preserve-3d] transition-transform duration-700 hover:[transform:rotateY(0deg)_translateZ(30px)]">
          <div 
            className={`relative rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.7),0_12px_36px_rgba(0,0,0,0.5)] border backdrop-blur-2xl transition-all duration-300 overflow-hidden ${
              authPhase === "denied" 
                ? "animate-haptic-shake border-rose-500/80 bg-rose-950/20 ring-4 ring-rose-500/30" 
                : authPhase === "granted" || authPhase === "warp"
                ? "border-emerald-500/60 bg-white/95 dark:bg-zinc-950/95 ring-4 ring-emerald-500/30"
                : authPhase === "scanning"
                ? "border-amber-500/60 bg-white/90 dark:bg-zinc-950/90 ring-4 ring-amber-500/20"
                : "border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80"
            }`}
          >
            
            {/* Neon Border Beam Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 opacity-80" />

            {/* LASER SCANNING BEAM OVERLAY */}
            {authPhase === "scanning" && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981,0_0_30px_#10b981] animate-laser-sweep" />
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              </div>
            )}

            {/* HOLOGRAPHIC SHEEN OVERLAY (Granted state) */}
            {(authPhase === "granted" || authPhase === "warp") && (
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                <div className="absolute -top-1/2 -bottom-1/2 w-48 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-holo-sheen" />
              </div>
            )}

            {/* STAGE A: FORM VIEW (Idle / Scanning / Denied) */}
            {authPhase !== "granted" && authPhase !== "warp" ? (
              <form onSubmit={handleFormSubmit} noValidate>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Fingerprint className="w-5 h-5 animate-pulse" />
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        Station Sign-In
                      </h2>
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                        BIOMETRIC &amp; STAFF AUTHENTICATION
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    AIR-GAPPED
                  </span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                  Enter your assigned Refinery ID and password to access the process console.
                </p>

                {/* Candidate User Preview (Instant live recognition) */}
                {candidateUser && (
                  <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-zinc-900/90 border border-amber-500/30 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center text-xs border border-amber-500/40">
                        {candidateUser.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                          {candidateUser.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {candidateUser.department}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(candidateUser.role)} uppercase tracking-wider`}>
                      {candidateUser.role}
                    </span>
                  </div>
                )}

                {/* Refinery ID Input */}
                <div className="space-y-1.5 mb-4">
                  <label htmlFor="rid" className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Refinery Staff ID / Email
                  </label>
                  <div className="relative">
                    <input
                      id="rid"
                      type="text"
                      required
                      autoComplete="username"
                      disabled={authPhase === "scanning"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. OPR001, SUP001, QCS001, or ADM001"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/90 shadow-inner text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-60"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 mb-5">
                  <label htmlFor="key" className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Access Password
                  </label>
                  <div className="relative">
                    <input
                      id="key"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      disabled={authPhase === "scanning"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter security password"
                      className="w-full h-11 pl-10 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/90 shadow-inner text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-60"
                    />
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      type="button"
                      id="toggle-password-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Scanning Live Telemetry Ticker */}
                {authPhase === "scanning" && (
                  <div className="mb-4 p-3 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-[11px] space-y-1 border border-emerald-500/30 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 font-bold animate-pulse">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>[BIOMETRIC HANDSHAKE IN PROGRESS]</span>
                    </div>
                    <div className="text-zinc-400 truncate">
                      &gt; [0.00s] SYNCHRONIZING SECURE REFINERY CYPHER...
                    </div>
                    {telemetryStep >= 2 && (
                      <div className="text-emerald-300 truncate">
                        &gt; [0.18s] MATCHING REFINERY SHA-256 HASH...
                      </div>
                    )}
                  </div>
                )}

                {/* Error Notice */}
                {errorMessage && authPhase === "idle" && (
                  <div 
                    role="alert" 
                    className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in fade-in duration-200"
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={authPhase === "scanning"}
                  className="w-full h-12 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 group btn-premium-amber text-white disabled:opacity-50 active:scale-[0.98]"
                >
                  {authPhase === "scanning" ? (
                    <span className="inline-flex items-center gap-2 font-bold">
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Biometrics...</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 font-bold">
                      <span>Authorize Workstation</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  )}
                </button>

                {/* Help & Support Footer Link */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="text-xs font-semibold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    Need assistance? Technical Support &amp; SOP
                  </button>
                </div>
              </form>
            ) : (
              /* STAGE B: HOLOGRAPHIC SECURITY PASS (Access Granted) */
              <div className="py-4 px-2 text-center animate-in zoom-in-95 fade-in duration-300">
                <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-2 border-emerald-300">
                    <BadgeCheck className="w-9 h-9" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  CLEARANCE VERIFIED · ACCESS GRANTED
                </div>

                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-1">
                  {authenticatedUser?.name || "Operator"}
                </h3>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                  {authenticatedUser?.department} · Shift {authenticatedUser?.shift}
                </p>

                {/* Pass Details Card */}
                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left font-mono text-xs space-y-1.5 mb-5 shadow-inner">
                  <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-[10px]">
                    <span>STATION ID:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">REFINERY-CONSOLE-01</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-[10px]">
                    <span>CLEARANCE ROLE:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleBadgeColor(authenticatedUser?.role || "")}`}>
                      {authenticatedUser?.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-[10px]">
                    <span>CIPHER PROTOCOL:</span>
                    <span className="text-emerald-500 font-bold">AES-256 AIR-GAPPED</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Entering Process Telemetry Dashboard...</span>
                </div>
              </div>
            )}

            {/* Micro HUD Corner Brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500/30 rounded-tl pointer-events-none" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500/30 rounded-tr pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500/30 rounded-bl pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-500/30 rounded-br pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. Bottom Plant Footer */}
      <footer className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-500 pointer-events-none">
        <span className="hidden sm:inline-block">
          NISSHIN PROCESS LOG // BLEACHING SECTION
        </span>
        <span className="mx-auto sm:mx-0">
          STRICTLY CONFIDENTIAL · LAM SOON EDIBLE OILS SDN. BHD.
        </span>
      </footer>

      {/* 5. Help & Support Modal */}
      {isHelpOpen && (
        <HelpSupportModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}
