"use client";

import React, { useState } from "react";
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
  LogOut
} from "lucide-react";
import { syncUserToInsForge, logActivityToInsForge } from "@/lib/dbService";
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
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-[#131416] text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-display">
                <th className="py-3 px-3.5 w-[28%]">Staff Member &amp; ID</th>
                <th className="py-3 px-3 w-[18%]">Role (RBAC)</th>
                <th className="py-3 px-3 w-[20%]">Department</th>
                <th className="py-3 px-3 w-[15%]">Last Login</th>
                <th className="py-3 px-2 w-[11%] text-center">Status</th>
                <th className="py-3 px-3 w-[8%] text-right">Action</th>
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
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User Info */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs font-display">
                          {user.name.slice(0, 2)}
                        </div>
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

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(user)}
                        className="btn-tactile p-2 rounded-xl border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 bg-zinc-50 dark:bg-white/5 hover:bg-amber-500/10 text-zinc-600 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer group transition-all"
                        title="Edit Staff Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddModalOpen && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md modal-backdrop-animate ${
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
        </div>
      )}
    </div>
  );
};
