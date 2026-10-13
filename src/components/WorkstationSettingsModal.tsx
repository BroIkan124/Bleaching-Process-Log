"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  SlidersHorizontal,
  X,
  User,
  Sliders,
  Bell,
  ShieldCheck,
  Database,
  Info,
  Camera,
  Upload,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  Droplets,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Clock,
  HardDrive,
  RefreshCw,
  Download,
  Key,
  Laptop,
  Check,
  AlertTriangle
} from "lucide-react";
import { UserProfile } from "@/types";
import { logActivityToInsForge } from "@/lib/dbService";

interface WorkstationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  isDark: boolean;
  onToggleDark: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onPlayTestSound: () => void;
  onForceResyncCloud: () => void;
}

type SettingsSection = 
  | 'profile' 
  | 'system' 
  | 'alerts' 
  | 'security' 
  | 'data' 
  | 'about';

export default function WorkstationSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  isDark,
  onToggleDark,
  isAudioEnabled,
  onToggleAudio,
  onPlayTestSound,
  onForceResyncCloud,
}: WorkstationSettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile edit form state
  const [fullName, setFullName] = useState(currentUser.name || "");
  const [department, setDepartment] = useState(currentUser.department || "Refinery Plant Operations");
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatar_url || "");
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // System preferences state
  const [pressureUnit, setPressureUnit] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nisshin_pref_pressure_unit") || "mmHg";
    }
    return "mmHg";
  });
  const [tempUnit, setTempUnit] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nisshin_pref_temp_unit") || "°C";
    }
    return "°C";
  });
  const [syncInterval, setSyncInterval] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nisshin_pref_sync_interval") || "1s";
    }
    return "1s";
  });

  // Alerts configuration state
  const [alertTone, setAlertTone] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nisshin_pref_alert_tone") || "industrial";
    }
    return "industrial";
  });
  const [outOfSpecBeeper, setOutOfSpecBeeper] = useState(true);
  const [qcBroadcastAlert, setQcBroadcastAlert] = useState(true);
  const [shiftChangeoverAlert, setShiftChangeoverAlert] = useState(true);

  // Security preferences
  const [autoLockTimeout, setAutoLockTimeout] = useState<string>("never");
  const [newPin, setNewPin] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Storage calculation
  const [storageUsageKb, setStorageUsageKb] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setFullName(currentUser.name || "");
      setDepartment(currentUser.department || "Refinery Plant Operations");
      setAvatarUrl(currentUser.avatar_url || "");
      calculateStorageUsage();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentUser]);

  const calculateStorageUsage = () => {
    try {
      if (typeof window !== "undefined") {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("nisshin_")) {
            const val = localStorage.getItem(key) || "";
            total += (key.length + val.length) * 2; // UTF-16 bytes
          }
        }
        setStorageUsageKb(Math.round(total / 1024));
      }
    } catch {}
  };

  if (!isOpen || !mounted) return null;

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Image upload handler (File input)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please choose a smaller image or GIF.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Paste image URL
  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setAvatarUrl(urlInput.trim());
      setUrlInput("");
      setIsUrlModalOpen(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setAvatarUrl("");
  };

  // Save Operator Profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      name: fullName.trim() || currentUser.name,
      department: department || currentUser.department,
      avatar_url: avatarUrl || undefined,
    };
    onUpdateUser(updated);

    // Persist in localStorage
    try {
      localStorage.setItem("nisshin_auth_user", JSON.stringify(updated));
    } catch {}

    // Log to InsForge audit trail
    logActivityToInsForge(currentUser, "UPDATE_PROFILE_SETTINGS", "USER_PROFILE", currentUser.id, {
      name: updated.name,
      department: updated.department,
      has_avatar: Boolean(updated.avatar_url),
    });

    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 2500);
  };

  // Save System Preferences
  const handleSavePreferences = (unit: string, temp: string, sync: string) => {
    setPressureUnit(unit);
    setTempUnit(temp);
    setSyncInterval(sync);
    try {
      localStorage.setItem("nisshin_pref_pressure_unit", unit);
      localStorage.setItem("nisshin_pref_temp_unit", temp);
      localStorage.setItem("nisshin_pref_sync_interval", sync);
    } catch {}
  };

  // Clear cache and resync cloud
  const handleClearCacheAndResync = () => {
    if (window.confirm("Are you sure you want to clear the tablet's local storage and pull fresh data from InsForge Cloud?")) {
      try {
        const authUser = localStorage.getItem("nisshin_auth_user");
        localStorage.clear();
        if (authUser) {
          localStorage.setItem("nisshin_auth_user", authUser);
        }
      } catch {}
      onForceResyncCloud();
      calculateStorageUsage();
      alert("Local workstation cache cleared. Fresh plant data synchronized from cloud.");
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    try {
      const sheetData = localStorage.getItem("nisshin_process_sheet") || "{}";
      const qcData = localStorage.getItem("nisshin_qc_reports") || "[]";
      const backupObj = {
        exportDate: new Date().toISOString(),
        plant: "PRD-REF-001 (Nisshin Bleaching Line 1)",
        user: currentUser.name,
        sheet: JSON.parse(sheetData),
        qcReports: JSON.parse(qcData),
      };

      const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nisshin_rms_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export backup: " + err);
    }
  };

  // Default avatar fallback (matches stylish aesthetic)
  const defaultAvatar = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80";

  return createPortal(
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop-animate ${
        isClosing ? "is-closing" : ""
      }`}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSmoothClose();
      }}
    >
      <div
        className={`w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#070D18] border border-[#1B2A3F] rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-200 modal-card-animate ${
          isClosing ? "is-closing" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B2A3F] bg-[#0A1324]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shadow-inner flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Plant Workstation Settings & Preferences
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                PRD - REF - 001 Configuration · Nisshin Deodorizer Plant
              </p>
            </div>
          </div>
          <button
            onClick={handleSmoothClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Settings (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Navigation: CONFIGURATION SECTIONS */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#1B2A3F] bg-[#060B14]/80 p-3.5 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <div className="px-3 pt-1 pb-2">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Configuration Sections
                </span>
              </div>

              <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
                {/* 1. Operator Profile */}
                <button
                  type="button"
                  onClick={() => setActiveSection('profile')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeSection === 'profile'
                      ? 'bg-[#0098EA] text-white shadow-md shadow-[#0098EA]/25'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="truncate">Operator Profile</span>
                </button>

                {/* 2. System Preferences */}
                <button
                  type="button"
                  onClick={() => setActiveSection('system')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeSection === 'system'
                      ? 'bg-[#0098EA] text-white shadow-md shadow-[#0098EA]/25'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0" />
                  <span className="truncate">System Preferences</span>
                </button>

                {/* 3. Alerts & Notifications */}
                <button
                  type="button"
                  onClick={() => setActiveSection('alerts')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeSection === 'alerts'
                      ? 'bg-[#0098EA] text-white shadow-md shadow-[#0098EA]/25'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span className="truncate">Alerts & Notifications</span>
                </button>

                {/* 4. Security & Access */}
                <button
                  type="button"
                  onClick={() => setActiveSection('security')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeSection === 'security'
                      ? 'bg-[#0098EA] text-white shadow-md shadow-[#0098EA]/25'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="truncate">Security & Access</span>
                </button>

                {/* 5. Data & Export Settings */}
                <button
                  type="button"
                  onClick={() => setActiveSection('data')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeSection === 'data'
                      ? 'bg-[#0098EA] text-white shadow-md shadow-[#0098EA]/25'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span className="truncate">Data & Export Settings</span>
                </button>

                {/* 6. About Refinery RMS */}
                <button
                  type="button"
                  onClick={() => setActiveSection('about')}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeSection === 'about'
                      ? 'bg-[#0098EA] text-white shadow-md shadow-[#0098EA]/25'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Info className="w-4 h-4 shrink-0" />
                    <span className="truncate">About Refinery RMS</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    activeSection === 'about' ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400'
                  }`}>
                    v1.0
                  </span>
                </button>
              </nav>
            </div>

            {/* Workstation Node Info in sidebar footer */}
            <div className="hidden md:block pt-3 border-t border-[#1B2A3F] px-1 text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Laptop className="w-3.5 h-3.5 text-sky-400" />
                <span>Station: WS-REF-001</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                <span>Cloud Link Online</span>
              </div>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-[#090F1C]/90">
            {/* ======================================================== */}
            {/* SECTION 1: OPERATOR PROFILE (EXACT MATCH TO DESIGN)      */}
            {/* ======================================================== */}
            {activeSection === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Section Header */}
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    1. Operator Identity & Authentication
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Plant credentials, department allocation, and operational shift signature.
                  </p>
                </div>

                {/* Identity Card (matches user uploaded screenshot) */}
                <div className="p-5 rounded-2xl bg-[#0E1726]/80 border border-[#1B2A3F] shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Avatar with Camera badge */}
                    <div className="relative shrink-0">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-md bg-zinc-900 flex items-center justify-center">
                        <img
                          src={avatarUrl || defaultAvatar}
                          alt="Operator Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultAvatar;
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload new image"
                        className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#0098EA] hover:bg-sky-400 text-white flex items-center justify-center shadow-md border-2 border-[#0A101D] cursor-pointer transition-transform active:scale-90"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Operator Details & Actions */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-base font-bold text-white truncate">
                          {fullName || currentUser.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active Station
                        </span>
                      </div>

                      <div className="text-xs font-mono text-zinc-300">
                        Employee ID: <span className="font-bold text-white">{currentUser.id}</span>
                      </div>

                      <div className="text-xs font-mono text-zinc-400">
                        System Role Authorization:{" "}
                        <span className="font-bold text-sky-400 uppercase">
                          {currentUser.role.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Change Image / GIF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsUrlModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Paste URL</span>
                        </button>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                        Supports animated GIF, PNG, JPG, WebP up to 10MB. Uploaded directly to cloud storage and synchronized across all sessions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#09111F] border border-[#1B2A3F] text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#0098EA]/40 focus:border-[#0098EA] transition-all"
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Employee ID
                      </label>
                      <input
                        type="text"
                        value={currentUser.id}
                        disabled
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#09111F]/50 border border-[#1B2A3F]/50 text-xs font-mono font-bold text-zinc-400 cursor-not-allowed"
                      />
                    </div>

                    {/* Plant Department */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          Plant Department
                        </label>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Admin Editable
                        </span>
                      </div>
                      <div className="relative">
                        <Droplets className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#09111F] border border-[#1B2A3F] text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#0098EA]/40 focus:border-[#0098EA] transition-all cursor-pointer appearance-none"
                        >
                          <option value="Refinery Plant Operations">Refinery Plant Operations</option>
                          <option value="Quality Assurance Laboratory">Quality Assurance Laboratory</option>
                          <option value="Process Engineering & Telemetry">Process Engineering & Telemetry</option>
                          <option value="Mechanical & Electrical Maintenance">Mechanical & Electrical Maintenance</option>
                          <option value="Plant Safety & Halal Compliance">Plant Safety & Halal Compliance</option>
                        </select>
                      </div>
                    </div>

                    {/* System Role Authorization */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        System Role Authorization
                      </label>
                      <div className="w-full px-3.5 py-2.5 rounded-xl bg-[#09111F]/50 border border-[#1B2A3F] text-xs font-mono font-bold text-sky-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400 inline-block shadow-xs" />
                        <span>{currentUser.role.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">
                      Changes will be stored in your local tablet session & synchronized to InsForge.
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#0098EA] hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-[#0098EA]/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </button>
                  </div>

                  {profileSavedToast && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Operator credentials and avatar successfully updated!</span>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 2: SYSTEM PREFERENCES & DISPLAY                  */}
            {/* ======================================================== */}
            {activeSection === 'system' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    2. System Preferences & Display
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Refinery telemetry units, plant line default, and visual theme adaptation.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Theme Mode Toggle */}
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Visual Interface Theme</div>
                      <div className="text-[11px] text-zinc-400">
                        Select between High-Contrast Dark Factory Theme or Daylight Light Mode.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleDark}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 transition-colors cursor-pointer"
                    >
                      {isDark ? (
                        <>
                          <Moon className="w-4 h-4 text-amber-400" />
                          <span>Dark Industrial (Active)</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4 text-amber-500" />
                          <span>Daylight Light (Active)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Telemetry Units */}
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] space-y-3">
                    <div className="text-xs font-bold text-white">Telemetry Engineering Units</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Bleacher Vacuum</label>
                        <select
                          value={pressureUnit}
                          onChange={(e) => handleSavePreferences(e.target.value, tempUnit, syncInterval)}
                          className="w-full px-3 py-2 rounded-lg bg-[#09111F] border border-[#1B2A3F] text-xs text-white"
                        >
                          <option value="mmHg">mmHg (Nisshin Standard)</option>
                          <option value="Torr">Torr</option>
                          <option value="mbar">mbar</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Heat Exchanger Temp</label>
                        <select
                          value={tempUnit}
                          onChange={(e) => handleSavePreferences(pressureUnit, e.target.value, syncInterval)}
                          className="w-full px-3 py-2 rounded-lg bg-[#09111F] border border-[#1B2A3F] text-xs text-white"
                        >
                          <option value="°C">°C (Celsius)</option>
                          <option value="°F">°F (Fahrenheit)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">Cloud Sync Frequency</label>
                        <select
                          value={syncInterval}
                          onChange={(e) => handleSavePreferences(pressureUnit, tempUnit, e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#09111F] border border-[#1B2A3F] text-xs text-white"
                        >
                          <option value="1s">1s (Real-Time Live)</option>
                          <option value="5s">5s (Standard)</option>
                          <option value="15s">15s (Power Saver)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 3: ALERTS & NOTIFICATIONS                        */}
            {/* ======================================================== */}
            {activeSection === 'alerts' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    3. Alerts & Audio Notifications
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Acoustic buzzer alerts, out-of-spec warnings, and dispatch broadcasts.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Master Audio Chime */}
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Audible Industrial Chime</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          isAudioEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-300"
                        }`}>
                          {isAudioEnabled ? "ACTIVE" : "MUTED"}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Plays synthesized chime sound for urgent out-of-spec warnings and QC release events.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onPlayTestSound}
                        className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-semibold cursor-pointer"
                      >
                        Test Sound
                      </button>
                      <button
                        type="button"
                        onClick={onToggleAudio}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isAudioEnabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-zinc-400"
                        }`}
                      >
                        {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Out of spec beeper */}
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Out-of-Spec Telemetry Alert</div>
                      <div className="text-[11px] text-zinc-400">
                        Trigger immediate visual and acoustic warning if Vacuum &lt; 600 mmHg or Temp outside 70-115°C.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={outOfSpecBeeper}
                      onChange={(e) => setOutOfSpecBeeper(e.target.checked)}
                      className="w-4 h-4 accent-[#0098EA] cursor-pointer"
                    />
                  </div>

                  {/* QC lab broadcast */}
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">QC Disposition Broadcast</div>
                      <div className="text-[11px] text-zinc-400">
                        Notify control room immediately when QC Chemist releases or rejects a dispatched slot sample.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={qcBroadcastAlert}
                      onChange={(e) => setQcBroadcastAlert(e.target.checked)}
                      className="w-4 h-4 accent-[#0098EA] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 4: SECURITY & ACCESS                             */}
            {/* ======================================================== */}
            {activeSection === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    4. Security & Access Control
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Workstation authentication, tablet auto-lock, and tamper-evident audit protection.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white">Tablet Workstation Auto-Lock</div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400">
                        ISO 9001:2015 Compliant
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Automatically locks the plant terminal after idle periods to prevent unauthorized log tampering.
                    </p>
                    <select
                      value={autoLockTimeout}
                      onChange={(e) => setAutoLockTimeout(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 rounded-lg bg-[#09111F] border border-[#1B2A3F] text-xs text-white"
                    >
                      <option value="never">Factory Floor Mode (Never Auto-Lock)</option>
                      <option value="15m">15 Minutes of Inactivity</option>
                      <option value="30m">30 Minutes of Inactivity</option>
                      <option value="1h">1 Hour</option>
                    </select>
                  </div>

                  {/* Change PIN / Password */}
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      <span>Update Staff PIN / Passcode</span>
                    </div>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="Enter new 6-digit PIN or password"
                        className="flex-1 px-3 py-2 rounded-lg bg-[#09111F] border border-[#1B2A3F] text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPin.trim().length >= 4) {
                            setPinChangeSuccess(true);
                            setNewPin("");
                            setTimeout(() => setPinChangeSuccess(false), 2500);
                          } else {
                            alert("PIN/Password must be at least 4 characters.");
                          }
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#0098EA] hover:bg-sky-400 text-white text-xs font-bold cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                    {pinChangeSuccess && (
                      <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Passcode updated successfully!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 5: DATA & EXPORT SETTINGS                        */}
            {/* ======================================================== */}
            {activeSection === 'data' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    5. Data Archive & Export Settings
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Local tablet storage diagnostics, cloud backups, and PDF export configuration.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Storage Diagnostics */}
                  <div className="p-4 rounded-xl bg-[#0E1726]/80 border border-[#1B2A3F] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-sky-400" />
                        <span>Offline Storage Usage</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {storageUsageKb} KB used
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, (storageUsageKb / 5120) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleClearCacheAndResync}
                        className="px-3.5 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Clear Cache & Resync Cloud</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="px-3.5 py-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON Backup</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 6: ABOUT REFINERY RMS                            */}
            {/* ======================================================== */}
            {activeSection === 'about' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    6. About Refinery RMS
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Software architecture, client certification, and engineering telemetry stack.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0E1726]/80 border border-[#1B2A3F] space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-amber-500 text-xl font-display">
                      LS
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Lam Soon Digital Refinery Management System (RMS)
                      </h4>
                      <div className="text-xs text-zinc-400 font-mono">
                        Version 1.0.4 · Production Build
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono text-zinc-300">
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">OPERATIONAL SITE</span>
                      <span className="font-bold text-white">Pasir Gudang Industrial Estate, Johor</span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">PROCESS STANDARD</span>
                      <span className="font-bold text-white">Nisshin Deodorizer / Bleaching Spec</span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">AUDIT COMPLIANCE</span>
                      <span className="font-bold text-emerald-400">ISO 9001:2015 & Halal Certified</span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/30 border border-white/5">
                      <span className="text-zinc-500 block text-[10px]">CLOUD INFRASTRUCTURE</span>
                      <span className="font-bold text-sky-400">InsForge PostgreSQL + Next.js Engine</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Paste URL Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#0A1324] border border-[#1B2A3F] rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-sky-400" />
              <span>Paste Image or GIF URL</span>
            </h4>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/photo.gif"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#09111F] border border-[#1B2A3F] text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0098EA]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-4 py-1.5 rounded-lg bg-[#0098EA] hover:bg-sky-400 text-xs font-bold text-white cursor-pointer"
              >
                Apply Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

