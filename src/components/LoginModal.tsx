"use client";

import React, { useState } from "react";
import { UserProfile, UserRole } from "@/types";
import { 
  Building2, 
  Lock, 
  Mail, 
  ShieldCheck, 
  UserCheck, 
  X, 
  AlertCircle,
  KeyRound,
  ArrowRight,
  Shield,
  FlaskConical,
  Wrench,
  CheckCircle2
} from "lucide-react";

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
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = allUsers.find(
      (u) => 
        (u.email.toLowerCase() === emailInput.trim().toLowerCase() || 
         u.name.toLowerCase() === emailInput.trim().toLowerCase()) &&
        (u.password ? u.password === passwordInput : true)
    );

    if (user) {
      if (!user.active) {
        setErrorMessage("This user account has been deactivated by the System Administrator.");
        return;
      }
      setSuccessAnimation(true);
      setTimeout(() => {
        onLoginSuccess({
          ...user,
          last_login: new Date().toLocaleString("en-MY", { 
            year: "numeric", month: "2-digit", day: "2-digit", 
            hour: "2-digit", minute: "2-digit", hour12: true 
          })
        });
        setSuccessAnimation(false);
        onClose();
      }, 500);
    } else {
      setErrorMessage("Invalid Email / Staff ID or password. (Try 'password123' or click Demo Buttons below)");
    }
  };

  const handleQuickDemoSelect = (user: UserProfile) => {
    setErrorMessage(null);
    setSuccessAnimation(true);
    setTimeout(() => {
      onLoginSuccess({
        ...user,
        last_login: new Date().toLocaleString("en-MY", { 
            year: "numeric", month: "2-digit", day: "2-digit", 
            hour: "2-digit", minute: "2-digit", hour12: true 
        })
      });
      setSuccessAnimation(false);
      onClose();
    }, 400);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin": return <Shield className="w-4 h-4 text-purple-400" />;
      case "supervisor": return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case "manager_qa": return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case "chemist": return <FlaskConical className="w-4 h-4 text-sky-400" />;
      case "technician": return <Wrench className="w-4 h-4 text-zinc-300" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#131416]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="login-modal-title" className="text-base font-bold tracking-tight">
                Nisshin Refinery Process Sign In
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                Lam Soon Edible Oils · Role-Based Access Control (RBAC)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Session Status (If logged in) */}
          {currentUser && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{currentUser.name}</span>
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{currentUser.department} · {currentUser.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setEmailInput("");
                  setPasswordInput("");
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Manual Credential Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Staff Email / Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. ahmad.razif@lamsoon.com.my or admin"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Password
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">Default: password123</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successAnimation && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Authentication successful! Loading station profile...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={successAnimation}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Quick Role Selection (1-Click Demo Switch):
              </span>
              <span className="text-[10px] text-amber-500 font-mono">Simulated Staff Profiles</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemoSelect(u)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isCurrent
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 font-bold"
                        : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0">
                        {getRoleIcon(u.role)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold truncate">{u.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono capitalize">
                          {u.role.replace("_", " ")} {u.shift && u.shift !== 'ALL' ? `· Shift ${u.shift}` : ""}
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-amber-500 text-white rounded">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-zinc-100 dark:bg-[#101113] border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            System complies with ISO 9001:2015 &amp; Halal Audit Trail standards. All logins are logged.
          </p>
        </div>
      </div>
    </div>
  );
};
