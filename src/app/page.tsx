"use client";

import React, { useState, useEffect } from "react";
import { LogSheet, LogEntry, UserProfile, DashboardTab, SupervisorUpdateEvent } from "@/types";
import { 
  MOCK_USERS, 
  MOCK_PLANTS, 
  MOCK_PRODUCTS, 
  MOCK_TANKS, 
  createMockSheet,
  INITIAL_SUPERVISOR_EVENTS
} from "@/lib/mockData";
import { SHIFTS } from "@/lib/constants";
import { getShiftForSlot } from "@/lib/utils";
import { HeaderNav } from "@/components/HeaderNav";
import { SheetHeaderParameters } from "@/components/SheetHeaderParameters";
import { SlotRail } from "@/components/SlotRail";
import { HourlyTableGrid } from "@/components/HourlyTableGrid";
import { SlotEntryDrawer } from "@/components/SlotEntryDrawer";
import { SupervisorReviewModal } from "@/components/SupervisorReviewModal";
import { PdfExportModal } from "@/components/PdfExportModal";
import { QCManagementView } from "@/components/QCManagementView";
import { FloatingBottomDock } from "@/components/FloatingBottomDock";
import { UserManagementView } from "@/components/UserManagementView";
import { SupervisorMonitoringView } from "@/components/SupervisorMonitoringView";
import { ReportsView } from "@/components/ReportsView";
import LoginView from "@/components/LoginView";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import {
  logActivityToInsForge,
  fetchUsersFromInsForge,
  updateUserLastLogin,
  syncSlotToInsForge,
  syncBatchParamsToInsForge,
  syncApprovalToInsForge
} from "@/lib/dbService";

export default function BleachingProcessLogApp() {
  // 1. Navigation Tab State
  const [activeTab, setActiveTab] = useState<DashboardTab>('bleaching');

  // 2. Authentication & Users State
  const [allUsers, setAllUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check saved session on mount and fetch live users from InsForge
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nisshin_auth_user");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
    setIsAuthChecking(false);

    // Fetch live users from InsForge PostgreSQL
    async function loadInsForgeUsers() {
      try {
        const liveUsers = await fetchUsersFromInsForge();
        if (liveUsers && liveUsers.length > 0) {
          setAllUsers(liveUsers);
        }
      } catch (err) {
        console.warn("Using offline user fallback:", err);
      }
    }
    loadInsForgeUsers();
  }, []);

  // 3. Supervisor Audit & Events State
  const [supervisorEvents, setSupervisorEvents] = useState<SupervisorUpdateEvent[]>(INITIAL_SUPERVISOR_EVENTS);

  // 4. Core Bleaching Log State
  const [sheet, setSheet] = useState<LogSheet>(() => createMockSheet());
  const [isDark, setIsDark] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Initialize theme from localStorage or default to Deep Industrial Dark
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("nisshin_theme");
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      } else {
        setIsDark(true);
      }
    } catch {
      setIsDark(true);
    }
  }, []);

  // 5. Interaction State
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Active current real hour slot (mocked as slot 4, ~1200 hrs)
  const currentSlotIndex = 4;
  const currentShift = getShiftForSlot(currentSlotIndex);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      try { localStorage.setItem("nisshin_theme", "dark"); } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try { localStorage.setItem("nisshin_theme", "light"); } catch {}
    }
  }, [isDark]);

  // Offline detection listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showNotice("Network connection restored. Synchronizing local queue...", "success");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showNotice("Network disconnected (Offline). All data saved to tablet local storage.", "info");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const showNotice = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Determine if current user can edit the selected slot
  const isSheetLocked = sheet.status === 'Approved';
  const slotShift = getShiftForSlot(selectedSlotIndex);

  let canEditSlot = false;
  if (!isSheetLocked && currentUser) {
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
      canEditSlot = true;
    } else if (currentUser.role === 'technician') {
      // Tech can edit slots of their assigned shift
      if (currentUser.id === sheet.tech_s1 && slotShift === 1) canEditSlot = true;
      else if (currentUser.id === sheet.tech_s2 && slotShift === 2) canEditSlot = true;
      else if (currentUser.id === sheet.tech_s3 && slotShift === 3) canEditSlot = true;
      else if (slotShift === currentShift) canEditSlot = true; // Fallback during testing
    }
  }

  // Handle Slot Select
  const handleSelectSlot = (slotIdx: number) => {
    setSelectedSlotIndex(slotIdx);
    setIsDrawerOpen(true);
  };

  // Handle Save Slot
  const handleSaveSlot = (updatedEntry: LogEntry) => {
    if (!currentUser) return;
    const updatedEntries = sheet.entries.map((e, idx) => 
      idx === updatedEntry.slot_index ? updatedEntry : e
    );

    const hasSavedAny = updatedEntries.some(e => e.is_saved);
    const newStatus = sheet.status === 'Draft' && hasSavedAny ? 'InProgress' : sheet.status;

    setSheet({
      ...sheet,
      entries: updatedEntries,
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    // Real-time synchronization to InsForge PostgreSQL (PL001)
    syncSlotToInsForge(updatedEntry, "BP001", currentUser);

    // Check if reading is out of spec
    const isVacAlert = typeof updatedEntry.vacuum_mmhg === 'number' && updatedEntry.vacuum_mmhg < 600;
    const isTempAlert = typeof updatedEntry.he_temp_c === 'number' && (updatedEntry.he_temp_c < 70 || updatedEntry.he_temp_c > 115);
    const hasAlert = isVacAlert || isTempAlert || (updatedEntry.out_of_spec && updatedEntry.out_of_spec.length > 0);

    // Log event into supervisor monitoring feed
    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: hasAlert 
        ? `ALERT: Out-of-Spec Parameter Logged (Slot ${updatedEntry.time_label} Hrs)`
        : `Slot ${updatedEntry.time_label} Hrs Successfully Saved`,
      description: `${currentUser.name} recorded Slot ${updatedEntry.time_label} (Flow ${updatedEntry.flowrate_set ?? '-'} MT/HR, Vac ${updatedEntry.vacuum_mmhg ?? '-'} mmHg, Temp ${updatedEntry.he_temp_c ?? '-'}°C). Remarks: ${updatedEntry.remarks || 'No special remarks.'}`,
      severity: hasAlert ? 'alert' : 'success',
      author_name: currentUser.name,
      author_role: currentUser.role,
      shift: updatedEntry.shift,
      slot_time: updatedEntry.time_label,
      requires_acknowledgment: hasAlert,
      acknowledged: false,
    };

    setSupervisorEvents(prev => [newEvent, ...prev]);

    setIsDrawerOpen(false);
    showNotice(`Slot ${updatedEntry.time_label} Hrs successfully saved & synced to InsForge.`, 'success');
  };

  // Update Header Parameter
  const handleUpdateHeader = (updates: Partial<LogSheet>) => {
    if (!currentUser) return;
    const updatedSheet = {
      ...sheet,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    setSheet(updatedSheet);

    // Real-time sync to InsForge (BP001)
    syncBatchParamsToInsForge(updatedSheet, currentUser);

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Operating Parameters',
      title: 'Sheet Operating Parameters Updated',
      description: `${currentUser.name} updated the plant target parameters (RF-FR-003).`,
      severity: 'info',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: false,
      acknowledged: true,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Sheet operating parameters updated & synced to InsForge.", "info");
  };

  // Submit Sheet for Review
  const handleSubmitSheet = () => {
    if (!currentUser) return;
    const submittedSheet = {
      ...sheet,
      status: 'Submitted' as const,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSheet(submittedSheet);

    // Real-time sync to InsForge
    syncBatchParamsToInsForge(submittedSheet, currentUser);
    logActivityToInsForge(currentUser, "SUBMIT_PROCESS_SHEET", "BATCH_PROCESS", "BP001", {
      plant_id: sheet.plant_id,
      product: sheet.product_name,
    });

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: 'Sheet Submitted for Supervisor Review',
      description: `${currentUser.name} submitted process sheet RF-FR-003 for final quality review.`,
      severity: 'warning',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: true,
      acknowledged: false,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Sheet RF-FR-003 submitted to Supervisor for quality review.", "success");
  };

  // Supervisor Approval
  const handleApproveSheet = (reviewNote: string) => {
    if (!currentUser) return;
    setSheet(prev => ({
      ...prev,
      status: 'Approved',
      reviewed_by: currentUser.id,
      reviewed_by_name: currentUser.name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    }));

    // Real-time sync approval record (AR001) to InsForge
    syncApprovalToInsForge("Bleaching Sheet", "BP001", currentUser, "Approved", reviewNote);

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: 'Process Sheet APPROVED & LOCKED',
      description: `${currentUser.name} approved process sheet RF-FR-003. Review notes: ${reviewNote}`,
      severity: 'success',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: false,
      acknowledged: true,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Sheet has been officially APPROVED and LOCKED in InsForge.", "success");
  };

  // Supervisor Return
  const handleReturnSheet = (reviewNote: string) => {
    if (!currentUser) return;
    setSheet(prev => ({
      ...prev,
      status: 'Returned',
      reviewed_by: currentUser.id,
      reviewed_by_name: currentUser.name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    }));

    // Real-time sync returned status (AR001) to InsForge
    syncApprovalToInsForge("Bleaching Sheet", "BP001", currentUser, "Returned", reviewNote);

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: 'Sheet RETURNED by Supervisor',
      description: `${currentUser.name} returned sheet to technician for corrective actions. Notes: ${reviewNote}`,
      severity: 'alert',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: true,
      acknowledged: false,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Sheet RETURNED to technician with supervisor review notes.", "info");
  };

  // Supervisor Acknowledge Event
  const handleAcknowledgeEvent = (eventId: string, acknowledgedBy: string) => {
    setSupervisorEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, acknowledged: true, acknowledged_by: acknowledgedBy, acknowledged_at: new Date().toISOString() }
        : e
    ));

    // Log acknowledgment in InsForge audit trail
    if (currentUser) {
      logActivityToInsForge(currentUser, "ACKNOWLEDGE_ALERT", "AUDIT_LOG", eventId, {
        acknowledgedBy,
      });
    }

    showNotice(`Alert entry verified and acknowledged by ${acknowledgedBy}.`, 'success');
  };

  // Login handler
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("nisshin_auth_user", JSON.stringify(user));
    } catch {}

    // Record login timestamp in InsForge users & audit log
    updateUserLastLogin(user);

    showNotice(`Welcome back, ${user.name} (${user.role}). Active session started.`, 'success');
  };

  // Logout handler
  const handleLogout = () => {
    if (currentUser) {
      logActivityToInsForge(currentUser, "USER_LOGOUT", "USER_SESSION", currentUser.id, {
        email: currentUser.email,
        role: currentUser.role,
      });
    }

    setCurrentUser(null);
    try {
      localStorage.removeItem("nisshin_auth_user");
    } catch {}
    showNotice("You have logged out of the system.", "info");
  };

  // Unacknowledged alerts count for supervisor badge
  const unacknowledgedAlertsCount = supervisorEvents.filter(e => e.requires_acknowledgment && !e.acknowledged).length;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 font-mono text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <span>Verifying plant workstation session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLoginSuccess} allUsers={allUsers} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors animate-in fade-in duration-300">
      {/* 1. Header Navigation with Dynamic Tab Pill & User Auth Button */}
      <HeaderNav
        sheetStatus={sheet.status}
        currentRole={currentUser}
        allUsers={allUsers}
        onRoleChange={setCurrentUser}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        isOffline={isOffline}
        onOpenPdf={() => setIsPdfOpen(true)}
        onSubmitSheet={handleSubmitSheet}
        onOpenReview={() => setIsReviewOpen(true)}
        currentShift={currentShift}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Notification Toast with 3D Depth */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom duration-300 [transform-style:preserve-3d] ${
          notification.type === 'success' 
            ? 'bg-emerald-600/95 text-white border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.3)]' 
            : notification.type === 'error'
              ? 'bg-rose-600/95 text-white border-rose-400/50 shadow-[0_0_24px_rgba(239,68,68,0.3)]'
              : 'bg-zinc-900/95 text-white border-zinc-700/60 shadow-[0_0_24px_rgba(245,158,11,0.2)]'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-200" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-200" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-amber-300" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-3 sm:p-5 pb-28 sm:pb-32 [perspective:1400px]">
        <div key={activeTab} className="fade-in-tactile">
          {/* Tab 1: Bleaching Process Log (RF-FR-003) */}
          {activeTab === 'bleaching' && (
            <>
              {/* Banner if Sheet was Returned with 3D Neon Alert */}
              {sheet.status === 'Returned' && sheet.review_note && (
                <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-rose-100/70 dark:from-rose-950/70 dark:to-rose-900/40 border border-rose-400 dark:border-rose-700/80 text-rose-800 dark:text-rose-200 flex items-start gap-3.5 shadow-[0_8px_24px_rgba(239,68,68,0.15)] [transform-style:preserve-3d]">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold font-display text-sm">Sheet Returned by Supervisor ({sheet.reviewed_by_name}):</span>
                    <p className="text-xs mt-1 font-mono leading-relaxed">{sheet.review_note}</p>
                  </div>
                </div>
              )}

              {/* Operating Parameters Header */}
              <SheetHeaderParameters
                sheet={sheet}
                plants={MOCK_PLANTS}
                products={MOCK_PRODUCTS}
                tanks={MOCK_TANKS}
                isLocked={isSheetLocked}
                onUpdateHeader={handleUpdateHeader}
              />

              {/* 24-Hour Timeline Slot Rail */}
              <SlotRail
                entries={sheet.entries}
                selectedSlotIndex={selectedSlotIndex}
                onSelectSlot={handleSelectSlot}
                activeCurrentHourIndex={currentSlotIndex}
              />

              {/* Full 24-Slot Paper-Like Grid */}
              <HourlyTableGrid
                entries={sheet.entries}
                currentShift={currentShift}
                currentUser={currentUser}
                isLocked={isSheetLocked}
                onSelectSlot={handleSelectSlot}
                selectedSlotIndex={selectedSlotIndex}
              />
            </>
          )}

          {/* Tab 2: QC Management Tab View */}
          {activeTab === 'qc' && (
            <QCManagementView
              currentUser={currentUser}
              isDark={isDark}
            />
          )}

          {/* Tab 3: Reports & Analytics Tab View */}
          {activeTab === 'reports' && (
            <ReportsView
              sheet={sheet}
              currentUser={currentUser}
            />
          )}

          {/* Tab 4: Supervisor Monitoring View */}
          {activeTab === 'supervisor' && (
            <SupervisorMonitoringView
              currentUser={currentUser}
              sheet={sheet}
              events={supervisorEvents}
              onAcknowledgeEvent={handleAcknowledgeEvent}
              onOpenReviewModal={() => setIsReviewOpen(true)}
              onOpenPdfModal={() => setIsPdfOpen(true)}
            />
          )}

          {/* Tab 5: Admin User Management View */}
          {activeTab === 'users' && (
            <UserManagementView
              currentUser={currentUser}
              users={allUsers}
              onUpdateUsers={setAllUsers}
              onRequestLoginModal={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Hourly Entry Drawer (Bleaching Tab) */}
      {isDrawerOpen && activeTab === 'bleaching' && (
        <SlotEntryDrawer
          entry={sheet.entries[selectedSlotIndex]}
          canEdit={canEditSlot}
          currentUser={currentUser}
          onSave={handleSaveSlot}
          onClose={() => setIsDrawerOpen(false)}
          onNavigateSlot={(direction) => {
            const nextIdx = selectedSlotIndex + direction;
            if (nextIdx >= 0 && nextIdx < 24) {
              setSelectedSlotIndex(nextIdx);
            }
          }}
          isFirstSlot={selectedSlotIndex === 0}
          isLastSlot={selectedSlotIndex === 23}
        />
      )}

      {/* Supervisor Quality Review & Approval Modal */}
      <SupervisorReviewModal
        sheet={sheet}
        currentUser={currentUser}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onApprove={handleApproveSheet}
        onReturn={handleReturnSheet}
      />

      {/* Printable PDF Modal (A4 Landscape Form RF-FR-003 Rev 03) */}
      <PdfExportModal
        sheet={sheet}
        isOpen={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
      />

      {/* Floating Bottom Dock Navigation */}
      <FloatingBottomDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPdf={() => setIsPdfOpen(true)}
        sheetStatus={sheet.status}
        qcSampleCount={54}
        currentUser={currentUser}
        unacknowledgedAlertsCount={unacknowledgedAlertsCount}
      />
    </div>
  );
}
