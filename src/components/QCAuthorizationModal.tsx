"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { UserProfile, SampleReport, QCDecision } from "@/types";
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff, 
  Delete, 
  UserCheck, 
  ArrowLeft,
  Check,
  AlertCircle
} from "lucide-react";
import { verifyUserQcPin, verifyUserPassword, setUserQcPin, getUserQcPin } from "@/lib/qcPinService";

interface QCAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SampleReport;
  decision: QCDecision;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onAuthorize: (metadata: {
    authorized_by_id: string;
    authorized_by_name: string;
    authorized_at: string;
    auth_method: "pin" | "password" | "supervisor_override";
    signature_stamp: string;
  }) => void;
}

export const QCAuthorizationModal: React.FC<QCAuthorizationModalProps> = ({
  isOpen,
  onClose,
  report,
  decision,
  currentUser,
  allUsers,
  onAuthorize,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [authMode, setAuthMode] = useState<"pin" | "password" | "override">("pin");
  
  // PIN State
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password Fallback State
  const [accountPassword, setAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [resetNewPinChecked, setResetNewPinChecked] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");

  // Supervisor Override State
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [supervisorPin, setSupervisorPin] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPinDigits([]);
      setPinError(null);
      setIsShaking(false);
      setIsSuccess(false);
      setAuthMode("pin");
      setAccountPassword("");
      setPasswordError(null);
      setResetNewPinChecked(false);
      setNewPin("");
      setConfirmNewPin("");
      setOverrideError(null);

      // Find first supervisor for override fallback
      const sup = allUsers.find(u => u.role === "supervisor" || u.role === "admin");
      if (sup) setSelectedSupervisorId(sup.id);
    }
  }, [isOpen, allUsers]);

  // Keyboard navigation for PIN
  useEffect(() => {
    if (!isOpen || authMode !== "pin" || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, authMode, pinDigits, isSuccess]);

  // Focus password input when switching to password mode
  useEffect(() => {
    if (authMode === "password") {
      setTimeout(() => passwordInputRef.current?.focus(), 150);
    }
  }, [authMode]);

  if (!isOpen || !isClient) return null;

  // Handle Digit Entry
  const handleDigitPress = (digit: string) => {
    if (pinDigits.length >= 4) return;
    setPinError(null);

    const nextDigits = [...pinDigits, digit];
    setPinDigits(nextDigits);

    // Auto-validate when 4 digits are completed
    if (nextDigits.length === 4) {
      const fullPin = nextDigits.join("");
      validatePinSubmission(fullPin);
    }
  };

  const handleBackspace = () => {
    setPinError(null);
    setPinDigits(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinError(null);
    setPinDigits([]);
  };

  // Validate PIN submission
  const validatePinSubmission = (pinToTest: string) => {
    const isValid = verifyUserQcPin(currentUser.id, pinToTest);
    if (isValid) {
      triggerSuccessAndAuthorize("pin");
    } else {
      setIsShaking(true);
      setPinError("PIN tidak sah. Sila cuba lagi atau gunakan Kata Laluan Akaun.");
      setTimeout(() => {
        setIsShaking(false);
        setPinDigits([]);
      }, 600);
    }
  };

  // Validate Password Fallback
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!accountPassword.trim()) {
      setPasswordError("Sila masukkan kata laluan akaun anda.");
      return;
    }

    const isValid = verifyUserPassword(currentUser, accountPassword);
    if (!isValid) {
      setPasswordError("Kata laluan tidak sah. Sila masukkan kata laluan log masuk akaun anda.");
      return;
    }

    // If user elected to reset their PIN right here
    if (resetNewPinChecked) {
      if (!/^\d{4}$/.test(newPin)) {
        setPasswordError("PIN baru mestilah tepat 4 digit nombor (cth: 2468).");
        return;
      }
      if (newPin !== confirmNewPin) {
        setPasswordError("Pengesahan PIN baru tidak sepadan.");
        return;
      }
      setUserQcPin(currentUser.id, newPin);
    }

    triggerSuccessAndAuthorize("password");
  };

  // Validate Supervisor Override
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError(null);

    if (!selectedSupervisorId) {
      setOverrideError("Sila pilih penyelia yang bertugas.");
      return;
    }

    const supervisor = allUsers.find(u => u.id === selectedSupervisorId);
    if (!supervisor) {
      setOverrideError("Penyelia tidak ditemui.");
      return;
    }

    const isPinValid = verifyUserQcPin(supervisor.id, supervisorPin);
    const isPassValid = verifyUserPassword(supervisor, supervisorPin);

    if (isPinValid || isPassValid) {
      triggerSuccessAndAuthorize("supervisor_override", supervisor.name);
    } else {
      setOverrideError("PIN atau kata laluan penyelia tidak sah.");
    }
  };

  const triggerSuccessAndAuthorize = (method: "pin" | "password" | "supervisor_override", supervisorName?: string) => {
    setIsSuccess(true);
    const signature = `SIG-${currentUser.id.slice(0, 5).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    setTimeout(() => {
      onAuthorize({
        authorized_by_id: currentUser.id,
        authorized_by_name: supervisorName ? `${currentUser.name} (Approved by Sup. ${supervisorName})` : currentUser.name,
        authorized_at: new Date().toISOString(),
        auth_method: method,
        signature_stamp: signature,
      });
      onClose();
    }, 700);
  };

  const isReject = decision.decision === "reject";
  const isAccept = decision.decision === "accept";
  const isConcession = decision.decision === "accept_concession";

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSuccess) onClose();
      }}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0B101E] border border-zinc-200/90 dark:border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 [transform-style:preserve-3d]"
      >
        {/* 1. Header with Decision Color Coding */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isAccept
            ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20"
            : isReject
            ? "border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20"
            : "border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border shadow-2xs ${
              isAccept
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : isReject
                ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
            }`}>
              {isAccept && <CheckCircle2 className="w-5 h-5" />}
              {isReject && <XCircle className="w-5 h-5" />}
              {isConcession && <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white font-display tracking-tight leading-snug">
                QC Authorization Sign-Off
              </h3>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                Official Electronic Disposition Signature
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSuccess}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Sample Context Card */}
        <div className="p-4 mx-5 mt-4 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-zinc-50/80 dark:bg-black/30 space-y-2 select-none">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {report.report_no}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${
              isAccept
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                : isReject
                ? "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300"
                : "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
            }`}>
              {isAccept ? "Accept (Batch Release)" : isReject ? "Reject / Hold / Rework" : "Concession Release"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-zinc-200/60 dark:border-white/5">
            <div>
              <span className="text-zinc-400 block text-[10px]">Product / Oil:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                {report.product_name || "RBD Palm Oil"}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px]">Lot Number:</span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                {report.lot_no}
              </span>
            </div>
          </div>

          {isReject && decision.reason_label && (
            <div className="pt-1.5 border-t border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Defect Code: {decision.reason_label}</span>
            </div>
          )}
        </div>

        {/* 3. Main Authorization Body */}
        <div className="p-5">
          {/* Mode 1: 4-Digit Security PIN */}
          {authMode === "pin" && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                  Masukkan 4-Digit PIN Keselamatan QC
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  Mengesahkan identiti: <strong className="text-zinc-900 dark:text-white">{currentUser.name}</strong> ({currentUser.role.replace("_", " ")})
                </span>
              </div>

              {/* 4 PIN Digits Box */}
              <div className={`relative ${isShaking ? "animate-shake" : ""}`}>
                <div className="flex items-center justify-center gap-3 max-w-[260px] mx-auto">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = idx < pinDigits.length;
                    const isActive = idx === pinDigits.length;
                    return (
                      <div
                        key={idx}
                        className={`w-13 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center font-mono text-2xl font-black border transition-all select-none ${
                          isSuccess
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-500 scale-105"
                            : isFilled
                            ? "bg-zinc-100 dark:bg-white/10 border-zinc-400 dark:border-white/30 text-zinc-900 dark:text-white shadow-2xs"
                            : isActive
                            ? "bg-amber-500/5 border-amber-500 ring-4 ring-amber-500/20 text-transparent"
                            : "bg-zinc-50 dark:bg-black/30 border-zinc-200 dark:border-white/10 text-transparent"
                        }`}
                      >
                        {isSuccess ? (
                          <Check className="w-6 h-6 text-emerald-500 animate-in zoom-in-50" />
                        ) : isFilled ? (
                          showPin ? (
                            pinDigits[idx]
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full bg-zinc-900 dark:bg-white inline-block shadow-xs" />
                          )
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-white/20 inline-block" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Show/Hide PIN Mask Button */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                  title={showPin ? "Sembunyikan Digit" : "Papar Digit"}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Message */}
              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-medium animate-in fade-in duration-150">
                  {pinError}
                </div>
              )}

              {/* Success Badge */}
              {isSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-1.5 animate-in fade-in duration-150">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Pengesahan Berjaya! Menyimpan keputusan makmal...</span>
                </div>
              )}

              {/* Tactile Virtual Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigitPress(num)}
                    disabled={isSuccess}
                    className="h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] active:scale-[0.95] active:bg-zinc-300 dark:active:bg-white/[0.18] border border-zinc-200/80 dark:border-white/[0.08] text-lg font-bold font-mono text-zinc-900 dark:text-white transition-all cursor-pointer shadow-2xs flex items-center justify-center select-none"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Clear (C) */}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSuccess || pinDigits.length === 0}
                  className="h-12 rounded-2xl bg-zinc-100/70 hover:bg-zinc-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] active:scale-[0.95] border border-zinc-200/80 dark:border-white/[0.08] text-xs font-bold font-mono text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center select-none"
                  title="Clear All"
                >
                  Clear
                </button>

                {/* 0 */}
                <button
                  type="button"
                  onClick={() => handleDigitPress("0")}
                  disabled={isSuccess}
                  className="h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] active:scale-[0.95] active:bg-zinc-300 dark:active:bg-white/[0.18] border border-zinc-200/80 dark:border-white/[0.08] text-lg font-bold font-mono text-zinc-900 dark:text-white transition-all cursor-pointer shadow-2xs flex items-center justify-center select-none"
                >
                  0
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={isSuccess || pinDigits.length === 0}
                  className="h-12 rounded-2xl bg-zinc-100/70 hover:bg-zinc-200 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] active:scale-[0.95] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center select-none"
                  title="Delete"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Fallback Option: Lupa PIN? */}
              <div className="pt-2 border-t border-zinc-200/70 dark:border-white/10 flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAuthMode("password")}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer py-1 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Lupa PIN? Sahkan menggunakan Kata Laluan Akaun</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("override")}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Pelepasan Kuasa Penyelia (Supervisor Override)</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Password Fallback (Lupa PIN) */}
          {authMode === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                    Pengesahan Kata Laluan Akaun
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                    Masukkan kata laluan akaun <strong className="text-zinc-900 dark:text-white">{currentUser.name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode("pin")}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kata Laluan Log Masuk Akaun:
                </label>
                <div className="relative">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    value={accountPassword}
                    onChange={(e) => {
                      setAccountPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Masukkan kata laluan log masuk anda"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-xs font-sans text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Option to set new PIN immediately */}
              <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetNewPinChecked}
                    onChange={(e) => setResetNewPinChecked(e.target.checked)}
                    className="rounded border-zinc-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Tetapkan 4-Digit PIN baru sekarang (agar tidak lupa lagi)</span>
                </label>

                {resetNewPinChecked && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        PIN Baru (4 Digit):
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="cth: 2468"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-center font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        Ulang PIN Baru:
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmNewPin}
                        onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="cth: 2468"
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-center font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode("pin")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer"
                >
                  Kembali ke PIN
                </button>
                <button
                  type="submit"
                  className="btn-premium-amber px-5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sahkan Keputusan</span>
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: Supervisor Override */}
          {authMode === "override" && (
            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                    Pelepasan Kuasa Penyelia (Supervisor Override)
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                    Pengesahan sekiranya staf QC terlupa PIN dan Kata Laluan
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode("pin")}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              </div>

              {overrideError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{overrideError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Pilih Penyelia Bertugas (*Authorizing Supervisor*):
                </label>
                <select
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none"
                >
                  {allUsers
                    .filter(u => u.role === "supervisor" || u.role === "admin" || u.role === "manager_qa")
                    .map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  PIN atau Kata Laluan Penyelia:
                </label>
                <input
                  type="password"
                  value={supervisorPin}
                  onChange={(e) => setSupervisorPin(e.target.value)}
                  placeholder="Masukkan PIN atau Password Supervisor"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-black/30 text-xs font-sans text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode("pin")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 cursor-pointer"
                >
                  Kembali ke PIN
                </button>
                <button
                  type="submit"
                  className="btn-premium-amber px-5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sahkan Pelepasan</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

