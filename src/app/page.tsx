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
  getHourForSlotIndex,
  evaluateSlotAccess
} from "@/lib/realtimeTimeline";
import { 
  createOrUpdateQcSampleFromLogEntry, 
  syncQcResultToLogEntries,
  createRetestSampleFromLogEntry 
} from "@/lib/workflowPipeline";
import { 
  playChime, 
  isAudioEnabled, 
  setAudioEnabled, 
  playTestTone 
} from "@/lib/audioService";
import { PlantNotification } from "@/types";
import { HeaderNav } from "@/components/HeaderNav";
import { SheetHeaderParameters } from "@/components/SheetHeaderParameters";
import { HourlyTableGrid } from "@/components/HourlyTableGrid";
import { SlotEntryDrawer } from "@/components/SlotEntryDrawer";
import { RealtimeTimelineBanner } from "@/components/RealtimeTimelineBanner";
import { SupervisorReviewModal } from "@/components/SupervisorReviewModal";
import { PdfExportModal } from "@/components/PdfExportModal";
import { QCManagementView } from "@/components/QCManagementView";
import { SidebarNav } from "@/components/SidebarNav";
import { UserManagementView } from "@/components/UserManagementView";
import { SupervisorMonitoringView } from "@/components/SupervisorMonitoringView";
import { ReportsView } from "@/components/ReportsView";
import { MasterDataView } from "@/components/MasterDataView";
import LoginView from "@/components/LoginView";
import WorkstationSettingsModal from "@/components/WorkstationSettingsModal";
import HelpSupportModal from "@/components/HelpSupportModal";
import { AlertCircle, CheckCircle, Info, Calendar } from "lucide-react";
import {
  logActivityToInsForge,
  fetchUsersFromInsForge,
  updateUserLastLogin,
  syncSlotToInsForge,
  syncBatchParamsToInsForge,
  syncApprovalToInsForge,
  fetchBatchSheetFromInsForge,
  fetchQcReportsFromInsForge,
  fetchSupervisorEventsFromInsForge,
  fetchMasterDataFromInsForge,
  syncMasterDataToInsForge,
  syncQcSampleToInsForge,
  syncSupervisorEventsToInsForge,
  saveStateSnapshotToInsForge,
  checkCloudUpdateTimestamp
} from "@/lib/dbService";

export default function BleachingProcessLogApp() {
  // 1. Navigation Tab State
  const [activeTab, setActiveTab] = useState<DashboardTab>('bleaching');

  // 2. Authentication & Users State
  const [allUsers, setAllUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Check saved session on mount
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

  // 4. Core Bleaching Log State (Resets automatically every new calendar day & supports historical calendar archive)
  const getTodayDateStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateStr());

  const [sheet, setSheet] = useState<LogSheet>(() => {
    const todayStr = getTodayDateStr();
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_process_sheet");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.sheet_date === todayStr) {
            return parsed;
          } else if (parsed && parsed.sheet_date) {
            // Archive previous day's sheet and initialize fresh clean sheet for today
            localStorage.setItem(`nisshin_archive_sheet_${parsed.sheet_date}`, JSON.stringify(parsed));
            return createCleanSheet(todayStr, parsed);
          }
        }
      } catch {}
    }
    return createCleanSheet(todayStr);
  });

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    const todayStr = getTodayDateStr();
    
    // Save current sheet before switching
    if (sheet.sheet_date === todayStr) {
      try { localStorage.setItem("nisshin_process_sheet", JSON.stringify(sheet)); } catch {}
    } else {
      try { localStorage.setItem(`nisshin_archive_sheet_${sheet.sheet_date}`, JSON.stringify(sheet)); } catch {}
    }

    setSelectedDate(newDate);

    if (newDate === todayStr) {
      // Restore today's live working sheet
      try {
        const savedToday = localStorage.getItem("nisshin_process_sheet");
        if (savedToday) {
          const parsed = JSON.parse(savedToday);
          if (parsed && parsed.sheet_date === todayStr) {
            setSheet(parsed);
            showNotice("Returned to Today's Live Shift.", "success");
            return;
          }
        }
      } catch {}
      setSheet(createCleanSheet(todayStr));
      showNotice("Loaded today's live shift.", "info");
    } else {
      // Load or create archived sheet for selected past date
      try {
        const savedArchive = localStorage.getItem(`nisshin_archive_sheet_${newDate}`);
        if (savedArchive) {
          setSheet(JSON.parse(savedArchive));
          showNotice(`Loaded archived process log for ${newDate}.`, "info");
          return;
        }
      } catch {}
      const archiveSheet = createCleanSheet(newDate);
      archiveSheet.status = "Approved"; // Past dates are archived/approved
      setSheet(archiveSheet);
      showNotice(`Viewing archived process log for ${newDate}.`, "info");
    }
  };

  useEffect(() => {
    try {
      const todayStr = getTodayDateStr();
      if (sheet.sheet_date === todayStr) {
        localStorage.setItem("nisshin_process_sheet", JSON.stringify(sheet));
      } else {
        localStorage.setItem(`nisshin_archive_sheet_${sheet.sheet_date}`, JSON.stringify(sheet));
      }
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Audible Industrial Chime state
  const [isAudioActive, setIsAudioActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return isAudioEnabled();
    }
    return false;
  });

  const handleToggleAudio = () => {
    const next = !isAudioActive;
    setIsAudioActive(next);
    setAudioEnabled(next);
    if (next) {
      playTestTone();
      showNotice("Audible Industrial Chime enabled.", "success");
    } else {
      showNotice("Audible Industrial Chime muted.", "info");
    }
  };

  // Plant broadcast notifications feed
  const [plantNotifications, setPlantNotifications] = useState<PlantNotification[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_plant_notifications");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("nisshin_plant_notifications", JSON.stringify(plantNotifications.slice(0, 30)));
    } catch {}
  }, [plantNotifications]);

  const addPlantNotification = (
    type: 'success' | 'warning' | 'alert' | 'info',
    title: string,
    message: string,
    source: 'QC Lab' | 'Bleaching Log' | 'Supervisor' | 'System',
    targetTab?: DashboardTab,
    slotIndex?: number,
    reportNo?: string
  ) => {
    const newNotif: PlantNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      source,
      read: false,
      targetTab,
      slotIndex,
      reportNo,
    };
    setPlantNotifications(prev => [newNotif, ...prev]);

    // Play acoustic chime
    playChime(type === 'alert' ? 'alert' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info');

    // Also show visual toast notification
    showNotice(`${title}: ${message}`, type === 'alert' ? 'error' : type === 'success' ? 'success' : 'info');
  };

  // 6. Dynamic Refinery Products Catalog (45 Standard Products, Persisted in LocalStorage)
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nisshin_products");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure all 45 standard MOCK_PRODUCTS are preserved alongside any user custom products
            const nameMap = new Map<string, Product>();
            for (const p of parsed) {
              nameMap.set(p.name.trim().toLowerCase(), p);
            }
            for (const def of MOCK_PRODUCTS) {
              if (!nameMap.has(def.name.trim().toLowerCase())) {
                nameMap.set(def.name.trim().toLowerCase(), def);
              }
            }
            const merged = Array.from(nameMap.values());
            try { localStorage.setItem("nisshin_products", JSON.stringify(merged)); } catch {}
            return merged;
          }
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

    syncMasterDataToInsForge(updated, plants, tanks, currentUser);

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

    syncMasterDataToInsForge(products, updated, tanks, currentUser);

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
          if (Array.isArray(parsed) && parsed.length > 0) {
            const nameMap = new Map<string, Tank>();
            for (const t of parsed) {
              nameMap.set(t.name.trim().toLowerCase(), t);
            }
            for (const def of MOCK_TANKS) {
              if (!nameMap.has(def.name.trim().toLowerCase())) {
                nameMap.set(def.name.trim().toLowerCase(), def);
              }
            }
            const merged = Array.from(nameMap.values());
            try { localStorage.setItem("nisshin_tanks", JSON.stringify(merged)); } catch {}
            return merged;
          }
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

    syncMasterDataToInsForge(products, plants, updated, currentUser);

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

  // 9. Multi-Device Cloud Synchronization Engine (InsForge PostgreSQL)
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastRemoteTimestamp, setLastRemoteTimestamp] = useState<string | null>(null);
  const isDrawerOpenRef = React.useRef(isDrawerOpen);
  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  const loadCloudData = async (isManual = false) => {
    try {
      if (isManual) setIsSyncing(true);

      // 1. Fetch live users
      const liveUsers = await fetchUsersFromInsForge();
      if (liveUsers && liveUsers.length > 0) {
        setAllUsers(liveUsers);
      }

      // 2. Fetch live master data catalog (Products, Plants, Tanks)
      const masterData = await fetchMasterDataFromInsForge();
      if (masterData) {
        if (masterData.products && masterData.products.length > 0) {
          const nameMap = new Map<string, Product>();
          for (const p of masterData.products) {
            nameMap.set(p.name.trim().toLowerCase(), p);
          }
          for (const def of MOCK_PRODUCTS) {
            if (!nameMap.has(def.name.trim().toLowerCase())) {
              nameMap.set(def.name.trim().toLowerCase(), def);
            }
          }
          const mergedProducts = Array.from(nameMap.values());
          setProducts(mergedProducts);
          try { localStorage.setItem("nisshin_products", JSON.stringify(mergedProducts)); } catch {}
        }
        if (masterData.plants && masterData.plants.length > 0) {
          setPlants(masterData.plants);
          try { localStorage.setItem("nisshin_plants", JSON.stringify(masterData.plants)); } catch {}
        }
        if (masterData.tanks && masterData.tanks.length > 0) {
          setTanks(masterData.tanks);
          try { localStorage.setItem("nisshin_tanks", JSON.stringify(masterData.tanks)); } catch {}
        }
      }

      // 3. Fetch live process log sheet (protect current drawer edit if operator actively typing)
      if (!isDrawerOpenRef.current) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const cloudSheetRes = await fetchBatchSheetFromInsForge(todayStr);
        if (cloudSheetRes && cloudSheetRes.sheet) {
          if (cloudSheetRes.sheet.sheet_date === todayStr) {
            setSheet(cloudSheetRes.sheet);
            try { localStorage.setItem("nisshin_process_sheet", JSON.stringify(cloudSheetRes.sheet)); } catch {}
          } else {
            // Cloud sheet belongs to a previous date -> Archive and reset for today!
            try { localStorage.setItem(`nisshin_archive_sheet_${cloudSheetRes.sheet.sheet_date}`, JSON.stringify(cloudSheetRes.sheet)); } catch {}
            const freshSheet = createCleanSheet(todayStr, cloudSheetRes.sheet);
            setSheet(freshSheet);
            try { localStorage.setItem("nisshin_process_sheet", JSON.stringify(freshSheet)); } catch {}
            saveStateSnapshotToInsForge("CURRENT_SHEET", freshSheet, currentUser);
          }
        }
      }

      // 4. Fetch live QC laboratory reports
      const cloudQc = await fetchQcReportsFromInsForge();
      if (cloudQc && Array.isArray(cloudQc)) {
        setQcReports(cloudQc);
        try { localStorage.setItem("nisshin_qc_reports", JSON.stringify(cloudQc)); } catch {}
      }

      // 5. Fetch live supervisor audit events
      const cloudEvents = await fetchSupervisorEventsFromInsForge();
      if (cloudEvents && Array.isArray(cloudEvents) && cloudEvents.length > 0) {
        setSupervisorEvents(cloudEvents);
        try { localStorage.setItem("nisshin_supervisor_events", JSON.stringify(cloudEvents)); } catch {}
      }

      // Track latest remote activity timestamp
      const latestTs = await checkCloudUpdateTimestamp();
      if (latestTs) {
        setLastRemoteTimestamp(latestTs);
      }

      if (isManual) {
        showNotice("Cloud sync complete! All laptops are updated with live refinery data.", "success");
      }
    } catch (err) {
      console.warn("Cloud sync warning:", err);
      if (isManual) {
        showNotice("Unable to reach InsForge cloud. Operating in local mode.", "info");
      }
    } finally {
      if (isManual) {
        setTimeout(() => setIsSyncing(false), 300);
      }
    }
  };

  // Immediate cloud data fetch on application mount across all laptops
  useEffect(() => {
    loadCloudData(false);
  }, []);

  // Smart periodic cloud synchronization (Background auto-sync polling every 1s & on window focus)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (isSyncing || isDrawerOpenRef.current) return;
      try {
        const latestTs = await checkCloudUpdateTimestamp();
        if (latestTs && latestTs !== lastRemoteTimestamp) {
          await loadCloudData(false);
        }
      } catch {}
    }, 1000);

    const handleFocus = () => {
      loadCloudData(false);
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [lastRemoteTimestamp, isSyncing]);

  // Automated day rollover detection (Auto-reset when entering a new calendar day)
  const lastActiveDateRef = React.useRef<string>("");
  useEffect(() => {
    const todayStr = clockState.dateString;
    if (!lastActiveDateRef.current) {
      lastActiveDateRef.current = todayStr;
      if (sheet.sheet_date !== todayStr) {
        try {
          localStorage.setItem(`nisshin_archive_sheet_${sheet.sheet_date}`, JSON.stringify(sheet));
        } catch {}
        const freshSheet = createCleanSheet(todayStr, sheet);
        setSheet(freshSheet);
        try {
          localStorage.setItem("nisshin_process_sheet", JSON.stringify(freshSheet));
        } catch {}
        saveStateSnapshotToInsForge("CURRENT_SHEET", freshSheet, currentUser);
        showNotice(`New day rollover detected (${todayStr}). Bleaching Process Log has been reset for the new 24-hour cycle.`, "info");
      }
      return;
    }
    if (lastActiveDateRef.current !== todayStr || sheet.sheet_date !== todayStr) {
      lastActiveDateRef.current = todayStr;
      try {
        localStorage.setItem(`nisshin_archive_sheet_${sheet.sheet_date}`, JSON.stringify(sheet));
      } catch {}
      const freshSheet = createCleanSheet(todayStr, sheet);
      setSheet(freshSheet);
      try {
        localStorage.setItem("nisshin_process_sheet", JSON.stringify(freshSheet));
      } catch {}
      saveStateSnapshotToInsForge("CURRENT_SHEET", freshSheet, currentUser);
      showNotice(`New day rollover detected (${todayStr}). Bleaching Process Log has been reset for the new 24-hour cycle.`, "info");
    }
  }, [clockState.dateString, sheet, currentUser]);

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

  // Handle Save Slot - Operator saves parameters and syncs data (does not auto-dispatch sample to QC)
  const handleSaveSlot = (updatedEntry: LogEntry) => {
    if (!currentUser) return;
    const updatedEntries = sheet.entries.map((e, idx) => 
      idx === updatedEntry.slot_index ? updatedEntry : e
    );

    const hasSavedAny = updatedEntries.some(e => e.is_saved);
    const newStatus = sheet.status === 'Draft' && hasSavedAny ? 'InProgress' : sheet.status;

    // Shift technician auto-detection (Option 3: Smart Hybrid)
    // If duty technician for this shift is not manually pinned, auto-assign from the active operator
    const shift = updatedEntry.shift;
    const operatorName = updatedEntry.entered_by_name || currentUser.name;
    const operatorId = updatedEntry.entered_by || currentUser.id;

    const shiftUpdates: Partial<LogSheet> = {};
    if (shift === 1 && !sheet.tech_s1_manual) {
      shiftUpdates.tech_s1 = operatorId;
      shiftUpdates.tech_s1_name = operatorName;
    } else if (shift === 2 && !sheet.tech_s2_manual) {
      shiftUpdates.tech_s2 = operatorId;
      shiftUpdates.tech_s2_name = operatorName;
    } else if (shift === 3 && !sheet.tech_s3_manual) {
      shiftUpdates.tech_s3 = operatorId;
      shiftUpdates.tech_s3_name = operatorName;
    }

    const updatedSheet: LogSheet = {
      ...sheet,
      ...shiftUpdates,
      entries: updatedEntries,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    setSheet(updatedSheet);

    // Real-time synchronization to InsForge PostgreSQL (PL001 + full sheet snapshot)
    const effectiveBatchId = updatedSheet.sheet_date ? `BP-${updatedSheet.sheet_date}` : "BP001";
    syncSlotToInsForge(updatedEntry, effectiveBatchId, currentUser, updatedSheet);
    saveStateSnapshotToInsForge("CURRENT_SHEET", updatedSheet, currentUser);

    // Check if reading is out of spec
    const isVacAlert = typeof updatedEntry.vacuum_mmhg === 'number' && updatedEntry.vacuum_mmhg < 600;
    const isTempAlert = typeof updatedEntry.he_temp_c === 'number' && (updatedEntry.he_temp_c < 70 || updatedEntry.he_temp_c > 115);
    const hasAlert = isVacAlert || isTempAlert || (updatedEntry.out_of_spec && updatedEntry.out_of_spec.length > 0);

    // Event: Bleaching Log slot recording alert
    const slotEvent: SupervisorUpdateEvent = {
      id: `evt-save-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: hasAlert 
        ? `ALERT: Out of Spec Recorded (Slot ${updatedEntry.time_label} Hrs)`
        : `Slot ${updatedEntry.time_label} Hrs Successfully Saved & Synchronized`,
      description: `${currentUser.name} recorded Slot ${updatedEntry.time_label} (Flow ${updatedEntry.flowrate_set ?? '-'} MT/HR, Vac ${updatedEntry.vacuum_mmhg ?? '-'} mmHg, Temp ${updatedEntry.he_temp_c ?? '-'} C).`,
      severity: hasAlert ? 'alert' : 'success',
      author_name: currentUser.name,
      author_role: currentUser.role,
      shift: updatedEntry.shift,
      slot_time: updatedEntry.time_label,
      requires_acknowledgment: hasAlert,
      acknowledged: false,
    };

    const updatedEvents = [slotEvent, ...supervisorEvents];
    setSupervisorEvents(updatedEvents);
    syncSupervisorEventsToInsForge(updatedEvents, currentUser);

    setIsDrawerOpen(false);
    showNotice(`Slot ${updatedEntry.time_label} Hrs saved & synchronized. Click "Send to QC" to dispatch sample.`, 'success');

    if (hasAlert) {
      addPlantNotification(
        'alert',
        'Operating Deviation Alert',
        `Slot ${updatedEntry.time_label} Hrs recorded off-spec readings (Temp: ${updatedEntry.he_temp_c ?? '-'}°C, Vac: ${updatedEntry.vacuum_mmhg ?? '-'} mmHg).`,
        'Bleaching Log',
        'bleaching',
        updatedEntry.slot_index
      );
    }
  };

  // Handle Operator Explicit Dispatch Sample to QC Management
  const handleDispatchToQc = (slotIndex: number) => {
    if (!currentUser) return;
    const entry = sheet.entries[slotIndex];
    if (!entry || !entry.is_saved) {
      showNotice(`Please save parameter telemetry for Slot ${entry?.time_label ?? slotIndex} before dispatching sample to QC.`, 'info');
      return;
    }

    // Explicit handover: Bleaching Log -> QC Lab
    const { updatedReports, newEvent: pipelineEvent, createdSample } = createOrUpdateQcSampleFromLogEntry(
      entry,
      sheet,
      currentUser,
      qcReports
    );
    setQcReports(updatedReports);
    try { localStorage.setItem("nisshin_qc_reports", JSON.stringify(updatedReports)); } catch {}

    const updatedEntry: LogEntry = {
      ...entry,
      qc_sample_sent: true,
      qc_sample_sent_at: new Date().toISOString(),
      qc_sample_id: createdSample.id,
      qc_status: 'pending',
    };

    const updatedEntries = sheet.entries.map((e, idx) =>
      idx === slotIndex ? updatedEntry : e
    );

    const updatedSheet: LogSheet = {
      ...sheet,
      entries: updatedEntries,
      updated_at: new Date().toISOString(),
    };
    setSheet(updatedSheet);
    try { localStorage.setItem("nisshin_process_sheet", JSON.stringify(updatedSheet)); } catch {}

    // Real-time synchronization to InsForge PostgreSQL & cloud snapshots
    const dispatchBatchId = updatedSheet.sheet_date ? `BP-${updatedSheet.sheet_date}` : "BP001";
    syncSlotToInsForge(updatedEntry, dispatchBatchId, currentUser, updatedSheet);
    syncQcSampleToInsForge(createdSample, currentUser, updatedReports);
    saveStateSnapshotToInsForge("QC_REPORTS", updatedReports, currentUser);
    saveStateSnapshotToInsForge("CURRENT_SHEET", updatedSheet, currentUser);

    const dispatchEvent: SupervisorUpdateEvent = {
      id: `evt-dispatch-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'Bleaching Log',
      title: `Sample Dispatched to QC: Slot ${entry.time_label} Hrs`,
      description: `${currentUser.name} has dispatched sample for Slot ${entry.time_label} Hrs to QC Management lab analysis queue.`,
      severity: 'info',
      author_name: currentUser.name,
      author_role: currentUser.role,
      shift: entry.shift,
      slot_time: entry.time_label,
    };

    const updatedEvents = [dispatchEvent, pipelineEvent, ...supervisorEvents];
    setSupervisorEvents(updatedEvents);
    syncSupervisorEventsToInsForge(updatedEvents, currentUser);

    addPlantNotification(
      'info',
      'Sampling Dispatched to QC',
      `Sample ${createdSample.report_no} for Slot ${entry.time_label} Hrs dispatched to QC Lab.`,
      'Bleaching Log',
      'qc',
      slotIndex,
      createdSample.report_no
    );
  };

  // Handle Operator Retest Dispatch following QC Rejection (STAGE 4 RETEST WORKFLOW)
  const handleDispatchRetest = (slotIndex: number) => {
    if (!currentUser) return;
    const entry = sheet.entries[slotIndex];
    if (!entry) return;

    const { updatedReports, newEvent: retestEvent, createdSample } = createRetestSampleFromLogEntry(
      entry,
      sheet,
      currentUser,
      qcReports
    );
    setQcReports(updatedReports);
    try { localStorage.setItem("nisshin_qc_reports", JSON.stringify(updatedReports)); } catch {}

    const retestSeq = (entry.qc_retest_count || 0) + 1;
    const updatedEntry: LogEntry = {
      ...entry,
      qc_status: 'retest_pending',
      qc_retest_count: retestSeq,
      qc_sample_sent: true,
      qc_sample_sent_at: new Date().toISOString(),
      qc_sample_id: createdSample.id,
    };

    const updatedEntries = sheet.entries.map((e, idx) =>
      idx === slotIndex ? updatedEntry : e
    );

    const updatedSheet: LogSheet = {
      ...sheet,
      entries: updatedEntries,
      updated_at: new Date().toISOString(),
    };
    setSheet(updatedSheet);
    try { localStorage.setItem("nisshin_process_sheet", JSON.stringify(updatedSheet)); } catch {}

    const dispatchBatchId = updatedSheet.sheet_date ? `BP-${updatedSheet.sheet_date}` : "BP001";
    syncSlotToInsForge(updatedEntry, dispatchBatchId, currentUser, updatedSheet);
    syncQcSampleToInsForge(createdSample, currentUser, updatedReports);
    saveStateSnapshotToInsForge("QC_REPORTS", updatedReports, currentUser);
    saveStateSnapshotToInsForge("CURRENT_SHEET", updatedSheet, currentUser);

    const updatedEvents = [retestEvent, ...supervisorEvents];
    setSupervisorEvents(updatedEvents);
    syncSupervisorEventsToInsForge(updatedEvents, currentUser);

    playChime('retest');
    addPlantNotification(
      'warning',
      'Priority Retest Dispatched',
      `Retest sample (R${retestSeq}) for Slot ${entry.time_label} Hrs dispatched to QC Lab following previous rejection.`,
      'Bleaching Log',
      'qc',
      slotIndex,
      createdSample.report_no
    );
  };

  // QC Lab -> Bleaching Log & Reports Sync (STAGE 2 & STAGE 4)
  const handleUpdateQcReport = (report: SampleReport) => {
    const updatedReports = qcReports.map(r => r.id === report.id ? report : r);
    setQcReports(updatedReports);
    
    if (currentUser) {
      const { updatedEntries, newEvent } = syncQcResultToLogEntries(
        report,
        sheet.entries,
        currentUser
      );
      const updatedSheet: LogSheet = {
        ...sheet,
        entries: updatedEntries,
        updated_at: new Date().toISOString(),
      };
      setSheet(updatedSheet);
      let updatedEvents = supervisorEvents;
      if (newEvent) {
        updatedEvents = [newEvent, ...supervisorEvents];
        setSupervisorEvents(updatedEvents);
        syncSupervisorEventsToInsForge(updatedEvents, currentUser);
      }
      syncQcSampleToInsForge(report, currentUser, updatedReports);
      saveStateSnapshotToInsForge("CURRENT_SHEET", updatedSheet, currentUser);

      // Extract slot time label for plant broadcast
      let timeLabel = "";
      if (report.time_check) {
        const raw = report.time_check.replace(":", "").trim();
        if (raw.length === 2) timeLabel = `${raw}00`;
        else if (raw.length === 4) timeLabel = raw;
      }
      if (!timeLabel && report.report_no) {
        const match = report.report_no.match(/\d{4}/);
        if (match) timeLabel = match[0];
      }

      if (report.decision?.decision === 'reject') {
        addPlantNotification(
          'alert',
          'QC Disposition: REJECTED',
          `Sample ${report.report_no} (Slot ${timeLabel || 'Process'} Hrs) REJECTED (${report.decision.reason_label || 'Off-spec'}). Retest sample required.`,
          'QC Lab',
          'bleaching',
          undefined,
          report.report_no
        );
      } else if (report.decision?.decision === 'accept' || report.decision?.decision === 'accept_concession') {
        const rColor = report.results?.find(r => r.parameter_code === 'COLOUR_R')?.value_numeric;
        const ffa = report.results?.find(r => r.parameter_code === 'FFA')?.value_numeric;
        addPlantNotification(
          'success',
          'QC Disposition: CERTIFIED',
          `Sample ${report.report_no} APPROVED (Colour: ${rColor ?? '-'}R, FFA: ${ffa ?? '-'}%). Bleaching Log synchronized.`,
          'QC Lab',
          'bleaching',
          undefined,
          report.report_no
        );
      } else {
        showNotice(`Analysis results for ${report.report_no} synchronized to Bleaching Log & Reports.`, 'success');
      }
    }
  };

  const handleCreateQcReport = (newReport: SampleReport) => {
    const updatedReports = [newReport, ...qcReports];
    setQcReports(updatedReports);
    const newEvent: SupervisorUpdateEvent = {
      id: `evt-qc-create-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'QC Lab',
      title: `New Sample Registered: ${newReport.report_no}`,
      description: `${currentUser?.name} registered new laboratory sample (${newReport.lot_no}).`,
      severity: 'info',
      author_name: currentUser?.name || 'QC Staff',
      author_role: currentUser?.role || 'technician',
      lot_no: newReport.lot_no,
      acknowledged: true,
    };
    const updatedEvents = [newEvent, ...supervisorEvents];
    setSupervisorEvents(updatedEvents);
    syncQcSampleToInsForge(newReport, currentUser, updatedReports);
    syncSupervisorEventsToInsForge(updatedEvents, currentUser);
    showNotice(`Laboratory sample ${newReport.report_no} registered & synced to cloud.`, 'info');
  };

  // Reset shift to clean real data state across all devices
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
    saveStateSnapshotToInsForge("CURRENT_SHEET", clean, currentUser);
    saveStateSnapshotToInsForge("QC_REPORTS", [], currentUser);
    saveStateSnapshotToInsForge("SUPERVISOR_EVENTS", INITIAL_SUPERVISOR_EVENTS, currentUser);
    showNotice("Refinery logs & QC records reset to clean live recording state across all laptops.", "success");
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
        ? `Time Lock Restored: Slot ${slotLabel} Hrs`
        : `EMERGENCY OVERRIDE: Slot ${slotLabel} Hrs Unlocked by Supervisor`,
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
    const approvedSheet: LogSheet = {
      ...sheet,
      status: 'Approved',
      reviewed_by: currentUser.id,
      reviewed_by_name: currentUser.name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    };
    setSheet(approvedSheet);

    // Real-time sync approval record (AR001) to InsForge & cloud snapshot
    syncApprovalToInsForge("Bleaching Sheet", "BP001", currentUser, "Approved", reviewNote, approvedSheet);

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
    const updatedEvents = [newEvent, ...supervisorEvents];
    setSupervisorEvents(updatedEvents);
    syncSupervisorEventsToInsForge(updatedEvents, currentUser);

    showNotice("Sheet has been officially APPROVED and LOCKED in InsForge.", "success");
  };

  // Supervisor Return
  const handleReturnSheet = (reviewNote: string) => {
    if (!currentUser) return;
    const returnedSheet: LogSheet = {
      ...sheet,
      status: 'Returned',
      reviewed_by: currentUser.id,
      reviewed_by_name: currentUser.name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
      updated_at: new Date().toISOString(),
    };
    setSheet(returnedSheet);

    // Real-time sync returned status (AR001) to InsForge & cloud snapshot
    syncApprovalToInsForge("Bleaching Sheet", "BP001", currentUser, "Returned", reviewNote, returnedSheet);

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
    const updatedEvents = [newEvent, ...supervisorEvents];
    setSupervisorEvents(updatedEvents);
    syncSupervisorEventsToInsForge(updatedEvents, currentUser);

    showNotice("Sheet RETURNED to technician with supervisor review notes.", "info");
  };

  // Supervisor Acknowledge Event
  const handleAcknowledgeEvent = (eventId: string, acknowledgedBy: string) => {
    const updatedEvents = supervisorEvents.map(e => 
      e.id === eventId 
        ? { ...e, acknowledged: true, acknowledged_by: acknowledgedBy, acknowledged_at: new Date().toISOString() }
        : e
    );
    setSupervisorEvents(updatedEvents);
    syncSupervisorEventsToInsForge(updatedEvents, currentUser);

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
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onSubmitSheet={handleSubmitSheet}
        onOpenReview={() => setIsReviewOpen(true)}
        currentShift={currentShift}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        clockState={clockState}
        isSyncing={isSyncing}
        onManualSync={() => loadCloudData(true)}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        isToday={selectedDate === getTodayDateStr()}
        isAudioEnabled={isAudioActive}
        onToggleAudio={handleToggleAudio}
        notifications={plantNotifications}
        onClearNotifications={() => setPlantNotifications([])}
        onNotificationClick={(notif) => {
          if (notif.targetTab) setActiveTab(notif.targetTab);
        }}
      />

      {/* Historical Archive Banner when viewing past dates */}
      {selectedDate !== getTodayDateStr() && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2 flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>HISTORICAL ARCHIVE MODE:</strong> Viewing process log record for <strong>{selectedDate}</strong>. (Today's live shift data remains safe in background).
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleDateChange(getTodayDateStr())}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors cursor-pointer text-xs shadow-xs"
          >
            Return to Today's Live Shift
          </button>
        </div>
      )}

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

      {/* Layout Container: Left Sidebar Menu Dashboard + Main Content */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-[1920px] mx-auto min-w-0">
        {/* Left Sidebar Menu Dashboard */}
        <SidebarNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenPdf={() => setIsPdfOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          sheetStatus={sheet.status}
          qcSampleCount={qcReports.length}
          currentUser={currentUser}
          unacknowledgedAlertsCount={unacknowledgedAlertsCount}
        />

        {/* Main Workspace Body */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-5 pb-12 overflow-x-auto">
          <div key={activeTab} className="fade-in-tactile">
          {/* Tab 1: Bleaching Process Log (RF-FR-003) */}
          {activeTab === 'bleaching' && (
            <>
              {/* Banner if Sheet was Returned */}
              {sheet.status === 'Returned' && sheet.review_note && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2.5 shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm">Sheet Returned by Supervisor ({sheet.reviewed_by_name}):</span>
                    <p className="text-xs mt-0.5 font-mono leading-relaxed">{sheet.review_note}</p>
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
                onDispatchToQc={handleDispatchToQc}
                onDispatchRetest={handleDispatchRetest}
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
              allUsers={allUsers}
              onUpdateShiftTechnician={handleUpdateHeader}
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
              allUsers={allUsers}
              onUpdateShiftTechnician={handleUpdateHeader}
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
      </div>

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
        qcReports={qcReports}
        currentUser={currentUser || undefined}
        allUsers={allUsers}
      />

      {/* Plant Workstation Settings & Preferences Modal (Matches User Design) */}
      {currentUser && (
        <WorkstationSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            try {
              localStorage.setItem("nisshin_auth_user", JSON.stringify(updated));
            } catch {}
            showNotice(`Profile updated: ${updated.name} (${updated.department || updated.role})`, "success");
          }}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          isAudioEnabled={isAudioActive}
          onToggleAudio={handleToggleAudio}
          onPlayTestSound={playTestTone}
          onForceResyncCloud={() => loadCloudData(true)}
        />
      )}

      {/* Help & SOP Support Modal */}
      <HelpSupportModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
