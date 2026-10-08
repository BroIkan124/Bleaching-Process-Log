"use client";

import React, { useState, useEffect } from "react";
import { LogSheet, LogEntry, UserProfile, DashboardTab, SupervisorUpdateEvent, SampleReport, Product, Plant, Tank } from "@/types";
import { 
  MOCK_USERS, 
  MOCK_PLANTS, 
  MOCK_PRODUCTS, 
  MOCK_TANKS, 
  createCleanSheet,
  INITIAL_SUPERVISOR_EVENTS
} from "@/lib/mockData";
import { SHIFTS } from "@/lib/constants";
import { getShiftForSlot } from "@/lib/utils";
import { 
  getRealtimeClockState, 
  RealtimeClockState, 
  evaluateSlotAccess,
  getHourForSlotIndex
} from "@/lib/realtimeTimeline";
import { 
  createOrUpdateQcSampleFromLogEntry, 
  syncQcResultToLogEntries 
} from "@/lib/workflowPipeline";
import { HeaderNav } from "@/components/HeaderNav";
import { SheetHeaderParameters } from "@/components/SheetHeaderParameters";
import { SlotRail } from "@/components/SlotRail";
import { HourlyTableGrid } from "@/components/HourlyTableGrid";
import { SlotEntryDrawer } from "@/components/SlotEntryDrawer";
import { RealtimeTimelineBanner } from "@/components/RealtimeTimelineBanner";
import { SupervisorReviewModal } from "@/components/SupervisorReviewModal";
import { PdfExportModal } from "@/components/PdfExportModal";
import { QCManagementView } from "@/components/QCManagementView";
import { FloatingBottomDock } from "@/components/FloatingBottomDock";
import { UserManagementView } from "@/components/UserManagementView";
import { SupervisorMonitoringView } from "@/components/SupervisorMonitoringView";
import { ReportsView } from "@/components/ReportsView";
import { MasterDataView } from "@/components/MasterDataView";
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

  // 3. Supervisor Audit & Events State (Persisted)
  const [supervisorEvents, setSupervisorEvents] = useState<SupervisorUpdateEvent[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_supervisor_events");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_SUPERVISOR_EVENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("nisshin_supervisor_events", JSON.stringify(supervisorEvents));
    } catch {}
  }, [supervisorEvents]);

  // 4. Core Bleaching Log State (Persisted - Zero Dummy Data, Ready for Real Operator Entry)
  const [sheet, setSheet] = useState<LogSheet>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_process_sheet");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return createCleanSheet();
  });

  useEffect(() => {
    try {
      localStorage.setItem("nisshin_process_sheet", JSON.stringify(sheet));
    } catch {}
  }, [sheet]);

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
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(() => getRealtimeClockState().slotIndex);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // 6. Dynamic Refinery Products Catalog (45 Standard Products, Persisted in LocalStorage)
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_products");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return MOCK_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("nisshin_products", JSON.stringify(products));
    } catch {}
  }, [products]);

  // Handler to dynamically register a custom product into the catalog
  const handleAddProduct = (newProductName: string): Product | null => {
    const trimmed = newProductName.trim();
    if (!trimmed) {
      showNotice("Product name cannot be empty.", "error");
      return null;
    }
    const existing = products.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      showNotice(`Product "${existing.name}" is already in the refinery catalog.`, "info");
      handleUpdateHeader({
        product_id: existing.id,
        product_name: existing.name,
      });
      return existing;
    }

    const newProd: Product = {
      id: `prd-${Date.now()}`,
      name: trimmed,
    };
    const updated = [...products, newProd];
    setProducts(updated);
    try {
      localStorage.setItem("nisshin_products", JSON.stringify(updated));
    } catch {}

    handleUpdateHeader({
      product_id: newProd.id,
      product_name: newProd.name,
    });

    showNotice(`New oil product "${trimmed}" added to refinery catalog and selected.`, "success");
    return newProd;
  };

  // 6b. Dynamic Refinery Plants (Persisted in LocalStorage)
  const [plants, setPlants] = useState<Plant[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_plants");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return MOCK_PLANTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("nisshin_plants", JSON.stringify(plants));
    } catch {}
  }, [plants]);

  const handleAddPlant = (newPlantName: string): Plant | null => {
    const trimmed = newPlantName.trim();
    if (!trimmed) {
      showNotice("Plant name cannot be empty.", "error");
      return null;
    }
    const existing = plants.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      showNotice(`Plant "${existing.name}" is already registered.`, "info");
      handleUpdateHeader({
        plant_id: existing.id,
        plant_name: existing.name,
      });
      return existing;
    }

    const newPlant: Plant = {
      id: `plt-${Date.now()}`,
      name: trimmed,
    };
    const updated = [...plants, newPlant];
    setPlants(updated);
    try {
      localStorage.setItem("nisshin_plants", JSON.stringify(updated));
    } catch {}

    handleUpdateHeader({
      plant_id: newPlant.id,
      plant_name: newPlant.name,
    });

    showNotice(`New plant line "${trimmed}" registered into configuration and selected.`, "success");
    return newPlant;
  };

  // 6c. Dynamic Refinery Tanks Farm (Persisted in LocalStorage)
  const [tanks, setTanks] = useState<Tank[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_tanks");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return MOCK_TANKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("nisshin_tanks", JSON.stringify(tanks));
    } catch {}
  }, [tanks]);

  const handleAddTank = (newTankName: string, kind: 'feed' | 'discharge' | 'both' = 'both'): Tank | null => {
    const trimmed = newTankName.trim();
    if (!trimmed) {
      showNotice("Tank name cannot be empty.", "error");
      return null;
    }
    const existing = tanks.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      showNotice(`Tank "${existing.name}" is already registered.`, "info");
      if (kind === 'feed') {
        handleUpdateHeader({ feed_tank_id: existing.id, feed_tank_name: existing.name });
      } else if (kind === 'discharge') {
        handleUpdateHeader({ discharge_tank_id: existing.id, discharge_tank_name: existing.name });
      }
      return existing;
    }

    const newTank: Tank = {
      id: `tnk-${Date.now()}`,
      name: trimmed,
      kind,
    };
    const updated = [...tanks, newTank];
    setTanks(updated);
    try {
      localStorage.setItem("nisshin_tanks", JSON.stringify(updated));
    } catch {}

    if (kind === 'feed') {
      handleUpdateHeader({ feed_tank_id: newTank.id, feed_tank_name: newTank.name });
    } else if (kind === 'discharge') {
      handleUpdateHeader({ discharge_tank_id: newTank.id, discharge_tank_name: newTank.name });
    }

    showNotice(`New tank "${trimmed}" registered into refinery tank farm.`, "success");
    return newTank;
  };

  // Two-way synchronization between Bleaching Log and QC Management product
  const handleProductChange = (newProductName: string) => {
    const trimmed = newProductName.trim();
    if (!trimmed) return;
    const prod = products.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    handleUpdateHeader({
      product_id: prod?.id || `prd-${Date.now()}`,
      product_name: prod?.name || trimmed,
    });
    showNotice(`Active product synchronized to "${trimmed}".`, "info");
  };

  // 7. Realtime Clock, Slot Rule & Override State (Strict 100% Live Clock)
  const [clockState, setClockState] = useState<RealtimeClockState>(() => getRealtimeClockState());
  const [supervisorUnlockedSlots, setSupervisorUnlockedSlots] = useState<number[]>([]);

  // 8. Centralized QC Reports for Multi-Department Workflow Handover (Stage 1 -> Stage 4, Persisted, Starts with Real Empty Set)
  const [qcReports, setQcReports] = useState<SampleReport[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_qc_reports");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("nisshin_qc_reports", JSON.stringify(qcReports));
    } catch {}
  }, [qcReports]);

  // Real-time ticking 1-second clock (Strictly Live Plant Clock)
  useEffect(() => {
    const updateClock = () => {
      setClockState(getRealtimeClockState());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Active current real hour slot & shift from synchronized clock state
  const currentSlotIndex = clockState.slotIndex;
  const currentShift = clockState.shiftNumber;

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

  // Determine if current user can edit the selected slot based on Realtime Slot Rule & Supervisor Override
  const isSheetLocked = sheet.status === 'Approved';
  const selectedSlotAccess = evaluateSlotAccess(
    selectedSlotIndex,
    currentSlotIndex,
    supervisorUnlockedSlots.includes(selectedSlotIndex),
    currentUser?.role
  );
  const canEditSlot = !isSheetLocked && selectedSlotAccess.canEdit;

  // Handle Slot Select (Strict Realtime Enforcement: Only active real-time slot can be opened)
  const handleSelectSlot = (slotIdx: number) => {
    const isUnlocked = supervisorUnlockedSlots.includes(slotIdx);
    if (slotIdx !== currentSlotIndex && !isUnlocked) {
      const slotHour = getHourForSlotIndex(slotIdx);
      const slotLabel = `${String(slotHour).padStart(2, '0')}:00`;
      const isPast = slotIdx < currentSlotIndex;
      showNotice(
        isPast 
          ? `Access Denied: Slot ${slotLabel} Hrs is locked (recording window closed). In compliance with plant SOP, only the current active real-time slot can be accessed.`
          : `Access Denied: Slot ${slotLabel} Hrs is locked (upcoming hour). Only the current active real-time slot can be accessed.`,
        'error'
      );
      return;
    }
    setSelectedSlotIndex(slotIdx);
    setIsDrawerOpen(true);
  };

  // Handle Save Slot - Multi-Department Workflow Handover: Bleaching Log -> QC Lab -> Reports -> Supervisor (STAGE 1)
  const handleSaveSlot = (updatedEntry: LogEntry) => {
    if (!currentUser) return;
    const updatedEntries = sheet.entries.map((e, idx) => 
      idx === updatedEntry.slot_index ? updatedEntry : e
    );

    const hasSavedAny = updatedEntries.some(e => e.is_saved);
    const newStatus = sheet.status === 'Draft' && hasSavedAny ? 'InProgress' : sheet.status;

    // 1. Bleaching Log -> QC Lab automatic handover (Stage 1)
    const { updatedReports, newEvent: pipelineEvent } = createOrUpdateQcSampleFromLogEntry(
      updatedEntry,
      sheet,
      currentUser,
      qcReports
    );
    setQcReports(updatedReports);

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

    // Event 1: Bleaching Log slot recording alert
    const slotEvent: SupervisorUpdateEvent = {
      id: `evt-save-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: hasAlert 
        ? `[STAGE 1] ALERT: Out of Spec Recorded (Slot ${updatedEntry.time_label} Hrs)`
        : `[STAGE 1] Slot ${updatedEntry.time_label} Hrs Successfully Saved & Synchronized`,
      description: `${currentUser.name} recorded Slot ${updatedEntry.time_label} (Flow ${updatedEntry.flowrate_set ?? '-'} MT/HR, Vac ${updatedEntry.vacuum_mmhg ?? '-'} mmHg, Temp ${updatedEntry.he_temp_c ?? '-'}°C). Lab sample synchronized to QC Lab.`,
      severity: hasAlert ? 'alert' : 'success',
      author_name: currentUser.name,
      author_role: currentUser.role,
      shift: updatedEntry.shift,
      slot_time: updatedEntry.time_label,
      requires_acknowledgment: hasAlert,
      acknowledged: false,
    };

    setSupervisorEvents(prev => [slotEvent, pipelineEvent, ...prev]);

    setIsDrawerOpen(false);
    showNotice(`Slot ${updatedEntry.time_label} Hrs saved & synchronized to QC Lab (SAR-2026-${updatedEntry.time_label}).`, 'success');
  };

  // QC Lab -> Bleaching Log & Reports Sync (STAGE 2)
  const handleUpdateQcReport = (report: SampleReport) => {
    setQcReports(prev => prev.map(r => r.id === report.id ? report : r));
    
    if (currentUser) {
      const { updatedEntries, newEvent } = syncQcResultToLogEntries(
        report,
        sheet.entries,
        currentUser
      );
      setSheet(prev => ({
        ...prev,
        entries: updatedEntries,
        updated_at: new Date().toISOString(),
      }));
      if (newEvent) {
        setSupervisorEvents(prev => [newEvent, ...prev]);
      }
      showNotice(`Analysis results for ${report.report_no} synchronized to Bleaching Log & Reports.`, 'success');
    }
  };

  const handleCreateQcReport = (newReport: SampleReport) => {
    setQcReports(prev => [newReport, ...prev]);
    const newEvent: SupervisorUpdateEvent = {
      id: `evt-qc-create-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'QC Lab',
      title: `[STAGE 2] New Sample Registered: ${newReport.report_no}`,
      description: `${currentUser?.name} registered new laboratory sample (${newReport.lot_no}).`,
      severity: 'info',
      author_name: currentUser?.name || 'QC Staff',
      author_role: currentUser?.role || 'technician',
      lot_no: newReport.lot_no,
      acknowledged: true,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);
    showNotice(`Laboratory sample ${newReport.report_no} registered.`, 'info');
  };

  // Reset shift to clean real data state
  const handleResetCleanShift = () => {
    const clean = createCleanSheet();
    setSheet(clean);
    setQcReports([]);
    setSupervisorEvents(INITIAL_SUPERVISOR_EVENTS);
    try {
      localStorage.removeItem("nisshin_process_sheet");
      localStorage.removeItem("nisshin_qc_reports");
      localStorage.removeItem("nisshin_supervisor_events");
    } catch {}
    showNotice("Refinery logs & QC records reset to clean live recording state.", "success");
  };

  // Supervisor Emergency Slot Unlock (STAGE 4)
  const handleToggleSupervisorOverride = (slotIndex: number) => {
    const isCurrentlyUnlocked = supervisorUnlockedSlots.includes(slotIndex);
    const updated = isCurrentlyUnlocked 
      ? supervisorUnlockedSlots.filter(i => i !== slotIndex)
      : [...supervisorUnlockedSlots, slotIndex];
    setSupervisorUnlockedSlots(updated);

    const slotLabel = sheet.entries[slotIndex]?.time_label || `${slotIndex}`;
    const newEvent: SupervisorUpdateEvent = {
      id: `evt-override-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Supervisor Monitoring',
      title: isCurrentlyUnlocked 
        ? `[STAGE 4] Time Lock Restored: Slot ${slotLabel} Hrs`
        : `[STAGE 4] EMERGENCY OVERRIDE: Slot ${slotLabel} Hrs Unlocked by Supervisor`,
      description: `Supervisor ${currentUser?.name} ${isCurrentlyUnlocked ? 're-locked' : 'manually unlocked'} Slot ${slotLabel} Hrs for audit log corrections.`,
      severity: isCurrentlyUnlocked ? 'info' : 'warning',
      author_name: currentUser?.name || 'Supervisor',
      author_role: currentUser?.role || 'supervisor',
      slot_time: slotLabel,
      acknowledged: true,
    };
    setSupervisorEvents(prev => [newEvent, ...prev]);
    showNotice(
      isCurrentlyUnlocked ? `Slot ${slotLabel} Hrs re-locked.` : `Emergency override: Slot ${slotLabel} Hrs unlocked for operator.`,
      'info'
    );
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
        clockState={clockState}
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
                plants={plants}
                products={products}
                onAddPlant={handleAddPlant}
                onAddProduct={handleAddProduct}
                tanks={tanks}
                onAddTank={handleAddTank}
                isLocked={isSheetLocked}
                onUpdateHeader={handleUpdateHeader}
              />

              {/* Realtime Clock & Timeline Slot Locking Banner */}
              <RealtimeTimelineBanner
                clockState={clockState}
                supervisorUnlockedCount={supervisorUnlockedSlots.length}
                userRole={currentUser?.role}
                isSupervisor={currentUser.role === 'supervisor' || currentUser.role === 'admin'}
              />

              {/* 24-Hour Timeline Slot Rail */}
              <SlotRail
                entries={sheet.entries}
                selectedSlotIndex={selectedSlotIndex}
                onSelectSlot={handleSelectSlot}
                activeCurrentHourIndex={currentSlotIndex}
                supervisorUnlockedSlots={supervisorUnlockedSlots}
                userRole={currentUser?.role}
              />

              {/* Full 24-Slot Paper-Like Grid */}
              <HourlyTableGrid
                entries={sheet.entries}
                currentShift={currentShift}
                currentUser={currentUser}
                isLocked={isSheetLocked}
                onSelectSlot={handleSelectSlot}
                selectedSlotIndex={selectedSlotIndex}
                activeCurrentHourIndex={currentSlotIndex}
                supervisorUnlockedSlots={supervisorUnlockedSlots}
                userRole={currentUser?.role}
              />
            </>
          )}

          {/* Tab 2: QC Management Tab View (STAGE 2) */}
          {activeTab === 'qc' && (
            <QCManagementView
              currentUser={currentUser}
              isDark={isDark}
              reports={qcReports}
              products={products}
              activeProductName={sheet.product_name}
              onProductChange={handleProductChange}
              plants={plants}
              tanks={tanks}
              onAddPlant={handleAddPlant}
              onAddTank={handleAddTank}
              onAddProduct={handleAddProduct}
              onUpdateReport={handleUpdateQcReport}
              onCreateReport={handleCreateQcReport}
            />
          )}

          {/* Tab 3: Reports & Analytics Tab View (STAGE 3) */}
          {activeTab === 'reports' && (
            <ReportsView
              sheet={sheet}
              currentUser={currentUser}
              qcReports={qcReports}
            />
          )}

          {/* Tab 4: Master Data & Quality Analytics View */}
          {activeTab === 'masterdata' && (
            <MasterDataView
              sheet={sheet}
              currentUser={currentUser}
              isDark={isDark}
              reports={qcReports}
              products={products}
              plants={plants}
              tanks={tanks}
              onAddPlant={handleAddPlant}
              onAddTank={handleAddTank}
              onNavigateTab={setActiveTab}
              onUpdateReport={handleUpdateQcReport}
              onResetCleanData={handleResetCleanShift}
            />
          )}

          {/* Tab 5: Supervisor Monitoring View (STAGE 4) */}
          {activeTab === 'supervisor' && (
            <SupervisorMonitoringView
              currentUser={currentUser}
              sheet={sheet}
              events={supervisorEvents}
              onAcknowledgeEvent={handleAcknowledgeEvent}
              onOpenReviewModal={() => setIsReviewOpen(true)}
              onOpenPdfModal={() => setIsPdfOpen(true)}
              qcReports={qcReports}
              onUnlockSlot={handleToggleSupervisorOverride}
              supervisorUnlockedSlots={supervisorUnlockedSlots}
              activeCurrentHourIndex={currentSlotIndex}
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
              const isUnlocked = supervisorUnlockedSlots.includes(nextIdx);
              if (nextIdx !== currentSlotIndex && !isUnlocked) {
                const slotHour = getHourForSlotIndex(nextIdx);
                const slotLabel = `${String(slotHour).padStart(2, '0')}:00`;
                showNotice(`Cannot switch to Slot ${slotLabel} Hrs: Access locked by SOP realtime policy.`, 'error');
                return;
              }
              setSelectedSlotIndex(nextIdx);
            }
          }}
          isFirstSlot={selectedSlotIndex === 0}
          isLastSlot={selectedSlotIndex === 23}
          activeCurrentHourIndex={currentSlotIndex}
          isSupervisorOverride={supervisorUnlockedSlots.includes(selectedSlotIndex)}
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
        qcSampleCount={qcReports.length}
        currentUser={currentUser}
        unacknowledgedAlertsCount={unacknowledgedAlertsCount}
      />
    </div>
  );
}
