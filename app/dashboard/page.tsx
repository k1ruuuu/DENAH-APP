'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home, Building, Settings, Menu, X, Save, Upload,
  Download, Search, Filter, AlertCircle, CheckCircle,
  Clock, LogOut, RefreshCw as RefreshCwIcon, Eye, Trash2,
  Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Plus, BarChart3, FileText, ChevronDown, Shield, UserPlus, Building2, Flame,
  Code2, Bell, MessageSquare, Wrench, Send, AlertTriangle, ToggleLeft, ToggleRight,
  WifiOff, Activity,
} from "lucide-react";

import { apiService, RoomData } from "@/services/api";
import type { HistoryHydrantAparData } from "@/services/api";
import { useAuth } from "@/app/context/AuthContext";
import { useApiStatus } from "@/hooks/useApiStatus";

import { ApiStatusIndicator } from "@/components/ui/ApiStatusIndicator";
import { RoleBadge, StatCard } from "@/components/ui/Badges";
import { RoomPopup } from "@/components/room/RoomPopup";
import { UserModal } from "@/components/admin/UserModal";
import { InteractiveMap } from "@/components/map/InteractiveMap";

import {
  GEDUNG_OPTIONS, BUILDINGS_DATA,
} from "@/constants";
import {
  getLantaiOptions, getFloorsByBuilding, getBuildingPath,
  getGedungFromPath, getLantaiFromPath, loadSvgContent,
  extractErrorMessage, exportToJson, fetchAllFakultasRooms, deleteFakultasRoom,
} from "@/utils";

import type {
  FilterOptions, UserData, LoginActivityData, ActivityData,
  AdminTable, SortField, SortDirection, UserModalMode, RoomWithSource,
} from "@/types";

// ---- Tipe lokal untuk Hydrant/APAR ----
type ProteksiType = 'Hydrant' | 'APAR';
type ProteksiStatus = 'Aktif' | 'Tidak Aktif' | 'Dalam Perbaikan';

interface HydrantAparData {
  id?: number;
  no: string;
  Proteksi: ProteksiType;
  Lantai: string;
  Gedung: string;
  Kapasitas?: string;
  Tekanan?: string;
  Keterangan?: string;
  Status?: ProteksiStatus;
  created_at?: string;
  updated_at?: string;
}

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

  // --- Data State (Ruangan) ---
  const [roomsData, setRoomsData] = useState<RoomWithSource[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithSource[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: "", gedung: "", fakultas: "", lantai: "", subUnit: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGedung, setSelectedGedung] = useState("");
  const [lantaiOptions, setLantaiOptions] = useState<Array<{ value: string; label: string }>>([]);

  // --- Toggle Manajemen ---
  const [manajemenType, setManajemenType] = useState<"ruangan" | "proteksi">("ruangan");

  // --- Data State (Proteksi / Hydrant+APAR) ---
  const [proteksiData, setProteksiData] = useState<HydrantAparData[]>([]);
  const [filteredProteksi, setFilteredProteksi] = useState<HydrantAparData[]>([]);
  const [isLoadingProteksi, setIsLoadingProteksi] = useState(false);
  const [proteksiFilter, setProteksiFilter] = useState({
    search: "",
    proteksi: "",
    gedung: "",
    lantai: "",
    status: "",
  });

  // --- Data State (History Proteksi) ---
  const [historyData, setHistoryData] = useState<HistoryHydrantAparData[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryHydrantAparData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterProteksi, setHistoryFilterProteksi] = useState("");
  const [historyFilterKondisi, setHistoryFilterKondisi] = useState("");

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

  // --- Developer State ---
  const [devPanel, setDevPanel] = useState<"maintenance" | "update" | "message">("maintenance");

  // Maintenance
  const [maintenanceStatus, setMaintenanceStatus] = useState(false);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("Kami sedang melakukan pembaruan sistem. Mohon tunggu sebentar.");

  // Update/Patch Notif
  const [patchTitle, setPatchTitle] = useState("");
  const [patchSubtitle, setPatchSubtitle] = useState("");
  const [patchMessage, setPatchMessage] = useState("");
  const [patchBugUrl, setPatchBugUrl] = useState("");
  const [isSendingPatch, setIsSendingPatch] = useState(false);
  const [showPatchPreview, setShowPatchPreview] = useState(false);
  // Notif aktif (simulated dari localStorage/BE)
  const [activePatch, setActivePatch] = useState<{ title: string; subtitle: string; message: string; bugUrl: string } | null>(null);

  // Custom Message
  const [msgTarget, setMsgTarget] = useState<"all" | "admin" | "user" | "username">("all");
  const [msgTargetUsername, setMsgTargetUsername] = useState("");
  const [msgFrom, setMsgFrom] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgPreview, setMsgPreview] = useState(false);

  // Global notif yang muncul untuk semua user (patch dialog + custom message)
  const [showPatchDialog, setShowPatchDialog] = useState(false);
  const [showCustomMsgDialog, setShowCustomMsgDialog] = useState(false);
  const [incomingMsg, setIncomingMsg] = useState<{ from: string; message: string } | null>(null);

  // ============================================================
  // Computed Values
  // ============================================================

  const getUserRoleFromAuth = () => getUserRole() ?? "user";
  // Developer = full akses (admin + developer panel + bisa buat akun dev)
  // Admin     = akses admin panel, tidak bisa CRUD akun developer
  // User      = read only, tidak bisa akses admin/developer
  const checkDeveloperAccess = () => getUserRoleFromAuth() === "developer";
  const checkAdminAccess     = () => ["admin", "developer"].includes(getUserRoleFromAuth());
  const checkCrudAccess      = () => ["admin", "developer"].includes(getUserRoleFromAuth());
  const checkViewerOnly      = () => getUserRoleFromAuth() === "user";
  const isMobile = windowWidth < 768;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredRooms.length);
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / rowsPerPage));
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  // Pagination proteksi
  const proteksiStartIndex = (currentPage - 1) * rowsPerPage;
  const proteksiEndIndex = Math.min(proteksiStartIndex + rowsPerPage, filteredProteksi.length);
  const proteksiTotalPages = Math.max(1, Math.ceil(filteredProteksi.length / rowsPerPage));
  const paginatedProteksi = filteredProteksi.slice(proteksiStartIndex, proteksiEndIndex);

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

  // Opsi lantai & gedung dari data proteksi (dinamis dari data)
  const proteksiGedungOptions = Array.from(new Set(proteksiData.map((p) => p.Gedung))).map((g) => ({ value: g, label: g }));
  const proteksiLantaiOptions = Array.from(new Set(proteksiData.map((p) => p.Lantai))).sort().map((l) => ({ value: l, label: `Lantai ${l}` }));

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
      { name: "Dashboard", icon: <Home size={20} />, id: "dashboard", roles: ["admin", "user", "developer"] },
      { name: "Denah Interaktif", icon: <Building size={20} />, id: "lantai", roles: ["admin", "user", "developer"] },
      { name: "Manajemen Data", icon: <Settings size={20} />, id: "manajemen", roles: ["admin", "user", "developer"] },
      { name: "History Proteksi", icon: <Clock size={20} />, id: "history", roles: ["admin", "user", "developer"] },
      { name: "Admin Panel", icon: <Shield size={20} />, id: "admin", roles: ["admin", "developer"] },
      { name: "Developer", icon: <Code2 size={20} />, id: "developer", roles: ["developer"] },
      { name: "Logout", icon: <LogOut size={20} />, id: "logout", roles: ["admin", "user", "developer"] },
    ];
    return allItems.filter((item) => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (active === "dashboard") fetchStatistics();
    if (active === "history") fetchHistoryData();
    if (active === "developer" && checkDeveloperAccess()) fetchMaintenanceStatus();
    if (active === "manajemen") {
      if (manajemenType === "ruangan") fetchRoomsData();
      else fetchProteksiData();
    }
    if (active === "admin" && checkAdminAccess()) {
      fetchUsers();
      fetchLoginActivities();
    }
  }, [active]);

  // Fetch proteksi saat toggle berubah ke "proteksi"
  useEffect(() => {
    if (active === "manajemen" && manajemenType === "proteksi" && proteksiData.length === 0) {
      fetchProteksiData();
    }
    if (active === "manajemen" && manajemenType === "ruangan" && roomsData.length === 0) {
      fetchRoomsData();
    }
    // Reset pagination saat toggle
    setCurrentPage(1);
  }, [manajemenType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions, proteksiFilter]);

  useEffect(() => {
    if (active === "lantai" && !svgContent) loadDefaultSvg();
  }, [active, svgContent]);

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

  useEffect(() => {
    applyFilters();
  }, [roomsData, filterOptions]);

  // Apply filter proteksi
  useEffect(() => {
    applyProteksiFilters();
  }, [proteksiData, proteksiFilter]);

  // Apply filter history
  useEffect(() => {
    applyHistoryFilters();
  }, [historyData, historySearch, historyFilterProteksi, historyFilterKondisi]);

  // Polling maintenance status setiap 30 detik (untuk non-developer)
  useEffect(() => {
    if (checkDeveloperAccess()) return;
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/mainten/1`, {
          headers: { Authorization: `Bearer ${apiService.auth.getAccessToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMaintenanceStatus(data.status ?? false);
          if (data.message) setMaintenanceMessage(data.message);
        }
      } catch { /* silent fail */ }
    };
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cek pesan masuk untuk user saat ini (polling tiap 60 detik)
  useEffect(() => {
    if (!user?.username) return;
    const checkMessages = async () => {
      try {
        const role = getUserRoleFromAuth();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/custom_message/unread?username=${user.username}&role=${role}`,
          { headers: { Authorization: `Bearer ${apiService.auth.getAccessToken()}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.message && !showCustomMsgDialog) {
            setIncomingMsg({ from: data.from_name, message: data.message });
            setShowCustomMsgDialog(true);
          }
        }
        // Cek patch notif aktif
        const patchRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/patch_notif/active`,
          { headers: { Authorization: `Bearer ${apiService.auth.getAccessToken()}` } }
        );
        if (patchRes.ok) {
          const pData = await patchRes.json();
          if (pData && pData.title && !showPatchDialog) {
            setActivePatch({ title: pData.title, subtitle: pData.subtitle, message: pData.message, bugUrl: pData.bug_url });
            setShowPatchDialog(true);
          }
        }
      } catch { /* silent fail */ }
    };
    checkMessages();
    const interval = setInterval(checkMessages, 60000);
    return () => clearInterval(interval);
  }, [user?.username]);

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchStatistics = async () => {
    try {
      const allRooms = await fetchAllFakultasRooms();
      const statistics = {
        total_ruangan: allRooms.length,
        gedung_count: new Set(allRooms.map((r) => r.gedung)).size,
        lantai_distribution: {} as Record<number, number>,
        fakultas_distribution: {} as Record<string, number>,
      };
      allRooms.forEach((room) => {
        statistics.lantai_distribution[room.lantai] =
          (statistics.lantai_distribution[room.lantai] || 0) + 1;
        statistics.fakultas_distribution[room.fk] =
          (statistics.fakultas_distribution[room.fk] || 0) + 1;
      });
      setStats(statistics);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRoomsData = async () => {
    setIsLoadingRooms(true);
    try {
      const allRooms = await fetchAllFakultasRooms();
      setRoomsData(allRooms);
      setFilteredRooms(allRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Fetch data dari tabel hydrant_apar
  const fetchProteksiData = async () => {
    setIsLoadingProteksi(true);
    try {
      const result = await apiService.getHydrantApar();
      if (result.success && result.data) {
        setProteksiData(result.data);
        setFilteredProteksi(result.data);
      } else {
        console.warn("Gagal fetch proteksi:", result.error);
      }
    } catch (error) {
      console.error("Error fetching proteksi:", error);
    } finally {
      setIsLoadingProteksi(false);
    }
  };

  const fetchHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const result = await apiService.getHistoryHydrantApar();
      if (result.success && result.data) {
        // Urutkan: terbaru di atas berdasarkan Tanggal_Pengecekan
        const sorted = [...result.data].sort((a, b) =>
          new Date(b.Tanggal_Pengecekan).getTime() - new Date(a.Tanggal_Pengecekan).getTime()
        );
        setHistoryData(sorted);
        setFilteredHistory(sorted);
      } else {
        console.warn("Gagal fetch history:", result.error);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ============================================================
  // Developer Functions
  // ============================================================

  const fetchMaintenanceStatus = async () => {
    setIsLoadingMaintenance(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/mainten/1`, {
        headers: { Authorization: `Bearer ${apiService.auth.getAccessToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceStatus(data.status ?? false);
        if (data.message) setMaintenanceMessage(data.message);
      }
    } catch (e) {
      console.warn("fetchMaintenanceStatus error:", e);
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const toggleMaintenance = async () => {
    const newStatus = !maintenanceStatus;
    setIsLoadingMaintenance(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/mainten/1`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiService.auth.getAccessToken()}`,
        },
        body: JSON.stringify({ status: newStatus, message: maintenanceMessage }),
      });
      if (res.ok) {
        setMaintenanceStatus(newStatus);
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Gagal update maintenance: " + (err.detail || res.status));
      }
    } catch (e) {
      alert("Error: " + e);
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const sendPatchNotif = async () => {
    if (!patchTitle.trim() || !patchMessage.trim()) {
      alert("Title dan Message wajib diisi."); return;
    }
    setIsSendingPatch(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/patch_notif`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiService.auth.getAccessToken()}`,
        },
        body: JSON.stringify({
          title: patchTitle, subtitle: patchSubtitle,
          message: patchMessage, bug_url: patchBugUrl, is_active: true,
        }),
      });
      if (res.ok) {
        setActivePatch({ title: patchTitle, subtitle: patchSubtitle, message: patchMessage, bugUrl: patchBugUrl });
        setShowPatchPreview(false);
        alert("✅ Patch notification berhasil dikirim ke semua user!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Gagal kirim patch: " + (err.detail || res.status));
      }
    } catch (e) { alert("Error: " + e); }
    finally { setIsSendingPatch(false); }
  };

  const sendCustomMessage = async () => {
    if (!msgContent.trim()) { alert("Message wajib diisi."); return; }
    if (msgTarget === "username" && !msgTargetUsername.trim()) { alert("Username tujuan wajib diisi."); return; }
    setIsSendingMsg(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000/api/v1"}/custom_message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiService.auth.getAccessToken()}`,
        },
        body: JSON.stringify({
          from_name: msgFrom || user?.username || "Developer",
          target_role: msgTarget === "username" ? null : msgTarget,
          target_username: msgTarget === "username" ? msgTargetUsername : null,
          message: msgContent,
        }),
      });
      if (res.ok) {
        setMsgPreview(false);
        setMsgContent("");
        setMsgTargetUsername("");
        alert("✅ Pesan berhasil dikirim!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Gagal kirim pesan: " + (err.detail || res.status));
      }
    } catch (e) { alert("Error: " + e); }
    finally { setIsSendingMsg(false); }
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
      setSvgContent(`<div style="display:flex;align-items:center;justify-content:center;height:100%"><div style="text-align:center;padding:20px"><div style="font-size:48px;margin-bottom:16px">🏢</div><h3>Peta Denah</h3><p>File SVG tidak ditemukan</p></div></div>`);
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

  const applyProteksiFilters = useCallback(() => {
    let result = [...proteksiData];
    const { search, proteksi, gedung, lantai, status } = proteksiFilter;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.no.toLowerCase().includes(s) ||
          p.Proteksi.toLowerCase().includes(s) ||
          p.Gedung.toLowerCase().includes(s) ||
          p.Lantai.toLowerCase().includes(s) ||
          (p.Keterangan?.toLowerCase().includes(s))
      );
    }
    if (proteksi) result = result.filter((p) => p.Proteksi === proteksi);
    if (gedung) result = result.filter((p) => p.Gedung === gedung);
    if (lantai) result = result.filter((p) => p.Lantai === lantai);
    if (status) result = result.filter((p) => p.Status === status);
    setFilteredProteksi(result);
  }, [proteksiData, proteksiFilter]);

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

  const handleProteksiFilterChange = (key: keyof typeof proteksiFilter, value: string) => {
    setProteksiFilter((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const applyHistoryFilters = useCallback(() => {
    let result = [...historyData];
    if (historySearch) {
      const s = historySearch.toLowerCase();
      result = result.filter(
        (h) =>
          h.no.toLowerCase().includes(s) ||
          h.Proteksi.toLowerCase().includes(s) ||
          (h.Pemeriksa?.toLowerCase().includes(s)) ||
          (h.Keterangan?.toLowerCase().includes(s)) ||
          (h.Kondisi?.toLowerCase().includes(s))
      );
    }
    if (historyFilterProteksi) result = result.filter((h) => h.Proteksi === historyFilterProteksi);
    if (historyFilterKondisi) result = result.filter((h) => h.Kondisi === historyFilterKondisi);
    setFilteredHistory(result);
  }, [historyData, historySearch, historyFilterProteksi, historyFilterKondisi]);

  const resetHistoryFilters = () => {
    setHistorySearch("");
    setHistoryFilterProteksi("");
    setHistoryFilterKondisi("");
    setFilteredHistory(historyData);
  };

  const resetFilters = () => {
    setFilterOptions({ search: "", gedung: "", fakultas: "", lantai: "", subUnit: "" });
    setSelectedGedung("");
    setLantaiOptions([]);
    setFilteredRooms(roomsData);
    setCurrentPage(1);
  };

  const resetProteksiFilters = () => {
    setProteksiFilter({ search: "", proteksi: "", gedung: "", lantai: "", status: "" });
    setFilteredProteksi(proteksiData);
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
    } else if (id === "admin" && !checkAdminAccess() && !checkDeveloperAccess()) {
      alert("Anda tidak memiliki akses ke Admin Panel");
    } else if (id === "developer" && !checkDeveloperAccess()) {
      alert("Anda tidak memiliki akses ke Developer Panel");
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

  // --- Hapus proteksi ---
  const handleDeleteProteksi = async (id: number, no: string) => {
    if (!confirm(`Hapus data proteksi nomor ${no}?`)) return;
    await handleApiOperation(async () => {
      const result = await apiService.deleteHydrantApar(id);
      if (result.success) {
        await fetchProteksiData();
        alert("Data proteksi berhasil dihapus!");
      } else {
        alert(`Gagal menghapus: ${result.error}`);
      }
    });
  };

  // --- User CRUD ---
  const handleUserSave = async (userData: any) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      if (userModalMode === "create") {
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

  // Helper warna status proteksi
  const getStatusColor = (status?: string) => {
    if (status === "Aktif") return "bg-emerald-100 text-emerald-700";
    if (status === "Tidak Aktif") return "bg-rose-100 text-rose-700";
    if (status === "Dalam Perbaikan") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-600";
  };

  const getProteksiColor = (type: string) =>
    type === "Hydrant"
      ? "bg-blue-100 text-blue-700"
      : "bg-orange-100 text-orange-700";

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg">
                <Building className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">YAYASAN UNISBA</h1>
                <p className="text-xs text-slate-600 truncate">Sistem Denah Digital</p>
              </div>
            </div>

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

              {/* Admin Panel button (admin + developer) */}
              {checkAdminAccess() && (
                <div className="relative ml-1">
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
                    <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${showAdminMenu ? "rotate-180" : ""}`} />
                  </button>
                  {showAdminMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu Admin</p>
                      </div>
                      {(["users", "activities", "logins"] as AdminTable[]).map((table) => {
                        const labels = { users: "👥 List User", activities: "📊 Activity User", logins: "🔐 Activity Login" };
                        return (
                          <button key={table} onClick={() => { setAdminTable(table); setActive("admin"); setShowAdminMenu(false); }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all flex items-center gap-3 ${adminTable === table && active === "admin" ? "bg-red-50 text-red-700" : "text-slate-700"}`}>
                            {labels[table]}
                          </button>
                        );
                      })}
                      <div className="border-t border-slate-100 my-2" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3">
                        <LogOut size={18} /><span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Developer Panel button (developer only) */}
              {checkDeveloperAccess() && (
                <button
                  onClick={() => handleSetActive("developer")}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ml-1 ${
                    active === "developer"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                      : "text-slate-700 hover:bg-slate-100 hover:text-violet-700"
                  }`}
                >
                  <Code2 size={18} />
                  <span>Developer</span>
                </button>
              )}

              {/* Logout (user only — admin/dev punya logout di dropdown) */}
              {checkViewerOnly() && (
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all font-medium text-xs sm:text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 ml-2">
                  <LogOut size={18} /><span>Logout</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block"><ApiStatusIndicator /></div>
              <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-lg sm:rounded-xl">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.username?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-900 truncate max-w-[100px]">{user?.username ?? "User"}</span>
                  <RoleBadge role={getUserRoleFromAuth()} size="sm" />
                </div>
              </div>
              <button className="lg:hidden text-slate-700 hover:text-blue-700 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-slate-100 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 shadow-lg">
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user?.username ?? "User"}</p>
                  <RoleBadge role={getUserRoleFromAuth()} size="sm" />
                </div>
              </div>
              <div className="space-y-1">
                {(["dashboard", "lantai", "manajemen", "history"] as const).map((id) => {
                  const item = menuItems.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <button key={id} onClick={() => handleSetActive(id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active === id ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200" : "text-slate-700 hover:bg-slate-50"}`}>
                      <div className={`p-2 rounded-lg ${active === id ? "bg-white shadow-sm" : "bg-slate-100"}`}>{item.icon}</div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  );
                })}
                {/* Admin Panel section (admin + developer) */}
                {checkAdminAccess() && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Panel</p>
                    {(["users", "activities", "logins"] as AdminTable[]).map((table) => {
                      const labels: Record<string, [string, string]> = { users: ["👥", "List User"], activities: ["📊", "Activity User"], logins: ["🔐", "Activity Login"] };
                      const [emoji, label] = labels[table];
                      return (
                        <button key={table} onClick={() => { setAdminTable(table); setActive("admin"); setMenuOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active === "admin" && adminTable === table ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200" : "text-slate-700 hover:bg-slate-50"}`}>
                          <div className={`p-2 rounded-lg ${active === "admin" && adminTable === table ? "bg-white shadow-sm" : "bg-slate-100"}`}><span className="text-lg">{emoji}</span></div>
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Developer Panel section (developer only) */}
                {checkDeveloperAccess() && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Developer Panel</p>
                    <button
                      onClick={() => { setActive("developer"); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active === "developer" ? "bg-gradient-to-r from-violet-50 to-indigo-100 text-violet-700 border border-violet-200" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      <div className={`p-2 rounded-lg ${active === "developer" ? "bg-white shadow-sm" : "bg-slate-100"}`}><Code2 size={18} /></div>
                      <span className="text-sm font-medium">Developer Tools</span>
                    </button>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all">
                    <div className="p-2 rounded-lg bg-rose-100"><LogOut size={18} /></div>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
                <div className="mt-3 px-3"><ApiStatusIndicator /></div>
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
                active === "developer" ? "bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700" :
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
                  {active === "developer" && "Maintenance, update patch & pesan kustom"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {active === "manajemen" && (
                <button
                  onClick={() => manajemenType === "ruangan"
                    ? exportToJson(filteredRooms, "data-ruangan")
                    : exportToJson(filteredProteksi, "data-proteksi")}
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
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold">Selamat datang, {user?.username ?? "User"}!</h3>
                      <RoleBadge role={getUserRoleFromAuth()} />
                    </div>
                    <p className="text-blue-100 text-sm">Anda login sebagai <span className="font-semibold">{getUserRoleFromAuth()}</span></p>
                  </div>
                  <div className="bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                    <p className="text-xs text-blue-100">Terakhir login</p>
                    <p className="text-sm font-semibold">{new Date().toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
              </div>

              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl ${
                apiStatus === "online" ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200" :
                apiStatus === "offline" ? "bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200" :
                "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                      {apiStatus === "online" ? "✅ Sistem Berjalan Normal" : apiStatus === "offline" ? "⚠️ Sistem Sedang Offline" : "🔄 Memeriksa Status Sistem..."}
                    </h3>
                    <p className="text-slate-700 text-xs sm:text-sm">
                      {apiStatus === "online" ? "Semua layanan berfungsi dengan baik." : apiStatus === "offline" ? "Beberapa fitur mungkin terbatas." : "Sedang memeriksa status sistem..."}
                    </p>
                  </div>
                  <button onClick={checkApiStatus} className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all font-medium text-slate-700 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <RefreshCwIcon size={14} className="sm:w-4 sm:h-4" />Refresh Status
                  </button>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                  <StatCard title="Total Ruangan" value={stats.total_ruangan ?? 0} icon={<Building size={18} />} color="blue" trend="+12%" />
                  <StatCard title="Jumlah Gedung" value={stats.gedung_count ?? 0} icon={<Home size={18} />} color="emerald" trend="+5%" />
                  <StatCard title="Fakultas" value={Object.keys(stats.fakultas_distribution ?? {}).length} icon={<BarChart3 size={18} />} color="amber" />
                  <StatCard title="Data Aktif" value={stats.active_data ?? "100%"} icon={<CheckCircle size={18} />} color="purple" />
                </div>
              )}
            </div>
          )}

          {/* ===== HISTORY TAB ===== */}
          {active === "history" && (
            <div className="p-3 sm:p-4 md:p-6">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">History Proteksi</h2>
                    <p className="text-slate-600 text-xs sm:text-sm">
                      Riwayat pengecekan alat proteksi kebakaran
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Badge total */}
                  <div className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <span className="text-xs sm:text-sm font-medium text-purple-700">
                      Total: <span className="font-bold">{filteredHistory.length}</span>
                      {filteredHistory.length !== historyData.length && (
                        <span className="text-purple-400"> / {historyData.length}</span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => handleApiOperation(fetchHistoryData)}
                    disabled={isLoadingHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
                  >
                    <RefreshCwIcon size={14} className={isLoadingHistory ? "animate-spin" : ""} />
                    <span className="hidden sm:inline">{isLoadingHistory ? "Memuat..." : "Refresh"}</span>
                  </button>
                  <button
                    onClick={() => exportToJson(filteredHistory, "history-proteksi")}
                    disabled={filteredHistory.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25 font-medium text-xs sm:text-sm"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari nomor alat, pemeriksa, keterangan..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700 placeholder-slate-400 text-sm"
                  />
                </div>
                {/* Filter Jenis */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {["", "Hydrant", "APAR"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setHistoryFilterProteksi(type)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        historyFilterProteksi === type
                          ? type === "Hydrant" ? "bg-blue-600 text-white shadow"
                          : type === "APAR" ? "bg-orange-500 text-white shadow"
                          : "bg-white text-slate-700 shadow"
                          : "text-slate-600 hover:bg-white/60"
                      }`}
                    >
                      {type === "" ? "Semua" : type}
                    </button>
                  ))}
                </div>
                {/* Filter Kondisi */}
                <select
                  value={historyFilterKondisi}
                  onChange={(e) => setHistoryFilterKondisi(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-700"
                >
                  <option value="">Semua Kondisi</option>
                  <option value="Baik">Baik</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Rusak">Rusak</option>
                </select>
                {(historySearch || historyFilterProteksi || historyFilterKondisi) && (
                  <button
                    onClick={resetHistoryFilters}
                    className="px-3 py-2 text-xs sm:text-sm text-slate-600 hover:text-slate-900 font-medium bg-white border border-slate-300 rounded-lg"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Loading State */}
              {isLoadingHistory ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-slate-900 mb-1">Memuat History Proteksi</h4>
                  <p className="text-slate-600 text-sm">Mengambil data dari server...</p>
                </div>
              ) : (
                <>
                  {/* Tabel */}
                  <div className="border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden mb-3">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-purple-50 to-slate-50">
                          <tr>
                            {["No", "ID", "Nomor Alat", "Jenis", "Tgl Pengecekan", "Tgl Pengisian", "Expired", "Kondisi", "Pemeriksa", "Keterangan"].map((h) => (
                              <th key={h} className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredHistory.length > 0 ? (
                            filteredHistory.map((item, index) => {
                              // Cek expired: Expired_Date < hari ini
                              const isExpired = item.Expired_Date
                                ? new Date(item.Expired_Date) < new Date()
                                : false;

                              const kondisiColor =
                                item.Kondisi === "Rusak" ? "bg-rose-100 text-rose-700" :
                                item.Kondisi === "Perlu Perbaikan" ? "bg-amber-100 text-amber-700" :
                                "bg-emerald-100 text-emerald-700";

                              const proteksiColor =
                                item.Proteksi === "Hydrant" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700";

                              return (
                                <tr key={item.id ?? index} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-3 sm:px-4 py-2.5 text-sm font-medium text-slate-900">{index + 1}</td>
                                  <td className="px-3 sm:px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${kondisiColor}`}>
                                        <span className="text-xs font-bold">H{index + 1}</span>
                                      </div>
                                      <span className="text-xs font-mono font-semibold text-slate-700">
                                        HR{String(index + 1).padStart(3, "0")}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5">
                                    <span className="text-xs sm:text-sm font-mono font-medium text-slate-900">{item.no}</span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${proteksiColor}`}>
                                      {item.Proteksi}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                                    {item.Tanggal_Pengecekan}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                                    {item.Tanggal_Pengisian ?? "-"}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                                    <span className={`text-xs sm:text-sm font-medium ${isExpired ? "text-rose-600" : "text-slate-700"}`}>
                                      {item.Expired_Date ?? "-"}
                                      {isExpired && (
                                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-rose-100 text-rose-700 font-semibold">Expired</span>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${kondisiColor}`}>
                                      {item.Kondisi ?? "Baik"}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-slate-700">
                                    {item.Pemeriksa ?? "-"}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2.5">
                                    <p className="text-xs text-slate-600 max-w-[160px] truncate" title={item.Keterangan}>
                                      {item.Keterangan || "-"}
                                    </p>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={10} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-purple-100 rounded-full flex items-center justify-center mb-3">
                                    <Clock size={24} className="text-purple-400" />
                                  </div>
                                  <h4 className="text-base font-semibold text-slate-900 mb-1">
                                    {historyData.length === 0 ? "Belum ada history" : "Data tidak ditemukan"}
                                  </h4>
                                  <p className="text-slate-500 text-sm mb-3">
                                    {historyData.length === 0
                                      ? "Belum ada riwayat pengecekan alat proteksi."
                                      : "Tidak ada data yang sesuai dengan filter."}
                                  </p>
                                  {(historySearch || historyFilterProteksi || historyFilterKondisi) && (
                                    <button onClick={resetHistoryFilters} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300">
                                      Reset Filter
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Legend */}
                  {historyData.length > 0 && (
                    <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-purple-50 rounded-lg border border-slate-200">
                      <div className="flex flex-wrap items-center gap-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kondisi:</p>
                        {[
                          { color: "bg-emerald-400", label: "Baik" },
                          { color: "bg-amber-400", label: "Perlu Perbaikan" },
                          { color: "bg-rose-400", label: "Rusak" },
                        ].map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                            <span className="text-xs text-slate-600">{label}</span>
                          </div>
                        ))}
                        <div className="ml-auto text-xs text-slate-500">
                          Diurutkan: terbaru di atas
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== DENAH INTERAKTIF TAB ===== */}
          {active === "lantai" && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1">🗺️ Eksplorasi Denah Kampus Interaktif</h3>
                <p className="text-slate-600 text-xs sm:text-sm">Gunakan peta interaktif untuk mengeksplorasi denah gedung</p>
              </div>
              <div className="relative h-[400px] sm:h-[500px] md:h-[600px] rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl bg-gradient-to-br from-slate-50 to-white">
                {svgContent ? (
                  <InteractiveMap svgContent={svgContent} onRoomClick={handleRoomClick} onRoomHover={setHoveredRoomId} hoveredRoomId={hoveredRoomId} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
                    <div className="text-center p-4 sm:p-8">
                      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3" />
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">Memuat Peta Denah</h4>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 sm:mt-6">
                <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Pilih Gedung</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
                  {BUILDINGS_DATA.map((building) => (
                    <button key={building.name} onClick={() => setSelectedBuilding(building.name)}
                      className={`group relative overflow-hidden bg-gradient-to-br text-left p-3 sm:p-4 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${selectedBuilding === building.name ? "from-blue-50 to-blue-100 border border-blue-500 shadow-lg" : "from-white to-slate-50 border border-slate-200 hover:border-blue-300"}`}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <div className={`text-sm sm:text-base font-bold truncate ${selectedBuilding === building.name ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700"}`}>{building.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{building.code}</div>
                        </div>
                        <div className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${selectedBuilding === building.name ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"}`}>{building.totalFloors}</div>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-slate-600 mt-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                        {building.totalRooms} Ruangan
                      </div>
                    </button>
                  ))}
                </div>
                {selectedBuilding && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900">Pilih Lantai - {selectedBuilding}</h4>
                      <div className="text-xs sm:text-sm text-slate-500">Total: {getFloorsByBuilding(selectedBuilding).length}</div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {getFloorsByBuilding(selectedBuilding).map((floor) => (
                        <Link key={floor} href={`/lantai/${floor.replace(" ", "-").toLowerCase()}`}
                          className="group relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border border-slate-200 text-center p-2 sm:p-3 rounded-lg hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:translate-y-[-2px] transition-all duration-200">
                          <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 mb-0.5">{floor.includes("B") ? `B${floor.slice(1)}` : floor === "Atap" ? "R" : floor}</div>
                          <div className="text-xs text-slate-500 group-hover:text-blue-600 truncate">{floor.includes("B") ? `B${floor.slice(1)}` : floor === "Atap" ? "Atap" : `Lt ${floor}`}</div>
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

              {/* Toggle Ruangan / Proteksi */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg sm:rounded-xl w-fit">
                  <button
                    onClick={() => setManajemenType("ruangan")}
                    className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                      manajemenType === "ruangan"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-center gap-2"><Building2 size={16} /><span>Data Ruangan</span></div>
                  </button>
                  <button
                    onClick={() => setManajemenType("proteksi")}
                    className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                      manajemenType === "proteksi"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25"
                        : "text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-center gap-2"><Flame size={16} /><span>Data Proteksi</span></div>
                  </button>
                </div>
              </div>

              {/* ---- DATA RUANGAN ---- */}
              {manajemenType === "ruangan" && (
                <>
                  {/* Search & Filter Bar */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input type="text" placeholder="Cari ruangan, fakultas, kode..."
                          value={filterOptions.search}
                          onChange={(e) => { handleFilterChange("search", e.target.value); setCurrentPage(1); }}
                          className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder-slate-400 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-medium text-xs sm:text-sm">
                          <Filter size={14} className="sm:w-4 sm:h-4" />{showFilters ? "Sembunyikan" : "Filter"}
                        </button>
                        <button onClick={() => handleApiOperation(fetchRoomsData)} disabled={isLoadingRooms} className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm">
                          <Upload size={14} className="sm:w-4 sm:h-4" />{isLoadingRooms ? "Memuat..." : "Refresh"}
                        </button>
                      </div>
                    </div>

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
                              <select value={filterOptions[key] || ""} onChange={(e) => { handleFilterChange(key, e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700">
                                <option value="">Semua {label}</option>
                                {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                        {Object.values(filterOptions).some(Boolean) && (
                          <div className="mt-3 flex justify-end">
                            <button onClick={resetFilters} className="text-xs sm:text-sm text-slate-700 hover:text-slate-900 font-medium">Reset Semua Filter</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Table Header */}
                  <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900">Data Ruangan</h4>
                      <p className="text-slate-600 text-xs sm:text-sm">
                        Menampilkan <span className="font-bold text-blue-600">{filteredRooms.length}</span> dari <span className="font-bold">{roomsData.length}</span> ruangan
                      </p>
                    </div>
                    {filteredRooms.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm text-slate-700">Baris:</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500">
                          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

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
                                  <th key={h} className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {paginatedRooms.length > 0 ? (
                                paginatedRooms.map((room, index) => (
                                  <tr key={`${room._source}-${room.id}`} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 sm:px-4 py-2"><span className="text-sm font-medium text-slate-900">{startIndex + index + 1}</span></td>
                                    <td className="px-3 sm:px-4 py-2"><span className="text-xs sm:text-sm font-medium text-slate-900">#{room.no}</span></td>
                                    <td className="px-3 sm:px-4 py-2 min-w-0">
                                      <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{room.ruangan}</p>
                                      {room.subUnit && <p className="text-xs text-slate-500 truncate">{room.subUnit}</p>}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2"><p className="text-xs sm:text-sm text-slate-700 truncate">{room.fk}</p></td>
                                    <td className="px-3 sm:px-4 py-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${room.lantai === 1 ? "bg-blue-100 text-blue-700" : room.lantai === 2 ? "bg-emerald-100 text-emerald-700" : room.lantai === 3 ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"}`}>
                                        Lt {room.lantai}
                                      </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2"><p className="text-xs sm:text-sm text-slate-700 truncate">{room.gedung}</p></td>
                                    <td className="px-3 sm:px-4 py-2">
                                      {room.ukuranR ? <span className="text-xs sm:text-sm font-medium text-emerald-600">{room.ukuranR} m²</span> : <span className="text-xs sm:text-sm text-slate-400">-</span>}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2">
                                      {checkCrudAccess() ? (
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => room.id && router.push(`/ruangan/${room.id}`)} className="p-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600 rounded-lg hover:from-emerald-100 hover:to-emerald-200 transition-all" title="Lihat detail"><Eye size={12} className="sm:w-4 sm:h-4" /></button>
                                          <button onClick={() => setPopupRoomId(`room${room.no}`)} disabled={apiStatus === "offline"} className="p-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all disabled:opacity-50" title="Edit data"><Edit size={12} className="sm:w-4 sm:h-4" /></button>
                                          <button
                                            onClick={async () => {
                                              if (!room.id || !confirm(`Hapus data ruangan ${room.ruangan}?`)) return;
                                              await handleApiOperation(async () => {
                                                const result = await deleteFakultasRoom(room._source, room.id!);
                                                if (result.success) { fetchRoomsData(); alert("Data berhasil dihapus"); }
                                              });
                                            }}
                                            disabled={apiStatus === "offline"}
                                            className="p-1.5 bg-gradient-to-r from-rose-50 to-rose-100 text-rose-600 rounded-lg hover:from-rose-100 hover:to-rose-200 transition-all disabled:opacity-50"
                                            title="Hapus data"
                                          ><Trash2 size={12} className="sm:w-4 sm:h-4" /></button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => room.id && router.push(`/ruangan/${room.id}`)} className="p-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-600 rounded-lg hover:from-emerald-100 hover:to-emerald-200 transition-all" title="Lihat detail"><Eye size={12} className="sm:w-4 sm:h-4" /></button>
                                          <span className="text-xs text-slate-400 ml-1">👁️</span>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={8} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-3"><Search size={20} className="text-slate-400 sm:w-6 sm:h-6" /></div>
                                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">{roomsData.length === 0 ? "Belum ada data ruangan" : "Data tidak ditemukan"}</h4>
                                      {(roomsData.length > 0 || filterOptions.search) && (
                                        <button onClick={resetFilters} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm mt-3">Reset Filter</button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination Ruangan */}
                      {filteredRooms.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                          <div className="text-xs sm:text-sm text-slate-600">Menampilkan {startIndex + 1} - {endIndex} dari {filteredRooms.length} data</div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronsLeft size={14} /></button>
                            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronLeft size={14} /></button>
                            <div className="flex items-center gap-0.5 mx-1">
                              {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${currentPage === i + 1 ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/25" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"}`}>{i + 1}</button>
                              ))}
                              {totalPages > 5 && <span className="px-1 text-slate-500">...</span>}
                            </div>
                            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronRight size={14} /></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronsRight size={14} /></button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ---- DATA PROTEKSI (Hydrant & APAR) ---- */}
              {manajemenType === "proteksi" && (
                <>
                  {/* Search & Filter Bar Proteksi */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input type="text" placeholder="Cari nomor, jenis, gedung..."
                          value={proteksiFilter.search}
                          onChange={(e) => handleProteksiFilterChange("search", e.target.value)}
                          className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-700 placeholder-slate-400 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Quick filter: Semua / Hydrant / APAR */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                          {["", "Hydrant", "APAR"].map((type) => (
                            <button key={type}
                              onClick={() => handleProteksiFilterChange("proteksi", type)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                proteksiFilter.proteksi === type
                                  ? type === "Hydrant" ? "bg-blue-600 text-white shadow" : type === "APAR" ? "bg-orange-500 text-white shadow" : "bg-white text-slate-700 shadow"
                                  : "text-slate-600 hover:bg-white/60"
                              }`}
                            >
                              {type === "" ? "Semua" : type}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => handleApiOperation(fetchProteksiData)} disabled={isLoadingProteksi} className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm">
                          <Upload size={14} className="sm:w-4 sm:h-4" />{isLoadingProteksi ? "Memuat..." : "Refresh"}
                        </button>
                      </div>
                    </div>

                    {/* Filter lanjutan */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Gedung", key: "gedung", options: proteksiGedungOptions },
                        { label: "Lantai", key: "lantai", options: proteksiLantaiOptions },
                        { label: "Status", key: "status", options: [
                          { value: "Aktif", label: "Aktif" },
                          { value: "Tidak Aktif", label: "Tidak Aktif" },
                          { value: "Dalam Perbaikan", label: "Dalam Perbaikan" },
                        ]},
                      ].map(({ label, key, options }) => (
                        <div key={key}>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                          <select
                            value={proteksiFilter[key as keyof typeof proteksiFilter] || ""}
                            onChange={(e) => handleProteksiFilterChange(key as keyof typeof proteksiFilter, e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-slate-700"
                          >
                            <option value="">Semua {label}</option>
                            {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>

                    {Object.values(proteksiFilter).some(Boolean) && (
                      <div className="mt-2 flex justify-end">
                        <button onClick={resetProteksiFilters} className="text-xs sm:text-sm text-slate-700 hover:text-slate-900 font-medium">Reset Filter</button>
                      </div>
                    )}
                  </div>

                  {/* Table Header */}
                  <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900">Data Hydrant & APAR</h4>
                      <p className="text-slate-600 text-xs sm:text-sm">
                        Menampilkan{" "}
                        <span className="font-bold text-red-600">{filteredProteksi.length}</span> dari{" "}
                        <span className="font-bold">{proteksiData.length}</span> alat proteksi
                        {proteksiData.length > 0 && (
                          <span className="ml-2 text-slate-400">
                            (Hydrant: {proteksiData.filter(p => p.Proteksi === "Hydrant").length} | APAR: {proteksiData.filter(p => p.Proteksi === "APAR").length})
                          </span>
                        )}
                      </p>
                    </div>
                    {filteredProteksi.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm text-slate-700">Baris:</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-red-500">
                          {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    )}
                    {/* Tambah Data — hanya untuk admin/developer */}
                    {checkCrudAccess() ? (
                      <button
                        onClick={() => {
                          setProteksiForm({ no:"",Proteksi:"Hydrant",Merk:"",Type:"",Lantai:"",Gedung:"",Kapasitas:"",Tekanan:"",Status:"Aktif",Keterangan:"" });
                          setEditingProteksi(null);
                          setProteksiFormMode("create");
                          setShowProteksiModal(true);
                        }}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 font-medium text-xs sm:text-sm"
                      >
                        <Plus size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Tambah Data</span>
                        <span className="sm:hidden">Tambah</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium border border-slate-200">
                        👁️ View Only
                      </span>
                    )}
                  </div>

                  {isLoadingProteksi ? (
                    <div className="py-8 sm:py-12 text-center">
                      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-red-200 border-t-red-600 mx-auto mb-3" />
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">Memuat Data Proteksi</h4>
                      <p className="text-slate-600 text-xs sm:text-sm">Mengambil data Hydrant & APAR dari server...</p>
                    </div>
                  ) : (
                    <>
                      <div className="border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                              <tr>
                                {["No", "Nomor Alat", "Jenis", "Lantai", "Gedung", "Kapasitas", "Tekanan", "Status", "Keterangan", "Aksi"].map((h) => (
                                  <th key={h} className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {paginatedProteksi.length > 0 ? (
                                paginatedProteksi.map((item, index) => (
                                  <tr key={item.id ?? index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 sm:px-4 py-2.5"><span className="text-sm font-medium text-slate-900">{proteksiStartIndex + index + 1}</span></td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.Proteksi === "Hydrant" ? "bg-blue-100" : "bg-orange-100"}`}>
                                          <Flame size={14} className={item.Proteksi === "Hydrant" ? "text-blue-600" : "text-orange-600"} />
                                        </div>
                                        <span className="text-xs sm:text-sm font-mono font-medium text-slate-900">{item.no}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getProteksiColor(item.Proteksi)}`}>
                                        {item.Proteksi}
                                      </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                        Lt {item.Lantai}
                                      </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5"><p className="text-xs sm:text-sm text-slate-700 truncate max-w-[120px]">{item.Gedung}</p></td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      {item.Kapasitas ? <span className="text-xs sm:text-sm text-emerald-600 font-medium">{item.Kapasitas}</span> : <span className="text-xs text-slate-400">-</span>}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      {item.Tekanan ? <span className="text-xs sm:text-sm text-blue-600 font-medium">{item.Tekanan}</span> : <span className="text-xs text-slate-400">-</span>}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(item.Status)}`}>
                                        {item.Status ?? "Aktif"}
                                      </span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      <p className="text-xs text-slate-600 max-w-[140px] truncate" title={item.Keterangan}>{item.Keterangan || "-"}</p>
                                    </td>
                                    <td className="px-3 sm:px-4 py-2.5">
                                      {checkCrudAccess() ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => {
                                              setEditingProteksi(item);
                                              setProteksiForm({ no:item.no||"",Proteksi:item.Proteksi||"Hydrant",Merk:item.Merk||"",Type:item.Type||"",Lantai:item.Lantai||"",Gedung:item.Gedung||"",Kapasitas:item.Kapasitas||"",Tekanan:item.Tekanan||"",Status:item.Status||"Aktif",Keterangan:item.Keterangan||"" });
                                              setProteksiFormMode("edit");
                                              setShowProteksiModal(true);
                                            }}
                                            disabled={!item.id || apiStatus === "offline"}
                                            className="p-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all disabled:opacity-50"
                                            title="Edit data"
                                          ><Edit size={12} className="sm:w-4 sm:h-4" /></button>
                                          <button
                                            onClick={() => handleDeleteProteksi(item.id!, item.no)}
                                            disabled={!item.id || apiStatus === "offline"}
                                            className="p-1.5 bg-gradient-to-r from-rose-50 to-rose-100 text-rose-600 rounded-lg hover:from-rose-100 hover:to-rose-200 transition-all disabled:opacity-50"
                                            title="Hapus data"
                                          ><Trash2 size={12} className="sm:w-4 sm:h-4" /></button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-400">👁️</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={10} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-50 to-orange-100 rounded-full flex items-center justify-center mb-3">
                                        <Flame size={20} className="text-red-400 sm:w-6 sm:h-6" />
                                      </div>
                                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">
                                        {proteksiData.length === 0 ? "Belum ada data proteksi" : "Data tidak ditemukan"}
                                      </h4>
                                      <p className="text-slate-600 mb-4 max-w-xs sm:max-w-md text-xs sm:text-sm text-center">
                                        {proteksiData.length === 0
                                          ? apiStatus === "offline" ? "Tidak dapat memuat data karena API sedang offline." : "Tidak ada data Hydrant/APAR yang tersedia."
                                          : "Tidak ada data yang sesuai dengan filter."}
                                      </p>
                                      {Object.values(proteksiFilter).some(Boolean) && (
                                        <button onClick={resetProteksiFilters} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm">Reset Filter</button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination Proteksi */}
                      {filteredProteksi.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                          <div className="text-xs sm:text-sm text-slate-600">Menampilkan {proteksiStartIndex + 1} - {proteksiEndIndex} dari {filteredProteksi.length} data</div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronsLeft size={14} /></button>
                            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronLeft size={14} /></button>
                            <div className="flex items-center gap-0.5 mx-1">
                              {[...Array(Math.min(5, proteksiTotalPages))].map((_, i) => (
                                <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${currentPage === i + 1 ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow shadow-red-500/25" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"}`}>{i + 1}</button>
                              ))}
                              {proteksiTotalPages > 5 && <span className="px-1 text-slate-500">...</span>}
                            </div>
                            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, proteksiTotalPages))} disabled={currentPage === proteksiTotalPages} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronRight size={14} /></button>
                            <button onClick={() => setCurrentPage(proteksiTotalPages)} disabled={currentPage === proteksiTotalPages} className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"><ChevronsRight size={14} /></button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== ADMIN PANEL TAB ===== */}
          {active === "admin" && checkAdminAccess() && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-red-700 flex items-center gap-2"><Shield className="text-red-500" size={24} />Admin Panel</h3>
                    <p className="text-slate-600 mt-1">Kelola pengguna dan pantau aktivitas sistem</p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setShowAdminTableMenu(!showAdminTableMenu)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all">
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
                          const labels: Record<string, [string, string]> = { users: ["👥", "List User"], activities: ["📊", "Activity User"], logins: ["🔐", "Activity Login"] };
                          const [emoji, label] = labels[table];
                          return (
                            <button key={table} onClick={() => { setAdminTable(table); setShowAdminTableMenu(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 ${adminTable === table ? "bg-red-50 text-red-700" : "text-slate-700"}`}>
                              <span className="text-lg">{emoji}</span>{label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <input type="text" placeholder={`Cari ${adminTable === "users" ? "nama, username..." : adminTable === "activities" ? "nama, aktivitas..." : "username, IP..."}`} value={adminSearchQuery} onChange={(e) => setAdminSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm" />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Baris:</span>
                  <select value={adminPerPage} onChange={(e) => setAdminPerPage(Number(e.target.value))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white">
                    {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

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
                        {sortedUsers.map((u, index) => {
                          // Admin tidak bisa CRUD akun developer
                          const isDevAccount = u.role === "developer";
                          const canCrud = checkDeveloperAccess() || (!isDevAccount);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    isDevAccount ? "bg-gradient-to-br from-violet-100 to-violet-200" : "bg-gradient-to-br from-red-100 to-red-200"
                                  }`}>
                                    <span className={`text-xs font-bold ${isDevAccount ? "text-violet-700" : "text-red-700"}`}>
                                      {isDevAccount ? "DEV" : "USR"}
                                    </span>
                                  </div>
                                  <span className="font-mono text-slate-900">{String(u.id).padStart(3, "0")}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3"><p className="text-sm font-medium text-slate-900">{u.name}</p></td>
                              <td className="px-4 py-3 text-sm text-slate-600">{u.username}</td>
                              <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                              <td className="px-4 py-3 text-sm text-slate-600">{u.createdAt}</td>
                              <td className="px-4 py-3">
                                {canCrud ? (
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setUserModalMode("edit"); setEditingUser(u); setShowUserModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110" title="Edit user"><Edit size={16} /></button>
                                    <button onClick={() => handleUserDelete(u.id, u.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110" title="Delete user"><Trash2 size={16} /></button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">🔒 Protected</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminTable === "logins" && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {["No", "ID Users", "IP Address", "Username", "Status", "Agent User", "Terakhir Login"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {loginActivities.filter((l) => l.username.toLowerCase().includes(adminSearchQuery.toLowerCase()) || l.ipAddress.includes(adminSearchQuery)).map((login, index) => (
                          <tr key={login.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center"><span className="text-xs font-bold text-indigo-700">UID</span></div><span className="font-mono text-slate-900">{String(login.userId).padStart(3, "0")}</span></div></td>
                            <td className="px-4 py-3"><span className="text-sm font-mono text-slate-600">{login.ipAddress}</span></td>
                            <td className="px-4 py-3 text-sm text-slate-600">{login.username}</td>
                            <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${login.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{login.status === "success" ? "Login Berhasil" : "Login Gagal"}</span></td>
                            <td className="px-4 py-3 text-sm text-slate-600">{login.userAgent}</td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /><span className="text-sm text-slate-600">{login.lastLogin}</span></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== DEVELOPER TAB ===== */}
          {active === "developer" && checkDeveloperAccess() && (
            <div className="p-3 sm:p-4 md:p-6 space-y-6">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                  <Code2 size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Developer Panel</h2>
                  <p className="text-slate-500 text-sm">Kontrol sistem, notifikasi & pesan kustom</p>
                </div>
                <div className="ml-auto px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold border border-violet-200">
                  🔐 Developer Only
                </div>
              </div>

              {/* Sub-nav tabs */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                {([
                  { id: "maintenance", label: "Maintenance", icon: <Wrench size={15} /> },
                  { id: "update", label: "Update Panel", icon: <Bell size={15} /> },
                  { id: "message", label: "Custom Message", icon: <MessageSquare size={15} /> },
                ] as const).map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setDevPanel(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      devPanel === id
                        ? "bg-white text-violet-700 shadow-sm border border-violet-100"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>

              {/* ---- MAINTENANCE PANEL ---- */}
              {devPanel === "maintenance" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Control Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={16} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Status Maintenance</h3>
                      </div>
                      <p className="text-xs text-slate-500">Kontrol akses aplikasi untuk semua user</p>
                    </div>
                    <div className="p-5 space-y-5">

                      {/* Big Toggle */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        maintenanceStatus
                          ? "bg-amber-50 border-amber-300"
                          : "bg-emerald-50 border-emerald-300"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${maintenanceStatus ? "bg-amber-100" : "bg-emerald-100"}`}>
                            {maintenanceStatus ? <WifiOff size={20} className="text-amber-600" /> : <CheckCircle size={20} className="text-emerald-600" />}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${maintenanceStatus ? "text-amber-800" : "text-emerald-800"}`}>
                              {maintenanceStatus ? "⚠️ MAINTENANCE AKTIF" : "✅ SISTEM NORMAL"}
                            </p>
                            <p className={`text-xs mt-0.5 ${maintenanceStatus ? "text-amber-600" : "text-emerald-600"}`}>
                              {maintenanceStatus ? "User hanya melihat halaman maintenance" : "Semua user bisa mengakses aplikasi"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={toggleMaintenance}
                          disabled={isLoadingMaintenance}
                          className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${
                            maintenanceStatus ? "bg-amber-500" : "bg-emerald-500"
                          } ${isLoadingMaintenance ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${maintenanceStatus ? "left-8" : "left-1"}`} />
                        </button>
                      </div>

                      {/* Maintenance Message */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                          Pesan Maintenance
                        </label>
                        <textarea
                          value={maintenanceMessage}
                          onChange={(e) => setMaintenanceMessage(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                          placeholder="Masukkan pesan yang akan ditampilkan saat maintenance..."
                        />
                      </div>

                      <button
                        onClick={toggleMaintenance}
                        disabled={isLoadingMaintenance}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          maintenanceStatus
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25"
                            : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
                        } disabled:opacity-50`}
                      >
                        {isLoadingMaintenance ? "⏳ Memproses..." : maintenanceStatus ? "✅ Matikan Maintenance" : "🔧 Aktifkan Maintenance"}
                      </button>
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Preview Halaman Maintenance</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-xl p-6 text-center min-h-[220px] flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
                            <Wrench size={32} className="text-amber-400" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse" />
                        </div>
                        <div>
                          <h2 className="text-white font-bold text-lg">Sedang Maintenance</h2>
                          <p className="text-slate-400 text-xs mt-1 max-w-xs">
                            {maintenanceMessage || "Kami sedang melakukan pembaruan sistem."}
                          </p>
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <p className="text-slate-500 text-xs">Sistem Denah Digital — UNISBA</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- UPDATE PANEL ---- */}
              {devPanel === "update" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Form */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell size={16} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Buat Patch Notification</h3>
                      </div>
                      <p className="text-xs text-slate-500">Dialog update yang muncul untuk semua user saat login</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Title *</label>
                        <input
                          type="text"
                          value={patchTitle}
                          onChange={(e) => setPatchTitle(e.target.value)}
                          placeholder="Contoh: Update v2.3.1 Tersedia"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Sub Title</label>
                        <input
                          type="text"
                          value={patchSubtitle}
                          onChange={(e) => setPatchSubtitle(e.target.value)}
                          placeholder="Contoh: Perbaikan bug & peningkatan performa"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Message *</label>
                        <textarea
                          value={patchMessage}
                          onChange={(e) => setPatchMessage(e.target.value)}
                          rows={4}
                          placeholder="Deskripsi perubahan yang dilakukan pada update ini..."
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Link Report Bug</label>
                        <input
                          type="url"
                          value={patchBugUrl}
                          onChange={(e) => setPatchBugUrl(e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() => setShowPatchPreview(true)}
                          className="flex-1 py-2.5 rounded-xl border border-violet-300 text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-all"
                        >
                          <Eye size={15} className="inline mr-1.5" />Preview
                        </button>
                        <button
                          onClick={sendPatchNotif}
                          disabled={isSendingPatch || !patchTitle || !patchMessage}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25"
                        >
                          <Send size={15} className="inline mr-1.5" />
                          {isSendingPatch ? "Mengirim..." : "Kirim ke Semua User"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Preview Toast/Dialog</h3>
                      </div>
                    </div>
                    <div className="p-5 flex items-center justify-center min-h-[340px] bg-slate-50 rounded-b-2xl">
                      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Dialog Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                              <Bell size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">{patchTitle || "Update v2.3.1 Tersedia"}</p>
                              <p className="text-violet-200 text-xs">{patchSubtitle || "Perbaikan & peningkatan performa"}</p>
                            </div>
                          </div>
                        </div>
                        {/* Dialog Body */}
                        <div className="px-5 py-4">
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {patchMessage || "Masukkan message di form untuk melihat preview..."}
                          </p>
                        </div>
                        {/* Dialog Buttons */}
                        <div className="px-5 pb-5 flex gap-2">
                          <a
                            href={patchBugUrl || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                          >
                            🐛 Report Bug
                          </a>
                          <button className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:from-violet-700 hover:to-indigo-700">
                            ✅ I Understand
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- CUSTOM MESSAGE ---- */}
              {devPanel === "message" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Form */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={16} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Kirim Pesan Kustom</h3>
                      </div>
                      <p className="text-xs text-slate-500">Pesan yang muncul sebagai dialog saat user membuka aplikasi</p>
                    </div>
                    <div className="p-5 space-y-4">

                      {/* From */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Dari (From)</label>
                        <input
                          type="text"
                          value={msgFrom}
                          onChange={(e) => setMsgFrom(e.target.value)}
                          placeholder={user?.username || "Developer"}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Kosongkan untuk menggunakan username Anda: <span className="font-medium text-slate-600">{user?.username}</span></p>
                      </div>

                      {/* Target */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Kirim Ke</label>
                        <div className="flex gap-2 flex-wrap">
                          {([
                            { value: "all", label: "🌐 Semua User" },
                            { value: "admin", label: "🛡️ Admin" },
                            { value: "user", label: "👁️ User" },
                            { value: "username", label: "👤 Username Tertentu" },
                          ] as const).map(({ value, label }) => (
                            <button
                              key={value}
                              onClick={() => setMsgTarget(value)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                msgTarget === value
                                  ? "bg-violet-600 text-white border-violet-600"
                                  : "bg-white text-slate-600 border-slate-300 hover:border-violet-300"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {msgTarget === "username" && (
                          <input
                            type="text"
                            value={msgTargetUsername}
                            onChange={(e) => setMsgTargetUsername(e.target.value)}
                            placeholder="Masukkan username tujuan..."
                            className="mt-2 w-full px-4 py-2.5 border border-violet-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                          />
                        )}
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Pesan *</label>
                        <textarea
                          value={msgContent}
                          onChange={(e) => setMsgContent(e.target.value)}
                          rows={5}
                          placeholder="Ketik pesan yang akan diterima user..."
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">{msgContent.length} karakter</p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setMsgPreview(true)}
                          className="flex-1 py-2.5 rounded-xl border border-violet-300 text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-all"
                        >
                          <Eye size={15} className="inline mr-1.5" />Preview
                        </button>
                        <button
                          onClick={sendCustomMessage}
                          disabled={isSendingMsg || !msgContent}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25"
                        >
                          <Send size={15} className="inline mr-1.5" />
                          {isSendingMsg ? "Mengirim..." : "Kirim Pesan"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-slate-500" />
                        <h3 className="font-semibold text-slate-900">Preview Dialog Pesan</h3>
                      </div>
                    </div>
                    <div className="p-5 flex items-center justify-center min-h-[340px] bg-slate-50 rounded-b-2xl">
                      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-500/30 rounded-full flex items-center justify-center">
                              <span className="text-violet-300 text-sm font-bold">
                                {(msgFrom || user?.username || "D").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{msgFrom || user?.username || "Developer"}</p>
                              <p className="text-slate-400 text-xs">
                                {msgTarget === "all" ? "Kepada: Semua User" :
                                 msgTarget === "admin" ? "Kepada: Admin" :
                                 msgTarget === "user" ? "Kepada: User" :
                                 `Kepada: @${msgTargetUsername || "username"}`}
                              </p>
                            </div>
                            <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full" />
                          </div>
                        </div>
                        {/* Body */}
                        <div className="px-5 py-5">
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {msgContent || "Isi pesan akan ditampilkan di sini..."}
                          </p>
                        </div>
                        {/* Button */}
                        <div className="px-5 pb-5">
                          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-semibold">
                            ✅ Ok, Mengerti
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1 rounded"><Building size={10} className="text-white sm:w-3 sm:h-3" /></div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Sistem Denah Digital</span>
              </div>
              <p className="text-xs text-slate-600">© {new Date().getFullYear()} UNISBA - Yayasan</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs sm:text-sm text-slate-600">Jl. Tamansari No. 24-26 Bandung</p>
              <p className="text-xs text-slate-500 mt-0.5">Login sebagai: {user?.username ?? "User"} ({getUserRoleFromAuth()})</p>
            </div>
          </div>
        </div>
      </footer>

      {/* ===== MODALS ===== */}
      {popupRoomId && <RoomPopup roomId={popupRoomId} onClose={() => setPopupRoomId(null)} />}
      {showUserModal && (
        <UserModal mode={userModalMode} user={editingUser} onClose={() => { setShowUserModal(false); setEditingUser(null); }} onSave={handleUserSave} />
      )}

      {/* ===== MAINTENANCE OVERLAY (untuk non-developer saat maintenance aktif) ===== */}
      {maintenanceStatus && !checkDeveloperAccess() && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
          {/* Animated BG dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative text-center max-w-md w-full">
            {/* Icon */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center mx-auto">
                <Wrench size={44} className="text-amber-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full animate-ping" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full" />
            </div>

            {/* Text */}
            <h1 className="text-3xl font-bold text-white mb-3">Sedang Maintenance</h1>
            <p className="text-slate-400 text-base leading-relaxed mb-6">
              {maintenanceMessage || "Kami sedang melakukan pembaruan sistem. Mohon tunggu sebentar dan coba kembali."}
            </p>

            {/* Animated dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full w-2/3 animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-slate-300 text-sm">Sistem Denah Digital — UNISBA</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== PATCH NOTIFICATION DIALOG ===== */}
      {showPatchDialog && activePatch && (
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold">{activePatch.title}</h2>
                  {activePatch.subtitle && <p className="text-violet-200 text-sm">{activePatch.subtitle}</p>}
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-slate-600 text-sm leading-relaxed">{activePatch.message}</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              {activePatch.bugUrl && (
                <a
                  href={activePatch.bugUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
                >
                  🐛 Report Bug
                </a>
              )}
              <button
                onClick={() => setShowPatchDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all"
              >
                ✅ I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CUSTOM MESSAGE DIALOG ===== */}
      {showCustomMsgDialog && incomingMsg && (
        <div className="fixed inset-0 z-[9997] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500/30 rounded-full flex items-center justify-center">
                  <span className="text-violet-300 font-bold text-lg">
                    {incomingMsg.from.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{incomingMsg.from}</p>
                  <p className="text-slate-400 text-xs">Pesan untuk Anda</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-5">
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{incomingMsg.message}</p>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setShowCustomMsgDialog(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-semibold hover:from-slate-700 hover:to-slate-800 transition-all"
              >
                ✅ Ok, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}