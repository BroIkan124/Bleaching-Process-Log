"use client";

import React, { useState } from "react";
import { UserProfile } from "@/types";
import { MOCK_USERS } from "@/lib/mockData";
import HelpSupportModal from "./HelpSupportModal";

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Simulate network authentication delay
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

      setIsLoading(false);

      if (user) {
        if (!user.active) {
          setErrorMessage("This user account has been deactivated by the Plant Administrator.");
          return;
        }

        onLogin({
          ...user,
          last_login: new Date().toLocaleString("en-MY", { 
            year: "numeric", month: "2-digit", day: "2-digit", 
            hour: "2-digit", minute: "2-digit", hour12: true 
          })
        });
      } else {
        setErrorMessage("Authentication failed. Please verify your Refinery ID or password.");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex items-center justify-center p-4 sm:p-8 lg:p-16">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] items-center gap-10 lg:gap-16">
        {/* Left Column: Brand & Hero Display */}
        <div className="space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/lamsoon-logo.png" 
                alt="Lam Soon Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <b className="block text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                Lam Soon Edible Oils
              </b>
              <span className="text-xs text-zinc-500 font-medium">
                Refinery Management System
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-4">
              Every reading, logged and verified.
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
              Hourly process logs, QC results and shift reports for the bleaching line (Form RF-FR-003, Rev 03).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap pt-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              ISO 9001:2015 Compliant
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Halal Audit Trail
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Continuous 24-Hr Station
            </span>
          </div>
        </div>

        {/* Right Column: Clean Surface Login Card */}
        <div className="w-full max-w-md mx-auto lg:justify-self-center">
          <form 
            onSubmit={handleFormSubmit} 
            noValidate 
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 shadow-xl"
          >
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Log in
            </h2>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              Use the ID and access key from your plant administrator.
            </p>

            {/* Refinery ID Field */}
            <div className="space-y-1.5 mb-4">
              <label htmlFor="rid" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Refinery ID
              </label>
              <input
                id="rid"
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. ADM001, OPR001 or Staff Email"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white"
              />
            </div>

            {/* Access Key Field with Show/Hide Toggle */}
            <div className="space-y-1.5 mb-4">
              <label htmlFor="key" className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Access key
              </label>
              <div className="relative">
                <input
                  id="key"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your access key"
                  className="w-full h-11 pl-3.5 pr-16 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div 
                role="alert" 
                className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400"
              >
                {errorMessage}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </span>
              ) : (
                "Access system"
              )}
            </button>

            {/* Help & Support Link */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="text-xs font-semibold text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
              >
                Help and support
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
