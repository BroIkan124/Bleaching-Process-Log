"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserProfile, UserRole } from "@/types";
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  FlaskConical, 
  Wrench, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  KeyRound, 
  Phone, 
  Mail, 
  Clock, 
  Building, 
  Lock, 
  X,
  AlertTriangle,
  UserCheck,
  LogOut,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  RefreshCw
} from "lucide-react";
import { syncUserToInsForge, logActivityToInsForge, deleteUserFromInsForge } from "@/lib/dbService";
import { RadioSelect } from "./RadioSelect";
import { GliderRadioGroup } from "./GliderRadioGroup";
import { AnimatedCheckbox } from "./AnimatedCheckbox";

interface UserManagementViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateUsers: (users: UserProfile[]) => void;
  onRequestLoginModal: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  users,
  onUpdateUsers,
  onRequestLoginModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Actions Dropdown & Modals State
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState<string>("password123");
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);
  const [isClosingResetModal, setIsClosingResetModal] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);
  const [isClosingDeleteModal, setIsClosingDeleteModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAddModalOpen || resetPasswordUser || deleteConfirmUser) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAddModalOpen, resetPasswordUser, deleteConfirmUser]);

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setIsClosingModal(false);
      setIsAddModalOpen(false);
    }, 200);
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    role: UserRole;
    email: string;
    department: string;
    phone: string;
    password: string;
    active: boolean;
  }>({
    name: "",
    role: "technician",
    email: "",
    department: "Refinery Operations",
    phone: "+60 ",
    password: "password123",
    active: true,
  });

  const isAdmin = currentUser.role === "admin";

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      u.department.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = 
      statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && u.active) || 
      (statusFilter === "INACTIVE" && !u.active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Role Badges
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>System Administrator</span>
          </span>
        );
      case "supervisor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Plant Supervisor</span>
          </span>
        );
      case "manager_qa":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>QA Manager</span>
          </span>
        );
      case "chemist":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 shadow-2xs">
            <FlaskConical className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>QC Chemist</span>
          </span>
        );
      case "technician":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 shadow-2xs">
            <Wrench className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Operations Technician</span>
          </span>
        );
    }
  };

  const handleToggleStatus = (userId: string) => {
    let changedUser: UserProfile | undefined;
    const updated = users.map((u) => {
      if (u.id === userId) {
        changedUser = { ...u, active: !u.active };
        return changedUser;
      }
      return u;
    });
    onUpdateUsers(updated);
    if (changedUser) {
      syncUserToInsForge(changedUser);
      logActivityToInsForge(currentUser, "TOGGLE_USER_STATUS", "USER", changedUser.id, {
        name: changedUser.name,
        active: changedUser.active,
      });
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      role: "technician",
      email: "",
      department: "Refinery Operations",
      phone: "+60 1",
      password: "password123",
      active: true,
    });
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setFormData({
      name: user.name,
      role: user.role,
      email: user.email,
      department: user.department,
      phone: user.phone || "",
      password: user.password || "password123",
      active: user.active,
    });
    setEditingUser(user);
    setIsAddModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Update
      const updatedUser: UserProfile = {
        ...editingUser,
        name: formData.name.trim(),
        role: formData.role,
        email: formData.email.trim(),
        department: formData.department.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        active: formData.active,
      };
      const updated = users.map((u) => 
        u.id === editingUser.id ? updatedUser : u
      );
      onUpdateUsers(updated);
      syncUserToInsForge(updatedUser);
      logActivityToInsForge(currentUser, "UPDATE_USER_ACCOUNT", "USER", updatedUser.id, {
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
      });
    } else {
      // Add - Generate prefix matching InsForge standard
      const prefixMap: Record<string, string> = {
        admin: "ADM",
        supervisor: "SUP",
        technician: "OPR",
        chemist: "QCS",
        manager_qa: "MGR",
      };
      const prefix = prefixMap[formData.role] || "USR";
      const sameRoleUsers = users.filter((u) => u.id.startsWith(prefix));
      const nextNum = sameRoleUsers.length + 1;
      const formattedId = `${prefix}${String(nextNum).padStart(3, "0")}`;

      const newUser: UserProfile = {
        id: formattedId,
        name: formData.name.trim(),
        role: formData.role,
        email: formData.email.trim(),
        department: formData.department.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        active: formData.active,
        last_login: "Never logged in",
      };
      onUpdateUsers([...users, newUser]);
      syncUserToInsForge(newUser);
      logActivityToInsForge(currentUser, "CREATE_USER_ACCOUNT", "USER", newUser.id, {
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
      });
    }
    handleCloseModal();
  };

  // Reset Password Handlers
  const handleOpenResetPasswordModal = (user: UserProfile) => {
    setResetPasswordUser(user);
    setNewPasswordValue("password123");
    setIsPasswordCopied(false);
  };

  const handleCloseResetModal = () => {
    setIsClosingResetModal(true);
    setTimeout(() => {
      setIsClosingResetModal(false);
      setResetPasswordUser(null);
    }, 200);
  };

  const handleGenerateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pass = "LS-";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordValue(pass);
    setIsPasswordCopied(false);
  };

  const handleCopyPassword = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(newPasswordValue);
      setIsPasswordCopied(true);
      setTimeout(() => setIsPasswordCopied(false), 2000);
    }
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPasswordValue.trim()) return;

    const updatedUser: UserProfile = {
      ...resetPasswordUser,
      password: newPasswordValue.trim(),
    };

    const updated = users.map((u) => (u.id === resetPasswordUser.id ? updatedUser : u));
    onUpdateUsers(updated);
    syncUserToInsForge(updatedUser);
    logActivityToInsForge(currentUser, "RESET_USER_PASSWORD", "USER", updatedUser.id, {
      name: updatedUser.name,
      email: updatedUser.email,
    });

    handleCloseResetModal();
  };

  // Delete User Handlers
  const handleOpenDeleteModal = (user: UserProfile) => {
    if (user.id === currentUser.id) return;
    setDeleteConfirmUser(user);
  };

  const handleCloseDeleteModal = () => {
    setIsClosingDeleteModal(true);
    setTimeout(() => {
      setIsClosingDeleteModal(false);
      setDeleteConfirmUser(null);
    }, 200);
  };

  const handleConfirmDeleteUser = () => {
    if (!deleteConfirmUser || deleteConfirmUser.id === currentUser.id) return;

    const targetId = deleteConfirmUser.id;
    const targetName = deleteConfirmUser.name;
    const targetRole = deleteConfirmUser.role;

    const updated = users.filter((u) => u.id !== targetId);
    onUpdateUsers(updated);
    deleteUserFromInsForge(targetId);
    logActivityToInsForge(currentUser, "DELETE_USER_ACCOUNT", "USER", targetId, {
      name: targetName,
      role: targetRole,
    });

    handleCloseDeleteModal();
  };

  // If not admin, show guard warning
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 text-center shadow-xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
          Restricted Access: User Management (Admin Only)
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          You are currently signed in as <strong className="text-amber-500 font-bold">{currentUser.name} ({currentUser.role})</strong>.
          This module is restricted to System Administrators to manage staff accounts, credentials, and access roles.
        </p>
        <div className="pt-2">
          <button
            onClick={onRequestLoginModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out to Log In as Administrator</span>
          </button>
        </div>
      </div>
    );
  }

  // Summary Metrics
  const totalCount = users.length;
  const activeCount = users.filter(u => u.active).length;
  const techCount = users.filter(u => u.role === 'technician').length;
  const qcCount = users.filter(u => u.role === 'chemist' || u.role === 'manager_qa').length;
  const supCount = users.filter(u => u.role === 'supervisor' || u.role === 'admin').length;

  return (
    <div className="space-y-6 [transform-style:preserve-3d]">
      {/* 1. Header & Actions Bar with 3D Specular Highlight */}
      <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-gradient-to-r from-zinc-50 via-zinc-100/70 to-zinc-50 dark:from-[#0A0F1C] dark:via-[#11182B] dark:to-[#0A0F1C] shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-[0_2px_10px_rgba(168,85,247,0.2)]">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100">
              User Management &amp; Access Control
            </h1>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
            Manage operations technicians, shift supervisors, QC chemists, and Role-Based Access Control (RBAC).
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-premium-amber flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer group shrink-0"
        >
          <UserPlus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span>Register New Staff</span>
        </button>
      </div>

      {/* 2. Top Statistic KPI Cards with 3D Telemetry */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="telemetry-card p-4 rounded-xl">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block font-display">Total Staff</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">{totalCount}</span>
            <span className="text-xs text-emerald-500 font-bold">{activeCount} Active</span>
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-xl">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block font-display">Operations Technicians</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-amber-500 font-mono tabular-nums">{techCount}</span>
            <span className="text-xs text-zinc-500 font-mono">Field Ops</span>
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-xl">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block font-display">QC Lab &amp; QA</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-sky-500 font-mono tabular-nums">{qcCount}</span>
            <span className="text-xs text-zinc-500 font-mono">RF-FR-001</span>
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-xl">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block font-display">Supervisors &amp; Admin</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-purple-500 font-mono tabular-nums">{supCount}</span>
            <span className="text-xs text-zinc-500 font-mono">Control</span>
          </div>
        </div>

        <div className="telemetry-card p-4 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block font-display">Authentication Status</span>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span>2FA &amp; Audit Active</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff name, ID, email, phone, department..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-black/30 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Role Filter */}
          <div className="w-48 sm:w-52">
            <RadioSelect
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={[
                { value: "ALL", label: "All Roles" },
                { value: "technician", label: "Operations Technician" },
                { value: "supervisor", label: "Plant Supervisor" },
                { value: "chemist", label: "QC Chemist" },
                { value: "manager_qa", label: "QA Manager" },
                { value: "admin", label: "System Administrator" },
              ]}
              icon={<Filter className="w-3.5 h-3.5 text-zinc-400" />}
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-36 sm:w-40">
            <RadioSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: "ALL", label: "All Status" },
                { value: "ACTIVE", label: "Active Only" },
                { value: "INACTIVE", label: "Suspended" },
              ]}
              icon={<Shield className="w-3.5 h-3.5 text-zinc-400" />}
              size="sm"
            />
          </div>

          {/* Staff Counter Badge */}
          <span className="px-3 py-2 rounded-xl text-xs font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            {filteredUsers.length} {filteredUsers.length === 1 ? "Staff" : "Staff"}
          </span>
        </div>
      </div>

      {/* 4. Staff Table */}
      <div className="rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[27%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-[#131416] text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-display">
                <th className="py-3 px-3.5">Staff Member &amp; ID</th>
                <th className="py-3 px-3">Role (RBAC)</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Last Login</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                      <Users className="w-8 h-8 text-zinc-400/60" />
                      <span className="font-bold text-zinc-900 dark:text-white text-sm">
                        No staff members found
                      </span>
                      <p className="text-xs text-zinc-500">
                        {searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Try clearing filters or search query to view all staff accounts."
                          : "No users registered in the system yet."}
                      </p>
                      {(searchQuery || roleFilter !== "ALL" || statusFilter !== "ALL") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setRoleFilter("ALL");
                            setStatusFilter("ALL");
                          }}
                          className="mt-2 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/10 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isNearBottom = idx >= Math.max(0, filteredUsers.length - 2) && filteredUsers.length > 2;
                  return (
                    <tr 
                      key={user.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="h-8 w-8 rounded-lg object-cover border border-amber-500/30 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs font-display">
                              {user.name.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{user.name}</span>
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/5">
                                {user.id}
                              </span>
                              {user.id === currentUser.id && (
                                <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500 text-white rounded font-extrabold tracking-wider shadow-xs">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        {renderRoleBadge(user.role)}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{user.department}</span>
                        </div>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{user.last_login ? user.last_login.split(",")[0] : "Never logged in"}</span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            user.active
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                          }`}
                          title={user.active ? "Click to suspend staff account" : "Click to activate staff account"}
                        >
                          {user.active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>Suspended</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="py-3 px-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuUserId(openMenuUserId === user.id ? null : user.id);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                              openMenuUserId === user.id
                                ? "border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20"
                                : "border-zinc-200 dark:border-white/10 hover:border-amber-500/40 bg-zinc-50 dark:bg-white/5 hover:bg-amber-500/10 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400"
                            }`}
                            title="Open Actions Menu"
                          >
                            <span>Actions</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMenuUserId === user.id ? "rotate-180 text-amber-500" : "text-zinc-400"}`} />
                          </button>

                          {openMenuUserId === user.id && (
                            <>
                              {/* Backdrop to close on click outside */}
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuUserId(null);
                                }} 
                              />
                              {/* Dropdown Menu */}
                              <div 
                                className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5 origin-bottom-right' : 'top-full mt-1.5 origin-top-right'} z-50 w-52 rounded-xl bg-white dark:bg-[#1C2029] border border-zinc-200 dark:border-white/15 shadow-2xl p-1 text-xs divide-y divide-zinc-100 dark:divide-white/5 animate-in fade-in zoom-in-95 duration-150`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-0.5">
                                  {/* Edit Profile */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuUserId(null);
                                      handleOpenEditModal(user);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-200 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition-colors cursor-pointer group"
                                  >
                                    <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-xs">Edit Profile</div>
                                      <div className="text-[10px] text-zinc-400 font-normal">Roles, email &amp; details</div>
                                    </div>
                                  </button>

                                  {/* Reset Password */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuUserId(null);
                                      handleOpenResetPasswordModal(user);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-zinc-700 dark:text-zinc-200 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 font-semibold transition-colors cursor-pointer group"
                                  >
                                    <div className="p-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                                      <KeyRound className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-xs">Reset Password</div>
                                      <div className="text-[10px] text-zinc-400 font-normal">Generate / set key</div>
                                    </div>
                                  </button>
                                </div>

                                {/* Delete Account */}
                                <div className="py-0.5">
                                  <button
                                    type="button"
                                    disabled={user.id === currentUser.id}
                                    onClick={() => {
                                      if (user.id === currentUser.id) return;
                                      setOpenMenuUserId(null);
                                      handleOpenDeleteModal(user);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left font-semibold transition-colors ${
                                      user.id === currentUser.id
                                        ? "opacity-40 cursor-not-allowed text-zinc-400"
                                        : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer group"
                                    }`}
                                    title={user.id === currentUser.id ? "Cannot delete own active session" : "Permanently remove staff account"}
                                  >
                                    <div className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-xs">Delete Staff</div>
                                      <div className="text-[10px] text-zinc-400 font-normal">
                                        {user.id === currentUser.id ? "Active Administrator" : "Remove account record"}
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && mounted && createPortal(
        <div 
          className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop-animate ${
            isClosingModal ? "is-closing" : ""
          }`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className={`relative w-full max-w-lg bg-white dark:bg-[#151922] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden text-zinc-900 dark:text-zinc-100 modal-card-animate ${
            isClosingModal ? "is-closing" : ""
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-black/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display text-zinc-900 dark:text-white">
                    {editingUser ? "Edit Staff Profile" : "Register New Staff"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {editingUser ? `Updating credentials for ${editingUser.name}` : "Configure profile and role-based permissions."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="btn-tactile p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer group"
              >
                <X className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {/* Full Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-display">
                    Full Staff Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Muhammad Haziq"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-black/30 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-display">
                    Role (RBAC)
                  </label>
                  <RadioSelect
                    value={formData.role}
                    onChange={(val) => setFormData({ ...formData, role: val as UserRole })}
                    options={[
                      { value: "technician", label: "Operations Technician" },
                      { value: "supervisor", label: "Plant Supervisor" },
                      { value: "chemist", label: "QC Chemist" },
                      { value: "manager_qa", label: "QA Manager" },
                      { value: "admin", label: "System Administrator" },
                    ]}
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-display">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. haziq@lamsoon.com.my"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-black/30 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-display">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+60 1x-xxx xxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-black/30 text-xs font-mono font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Department & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-display">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Refinery Operations"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-black/30 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5 font-display">
                    Password / Access Key
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-black/30 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Active Account Toggle */}
              <div className="p-3.5 rounded-xl bg-zinc-50/70 dark:bg-black/20 border border-zinc-200/80 dark:border-white/5">
                <AnimatedCheckbox
                  id="active-checkbox"
                  checked={formData.active}
                  onChange={(checked) => setFormData({ ...formData, active: checked })}
                  color="amber"
                  size="sm"
                  label={
                    <div className="ml-1">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                        Account Active &amp; Authorized to Sign In
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Staff member can authenticate into Nisshin Process Log based on their assigned role.
                      </span>
                    </div>
                  }
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-tactile px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-premium-amber px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer group"
                >
                  {editingUser ? "Save Profile Changes" : "Register Staff Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && mounted && createPortal(
        <div 
          className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop-animate ${
            isClosingResetModal ? "is-closing" : ""
          }`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseResetModal();
          }}
        >
          <div className={`relative w-full max-w-md bg-white dark:bg-[#151922] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden text-zinc-900 dark:text-zinc-100 modal-card-animate ${
            isClosingResetModal ? "is-closing" : ""
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display">
                    Reset Staff Password
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Set a new security access key for {resetPasswordUser.name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseResetModal}
                className="btn-tactile p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer group"
              >
                <X className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveResetPassword} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Staff ID:</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{resetPasswordUser.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Staff Name:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{resetPasswordUser.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Official Email:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{resetPasswordUser.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1.5 font-display">
                  New Password / Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="w-full pl-3.5 pr-24 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-all cursor-pointer"
                      title="Copy Password"
                    >
                      {isPasswordCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick actions for password */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-sky-500/10 hover:border-sky-500/30 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-sky-500" />
                  <span>Generate Random</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordValue("password123")}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer"
                >
                  Set Default (password123)
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Staff member will need to provide this new password upon next authentication into the system.
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-tactile px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirmUser && mounted && createPortal(
        <div 
          className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md modal-backdrop-animate ${
            isClosingDeleteModal ? "is-closing" : ""
          }`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDeleteModal();
          }}
        >
          <div className={`relative w-full max-w-md bg-white dark:bg-[#151922] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden text-zinc-900 dark:text-zinc-100 modal-card-animate ${
            isClosingDeleteModal ? "is-closing" : ""
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/10 bg-rose-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display">
                    Delete Staff Account
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Confirm deletion of account credentials
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseDeleteModal}
                className="btn-tactile p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer group"
              >
                <X className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <p className="font-bold">Are you sure you want to delete this staff member?</p>
                  <p className="mt-1 opacity-90">
                    This will permanently revoke system access for <strong className="underline">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.id}). This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Staff Member:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{deleteConfirmUser.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Role:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{deleteConfirmUser.role.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Department:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{deleteConfirmUser.department}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  className="btn-tactile px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  className="btn-tactile px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Staff Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
