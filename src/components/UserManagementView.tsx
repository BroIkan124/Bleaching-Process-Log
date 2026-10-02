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
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    role: UserRole;
    email: string;
    department: string;
    shift: 1 | 2 | 3 | 'ALL';
    phone: string;
    password: string;
    active: boolean;
  }>({
    name: "",
    role: "technician",
    email: "",
    department: "Refinery Operations",
    shift: 1,
    phone: "+60 ",
    password: "password123",
    active: true,
  });

  const isAdmin = currentUser.role === "admin";

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesShift = shiftFilter === "ALL" || String(u.shift) === shiftFilter;
    return matchesSearch && matchesRole && matchesShift;
  });

  // Role Badges
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <Shield className="w-3 h-3" /> System Administrator
          </span>
        );
      case "supervisor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <ShieldCheck className="w-3 h-3" /> Plant Supervisor
          </span>
        );
      case "manager_qa":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="w-3 h-3" /> QA Manager
          </span>
        );
      case "chemist":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <FlaskConical className="w-3 h-3" /> QC Chemist
          </span>
        );
      case "technician":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
            <Wrench className="w-3 h-3" /> Operations Technician
          </span>
        );
    }
  };

  const handleToggleStatus = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { ...u, active: !u.active };
      }
      return u;
    });
    onUpdateUsers(updated);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      role: "technician",
      email: "",
      department: "Refinery Operations",
      shift: 1,
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
      shift: user.shift || 1,
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
      const updated = users.map((u) => 
        u.id === editingUser.id ? { ...u, ...formData } : u
      );
      onUpdateUsers(updated);
    } else {
      // Add
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        ...formData,
        last_login: "Never logged in",
      };
      onUpdateUsers([...users, newUser]);
    }
    setIsAddModalOpen(false);
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
          This module is restricted to System Administrators to manage staff accounts, permissions, and shift schedules.
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
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
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
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Staff</span>
        </button>
      </div>

      {/* 2. Top Statistic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Total Staff</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-100">{totalCount}</span>
            <span className="text-xs text-emerald-500 font-bold">{activeCount} Active</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Operations Technicians</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-amber-500">{techCount}</span>
            <span className="text-xs text-zinc-500 font-mono">Shift 1-3</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">QC Lab &amp; QA</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-sky-500">{qcCount}</span>
            <span className="text-xs text-zinc-500 font-mono">RF-FR-001</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Supervisors &amp; Admin</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-purple-500">{supCount}</span>
            <span className="text-xs text-zinc-500 font-mono">Control</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Authentication Status</span>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span>2FA &amp; Audit Active</span>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone or department..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="technician">Operations Technician</option>
              <option value="supervisor">Plant Supervisor</option>
              <option value="chemist">QC Chemist</option>
              <option value="manager_qa">QA Manager</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Shifts</option>
            <option value="1">Shift 1 (0800–1500)</option>
            <option value="2">Shift 2 (1600–2300)</option>
            <option value="3">Shift 3 (2400–0700)</option>
          </select>
        </div>
      </div>

      {/* 4. Staff Table */}
      <div className="rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#131416] text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <th className="py-3 px-4">Staff Name &amp; Contact</th>
                <th className="py-3 px-4">Role (RBAC)</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assigned Shift</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No users found matching this search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {/* User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-600/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {user.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>{user.name}</span>
                            {user.id === currentUser.id && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500 text-white rounded font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                            {user.phone && (
                              <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3" /> {user.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderRoleBadge(user.role)}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                      {user.department}
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {user.shift === "ALL" ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          All Shifts
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono">
                          Shift {user.shift}
                        </span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                      {user.last_login || "No login"}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                          user.active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {user.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                          title="Edit User"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#131416]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base font-display">
                  {editingUser ? "Edit Staff Profile" : "Register New Staff"}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Full Staff Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Muhammad Haziq"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Role (RBAC)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="technician">Operations Technician</option>
                    <option value="supervisor">Plant Supervisor</option>
                    <option value="chemist">QC Chemist</option>
                    <option value="manager_qa">QA Manager</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Shift
                  </label>
                  <select
                    value={String(formData.shift)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        shift: val === 'ALL' ? 'ALL' : (Number(val) as 1 | 2 | 3) 
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold focus:outline-none"
                  >
                    <option value="1">Shift 1 (0800–1500)</option>
                    <option value="2">Shift 2 (1600–2300)</option>
                    <option value="3">Shift 3 (2400–0700)</option>
                    <option value="ALL">All Shifts (Flexible)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. haziq@lamsoon.com.my"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Refinery Operations"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+60 1x-xxx xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300 dark:border-zinc-700"
                />
                <label htmlFor="active-checkbox" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  Active Account &amp; Can Sign In
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all"
                >
                  {editingUser ? "Save Changes" : "Register Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
