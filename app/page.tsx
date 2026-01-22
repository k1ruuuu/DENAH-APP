<<<<<<< HEAD
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Lock, 
  Map, 
  Users, 
  Wifi, 
  MousePointerClick,
  ChevronRight,
  CheckCircle,
  Loader2,
  University,
  Smartphone,
  BarChart3,
  Shield,
  Globe,
  Key,
  AlertCircle,
  Home,
  User,
  Eye,
  EyeOff,
  LogIn,
  Database,
  Server
} from 'lucide-react';
=======
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Home, Building, Settings, Menu, X, Save, Upload, Download, Search, Filter, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService, RoomData, MasterData } from "@/services/api";
>>>>>>> e9daa1450a599b8889bef867cb46fb72b816fab8

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

<<<<<<< HEAD
  // Particle animation untuk background
=======
interface InteractiveMapProps {
  svgContent: string;
  onRoomClick: (roomId: string) => void;
}

// --- Tipe untuk Filter ---
interface FilterOptions {
  search: string;
  gedung: string;
  fakultas: string;
  lantai: string;
  subUnit: string;
}

// --- Data untuk Dropdown (Sesuaikan dengan API) ---
const unitKerjaOptions = [
  { value: "Fakultas Syariah", label: "01. Fakultas Syariah" },
  { value: "Fakultas Dakwah", label: "02. Fakultas Dakwah" },
  { value: "Fakultas Tarbiyah dan Keguruan", label: "03. Fakultas Tarbiyah dan Keguruan" },
  { value: "Fakultas Hukum", label: "04. Fakultas Hukum" },
  { value: "Fakultas Psikologi", label: "05. Fakultas Psikologi" },
  { value: "Fakultas MIPA", label: "06. Fakultas MIPA" },
  { value: "Fakultas Teknik", label: "07. Fakultas Teknik" },
  { value: "Fakultas Ilmu Komunikasi", label: "08. Fakultas Ilmu Komunikasi" },
  { value: "Fakultas Ekonomi dan Bisnis", label: "09. Fakultas Ekonomi dan Bisnis" },
  { value: "Fakultas Kedokteran", label: "10. Fakultas Kedokteran" },
];

const subUnitKerjaOptions = [
  { value: "Prodi Manajemen", label: "01. Prodi Manajemen" },
  { value: "Prodi Akuntansi", label: "02. Prodi Akuntansi" },
  { value: "Prodi Ekonomi Pembangunan", label: "03. Prodi Ekonomi Pembangunan" },
  { value: "Sekertariat Fakultas", label: "04. Sekertariat Fakultas" },
  { value: "Prodi Magister Akuntansi", label: "05. Prodi Magister Akuntansi" },
  { value: "Prodi Magister Manajemen", label: "06. Prodi Magister Manajemen" },
  { value: "Prodi Doktor Manajemen", label: "07. Prodi Doktor Manajemen" },
];

// --- Fungsi untuk mengecek status API ---
const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkApiStatus = useCallback(async () => {
    try {
      setApiStatus('checking');
      const startTime = performance.now();
      
      // Coba panggil endpoint health check atau endpoint yang sederhana
      const result = await apiService.getStatistics();
      const endTime = performance.now();
      
      const responseTimeMs = Math.round(endTime - startTime);
      setResponseTime(responseTimeMs);
      
      if (result.success) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      console.error('API status check failed:', error);
      setApiStatus('offline');
      setResponseTime(null);
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  // Fungsi untuk memulai/menghentikan monitoring
  const startMonitoring = useCallback((intervalMs: number = 30000) => {
    // Cek status pertama kali
    checkApiStatus();
    
    // Set interval untuk pengecekan berkala
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    
    checkIntervalRef.current = setInterval(checkApiStatus, intervalMs);
  }, [checkApiStatus]);

  const stopMonitoring = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Format waktu terakhir pengecekan
  const getLastCheckedText = () => {
    if (!lastChecked) return 'Belum diperiksa';
    
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return `${diffSec} detik yang lalu`;
    } else if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)} menit yang lalu`;
    } else {
      return `${Math.floor(diffSec / 3600)} jam yang lalu`;
    }
  };

  useEffect(() => {
    // Mulai monitoring saat komponen mount
    startMonitoring(30000); // Cek setiap 30 detik
    
    // Cleanup saat unmount
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    apiStatus,
    lastChecked,
    responseTime,
    getLastCheckedText,
    checkApiStatus,
    startMonitoring,
    stopMonitoring
  };
};

// --- Komponen ApiStatusIndicator ---
const ApiStatusIndicator: React.FC = () => {
  const { apiStatus, lastChecked, responseTime, getLastCheckedText, checkApiStatus } = useApiStatus();
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusConfig = () => {
    switch (apiStatus) {
      case 'online':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-200',
          icon: '🟢',
          text: 'Online',
          iconComponent: <CheckCircle size={14} className="text-green-600" />
        };
      case 'offline':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          icon: '🔴',
          text: 'Offline',
          iconComponent: <AlertCircle size={14} className="text-red-600" />
        };
      case 'checking':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          border: 'border-yellow-200',
          icon: '🟡',
          text: 'Checking...',
          iconComponent: <Clock size={14} className="text-yellow-600" />
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          icon: '⚪',
          text: 'Unknown',
          iconComponent: <AlertCircle size={14} className="text-gray-600" />
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} transition-all duration-300 cursor-help hover:shadow-sm`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => checkApiStatus()}
      >
        <div className="flex items-center gap-1.5">
          {statusConfig.iconComponent}
          <span className="text-sm font-medium">
            API: <span className={`font-bold ${statusConfig.color}`}>{statusConfig.text}</span>
          </span>
          {responseTime && apiStatus === 'online' && (
            <span className="text-xs text-gray-500 ml-1">
              ({responseTime}ms)
            </span>
          )}
        </div>
      </div>
      
      {/* Tooltip dengan info detail */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg border border-gray-700">
            <div className="font-medium mb-1">Status Sistem</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-300">Status API:</span>
                <span className={`font-bold ${statusConfig.color}`}>
                  {statusConfig.text}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-300">Terakhir diperiksa:</span>
                <span>{getLastCheckedText()}</span>
              </div>
              {responseTime && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-300">Response time:</span>
                  <span className={responseTime > 1000 ? 'text-yellow-400' : 'text-green-400'}>
                    {responseTime} ms
                  </span>
                </div>
              )}
              <div className="text-gray-400 text-[10px] mt-2 pt-1 border-t border-gray-700">
                Klik untuk refresh • Auto-refresh setiap 30 detik
              </div>
            </div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// --- Komponen RoomPopup dengan integrasi API ---
const RoomPopup: React.FC<RoomPopupProps> = ({ roomId, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    no: 0,
    fk: "",
    subUnit: "",
    ruangan: "",
    lantai: 3,
    gedung: "Gedung Dekanat",
    ukuranR: undefined,
    ket: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [filteredSubUnits, setFilteredSubUnits] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Load master data
>>>>>>> e9daa1450a599b8889bef867cb46fb72b816fab8
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
      
      // Create particles on mouse move
      if (Math.random() > 0.7) {
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          color: `rgba(30, 64, 175, ${Math.random() * 0.3})`
        };
        setParticles(prev => [...prev.slice(-50), newParticle]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          size: p.size * 0.98
        })).filter(p => p.size > 0.5)
      );
    }, 50);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || username.length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    
    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      
      // Simpan status login
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', username);
      localStorage.setItem('userRole', getRoleByUsername(username));
      
      // Redirect after success animation
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }, 1500);
  };

  const getRoleByUsername = (username: string): string => {
    const roles: Record<string, string> = {
      'admin': 'Administrator',
      'operator': 'Operator',
      'viewer': 'Viewer',
      'staff': 'Staff',
      'dosen': 'Dosen',
      'mahasiswa': 'Mahasiswa'
    };
    
    return roles[username.toLowerCase()] || 'User';
  };

<<<<<<< HEAD
  const features = [
    { icon: <Map className="h-5 w-5" />, text: "Denah 3D Interaktif", desc: "Navigasi real-time" },
    { icon: <Building className="h-5 w-5" />, text: "Navigasi Ruangan", desc: "Smart routing" },
    { icon: <Users className="h-5 w-5" />, text: "Manajemen Pengguna", desc: "Role-based access" },
    { icon: <Wifi className="h-5 w-5" />, text: "IoT Integration", desc: "300+ sensor aktif" },
    { icon: <MousePointerClick className="h-5 w-5" />, text: "Kontrol Real-time", desc: "Instant control" },
    { icon: <Smartphone className="h-5 w-5" />, text: "Mobile Ready", desc: "Responsive design" },
  ];

  const stats = [
    { label: 'Total Lantai', value: '8', change: '+1', icon: <Building className="h-4 w-4" /> },
    { label: 'Ruangan Aktif', value: '156', change: '+5', icon: <Map className="h-4 w-4" /> },
    { label: 'Pengguna Aktif', value: '42', change: '+12', icon: <Users className="h-4 w-4" /> },
    { label: 'Sensor IoT', value: '289', change: '+23', icon: <Wifi className="h-4 w-4" /> },
  ];
=======
  // Setup listeners when SVG content changes
  useEffect(() => {
    const cleanup = setupEventListeners();
    return cleanup;
  }, [setupEventListeners]);

  // Handle dynamic content (if SVG loads after mount)
  useEffect(() => {
    if (!svgContent) return;

    const observer = new MutationObserver(() => {
      setupEventListeners();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [svgContent, setupEventListeners]);

  return (
    <div className="w-full h-full min-h-[500px] relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        wheel={{ step: 0.1 }}
        panning={{ excluded: ["input", "select", "textarea", "button"] }}
      >
        <TransformComponent
          wrapperStyle={{ width: "100%", height: "100%" }}
          contentStyle={{ 
            width: "100%", 
            height: "100%", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center" 
          }}
        >
          <div
            ref={containerRef}
            id="svg-map-container"
            className="w-full h-full flex justify-center items-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </TransformComponent>
      </TransformWrapper>
      <div className="absolute top-4 left-4 bg-white/90 p-2 rounded text-xs text-gray-600 shadow-md border border-gray-200">
        Klik ruangan untuk detail. Scroll untuk zoom.
      </div>
    </div>
  );
};

// --- Komponen Utama dengan integrasi API ---
export default function DashboardWithMap() {
  const router = useRouter();
  const [active, setActive] = useState("lantai");
  const [menuOpen, setMenuOpen] = useState(false);
  const [svgContent, setSvgContent] = useState("");
  const [popupRoomId, setPopupRoomId] = useState<string | null>(null);
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: "",
    gedung: "",
    fakultas: "",
    lantai: "",
    subUnit: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const { apiStatus, checkApiStatus } = useApiStatus();

  const lantai = [1, 2, 3, 4, 5, 6, 7, 8];

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, id: "dashboard" },
    { name: "Denah Interaktif", icon: <Building size={20} />, id: "lantai" },
    { name: "Manajemen Data", icon: <Settings size={20} />, id: "manajemen" },
  ];

  // Fetch data ruangan dari API
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
>>>>>>> e9daa1450a599b8889bef867cb46fb72b816fab8

  const defaultAccounts = [
    { role: 'Administrator', username: 'admin', password: 'admin123', color: 'bg-red-500/20 text-red-200' },
    { role: 'Operator Sistem', username: 'operator', password: 'operator123', color: 'bg-blue-500/20 text-blue-200' },
    { role: 'Staff Admin', username: 'staff', password: 'staff123', color: 'bg-green-500/20 text-green-200' },
    { role: 'Viewer Only', username: 'viewer', password: 'viewer123', color: 'bg-purple-500/20 text-purple-200' },
  ];

<<<<<<< HEAD
  const handleDemoLogin = (account: { username: string, password: string }) => {
    setUsername(account.username);
    setPassword(account.password);
    setTimeout(() => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setShowSuccess(true);
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', account.username);
        localStorage.setItem('userRole', getRoleByUsername(account.username));
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }, 1000);
    }, 300);
=======
  // Filter rooms berdasarkan kriteria
  const applyFilters = useCallback(() => {
    let result = [...roomsData];

    // Filter by search (mencari di semua field)
    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase();
      result = result.filter(room => 
        room.ruangan.toLowerCase().includes(searchLower) ||
        room.fk.toLowerCase().includes(searchLower) ||
        (room.subUnit && room.subUnit.toLowerCase().includes(searchLower)) ||
        room.gedung.toLowerCase().includes(searchLower) ||
        room.no.toString().includes(searchLower)
      );
    }

    // Filter by gedung
    if (filterOptions.gedung) {
      result = result.filter(room => 
        room.gedung.toLowerCase() === filterOptions.gedung.toLowerCase()
      );
    }

    // Filter by fakultas
    if (filterOptions.fakultas) {
      result = result.filter(room => 
        room.fk.toLowerCase() === filterOptions.fakultas.toLowerCase()
      );
    }

    // Filter by lantai
    if (filterOptions.lantai) {
      result = result.filter(room => 
        room.lantai.toString() === filterOptions.lantai
      );
    }

    // Filter by subUnit
    if (filterOptions.subUnit) {
      result = result.filter(room => 
        room.subUnit && room.subUnit.toLowerCase() === filterOptions.subUnit.toLowerCase()
      );
    }

    setFilteredRooms(result);
  }, [roomsData, filterOptions]);

  // Terapkan filter saat filterOptions berubah
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Load SVG
  useEffect(() => {
    if (active === "lantai" && !svgContent) {
      fetch("/lantai3.svg")
        .then((res) => {
          if (!res.ok) throw new Error("SVG not found");
          return res.text();
        })
        .then((data) => setSvgContent(data))
        .catch(error => {
          console.error("Failed to load SVG:", error);
          setSvgContent(`
            <div class="flex items-center justify-center h-full p-8">
              <div class="text-center">
                <Building size={48} class="text-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Peta Denah</h3>
                <p class="text-gray-500">File lantai3.svg tidak ditemukan</p>
                <p class="text-sm text-gray-400 mt-2">Pastikan file ada di folder public/</p>
              </div>
            </div>
          `);
        });
    }
  }, [active, svgContent]);

  // Load data saat komponen mount
  useEffect(() => {
    if (active === "dashboard") {
      fetchStatistics();
    } else if (active === "manajemen") {
      fetchRoomsData();
    }
  }, [active]);

  // Cek API status saat melakukan operasi data
  const handleApiOperation = async (operation: () => Promise<any>) => {
    if (apiStatus === 'offline') {
      if (!confirm('API sedang offline. Apakah Anda ingin mencoba melanjutkan?')) {
        return;
      }
    }
    
    try {
      await operation();
    } catch (error) {
      console.error('Operation failed:', error);
      // Refresh status API setelah error
      await checkApiStatus();
    }
  };

  const closePopup = () => {
    setPopupRoomId(null);
  };

  const handleRoomClick = (roomId: string) => {
    console.log('Room clicked in main:', roomId);
    setPopupRoomId(roomId);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredRooms, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `data-ruangan-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
>>>>>>> e9daa1450a599b8889bef867cb46fb72b816fab8
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilterOptions({
      search: "",
      gedung: "",
      fakultas: "",
      lantai: "",
      subUnit: "",
    });
    setFilteredRooms(roomsData);
  };

  // Ekstrak nilai unik untuk dropdown filter
  const gedungOptions = Array.from(new Set(roomsData.map(room => room.gedung)));
  const fakultasOptions = Array.from(new Set(roomsData.map(room => room.fk)));
  const lantaiOptions = Array.from(new Set(roomsData.map(room => room.lantai.toString()))).sort();
  const subUnitOptions = Array.from(new Set(
    roomsData
      .map(room => room.subUnit)
      .filter(subUnit => subUnit && subUnit.trim() !== "")
  ));

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden relative"
    >
      {/* Animated Background Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 10px ${particle.color}`
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1 }}
        />
      ))}

      {/* Animated Cursor Effect */}
      <motion.div
        className="fixed w-64 h-64 rounded-full bg-gradient-to-r from-blue-200/10 to-indigo-200/10 pointer-events-none z-0"
        animate={{
          x: cursorPosition.x - 128,
          y: cursorPosition.y - 128,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      />

      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-blue-700 hover:bg-white hover:shadow-lg transition-all duration-300 border border-white/20"
        >
          <Home size={16} />
          <span className="text-sm font-medium">Kembali ke Dashboard</span>
        </Link>
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* Header dengan animasi */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl mb-4"
            >
              <University className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-900 mb-2 leading-tight"
            >
              Gedung Dekanat
            </motion.h1>
            
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 mb-3 leading-tight"
            >
              Sistem Denah Digital
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base"
            >
              Login dengan username dan password untuk mengakses sistem
            </motion.p>
          </motion.div>

<<<<<<< HEAD
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Features List - Kiri */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full lg:w-2/5 max-w-lg"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
                <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                  <MousePointerClick className="h-6 w-6" />
                  Fitur Sistem Canggih
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.03, x: 5 }}
                      className="flex flex-col p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-100/50 hover:to-indigo-100/50 border border-white/50 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <div className="text-blue-700">{feature.icon}</div>
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-800 font-semibold text-sm">{feature.text}</span>
                          <p className="text-gray-500 text-xs mt-0.5">{feature.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
=======
          <div className="hidden sm:flex items-center space-x-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-semibold border-2 ${
                  active === item.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md hover:bg-blue-700"
                    : "text-gray-600 border-transparent hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Menu Mobile */}
      {menuOpen && (
        <div className="fixed top-[70px] left-0 right-0 z-20 bg-white shadow-xl sm:hidden p-4 border-b border-gray-200 animate-in slide-in-from-top-1">
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  setMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-lg transition text-left text-base font-medium ${
                  active === item.id
                    ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto w-full bg-gray-50/50">
        <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-16 max-w-7xl mx-auto w-full flex flex-col min-h-full">
          {/* Header */}
          <header className="flex items-center justify-between mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-bold capitalize text-gray-800">
              {menuItems.find(item => item.id === active)?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-2">
              <ApiStatusIndicator />
              {active === "manajemen" && (
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  <Download size={16} /> Export
                </button>
              )}
            </div>
          </header>

          {/* Content Section */}
          <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-100 flex-1 min-h-[600px] flex flex-col">
            {active === "dashboard" && (
              <div className="h-full flex flex-col flex-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-700">
                  <Home className="inline mr-2 text-blue-500" size={24} /> Dashboard Sistem
                </h3>
                
                {/* Status API Card */}
                <div className="mb-6">
                  <div className={`p-4 rounded-lg border-l-4 ${
                    apiStatus === 'online' ? 'border-green-500 bg-green-50' :
                    apiStatus === 'offline' ? 'border-red-500 bg-red-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">Status Sistem</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-bold ${
                            apiStatus === 'online' ? 'text-green-600' :
                            apiStatus === 'offline' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {apiStatus === 'online' ? '🟢 Semua Sistem Berjalan Normal' :
                             apiStatus === 'offline' ? '🔴 API Offline - Beberapa Fitur Mungkin Terbatas' :
                             '🟡 Memeriksa Status Sistem...'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Sistem akan secara otomatis mendeteksi koneksi ke server API setiap 30 detik.
                        </p>
                      </div>
                      <button
                        onClick={() => checkApiStatus()}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
                      >
                        <RefreshCw size={14} />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-semibold text-blue-700">Total Ruangan</h4>
                      <p className="text-3xl font-bold text-gray-800">{stats.total_ruangan || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-semibold text-green-700">Jumlah Gedung</h4>
                      <p className="text-3xl font-bold text-gray-800">{stats.gedung_count || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <h4 className="font-semibold text-purple-700">Fakultas</h4>
                      <p className="text-3xl font-bold text-gray-800">{Object.keys(stats.fakultas_distribution || {}).length || 0}</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50/50 rounded-lg border-l-4 border-blue-600 mt-4">
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                    Sistem Denah Digital Gedung Dekanat terintegrasi dengan API database. 
                    Klik ruangan pada peta untuk menambah atau mengedit data.
                  </p>
                  <div className="mt-3 text-sm text-gray-600">
                    <p>• Data tersimpan di database MySQL</p>
                    <p>• Update real-time melalui API</p>
                    <p>• Status API: <span className={
                      apiStatus === 'online' ? 'text-green-600 font-bold' :
                      apiStatus === 'offline' ? 'text-red-600 font-bold' :
                      'text-yellow-600 font-bold'
                    }>{apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}</span></p>
                    <p>• Ekspor data dalam format JSON</p>
                  </div>
                </div>
              </div>
            )}

            {/* Peta Interaktif */}
            {active === "lantai" && (
              <div className="h-full flex flex-col flex-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-5 text-blue-700">
                  <Building className="inline mr-2 text-blue-500" size={24} /> Denah Lantai 3 (Interaktif)
                </h3>
                
                {/* Peta */}
                <div className="flex-1 min-h-[500px]">
                  {svgContent ? (
                    <InteractiveMap
                      svgContent={svgContent}
                      onRoomClick={handleRoomClick}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Memuat peta...</p>
>>>>>>> e9daa1450a599b8889bef867cb46fb72b816fab8
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Quick Demo Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Login Cepat (Demo)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultAccounts.slice(0, 4).map((account, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleDemoLogin(account)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 transition-all duration-300"
                      >
                        <span className="text-xs font-medium text-blue-700">{account.role}</span>
                        <span className="text-xs text-gray-600">@{account.username}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

<<<<<<< HEAD
            {/* Login Form - Tengah */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="w-full lg:w-1/3 max-w-md"
            >
              <AnimatePresence mode="wait">
                {/* Success Animation */}
                {showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-8 text-center shadow-2xl"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="inline-flex items-center justify-center p-4 bg-white rounded-full mb-6"
                    >
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Login Berhasil!</h3>
                    <p className="text-emerald-100 text-sm">
                      Selamat datang, <span className="font-bold">{username}</span>!
                    </p>
                    <p className="text-emerald-100 text-sm mt-1">
                      Role: <span className="font-bold">{getRoleByUsername(username)}</span>
                    </p>
                    <p className="text-emerald-100 text-sm">Mengarahkan ke dashboard...</p>
                    
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 1.5 }}
                      className="h-1.5 bg-white/30 rounded-full mt-6 overflow-hidden"
                    >
                      <div className="h-full bg-white/50 rounded-full" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20"
                  >
                    {/* Form Header */}
                    <div className="mb-6 text-center">
                      <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                        <User className="h-8 w-8 text-blue-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-blue-800 mb-2">
                        Login Sistem
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Masukkan username dan password Anda
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      {/* Username Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Username
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                          </div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-10 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 transition-all duration-300 outline-none text-gray-800 placeholder-gray-500 bg-white/50"
                            placeholder="Masukkan username"
                            required
                            minLength={3}
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 transition-all duration-300 outline-none text-gray-800 placeholder-gray-500 bg-white/50"
                            placeholder="Masukkan password"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                            Ingat saya
                          </label>
                        </div>
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <Key className="h-3 w-3" />
                          Lupa password?
                        </button>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={!loading ? { scale: 1.02 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                          loading
                            ? 'bg-gradient-to-r from-blue-400 to-indigo-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl'
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-base">Memproses login...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="h-5 w-5" />
                            <span className="text-base">Masuk ke Sistem</span>
                          </>
                        )}
                      </motion.button>

                      {/* Register Link */}
                      <div className="text-center pt-4 border-t border-gray-200/50">
                        <p className="text-gray-600 text-sm">
                          Belum punya akun?{' '}
                          <button className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                            Hubungi Administrator
                          </button>
                        </p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stats/Info - Kanan */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="w-full lg:w-2/5 max-w-lg"
            >
              <div className="bg-gradient-to-br from-blue-900/90 to-indigo-900/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
                <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                  <Server className="h-6 w-6" />
                  Informasi Sistem & Akun
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col p-4 rounded-xl bg-white/10 hover:bg-white/15 transition-all duration-300 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white/20 rounded-lg">
                            {stat.icon}
                          </div>
                          <span className="text-blue-200 text-xs font-medium">{stat.label}</span>
                        </div>
                        <span className="text-emerald-300 text-xs bg-emerald-900/30 px-2 py-1 rounded-full">
                          {stat.change}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{stat.value}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Default Accounts Section */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h4 className="text-blue-200 text-sm font-medium mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Akun Default untuk Testing
                  </h4>
                  <div className="space-y-3">
                    {defaultAccounts.map((account, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                        onClick={() => handleDemoLogin(account)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${account.color}`}>
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{account.role}</div>
                            <div className="text-xs text-blue-300">@{account.username}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-amber-300 font-mono">{account.password}</div>
                          <div className="text-xs text-gray-400 mt-1">Klik untuk login</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
=======
            {/* Manajemen Data */}
            {active === "manajemen" && (
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-700">
                  <Settings className="inline mr-2 text-blue-500" size={24} /> Manajemen Data Ruangan
                </h3>
                
                {/* Peringatan jika API offline */}
                {apiStatus === 'offline' && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <div className="text-red-700 font-semibold">⚠️ PERINGATAN: API Sedang Offline</div>
                        <div className="text-red-600 text-sm mt-1">
                          Beberapa fitur mungkin tidak tersedia. Data yang ditampilkan mungkin tidak terbaru.
                          <button 
                            onClick={() => checkApiStatus()}
                            className="ml-2 text-red-800 font-medium hover:underline"
                          >
                            Coba koneksi ulang
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search and Filter Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari ruangan, fakultas, atau kode..."
                        value={filterOptions.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      {/* Filter Toggle */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Filter size={16} />
                        {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
                      </button>

                      {/* Refresh Button */}
                      <button
                        onClick={() => handleApiOperation(fetchRoomsData)}
                        disabled={isLoadingRooms}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Upload size={16} />
                        {isLoadingRooms ? "Memuat..." : "Refresh"}
                      </button>
                    </div>
                  </div>

                  {/* Filter Options */}
                  {showFilters && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Filter by Gedung */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Gedung
                          </label>
                          <select
                            value={filterOptions.gedung}
                            onChange={(e) => handleFilterChange('gedung', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Semua Gedung</option>
                            {gedungOptions.map((gedung) => (
                              <option key={gedung} value={gedung}>
                                {gedung}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filter by Fakultas */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Fakultas
                          </label>
                          <select
                            value={filterOptions.fakultas}
                            onChange={(e) => handleFilterChange('fakultas', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Semua Fakultas</option>
                            {fakultasOptions.map((fakultas) => (
                              <option key={fakultas} value={fakultas}>
                                {fakultas}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filter by Lantai */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Lantai
                          </label>
                          <select
                            value={filterOptions.lantai}
                            onChange={(e) => handleFilterChange('lantai', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Semua Lantai</option>
                            {lantaiOptions.map((lantai) => (
                              <option key={lantai} value={lantai}>
                                Lantai {lantai}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Filter by Sub Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Sub Unit
                          </label>
                          <select
                            value={filterOptions.subUnit}
                            onChange={(e) => handleFilterChange('subUnit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Semua Sub Unit</option>
                            {subUnitOptions.map((subUnit) => (
                              <option key={subUnit} value={subUnit}>
                                {subUnit}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Menampilkan {filteredRooms.length} dari {roomsData.length} data
                          {filterOptions.search && (
                            <span className="ml-2 text-blue-600">
                              • Pencarian: "{filterOptions.search}"
                            </span>
                          )}
                        </div>
                        <button
                          onClick={resetFilters}
                          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                          Reset Filter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4 flex justify-between items-center">
                  <p className="text-gray-600">
                    Total data: <span className="font-bold">{roomsData.length}</span> ruangan
                    {filteredRooms.length !== roomsData.length && (
                      <span className="ml-2 text-blue-600">
                        (Difilter: {filteredRooms.length} ruangan)
                      </span>
                    )}
                  </p>
>>>>>>> e9daa1450a599b8889bef867cb46fb72b816fab8
                </div>

                {/* System Info */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Status Server:</span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-300 font-medium">Online</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Database:</span>
                      <span className="text-white/80">MySQL v8.0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">API Version:</span>
                      <span className="text-white/80">v2.1.0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Last Backup:</span>
                      <span className="text-white/80">2 jam yang lalu</span>
                    </div>
                  </div>
<<<<<<< HEAD
                </div>
              </div>
            </motion.div>
          </div>
=======
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruangan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fakultas</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Unit</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lantai</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gedung</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ukuran</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRooms.length > 0 ? (
                          filteredRooms.map((room) => (
                            <tr key={room.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {room.no}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {room.ruangan}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {room.fk}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {room.subUnit || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {room.lantai}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {room.gedung}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {room.ukuranR ? `${room.ukuranR} m²` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setPopupRoomId(`room${room.no}`)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                  disabled={apiStatus === 'offline'}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (room.id) {
                                      router.push(`/ruangan/${room.id}`);
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  Detail
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!room.id || !confirm(`Hapus data ruangan ${room.ruangan}?`)) return;
                                    await handleApiOperation(async () => {
                                      const result = await apiService.deleteFakultasEkonomi(room.id!);
                                      if (result.success) {
                                        fetchRoomsData();
                                        alert('Data berhasil dihapus');
                                      }
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  disabled={apiStatus === 'offline'}
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                              {roomsData.length === 0 ? (
                                <div className="text-center">
                                  <p className="text-gray-700 mb-2">
                                    {apiStatus === 'offline' 
                                      ? "Tidak dapat memuat data karena API sedang offline. Silakan coba lagi nanti." 
                                      : "Tidak ada data ruangan. Klik ruangan pada peta untuk menambah data."}
                                  </p>
                                  {apiStatus === 'offline' && (
                                    <button
                                      onClick={() => checkApiStatus()}
                                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                      Coba Koneksi Ulang
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-gray-700 mb-2">Tidak ada data yang sesuai dengan filter</p>
                                  <button
                                    onClick={resetFilters}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Reset filter untuk menampilkan semua data
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            
            <footer className="mt-8 text-center py-6 text-gray-400 border-t border-gray-200">
              © {new Date().getFullYear()} UNISSA - Sistem Denah Digital v1.0
              <div className="text-xs mt-2 text-gray-500">
                Status API: <span className={
                  apiStatus === 'online' ? 'text-green-600 font-bold' :
                  apiStatus === 'offline' ? 'text-red-600 font-bold' :
                  'text-yellow-600 font-bold'
                }>{apiStatus}</span>
                {apiStatus === 'offline' && (
                  <span className="ml-2 text-red-500">• Beberapa fitur mungkin terbatas</span>
                )}
              </div>
            </footer>
          </section>
        </div>
      </main>
>>>>>>> e9daa1450a599b8889bef867cb46fb72b816fab8

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-12 pt-8 border-t border-gray-200/50"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 text-sm">Keamanan Terenkripsi AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 text-sm">Database Terkelola</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 text-sm">Server 24/7 Monitoring</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Gedung Dekanat - Sistem Denah Digital v2.1
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Hanya untuk penggunaan internal. Akses terbatas berdasarkan otorisasi.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Floating Elements Animation */}
      <motion.div
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-10 w-4 h-4 rounded-full bg-blue-400/30 pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-1/4 right-10 w-6 h-6 rounded-full bg-indigo-400/20 pointer-events-none"
      />
    </div>
  );
}

// Komponen RefreshCw icon kecil (jika belum diimpor)
const RefreshCw: React.FC<{ size: number }> = ({ size }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M21 21v-5h-5"/>
  </svg>
);