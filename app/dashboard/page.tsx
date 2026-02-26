// ============================================================
// app/dashboard/page.tsx  (atau sesuai routing Next.js Anda)
// Halaman utama dashboard - sudah dirapikan dan dimodulasi
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home, Building, Settings, Menu, X, Save, Upload,
  Download, Search, Filter, AlertCircle, CheckCircle,
  Clock, LogOut, RefreshCw as RefreshCwIcon, Eye, Trash2,
  Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Plus, BarChart3, FileText, ChevronDown, Shield, UserPlus,
} from "lucide-react";

import { apiService, RoomData } from "@/services/api";
import { useAuth } from "@/app/context/AuthContext";
import { useApiStatus } from "@/hooks/useApiStatus";

import { ApiStatusIndicator } from "@/components/ui/ApiStatusIndicator";
import { RoleBadge, StatCard } from "@/components/ui/Badges";
import { RoomPopup } from "@/components/room/RoomPopup";
import { UserModal } from "@/components/admin/UserModal";
import { InteractiveMap } from "@/components/map/InteractiveMap";

import {
  GEDUNG_OPTIONS, BUILDINGS_DATA, HISTORY_PROTEKSI,
} from "@/constants";
import {
  getLantaiOptions, getFloorsByBuilding, getBuildingPath,
  getGedungFromPath, getLantaiFromPath, loadSvgContent,
  extractErrorMessage, exportToJson,
} from "@/utils";

import type {
  FilterOptions, UserData, LoginActivityData, ActivityData,
  AdminTable, SortField, SortDirection, UserModalMode,
} from "@/types";

// ============================================================
// Komponen Utama
// ============================================================

export default function DashboardWithMap() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin, getUserRole, isLoading } = useAuth();
  const { apiStatus, checkApiStatus } = useApiStatus();
  const isSubmittingRef = useRef(false);

  // --- UI State ---
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  // --- Peta State ---
  const [svgContent, setSvgContent] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [popupRoomId, setPopupRoomId] = useState<string | null>(null);

  // --- Data State ---
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: "", gedung: "", fakultas: "", lantai: "", subUnit: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGedung, setSelectedGedung] = useState("");
  const [lantaiOptions, setLantaiOptions] = useState<Array<{ value: string; label: string }>>([]);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Admin State ---
  const [users, setUsers] = useState<UserData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivityData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userModalMode, setUserModalMode] = useState<UserModalMode>("create");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [adminTable, setAdminTable] = useState<AdminTable>("users");
  const [showAdminTableMenu, setShowAdminTableMenu] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminPerPage, setAdminPerPage] = useState(10);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);

  // ============================================================
  // Computed Values
  // ============================================================

  const getUserRoleFromAuth = () => getUserRole() ?? "viewer";
  const checkAdminAccess = () => isAdmin();
  const isMobile = windowWidth < 768;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredRooms.length);
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / rowsPerPage));
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  const fakultasOptions = Array.from(new Set(roomsData.map((r) => r.fk)));
  const lantaiOptionsFromData = Array.from(
    new Set(roomsData.map((r) => r.lantai.toString()))
  ).sort();
  const subUnitOptions = Array.from(
    new Set(roomsData.map((r) => r.subUnit).filter(Boolean))
  );
  const currentLantaiOptions =
    lantaiOptions.length > 0
      ? lantaiOptions
      : lantaiOptionsFromData.map((l) => ({ value: l, label: `Lantai ${l}` }));

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // ============================================================
  // Menu Items
  // ============================================================

  const getMenuItems = () => {
    const userRole = getUserRoleFromAuth();
    const allItems = [
      { name: "Dashboard", icon: <Home size={20} />, id: "dashboard", roles: ["admin", "viewer"] },
      { name: "Denah Interaktif", icon: <Building size={20} />, id: "lantai", roles: ["admin", "viewer"] },
      { name: "Manajemen Data", icon: <Settings size={20} />, id: "manajemen", roles: ["admin", "viewer"] },
      { name: "History Proteksi", icon: <Clock size={20} />, id: "history", roles: ["admin", "viewer"] },
      { name: "Admin Panel", icon: <Shield size={20} />, id: "admin", roles: ["admin", "viewer"] },
      { name: "Logout", icon: <LogOut size={20} />, id: "logout", roles: ["admin", "viewer"] },
    ];
    return allItems.filter((item) => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  // ============================================================
  // Effects
  // ============================================================

  // Window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load data saat tab aktif berubah
  useEffect(() => {
    if (active === "dashboard") fetchStatistics();
    if (active === "manajemen") fetchRoomsData();
    if (active === "admin" && checkAdminAccess()) {
      fetchUsers();
      fetchLoginActivities();
    }
  }, [active]);

  // Reset halaman saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions]);

  // Load SVG default saat masuk tab lantai
  useEffect(() => {
    if (active === "lantai" && !svgContent) loadDefaultSvg();
  }, [active, svgContent]);

  // Load SVG berdasarkan URL path
  useEffect(() => {
    const loadFromPath = async () => {
      if (!pathname || pathname === "/") return;
      const gedung = getGedungFromPath(pathname);
      const lantai = getLantaiFromPath(pathname);

      if (gedung) {
        setSelectedBuilding(gedung);
        setActive("lantai");
        const content = await loadSvgContent(gedung, lantai ?? undefined);
        if (content) setSvgContent(content);
      }
    };
    loadFromPath();
  }, [pathname]);

  // Apply filter saat data atau opsi filter berubah
  useEffect(() => {
    applyFilters();
  }, [roomsData, filterOptions]);

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchStatistics = async () => {
    try {
      const result = await apiService.getStatistics();
      if (result.success) setStats(result.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRoomsData = async () => {
    setIsLoadingRooms(true);
    try {
      const result = await apiService.getFakultasEkonomi();
      if (result.success && result.data) {
        setRoomsData(result.data);
        setFilteredRooms(result.data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    if (!checkAdminAccess()) return;
    setIsLoadingUsers(true);
    try {
      const result = await apiService.getUsers(0, 100);
      if (result.success && result.data) {
        setUsers(
          result.data.map((u) => ({
            id: u.id ?? 0,
            name: u.name,
            username: u.username,
            role: u.role,
            createdAt: u.created_at ?? new Date().toISOString().split("T")[0],
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchLoginActivities = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;

    try {
      const res = await fetch("http://localhost:9000/api/v1/auth/admin/login-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setLoginActivities(
        data.history.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          ipAddress: item.ip_address,
          username: item.username,
          status: item.status,
          userAgent: item.user_agent,
          lastLogin: item.login_time,
        }))
      );
    } catch (err) {
      console.error("Error fetch login history:", err);
    }
  }, []);

  const loadDefaultSvg = async () => {
    try {
      const res = await fetch("/lantai3.svg");
      if (!res.ok) throw new Error("SVG not found");
      let data = await res.text();
      data = data.replace(
        "<svg",
        '<svg style="width: 100%; height: 100%; max-height: 100vh; object-fit: contain; display: block;" preserveAspectRatio="xMidYMid meet"'
      );
      setSvgContent(data);
    } catch {
      setSvgContent(`
        <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🏢</div>
            <h3>Peta Denah Lantai 3</h3>
            <p>File lantai3.svg tidak ditemukan</p>
          </div>
        </div>
      `);
    }
  };

  // ============================================================
  // Filter & Sort
  // ============================================================

  const applyFilters = useCallback(() => {
    let result = [...roomsData];
    const { search, gedung, fakultas, lantai, subUnit } = filterOptions;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.ruangan.toLowerCase().includes(s) ||
          r.fk.toLowerCase().includes(s) ||
          (r.subUnit?.toLowerCase().includes(s)) ||
          r.gedung.toLowerCase().includes(s) ||
          r.no.toString().includes(s)
      );
    }
    if (gedung) result = result.filter((r) => r.gedung.toLowerCase() === gedung.toLowerCase());
    if (fakultas) result = result.filter((r) => r.fk.toLowerCase() === fakultas.toLowerCase());
    if (lantai) result = result.filter((r) => r.lantai.toString() === lantai);
    if (subUnit) result = result.filter((r) => r.subUnit?.toLowerCase() === subUnit.toLowerCase());

    setFilteredRooms(result);
  }, [roomsData, filterOptions]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions((prev) => ({ ...prev, [key]: value }));

    if (key === "gedung") {
      setSelectedGedung(value);
      const lantaiOpts = getLantaiOptions(value);
      setLantaiOptions(lantaiOpts);
      if (lantaiOpts.length > 0) {
        setFilterOptions((prev) => ({ ...prev, lantai: lantaiOpts[0].value }));
      }
    }
  };

  const resetFilters = () => {
    setFilterOptions({ search: "", gedung: "", fakultas: "", lantai: "", subUnit: "" });
    setSelectedGedung("");
    setLantaiOptions([]);
    setFilteredRooms(roomsData);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ============================================================
  // Action Handlers
  // ============================================================

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin logout?")) {
      await logout();
      router.push("/");
    }
  };

  const handleSetActive = (id: string) => {
    if (id === "logout") {
      handleLogout();
    } else if (id === "admin" && !checkAdminAccess()) {
      alert("Anda tidak memiliki akses ke Admin Panel");
    } else {
      setActive(id);
      setMenuOpen(false);
    }
  };

  const handleRoomClick = (roomId: string) => setPopupRoomId(roomId);

  const handleBuildingSelect = (buildingName: string) => {
    setSelectedBuilding(buildingName);
    setSelectedFloor(null);
    setSvgContent("");
    router.push(getBuildingPath(buildingName));
  };

  const handleFloorSelect = (buildingName: string, floor: string) => {
    setSelectedBuilding(buildingName);
    setSelectedFloor(floor);
    setSvgContent("");
    router.push(getBuildingPath(buildingName, floor));
  };

  const handleApiOperation = async (operation: () => Promise<any>) => {
    if (apiStatus === "offline") {
      if (!confirm("API sedang offline. Apakah Anda ingin mencoba melanjutkan?")) return;
    }
    try {
      await operation();
    } catch (error) {
      console.error("Operation failed:", error);
      await checkApiStatus();
    }
  };

  // --- User CRUD ---

  const handleUserSave = async (userData: any) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (userModalMode === "create") {
        const token = localStorage.getItem("access_token");
        if (!token) {
          alert("Token tidak ditemukan. Silakan login ulang.");
          return;
        }

        const result = await apiService.createUser({
          username: userData.username,
          name: userData.name,
          password: userData.password,
          role: userData.role,
        });

        if (result.success && result.data) {
          await fetchUsers();
          alert("✅ User berhasil ditambahkan!");
          setShowUserModal(false);
          setEditingUser(null);
        } else {
          alert(`❌ Gagal menambah user: ${extractErrorMessage(result.error)}`);
        }
      } else if (editingUser) {
        const updateData: any = { name: userData.name, role: userData.role };
        if (userData.username !== editingUser.username) updateData.username = userData.username;
        if (userData.password) updateData.password = userData.password;

        const result = await apiService.updateUser(editingUser.id, updateData);
        if (result.success && result.data) {
          await fetchUsers();
          alert("✅ User berhasil diperbarui!");
          setShowUserModal(false);
          setEditingUser(null);
        } else {
          alert(`❌ Gagal memperbarui user: ${extractErrorMessage(result.error)}`);
        }
      }
    } catch (error) {
      alert(`❌ Terjadi kesalahan: ${extractErrorMessage(error)}`);
    } finally {
      setTimeout(() => { isSubmittingRef.current = false; }, 1000);
    }
  };

  const handleUserDelete = async (userId: number, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) return;
    try {
      const result = await apiService.deleteUser(userId);
      if (result.success) {
        await fetchUsers();
        alert("✅ User berhasil dihapus!");
      } else {
        alert(`❌ Gagal menghapus user: ${extractErrorMessage(result.error)}`);
      }
    } catch (error) {
      alert(`❌ Terjadi kesalahan: ${extractErrorMessage(error)}`);
    }
  };

  // ============================================================
  // Loading / Auth Guard
  // ============================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Memuat Dashboard</h2>
          <p className="text-slate-600">Harap tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg">
                <Building className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                  YAYASAN UNISBA
                </h1>
                <p className="text-xs text-slate-600 truncate">Sistem Denah Digital</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {(["dashboard", "lantai", "manajemen", "history"] as const).map((id) => {
                const item = menuItems.find((m) => m.id === id);
                if (!item) return null;
                return (
                  <button
                    key={id}
                    onClick={() => handleSetActive(id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
                      active === id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {/* Admin Panel Dropdown */}
              {checkAdminAccess() && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
                      active === "admin"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25"
                        : "text-slate-700 hover:bg-slate-100 hover:text-red-700"
                    }`}
                  >
                    <Shield size={18} />
                    <span>Admin Panel</span>
                    <ChevronDown
                      size={16}
                      className={`ml-1 transition-transform duration-200 ${showAdminMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showAdminMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu Admin</p>
                      </div>
                      {(["users", "activities", "logins"] as AdminTable[]).map((table) => {
                        const labels = { users: "👥 List User", activities: "📊 Activity User", logins: "🔐 Activity Login" };
                        return (
                          <button
                            key={table}
                            onClick={() => { setAdminTable(table); setActive("admin"); setShowAdminMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all flex items-center gap-3 ${
                              adminTable === table && active === "admin" ? "bg-red-50 text-red-700" : "text-slate-700"
                            }`}
                          >
                            {labels[table]}
                          </button>
                        );
                      })}
                      <div className="border-t border-slate-100 my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Logout untuk non-admin */}
              {!checkAdminAccess() && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all font-medium text-xs sm:text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 ml-2"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              )}
            </div>

            {/* Right: API Status + User Info */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <ApiStatusIndicator />
              </div>
              <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-lg sm:rounded-xl">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.username?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-900 truncate max-w-[100px]">
                    {user?.username ?? "User"}
                  </span>
                  <RoleBadge role={getUserRoleFromAuth()} size="sm" />
                </div>
              </div>

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden text-slate-700 hover:text-blue-700 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 shadow-lg">
            <div className="px-4 py-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.username ?? "User"}</p>
                  <RoleBadge role={getUserRoleFromAuth()} size="sm" />
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {(["dashboard", "lantai", "manajemen", "history"] as const).map((id) => {
                  const item = menuItems.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => handleSetActive(id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        active === id
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${active === id ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  );
                })}

                {/* Admin Panel Mobile */}
                {checkAdminAccess() && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Panel</p>
                    {(["users", "activities", "logins"] as AdminTable[]).map((table) => {
                      const labels = { users: ["👥", "List User"], activities: ["📊", "Activity User"], logins: ["🔐", "Activity Login"] };
                      const [emoji, label] = labels[table];
                      return (
                        <button
                          key={table}
                          onClick={() => { setAdminTable(table); setActive("admin"); setMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                            active === "admin" && adminTable === table
                              ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${active === "admin" && adminTable === table ? "bg-white shadow-sm" : "bg-slate-100"}`}>
                            <span className="text-lg">{emoji}</span>
                          </div>
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Logout */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-rose-100"><LogOut size={18} /></div>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>

                <div className="mt-3 px-3">
                  <ApiStatusIndicator />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">

        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
              <div className={`p-2 rounded-lg sm:rounded-xl ${
                active === "dashboard" ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700" :
                active === "lantai" ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700" :
                active === "manajemen" ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700" :
                active === "history" ? "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700" :
                "bg-gradient-to-br from-red-100 to-red-200 text-red-700"
              }`}>
                {menuItems.find((item) => item.id === active)?.icon}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">
                  {menuItems.find((item) => item.id === active)?.name ?? "Dashboard"}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm truncate">
                  {active === "dashboard" && "Overview sistem dan monitoring real-time"}
                  {active === "lantai" && "Sistem denah digital terintegrasi"}
                  {active === "manajemen" && "Kelola data ruangan secara lengkap"}
                  {active === "history" && "Riwayat pengecekan alat proteksi kebakaran"}
                  {active === "admin" && "Manajemen pengguna dan hak akses sistem"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {active === "manajemen" && (
                <button
                  onClick={() => exportToJson(filteredRooms, "data-ruangan")}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 font-medium text-xs sm:text-sm"
                >
                  <Download size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Export Data</span>
                  <span className="sm:hidden">Export</span>
                </button>
              )}
              {active === "admin" && checkAdminAccess() && (
                <button
                  onClick={() => { setUserModalMode("create"); setEditingUser(null); setShowUserModal(true); }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25 font-medium text-xs sm:text-sm"
                >
                  <UserPlus size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Tambah User</span>
                  <span className="sm:hidden">Tambah</span>
                </button>
              )}
              {active === "lantai" && (
                <div className="px-2 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">
                    {isMobile ? "💡 Klik ruangan" : "💡 Klik ruangan untuk detail"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

          {/* ===== DASHBOARD TAB ===== */}
          {active === "dashboard" && (
            <div className="p-3 sm:p-4 md:p-6">
              {/* Welcome */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold">Selamat datang, {user?.username ?? "User"}!</h3>
                      <RoleBadge role={getUserRoleFromAuth()} />
                    </div>
                    <p className="text-blue-100 text-sm">
                      Anda login sebagai <span className="font-semibold">{getUserRoleFromAuth()}</span>
                    </p>
                  </div>
                  <div className="bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-blue-100">Terakhir login</p>
                    <p className="text-sm font-semibold">{new Date().toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
              </div>

              {/* API Status Banner */}
              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl ${
                apiStatus === "online" ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200" :
                apiStatus === "offline" ? "bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200" :
                "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                      {apiStatus === "online" ? "✅ Sistem Berjalan Normal" :
                       apiStatus === "offline" ? "⚠️ Sistem Sedang Offline" :
                       "🔄 Memeriksa Status Sistem..."}
                    </h3>
                    <p className="text-slate-700 text-xs sm:text-sm">
                      {apiStatus === "online"
                        ? "Semua layanan berfungsi dengan baik."
                        : apiStatus === "offline"
                        ? "Beberapa fitur mungkin terbatas. Periksa koneksi."
                        : "Sedang memeriksa status sistem..."}
                    </p>
                  </div>
                  <button
                    onClick={checkApiStatus}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all font-medium text-slate-700 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                  >
                    <RefreshCwIcon size={14} className="sm:w-4 sm:h-4" />
                    Refresh Status
                  </button>
                </div>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                  <StatCard title="Total Ruangan" value={stats.total_ruangan ?? 0} icon={<Building size={18} />} color="blue" trend="+12%" />
                  <StatCard title="Jumlah Gedung" value={stats.gedung_count ?? 0} icon={<Home size={18} />} color="emerald" trend="+5%" />
                  <StatCard title="Fakultas" value={Object.keys(stats.fakultas_distribution ?? {}).length} icon={<BarChart3 size={18} />} color="amber" />
                  <StatCard title="Data Aktif" value={stats.active_data ?? "100%"} icon={<CheckCircle size={18} />} color="purple" />
                </div>
              )}

              {/* Info Panel */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                    <FileText size={18} className="text-white sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">Tentang Sistem</h4>
                    <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                      Sistem Denah Digital Gedung Dekanat merupakan platform terintegrasi untuk
                      manajemen data ruangan secara real-time.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                      {[
                        "Data tersimpan di database MySQL",
                        "Update real-time melalui API",
                        "Ekspor data dalam format JSON",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                          <span className="text-xs sm:text-sm text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== HISTORY TAB ===== */}
          {active === "history" && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                <div className="mb-3 sm:mb-0">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                    History Pengecekan Alat Proteksi
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    Riwayat lengkap pengecekan dan pemeliharaan alat proteksi kebakaran
                  </p>
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl">
                  <span className="text-xs sm:text-sm font-medium text-blue-700">
                    Total: <span className="font-bold">{HISTORY_PROTEKSI.length}</span> record
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        {["No", "History ID", "Alat Proteksi", "Tanggal", "Status", "Expired", "Keterangan"].map((h) => (
                          <th key={h} className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {HISTORY_PROTEKSI.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                                item.status === "Expired" ? "bg-rose-100 text-rose-700" :
                                item.status === "Rendah" ? "bg-amber-100 text-amber-700" :
                                "bg-emerald-100 text-emerald-700"
                              }`}>
                                <span className="text-xs font-bold">H{index + 1}</span>
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-900">
                                HR{String(index + 1).padStart(3, "0")}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className="text-xs sm:text-sm font-medium text-slate-900">{item.alatProteksi}</p>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className="text-xs sm:text-sm text-slate-900">{item.tanggal}</p>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${
                              item.status === "Expired" ? "bg-rose-100 text-rose-800" :
                              item.status === "Rendah" ? "bg-amber-100 text-amber-800" :
                              "bg-emerald-100 text-emerald-800"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className={`text-xs sm:text-sm ${item.status === "Expired" ? "text-rose-600 font-medium" : "text-slate-900"}`}>
                              {item.expired}
                            </p>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className="text-xs sm:text-sm text-slate-700 max-w-xs truncate">{item.keterangan}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex-shrink-0">
                    <AlertCircle size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1.5 text-sm">Informasi Status</h4>
                    <div className="flex flex-wrap gap-3">
                      {[["emerald", "Normal/Baik"], ["amber", "Rendah"], ["rose", "Expired"]].map(([color, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-${color}-400`} />
                          <span className="text-xs sm:text-sm text-slate-700">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== DENAH INTERAKTIF TAB ===== */}
          {active === "lantai" && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  🗺️ Eksplorasi Denah Kampus Interaktif
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Gunakan peta interaktif untuk mengeksplorasi denah gedung
                </p>
              </div>

              <div className="relative h-[400px] sm:h-[500px] md:h-[600px] rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl bg-gradient-to-br from-slate-50 to-white">
                {svgContent ? (
                  <InteractiveMap
                    svgContent={svgContent}
                    onRoomClick={handleRoomClick}
                    onRoomHover={setHoveredRoomId}
                    hoveredRoomId={hoveredRoomId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
                    <div className="text-center p-4 sm:p-8">
                      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3" />
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">Memuat Peta Denah</h4>
                      <p className="text-slate-600 text-xs sm:text-sm">Harap tunggu sebentar...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pilih Gedung */}
              <div className="mt-4 sm:mt-6">
                <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Pilih Gedung</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
                  {BUILDINGS_DATA.map((building) => (
                    <button
                      key={building.name}
                      onClick={() => setSelectedBuilding(building.name)}
                      className={`group relative overflow-hidden bg-gradient-to-br text-left p-3 sm:p-4 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                        selectedBuilding === building.name
                          ? "from-blue-50 to-blue-100 border border-blue-500 shadow-lg"
                          : "from-white to-slate-50 border border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <div className={`text-sm sm:text-base font-bold truncate ${selectedBuilding === building.name ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700"}`}>
                            {building.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{building.code}</div>
                        </div>
                        <div className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${
                          selectedBuilding === building.name ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                        }`}>
                          {building.totalFloors}
                        </div>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-slate-600 mt-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        {building.totalRooms} Ruangan
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pilih Lantai */}
                {selectedBuilding && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900">
                        Pilih Lantai - {selectedBuilding}
                      </h4>
                      <div className="text-xs sm:text-sm text-slate-500">
                        Total: {getFloorsByBuilding(selectedBuilding).length}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {getFloorsByBuilding(selectedBuilding).map((floor) => (
                        <Link
                          key={floor}
                          href={`/lantai/${floor.replace(" ", "-").toLowerCase()}`}
                          className="group relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border border-slate-200 text-center p-2 sm:p-3 rounded-lg hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:translate-y-[-2px] transition-all duration-200"
                        >
                          <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 mb-0.5">
                            {floor.includes("B") ? `B${floor.slice(1)}` : floor === "Atap" ? "R" : floor}
                          </div>
                          <div className="text-xs text-slate-500 group-hover:text-blue-600 truncate">
                            {floor.includes("B") ? `B${floor.slice(1)}` : floor === "Atap" ? "Atap" : `Lt ${floor}`}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== MANAJEMEN DATA TAB ===== */}
          {active === "manajemen" && (
            <div className="p-3 sm:p-4 md:p-6">
              {/* Search & Filter Bar */}
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Cari ruangan, fakultas, kode..."
                      value={filterOptions.search}
                      onChange={(e) => { handleFilterChange("search", e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder-slate-400 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-medium text-xs sm:text-sm"
                    >
                      <Filter size={14} className="sm:w-4 sm:h-4" />
                      {showFilters ? "Sembunyikan" : "Filter"}
                    </button>
                    <button
                      onClick={() => handleApiOperation(fetchRoomsData)}
                      disabled={isLoadingRooms}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
                    >
                      <Upload size={14} className="sm:w-4 sm:h-4" />
                      {isLoadingRooms ? "Memuat..." : "Refresh"}
                    </button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: "Gedung", key: "gedung" as keyof FilterOptions, options: GEDUNG_OPTIONS },
                        { label: "Fakultas", key: "fakultas" as keyof FilterOptions, options: fakultasOptions.map((f) => ({ value: f, label: f })) },
                        { label: "Lantai", key: "lantai" as keyof FilterOptions, options: currentLantaiOptions },
                        { label: "Sub Unit", key: "subUnit" as keyof FilterOptions, options: (subUnitOptions as string[]).map((s) => ({ value: s, label: s })) },
                      ].map(({ label, key, options }) => (
                        <div key={key}>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                          <select
                            value={filterOptions[key]}
                            onChange={(e) => { handleFilterChange(key, e.target.value); setCurrentPage(1); }}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                          >
                            <option value="">Semua {label}</option>
                            {options.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {Object.values(filterOptions).some(Boolean) && (
                      <div className="mt-3 flex justify-end">
                        <button onClick={resetFilters} className="text-xs sm:text-sm text-slate-700 hover:text-slate-900 font-medium">
                          Reset Semua Filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Table Header Row */}
              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900">Data Ruangan</h4>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    Menampilkan <span className="font-bold text-blue-600">{filteredRooms.length}</span> dari{" "}
                    <span className="font-bold">{roomsData.length}</span> ruangan
                  </p>
                </div>
                {filteredRooms.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm text-slate-700">Baris:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500"
                    >
                      {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Data Table */}
              {isLoadingRooms ? (
                <div className="py-8 sm:py-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3" />
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">Memuat Data Ruangan</h4>
                  <p className="text-slate-600 text-xs sm:text-sm">Harap tunggu sebentar...</p>
                </div>
              ) : (
                <>
                  <div className="border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                          <tr>
                            {["No", "Kode", "Ruangan", "Fakultas", "Lantai", "Gedung", "Ukuran", "Aksi"].map((h) => (
                              <th key={h} className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {paginatedRooms.length > 0 ? (
                            paginatedRooms.map((room, index) => (
                              <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 sm:px-4 py-2">
                                  <span className="text-sm font-medium text-slate-900">{startIndex + index + 1}</span>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <span className="text-xs sm:text-sm font-medium text-slate-900">#{room.no}</span>
                                </td>
                                <td className="px-3 sm:px-4 py-2 min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{room.ruangan}</p>
                                  {room.subUnit && (
                                    <p className="text-xs text-slate-500 truncate">{room.subUnit}</p>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <p className="text-xs sm:text-sm text-slate-700 truncate">{room.fk}</p>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    room.lantai === 1 ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700" :
                                    room.lantai === 2 ? "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700" :
                                    room.lantai === 3 ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700" :
                                    "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700"
                                  }`}>
                                    Lt {room.lantai}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <p className="text-xs sm:text-sm text-slate-700 truncate">{room.gedung}</p>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  {room.ukuranR ? (
                                    <span className="text-xs sm:text-sm font-medium text-emerald-600">{room.ukuranR} m²</span>
                                  ) : (
                                    <span className="text-xs sm:text-sm text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setPopupRoomId(`room${room.no}`)}
                                      disabled={apiStatus === "offline"}
                                      className="p-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all disabled:opacity-50"
                                      title="Edit data"
                                    >
                                      <Edit size={12} className="sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      onClick={() => room.id && router.push(`/ruangan/${room.id}`)}
                                      className="p-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600 rounded-lg hover:from-emerald-100 hover:to-emerald-200 transition-all"
                                      title="Lihat detail"
                                    >
                                      <Eye size={12} className="sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!room.id || !confirm(`Hapus data ruangan ${room.ruangan}?`)) return;
                                        await handleApiOperation(async () => {
                                          const result = await apiService.deleteFakultasEkonomi(room.id!);
                                          if (result.success) { fetchRoomsData(); alert("Data berhasil dihapus"); }
                                        });
                                      }}
                                      disabled={apiStatus === "offline"}
                                      className="p-1.5 bg-gradient-to-r from-rose-50 to-rose-100 text-rose-600 rounded-lg hover:from-rose-100 hover:to-rose-200 transition-all disabled:opacity-50"
                                      title="Hapus data"
                                    >
                                      <Trash2 size={12} className="sm:w-4 sm:h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-3">
                                    <Search size={20} className="text-slate-400 sm:w-6 sm:h-6" />
                                  </div>
                                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">
                                    {roomsData.length === 0 ? "Belum ada data ruangan" : "Data tidak ditemukan"}
                                  </h4>
                                  <p className="text-slate-600 mb-4 max-w-xs sm:max-w-md text-xs sm:text-sm text-center">
                                    {roomsData.length === 0
                                      ? apiStatus === "offline"
                                        ? "Tidak dapat memuat data karena API sedang offline."
                                        : "Klik ruangan pada peta untuk menambahkan data."
                                      : "Tidak ada data yang sesuai dengan filter pencarian."}
                                  </p>
                                  <div className="flex gap-2">
                                    {roomsData.length === 0 && apiStatus === "offline" && (
                                      <button
                                        onClick={checkApiStatus}
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 font-medium text-xs sm:text-sm"
                                      >
                                        Coba Koneksi Ulang
                                      </button>
                                    )}
                                    {(roomsData.length > 0 || filterOptions.search) && (
                                      <button onClick={resetFilters} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-lg sm:rounded-xl hover:from-slate-300 hover:to-slate-400 font-medium text-xs sm:text-sm">
                                        Reset Filter
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {filteredRooms.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="text-xs sm:text-sm text-slate-600">
                        Menampilkan {startIndex + 1} - {endIndex} dari {filteredRooms.length} data
                      </div>
                      <div className="flex items-center gap-1">
                        {[
                          { onClick: () => setCurrentPage(1), disabled: currentPage === 1, icon: <ChevronsLeft size={14} />, title: "Halaman pertama" },
                          { onClick: () => setCurrentPage((p) => Math.max(p - 1, 1)), disabled: currentPage === 1, icon: <ChevronLeft size={14} />, title: "Sebelumnya" },
                        ].map((btn, i) => (
                          <button key={i} onClick={btn.onClick} disabled={btn.disabled} title={btn.title} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50">
                            {btn.icon}
                          </button>
                        ))}

                        <div className="flex items-center gap-0.5 mx-1">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                currentPage === i + 1
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/25"
                                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          {totalPages > 5 && <span className="px-1 text-slate-500">...</span>}
                        </div>

                        {[
                          { onClick: () => setCurrentPage((p) => Math.min(p + 1, totalPages)), disabled: currentPage === totalPages, icon: <ChevronRight size={14} />, title: "Selanjutnya" },
                          { onClick: () => setCurrentPage(totalPages), disabled: currentPage === totalPages, icon: <ChevronsRight size={14} />, title: "Halaman terakhir" },
                        ].map((btn, i) => (
                          <button key={i} onClick={btn.onClick} disabled={btn.disabled} title={btn.title} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50">
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== ADMIN PANEL TAB ===== */}
          {active === "admin" && checkAdminAccess() && (
            <div className="p-3 sm:p-4 md:p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-red-700 flex items-center gap-2">
                      <Shield className="text-red-500" size={24} />
                      Admin Panel
                    </h3>
                    <p className="text-slate-600 mt-1">Kelola pengguna dan pantau aktivitas sistem</p>
                  </div>

                  {/* Table Switcher */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAdminTableMenu(!showAdminTableMenu)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {adminTable === "users" && "👥 List User"}
                        {adminTable === "activities" && "📊 Activity User"}
                        {adminTable === "logins" && "🔐 Activity Login"}
                      </span>
                      <ChevronDown size={16} className={`text-slate-500 transition-transform ${showAdminTableMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showAdminTableMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                        {(["users", "activities", "logins"] as AdminTable[]).map((table) => {
                          const labels = { users: ["👥", "List User"], activities: ["📊", "Activity User"], logins: ["🔐", "Activity Login"] };
                          const [emoji, label] = labels[table];
                          return (
                            <button
                              key={table}
                              onClick={() => { setAdminTable(table); setShowAdminTableMenu(false); }}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 ${adminTable === table ? "bg-red-50 text-red-700" : "text-slate-700"}`}
                            >
                              <span className="text-lg">{emoji}</span>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search + Per Page */}
              <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <input
                    type="text"
                    placeholder={`Cari ${
                      adminTable === "users" ? "nama, username..." :
                      adminTable === "activities" ? "nama, aktivitas..." :
                      "username, IP..."
                    }`}
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Baris:</span>
                  <select
                    value={adminPerPage}
                    onChange={(e) => setAdminPerPage(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                  >
                    {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* USER LIST TABLE */}
              {adminTable === "users" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {["No", "ID", "Nama", "Username", "Role", "Dibuat", "Aksi"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sortedUsers.map((u, index) => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                                  <span className="text-xs font-bold text-red-700">USR</span>
                                </div>
                                <span className="font-mono text-slate-900">{String(u.id).padStart(3, "0")}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-900">{u.name}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{u.username}</td>
                            <td className="px-4 py-3">
                              <RoleBadge role={u.role} />
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{u.createdAt}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setUserModalMode("edit"); setEditingUser(u); setShowUserModal(true); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                                  title="Edit user"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleUserDelete(u.id, u.name)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                                  title="Delete user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ACTIVITY USER TABLE */}
              {adminTable === "activities" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {["No", "ID User", "Nama Pengguna", "Username", "Aktivitas", "Waktu Kejadian"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {activities
                          .filter((a) =>
                            a.userName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            a.username.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            a.activity.toLowerCase().includes(adminSearchQuery.toLowerCase())
                          )
                          .map((activity, index) => (
                            <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-purple-700">UID</span>
                                  </div>
                                  <span className="font-mono text-slate-900">{String(activity.userId).padStart(3, "0")}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{activity.userName}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{activity.username}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  activity.activity.includes("tambah") ? "bg-emerald-100 text-emerald-700" :
                                  activity.activity.includes("hapus") ? "bg-rose-100 text-rose-700" :
                                  activity.activity.includes("ubah") ? "bg-amber-100 text-amber-700" :
                                  "bg-blue-100 text-blue-700"
                                }`}>
                                  {activity.activity}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-slate-400" />
                                  <span className="text-sm text-slate-600">{activity.timestamp}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LOGIN ACTIVITY TABLE */}
              {adminTable === "logins" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {["No", "ID Users", "IP Address", "Username", "Aktivitas", "Agent User", "Terakhir Login"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {loginActivities
                          .filter((l) =>
                            l.username.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            l.ipAddress.includes(adminSearchQuery) ||
                            l.userAgent.toLowerCase().includes(adminSearchQuery.toLowerCase())
                          )
                          .map((login, index) => (
                            <tr key={login.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-indigo-700">UID</span>
                                  </div>
                                  <span className="font-mono text-slate-900">{String(login.userId).padStart(3, "0")}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-mono text-slate-600">{login.ipAddress}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{login.username}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  login.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {login.status === "success" ? "Login Berhasil" : "Login Gagal"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{login.userAgent}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-slate-400" />
                                  <span className="text-sm text-slate-600">{login.lastLogin}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Admin Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">Halaman {adminCurrentPage} dari 8</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdminCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={adminCurrentPage === 1}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((page) => (
                      <button
                        key={page}
                        onClick={() => setAdminCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm transition-all ${page === adminCurrentPage ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-slate-100 text-slate-600"}`}
                      >
                        {page}
                      </button>
                    ))}
                    <span className="px-2 text-slate-400">...</span>
                    <button
                      onClick={() => setAdminCurrentPage(8)}
                      className={`w-8 h-8 rounded-lg text-sm transition-all ${8 === adminCurrentPage ? "bg-red-500 text-white" : "hover:bg-slate-100 text-slate-600"}`}
                    >
                      8
                    </button>
                  </div>
                  <button
                    onClick={() => setAdminCurrentPage((p) => Math.min(p + 1, 8))}
                    disabled={adminCurrentPage === 8}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Info Hak Akses */}
              <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                    <Shield size={20} className="text-blue-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Informasi Hak Akses:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
                      {[
                        ["orange", "Admin", "Dapat mengelola user dan data"],
                        ["green", "Viewer", "Hanya dapat melihat data ruangan"],
                      ].map(([color, role, desc]) => (
                        <div key={role} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full bg-${color}-500`} />
                          <span className="text-slate-700">
                            <span className="font-semibold">{role}</span>: {desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="mt-4 sm:mt-6 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1.5 mb-1.5">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1 rounded">
                  <Building size={10} className="text-white sm:w-3 sm:h-3" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Sistem Denah Digital</span>
              </div>
              <p className="text-xs text-slate-600">© {new Date().getFullYear()} UNISBA - Yayasan</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs sm:text-sm text-slate-600">Jl. Tamansari No. 24-26 Bandung</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Login sebagai: {user?.username ?? "User"} ({getUserRoleFromAuth()})
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== MODALS ===== */}
      {popupRoomId && <RoomPopup roomId={popupRoomId} onClose={() => setPopupRoomId(null)} />}

      {showUserModal && (
        <UserModal
          mode={userModalMode}
          user={editingUser}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSave={handleUserSave}
        />
      )}
    </div>
  );
}