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
import { LoginModal } from "@/components/LoginModal";
import { UserManagementView } from "@/components/UserManagementView";
import { SupervisorMonitoringView } from "@/components/SupervisorMonitoringView";
import { ReportsView } from "@/components/ReportsView";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

export default function BleachingProcessLogApp() {
  // 1. Navigation Tab State
  const [activeTab, setActiveTab] = useState<DashboardTab>('bleaching');

  // 2. Authentication & Users State
  const [allUsers, setAllUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]); // Ahmad Razif (Tech Shift 1)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 3. Supervisor Audit & Events State
  const [supervisorEvents, setSupervisorEvents] = useState<SupervisorUpdateEvent[]>(INITIAL_SUPERVISOR_EVENTS);

  // 4. Core Bleaching Log State
  const [sheet, setSheet] = useState<LogSheet>(() => createMockSheet());
  const [isDark, setIsDark] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

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
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Offline detection listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showNotice("Sambungan rangkaian dipulihkan. Menyelaraskan barisan menunggu tempatan...", "success");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showNotice("Rangkaian terputus (Offline). Semua data disimpan dalam memori tablet.", "info");
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
  if (!isSheetLocked) {
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
        ? `AMARAN: Parameter Luar Had Direkodkan (Slot ${updatedEntry.time_label} Hrs)`
        : `Slot ${updatedEntry.time_label} Hrs Berjaya Disimpan`,
      description: `${currentUser.name} merekodkan Slot ${updatedEntry.time_label} (Flow ${updatedEntry.flowrate_set ?? '-'} MT/HR, Vac ${updatedEntry.vacuum_mmhg ?? '-'} mmHg, Temp ${updatedEntry.he_temp_c ?? '-'}°C). Catatan: ${updatedEntry.remarks || 'Tiada catatan khas.'}`,
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
    showNotice(`Slot ${updatedEntry.time_label} Hrs berjaya disimpan oleh ${currentUser.name}.`, 'success');
  };

  // Update Header Parameter
  const handleUpdateHeader = (updates: Partial<LogSheet>) => {
    setSheet(prev => ({
      ...prev,
      ...updates,
      updated_at: new Date().toISOString(),
    }));

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Operating Parameters',
      title: 'Parameter Operasi Borang Dikemas kini',
      description: `${currentUser.name} telah mengemas kini parameter sasaran loji (RF-FR-003).`,
      severity: 'info',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: false,
      acknowledged: true,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Parameter operasi lembaran dikemas kini.", "info");
  };

  // Submit Sheet for Review
  const handleSubmitSheet = () => {
    setSheet(prev => ({
      ...prev,
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: 'Lembaran Dihantar untuk Semakan Penyelia',
      description: `${currentUser.name} telah menghantar lembaran proses RF-FR-003 untuk semakan kualiti akhir.`,
      severity: 'warning',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: true,
      acknowledged: false,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Lembaran RF-FR-003 telah dihantar kepada Penyelia untuk semakan kualiti.", "success");
  };

  // Supervisor Approval
  const handleApproveSheet = (reviewNote: string) => {
    setSheet(prev => ({
      ...prev,
      status: 'Approved',
      reviewed_by: currentUser.id,
      reviewed_by_name: currentUser.name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    }));

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: 'Lembaran Rasmi DILULUSKAN & DIKUNCI',
      description: `${currentUser.name} telah meluluskan lembaran proses RF-FR-003. Ulasan: ${reviewNote}`,
      severity: 'success',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: false,
      acknowledged: true,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Borang telah DILULUSKAN dan DIKUNCI secara rasmi.", "success");
  };

  // Supervisor Return
  const handleReturnSheet = (reviewNote: string) => {
    setSheet(prev => ({
      ...prev,
      status: 'Returned',
      reviewed_by: currentUser.id,
      reviewed_by_name: currentUser.name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    }));

    const newEvent: SupervisorUpdateEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: 'Lembaran DIKEMBALIKAN oleh Penyelia',
      description: `${currentUser.name} mengembalikan lembaran kepada juruteknik untuk pembetulan. Catatan: ${reviewNote}`,
      severity: 'alert',
      author_name: currentUser.name,
      author_role: currentUser.role,
      requires_acknowledgment: true,
      acknowledged: false,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);

    showNotice("Borang telah DIKEMBALIKAN kepada juruteknik berserta catatan ulasan.", "info");
  };

  // Supervisor Acknowledge Event
  const handleAcknowledgeEvent = (eventId: string, acknowledgedBy: string) => {
    setSupervisorEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, acknowledged: true, acknowledged_by: acknowledgedBy, acknowledged_at: new Date().toISOString() }
        : e
    ));
    showNotice(`Catatan amaran telah disahkan dan diperakui oleh ${acknowledgedBy}.`, 'success');
  };

  // Login handler
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    showNotice(`Selamat kembali, ${user.name} (${user.role}). Sesi aktif dimulakan.`, 'success');
  };

  // Logout handler
  const handleLogout = () => {
    showNotice("Anda telah log keluar daripada sistem.", "info");
  };

  // Unacknowledged alerts count for supervisor badge
  const unacknowledgedAlertsCount = supervisorEvents.filter(e => e.requires_acknowledgment && !e.acknowledged).length;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors">
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
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : notification.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-zinc-900 text-white border-zinc-700'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-amber-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-3 sm:p-5 pb-28 sm:pb-32">
        {/* Tab 1: Bleaching Process Log (RF-FR-003) */}
        {activeTab === 'bleaching' && (
          <>
            {/* Banner if Sheet was Returned */}
            {sheet.status === 'Returned' && sheet.review_note && (
              <div className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Borang Dikembalikan oleh Penyelia ({sheet.reviewed_by_name}):</span>
                  <p className="text-xs mt-1 font-mono">{sheet.review_note}</p>
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
            onRequestLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}
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

      {/* User Login & Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
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
