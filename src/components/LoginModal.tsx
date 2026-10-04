"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types";
import { X, LogOut, CheckCircle2 } from "lucide-react";
import HelpSupportModal from "./HelpSupportModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onLoginSuccess,
  onLogout,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanId = identifier.trim().toLowerCase();
      
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

      setIsLoading(false);

      if (user) {
        if (!user.active) {
          setErrorMessage("This user account has been deactivated by the Plant Administrator.");
          return;
        }

        onLoginSuccess({
          ...user,
          last_login: new Date().toLocaleString("en-MY", { 
            year: "numeric", month: "2-digit", day: "2-digit", 
            hour: "2-digit", minute: "2-digit", hour12: true 
          })
        });
        onClose();
      } else {
        setErrorMessage("Authentication failed. Please verify your Refinery ID or password.");
      }
    }, 350);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden text-[var(--text-main)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-zinc-50 dark:bg-[#131416]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-800 p-1.5 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/lamsoon-logo.png" 
                alt="Lam Soon Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <h2 id="login-modal-title" className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                Refinery User Authentication
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Lam Soon Edible Oils · Bleaching Line
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-tactile p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-200 ease-spring active:scale-90 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Session Status (If logged in) */}
          {currentUser && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-bold shrink-0">
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 truncate block">
                    {currentUser.department} · {currentUser.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-sm transition-all duration-200 ease-spring active:scale-95 shrink-0 cursor-pointer group"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleManualLogin} noValidate className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                {currentUser ? "Switch Account / Sign In" : "Sign In"}
              </h3>
              <p className="text-xs text-zinc-500 mb-3">
                Use your Refinery ID or Staff Email and access key.
              </p>
            </div>

            {/* Refinery ID */}
            <div className="space-y-1.5">
              <label htmlFor="modal-rid" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Refinery ID
              </label>
              <input
                id="modal-rid"
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. ADM001, OPR001 or Staff Email"
                className="w-full h-10 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white"
              />
            </div>

            {/* Access Key */}
            <div className="space-y-1.5">
              <label htmlFor="modal-key" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Access key
              </label>
              <div className="relative">
                <input
                  id="modal-key"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your access key"
                  className="w-full h-10 pl-3.5 pr-16 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-tactile absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all duration-150 active:scale-95"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div 
                role="alert" 
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400"
              >
                {errorMessage}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-tactile btn-premium-amber w-full h-11 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Access system</span>
                  <CheckCircle2 className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
                </span>
              )}
            </button>

            {/* Help & Support Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="btn-tactile text-xs font-semibold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-200 active:scale-95 cursor-pointer hover:underline"
              >
                Help and support
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-zinc-100 dark:bg-[#101113] border-t border-[var(--border-color)] text-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            Complies with ISO 9001:2015 &amp; Halal Audit Trail standards. All sessions logged.
          </p>
        </div>
      </div>

      {/* Help & Support Modal */}
      {isHelpOpen && (
        <HelpSupportModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
