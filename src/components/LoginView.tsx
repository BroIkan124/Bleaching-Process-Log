"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types";
import { MOCK_USERS } from "@/lib/mockData";
import HelpSupportModal from "./HelpSupportModal";
import { Lock, User, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  allUsers?: UserProfile[];
}

export default function LoginView({ onLogin, allUsers = MOCK_USERS }: LoginViewProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Natural responsive delay for smooth authentication feel
    setTimeout(() => {
      const cleanId = identifier.trim().toLowerCase();
      
      // Match by staff ID mapping, email, or name
      const user = allUsers.find((u) => {
        const matchesEmail = u.email.toLowerCase() === cleanId;
        const matchesName = u.name.toLowerCase() === cleanId;
        const matchesRole = u.role.toLowerCase() === cleanId;

        // Custom employee IDs commonly used in refinery plants
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

      if (user) {
        if (!user.active) {
          setIsLoading(false);
          setErrorMessage("This account has been deactivated by the Plant Administrator.");
          return;
        }

        // Show successful authentication animation before transitioning
        setIsSuccess(true);
        setIsLoading(false);

        setTimeout(() => {
          onLogin({
            ...user,
            last_login: new Date().toLocaleString("en-MY", { 
              year: "numeric", month: "2-digit", day: "2-digit", 
              hour: "2-digit", minute: "2-digit", hour12: true 
            })
          });
        }, 320);
      } else {
        setIsLoading(false);
        setErrorMessage("Authentication failed. Please verify your Refinery ID and password.");
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex items-center justify-center p-4 sm:p-8 lg:p-16 transition-colors duration-300">
      <div className={`w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] items-center gap-10 lg:gap-16 transition-all duration-300 ${
        isSuccess ? "opacity-0 scale-[0.985] pointer-events-none" : "opacity-100 scale-100"
      }`}>
        {/* Left Column: Brand & Hero Display */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-zinc-800 p-2.5 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/lamsoon-logo.png" 
                alt="Lam Soon Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <span className="block text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                Lam Soon Edible Oils
              </span>
              <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-semibold">
                Refinery Management System
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-4">
              Continuous Process Logging &amp; Telemetry
            </h1>
            <p className="text-zinc-700 dark:text-zinc-300 text-sm sm:text-base max-w-lg leading-relaxed font-medium">
              Digital Bleaching Process Log (Form RF-FR-003, Rev 03). Real-time hourly readings, Niagara filtration telemetry, and quality control verification.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap pt-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              ISO 9001:2015 Compliant
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Halal Audit Trail
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
              24-Hour Continuous Operation
            </span>
          </div>
        </div>

        {/* Right Column: Clean Industrial Login Card */}
        <div className="w-full max-w-md mx-auto lg:justify-self-center">
          <form 
            onSubmit={handleFormSubmit} 
            noValidate 
            className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200/90 dark:border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Operator Sign In
              </h2>
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
            </div>
            
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-6">
              Enter your Refinery ID or official email to access the workstation.
            </p>

            {/* Refinery ID Field */}
            <div className="space-y-2 mb-4">
              <label htmlFor="rid" className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Refinery Staff ID / Email
              </label>
              <div className="relative">
                <input
                  id="rid"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. OPR001, SUP001, or ADM001"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Access Key Field with Show/Hide Toggle */}
            <div className="space-y-2 mb-5">
              <label htmlFor="key" className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Access Password
              </label>
              <div className="relative">
                <input
                  id="key"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full h-11 pl-10 pr-14 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-tactile absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div 
                role="alert" 
                className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                {errorMessage}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full h-11 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 group ${
                isSuccess 
                  ? "btn-premium-emerald text-white" 
                  : "btn-premium-amber text-white disabled:opacity-50"
              }`}
            >
              {isSuccess ? (
                <span className="inline-flex items-center gap-2 animate-in fade-in duration-200 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Access Granted - Loading Console...</span>
                </span>
              ) : isLoading ? (
                <span className="inline-flex items-center gap-2 font-bold">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Credentials...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 font-bold">
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              )}
            </button>

            {/* Help & Support Link */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="btn-tactile text-xs font-bold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
              >
                Need assistance? Technical Support &amp; SOP
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help & Support Modal */}
      {isHelpOpen && (
        <HelpSupportModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}
