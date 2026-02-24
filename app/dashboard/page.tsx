'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  Home,
  Building,
  Settings,
  Menu,
  X,
  Save,
  Upload,
  Download,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  RefreshCw as RefreshCwIcon,
  Eye,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  BarChart3,
  FileText,
  ChevronDown,
  User,
  Shield,
  Users,
  Key,
  Lock,
  Unlock,
  UserCog,
  UserPlus,
  UserCheck,
  UserX
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { apiService, RoomData, MasterData } from "@/services/api";
import { useAuth } from '@/app/context/AuthContext';

// --- Tipe Data ---
interface FormData {
  no: number;
  fk: string;
  subUnit: string;
  ruangan: string;
  lantai: number;
  gedung: string;
  ukuranR?: number;
  ket?: string;
}

interface RoomPopupProps {
  roomId: string | null;
  onClose: () => void;
}

interface InteractiveMapProps {
  svgContent: string;
  onRoomClick: (roomId: string) => void;
  onRoomHover?: (roomId: string | null) => void;
  hoveredRoomId?: string | null;
}

// --- Tipe untuk Filter ---
interface FilterOptions {
  search: string;
  gedung: string;
  fakultas: string;
  lantai: string;
  subUnit: string;
}

// --- Tipe untuk User Management ---
interface UserData {
  id: number;
  name: string;
  username: string;
  role: string;
  createdAt: string;

}

interface ActivityData {
  id: number;
  userId: number;
  userName: string;
  username: string;
  activity: string;
  timestamp: string;
}

interface LoginActivityData {
  id: number;
  userId: number;
  ipAddress: string;
  username: string;
  status: 'success' | 'failed';
  userAgent: string;
  lastLogin: string;
}

// --- Data Gedung dan Lantai ---
const gedungOptions = [
  { value: "Tamansari 1", label: "Tamansari 1" },
  { value: "Kedokteran", label: "Kedokteran" },
  { value: "Dekanat", label: "Dekanat" },
  { value: "Pascasarjana", label: "Pascasarjana" }
];

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

// Sub unit untuk setiap fakultas
const subUnitMapping: Record<string, Array<{ value: string; label: string }>> = {
  "Fakultas Ekonomi dan Bisnis": [
    { value: "Prodi Manajemen", label: "01. Prodi Manajemen" },
    { value: "Prodi Akuntansi", label: "02. Prodi Akuntansi" },
    { value: "Prodi Ekonomi Pembangunan", label: "03. Prodi Ekonomi Pembangunan" },
    { value: "Sekertariat Fakultas", label: "04. Sekertariat Fakultas" },
    { value: "Prodi Magister Akuntansi", label: "05. Prodi Magister Akuntansi" },
    { value: "Prodi Magister Manajemen", label: "06. Prodi Magister Manajemen" },
    { value: "Prodi Doktor Manajemen", label: "07. Prodi Doktor Manajemen" },
  ],
  "Fakultas Syariah": [
    { value: "Prodi Hukum Ekonomi Syariah", label: "01. Prodi Hukum Ekonomi Syariah" },
    { value: "Prodi Perbankan Syariah", label: "02. Prodi Perbankan Syariah" },
  ],
  "Fakultas Kedokteran": [
    { value: "Prodi Pendidikan Dokter", label: "01. Prodi Pendidikan Dokter" },
    { value: "Prodi Ilmu Keperawatan", label: "02. Prodi Ilmu Keperawatan" },
  ],
  "Fakultas Dakwah": [
    { value: "Prodi Komunikasi Penyiaran Islam", label: "01. Prodi Komunikasi Penyiaran Islam" },
  ],
  "Fakultas Tarbiyah dan Keguruan": [
    { value: "Prodi Pendidikan Agama Islam", label: "01. Prodi Pendidikan Agama Islam" },
  ],
  "Fakultas Hukum": [
    { value: "Prodi Ilmu Hukum", label: "01. Prodi Ilmu Hukum" },
  ],
  "Fakultas Psikologi": [
    { value: "Prodi Psikologi", label: "01. Prodi Psikologi" },
  ],
  "Fakultas MIPA": [
    { value: "Prodi Matematika", label: "01. Prodi Matematika" },
  ],
  "Fakultas Teknik": [
    { value: "Prodi Teknik Elektro", label: "01. Prodi Teknik Elektro" },
  ],
  "Fakultas Ilmu Komunikasi": [
    { value: "Prodi Ilmu Komunikasi", label: "01. Prodi Ilmu Komunikasi" },
  ],
};

const getSubUnitsByFakultas = (fakultas: string) => {
  return subUnitMapping[fakultas] || [];
};

// Fungsi untuk mendapatkan path URL
const getBuildingPath = (gedung: string, lantai?: string) => {
  const gedungMap = {
    'Dekanat': 'dekanat',
    'Kedokteran': 'kedokteran',
    'Pascasarjana': 'pascasarjana',
    'Tamansari 1': 'tamansari1'
  };
  type GedungKey = keyof typeof gedungMap;

  const pathGedung = gedungMap[gedung as GedungKey];
  
  if (lantai) {
    return `/${pathGedung}/${lantai}`;
  }
  return `/${pathGedung}`;
};

// Fungsi untuk memuat SVG yang benar
const loadSvgContent = async (gedung: string, lantai?: string) => {
  try {
    let fileName = '';
    
    if (gedung === 'Dekanat') {
      // Format: lantai1.svg, lantai_b1.svg
      fileName = lantai ? `lantai${lantai}.svg` : 'denahv2.svg';
    } 
    else if (gedung === 'Kedokteran') {
      // Format: lantai1_kedokteran.svg, lantai_b1_kedokteran.svg
      const lantaiKey = lantai?.toLowerCase().replace(' ', '_');
      fileName = lantai ? `lantai${lantaiKey}_kedokteran.svg` : 'kedokteran.svg';
    }
    else if (gedung === 'Pascasarjana') {
      // Format: lantai1_pasca.svg, lantai_b1_pasca.svg
      const lantaiKey = lantai?.toLowerCase().replace(' ', '_');
      fileName = lantai ? `lantai${lantaiKey}_pasca.svg` : 'pascasarjana.svg';
    }

    const response = await fetch(`/${fileName}`);
    return await response.text();
  } catch (error) {
    console.error('Gagal load SVG:', error);
    return null;
  }
};

// --- FUNGSI UNTUK MENDAPATKAN NAMA GEDUNG DARI PATH ---
const getGedungFromPath = (path: string): string | null => {
  const parts = path.split('/').filter(p => p);
  if (parts.length === 0) return null;
  
  const pathGedung = parts[0];
  
  // Mapping path ke nama gedung
  const pathMap: Record<string, string> = {
    'dekanat': 'Dekanat',
    'tamansari1': 'Tamansari 1',
    'kedokteran': 'Kedokteran',
    'pascasarjana': 'Pascasarjana'
  };
  
  return pathMap[pathGedung] || null;
};

// --- FUNGSI UNTUK MENDAPATKAN LANTAI DARI PATH ---
const getLantaiFromPath = (path: string): string | null => {
  const parts = path.split('/').filter(p => p);
  return parts.length >= 2 ? parts[1] : null;
};


// --- Role Configuration untuk Akses Menu ---
const rolePermissions: Record<string, string[]> = {
  admin: ['dashboard', 'lantai', 'manajemen', 'history', 'admin'],
  viewer: ['dashboard', 'lantai']
};

// --- Role Colors untuk UI ---
const roleColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  super_admin: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: 'text-red-600' },
  admin: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', icon: 'text-orange-600' },
  manager: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: 'text-blue-600' },
  staff: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: 'text-green-600' },
  supervisor: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: 'text-purple-600' },
  technician: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', icon: 'text-amber-600' },
  coordinator: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', icon: 'text-teal-600' },
  auditor: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', icon: 'text-indigo-600' },
  viewer: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: 'text-gray-600' }
};

// --- Role Icons ---
const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Shield size={14} />,
  admin: <UserCog size={14} />,
  manager: <Users size={14} />,
  staff: <User size={14} />,
  supervisor: <UserCheck size={14} />,
  technician: <Settings size={14} />,
  coordinator: <UserCog size={14} />,
  auditor: <Key size={14} />,
  viewer: <User size={14} />
};

// --- FUNGSI UNTUK MENDAPATKAN OPSI LANTAI BERDASARKAN GEDUNG ---
const getLantaiOptions = (gedung: string) => {
  switch (gedung) {
    case "Tamansari 1":
      return [
        { value: "1", label: "Lantai 1" },
        { value: "2", label: "Lantai 2" },
        { value: "3", label: "Lantai 3" },
        { value: "4", label: "Lantai 4" }
      ];
    case "Kedokteran":
      return [
        { value: "B1", label: "Basement 1" },
        { value: "B2", label: "Basement 2" },
        { value: "1", label: "Lantai 1" },
        { value: "2", label: "Lantai 2" },
        { value: "3", label: "Lantai 3" },
        { value: "4", label: "Lantai 4" },
        { value: "5", label: "Lantai 5" },
        { value: "6", label: "Lantai 6" },
        { value: "7", label: "Lantai 7" },
        { value: "8", label: "Lantai 8" },
        { value: "9", label: "Lantai 9" },
        { value: "ATAP", label: "Atap" }
      ];
    case "Dekanat":
      return [
        { value: "B1", label: "Basement 1" },
        { value: "B2", label: "Basement 2" },
        { value: "B3", label: "Basement 3" },
        { value: "1", label: "Lantai 1" },
        { value: "2", label: "Lantai 2" },
        { value: "3", label: "Lantai 3" },
        { value: "4", label: "Lantai 4" },
        { value: "5", label: "Lantai 5" },
        { value: "6", label: "Lantai 6" },
        { value: "7", label: "Lantai 7" },
        { value: "8", label: "Lantai 8" },
        { value: "9", label: "Lantai 9" }
      ];
    case "Pascasarjana":
      return [
        { value: "B1", label: "Basement 1" },
        { value: "1", label: "Lantai 1" },
        { value: "2", label: "Lantai 2" },
        { value: "3", label: "Lantai 3" },
        { value: "4", label: "Lantai 4" },
        { value: "5", label: "Lantai 5" }
      ];
    default:
      return [];
  }
};

// --- FUNGSI UNTUK MENDAPATKAN DAFTAR LANTAI BERDASARKAN GEDUNG ---
const getFloorsByBuilding = (building: string | null) => {
  if (!building) return [];
  
  switch (building) {
    case 'Tamansari 1':
      return ['1', '2', '3', '4'];
    case 'Kedokteran':
      return ['B2', 'B1', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Atap'];
    case 'Dekanat':
      return ['B3', 'B2', 'B1', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    case 'Pascasarjana':
      return ['B1', '1', '2', '3', '4', '5'];
    default:
      return [];
  }
};
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

  const startMonitoring = useCallback((intervalMs: number = 30000) => {
    checkApiStatus();
    
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
    startMonitoring(30000);
    
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

// --- Komponen ApiStatusIndicator yang lebih compact ---
const ApiStatusIndicator: React.FC = () => {
  const { apiStatus, responseTime, checkApiStatus } = useApiStatus();
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusConfig = () => {
    switch (apiStatus) {
      case 'online':
        return {
          dot: 'bg-emerald-400',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          label: 'Online',
          icon: <CheckCircle size={14} className="text-emerald-500" />
        };
      case 'offline':
        return {
          dot: 'bg-rose-400',
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-700',
          label: 'Offline',
          icon: <AlertCircle size={14} className="text-rose-500" />
        };
      case 'checking':
        return {
          dot: 'bg-amber-400',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          label: 'Checking',
          icon: <Clock size={14} className="text-amber-500 animate-spin" />
        };
      default:
        return {
          dot: 'bg-slate-400',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          label: 'Unknown',
          icon: <AlertCircle size={14} className="text-slate-500" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="relative">
      <button
        onClick={() => checkApiStatus()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${config.bg} ${config.border} hover:shadow-sm transition-all active:scale-95`}
      >
        <div className="relative">
          {config.icon}
          <div className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white ${config.dot}`}></div>
        </div>
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
        {responseTime && apiStatus === 'online' && (
          <span className="text-[10px] text-slate-500 font-mono ml-0.5">{responseTime}ms</span>
        )}
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute top-full right-0 mt-1 z-50 w-48">
          <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-800">
            <div className="font-medium mb-1 text-slate-300">Status API</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-medium ${config.text.replace('text-', 'text-')}`}>{config.label}</span>
              </div>
              {responseTime && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Response:</span>
                  <span className="font-mono text-emerald-400">{responseTime}ms</span>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-[10px] mt-2 text-center">Klik untuk refresh</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Komponen Responsive Select Dropdown ---
const ResponsiveSelect: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}> = ({ label, name, value, onChange, options, required = false, disabled = false, placeholder = "Pilih...", className = "" }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none ${className} ${disabled ? 'bg-slate-50 text-slate-400' : ''}`}
          required={required}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </div>
  );
};

// --- Komponen Responsive Input ---
const ResponsiveInput: React.FC<{
  label: string;
  name: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}> = ({ label, name, type, value, onChange, required = false, disabled = false, placeholder = "", min, max, step, className = "" }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${className} ${disabled ? 'bg-slate-50 text-slate-400' : ''}`}
      />
    </div>
  );
};

// --- Komponen RoleBadge ---
const RoleBadge: React.FC<{ role: string; size?: 'sm' | 'md' | 'lg' }> = ({ role, size = 'md' }) => {
  const colors = roleColors[role] || roleColors.viewer;
  const icon = roleIcons[role] || roleIcons.viewer;
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1.5 text-sm'
  };
  
  const roleDisplay: Record<string, string> = {
    admin: 'Admin',
    viewer: 'Viewer'
  };
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colors.bg} ${colors.text} border ${colors.border} ${sizeClasses[size]}`}>
      {icon}
      {roleDisplay[role] || role}
    </span>
  );
};

// --- Komponen RoomPopup dengan desain modern dan responsif ---
const RoomPopup: React.FC<RoomPopupProps> = ({ roomId, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    no: 0,
    fk: "",
    subUnit: "",
    ruangan: "",
    lantai: 3,
    gedung: "Dekanat",
    ukuranR: undefined,
    ket: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingId, setExistingId] = useState<number | null>(null);
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [customSubUnit, setCustomSubUnit] = useState("");
  const [showCustomSubUnit, setShowCustomSubUnit] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle klik di luar popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const data = await apiService.getMasterData();
        setMasterData(data);
      } catch (error) {
        console.error("Error loading master data:", error);
      }
    };
    
    loadMasterData();
  }, []);

  // Get sub unit options based on selected fakultas
  const getSubUnitOptions = () => {
    if (!formData.fk) return [];
    
    const predefinedSubUnits = getSubUnitsByFakultas(formData.fk);
    
    // Jika ada data dari database dan tidak ada di predefined, tambahkan
    const additionalSubUnits: Array<{ value: string; label: string }> = [];
    if (masterData?.subUnits[formData.fk]) {
      for (const subUnit of masterData.subUnits[formData.fk]) {
        if (!predefinedSubUnits.some(p => p.value === subUnit.value)) {
          additionalSubUnits.push(subUnit);
        }
      }
    }
    
    return [...predefinedSubUnits, ...additionalSubUnits];
  };

  // Handle fakultas change
  const handleFakultasChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      fk: value,
      subUnit: "" // Reset sub unit when fakultas changes
    }));
    setShowCustomSubUnit(false);
    setCustomSubUnit("");
  };

  // Handle sub unit change
  const handleSubUnitChange = (value: string) => {
    if (value === "custom") {
      setShowCustomSubUnit(true);
      setFormData(prev => ({ ...prev, subUnit: "" }));
    } else {
      setShowCustomSubUnit(false);
      setFormData(prev => ({ ...prev, subUnit: value }));
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      setIsLoading(true);
      try {
        const no = parseInt(roomId.replace(/\D/g, ''));
        if (!isNaN(no)) {
          const result = await apiService.getFakultasEkonomiByNo(no);
          
          if (result.success && result.data) {
            const roomData = result.data;
            setFormData({
              no: roomData.no,
              fk: roomData.fk,
              subUnit: roomData.subUnit || "",
              ruangan: roomData.ruangan,
              lantai: roomData.lantai,
              gedung: roomData.gedung,
              ukuranR: roomData.ukuranR,
              ket: roomData.ket || "",
            });
            
            // If subUnit exists but not in predefined options, show as custom
            if (roomData.subUnit && !getSubUnitsByFakultas(roomData.fk).some(opt => opt.value === roomData.subUnit)) {
              setCustomSubUnit(roomData.subUnit);
              setShowCustomSubUnit(true);
            }
            
            setExistingId(roomData.id || null);
            setIsEditing(true);
          } else {
            setFormData(prev => ({
              ...prev,
              no,
              ruangan: `Ruangan ${roomId}`,
            }));
            setIsEditing(false);
            setExistingId(null);
          }
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "fk") {
      handleFakultasChange(value);
    } else if (name === "subUnit") {
      handleSubUnitChange(value);
    } else if (name === "no" || name === "lantai" || name === "ukuranR") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle custom sub unit input
  const handleCustomSubUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomSubUnit(value);
    setFormData(prev => ({ ...prev, subUnit: value }));
  };

  const handleSubmit = async () => {
    if (!formData.no || !formData.fk || !formData.ruangan || !formData.gedung) {
      alert("Harap isi semua field yang wajib!");
      return;
    }

    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        subUnit: showCustomSubUnit ? customSubUnit : formData.subUnit
      };

      if (isEditing && existingId) {
        const result = await apiService.updateFakultasEkonomi(existingId, submitData);
        if (result.success) {
          alert("Data berhasil diperbarui!");
          onClose();
        } else {
          alert(`Gagal memperbarui data: ${result.error}`);
        }
      } else {
        const result = await apiService.createFakultasEkonomi(submitData);
        if (result.success) {
          alert("Data berhasil disimpan!");
          onClose();
        } else {
          alert(`Gagal menyimpan data: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingId || !confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    setIsLoading(true);
    try {
      const result = await apiService.deleteFakultasEkonomi(existingId);
      if (result.success) {
        alert("Data berhasil dihapus!");
        onClose();
      } else {
        alert(`Gagal menghapus data: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = () => {
    if (existingId) {
      window.open(`/ruangan/${existingId}`, '_blank');
    } else {
      alert("Simpan data terlebih dahulu untuk melihat detail");
    }
  };

  if (!roomId) return null;

  const subUnitOptions = getSubUnitOptions();

  // Determine popup size based on screen width
  const getPopupSize = () => {
    if (windowWidth < 640) return "w-[95vw] max-h-[90vh]";
    if (windowWidth < 1024) return "w-[90vw] max-h-[85vh]";
    return "w-[800px] max-h-[80vh]";
  };

  const getScrollableContentHeight = () => {
    if (windowWidth < 640) return "max-h-[calc(90vh-140px)]";
    if (windowWidth < 1024) return "max-h-[calc(85vh-160px)]";
    return "max-h-[calc(80vh-180px)]";
  };

  return (

    
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
      <div 
        ref={popupRef}
        className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl mx-auto overflow-hidden border border-slate-200 ${getPopupSize()} flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header dengan gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                {isEditing ? "Edit Data Ruangan" : "Edit Data Proteksi"}
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">
                {isEditing ? "Perbarui informasi ruangan" : "Tambahkan ruangan baru ke sistem"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 sm:p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 ml-2"
              aria-label="Tutup"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            <div className="bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-white text-xs">
              ID: <span className="font-mono font-bold">{roomId}</span>
            </div>
            {isEditing && (
              <div className="bg-emerald-500/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-emerald-100 text-xs">
                Mode Edit
              </div>
            )}
          </div>
        </div>
        
        {/* Content Area - Scrollable */}
        <div className={`p-3 sm:p-4 md:p-6 overflow-y-auto flex-1 ${getScrollableContentHeight()}`}>
          {isLoading ? (
            <div className="py-8 sm:py-12 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <p className="mt-3 sm:mt-4 text-slate-600 font-medium text-sm sm:text-base">Memuat data ruangan...</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Harap tunggu sebentar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Kolom 1 */}
              <div className="space-y-3 sm:space-y-4">
                <ResponsiveInput
                  label="Kode Ruangan"
                  name="no"
                  type="number"
                  value={formData.no}
                  onChange={handleChange}
                  required
                  disabled={isEditing}
                  className="text-sm"
                />

                <ResponsiveSelect
                  label="Fakultas"
                  name="fk"
                  value={formData.fk}
                  onChange={handleChange}
                  options={unitKerjaOptions}
                  required
                  className="text-sm"
                />

                <ResponsiveInput
                  label="Nama Ruangan"
                  name="ruangan"
                  type="text"
                  value={formData.ruangan}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Ruang Kelas A"
                  className="text-sm"
                />
              </div>

              {/* Kolom 2 */}
              <div className="space-y-3 sm:space-y-4">
                {/* Sub Unit dengan opsi custom */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sub Unit {!formData.fk && <span className="text-xs font-normal text-slate-500">(Pilih fakultas terlebih dahulu)</span>}
                  </label>
                  
                  {formData.fk ? (
                    <>
                      <div className="relative mb-2">
                        <select
                          name="subUnit"
                          value={showCustomSubUnit ? "custom" : formData.subUnit}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white appearance-none"
                        >
                          <option value="">Pilih Sub Unit</option>
                          {subUnitOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronDown size={16} className="text-slate-400" />
                        </div>
                      </div>
                      
                      {showCustomSubUnit && (
                        <input
                          type="text"
                          value={customSubUnit}
                          onChange={handleCustomSubUnitChange}
                          placeholder="Masukkan sub unit baru..."
                          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all mt-2"
                        />
                      )}
                    </>
                  ) : (
                    <div className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                      ← Pilih fakultas terlebih dahulu
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <ResponsiveInput
                    label="Lantai"
                    name="lantai"
                    type="number"
                    value={formData.lantai}
                    onChange={handleChange}
                    className="text-sm"
                  />
                  
                  <ResponsiveInput
                    label="Ukuran (m²)"
                    name="ukuranR"
                    type="number"
                    value={formData.ukuranR || ''}
                    onChange={handleChange}
                    placeholder="0.0"
                    className="text-sm"
                  />
                </div>

                <ResponsiveSelect
                  label="Gedung"
                  name="gedung"
                  value={formData.gedung}
                  onChange={handleChange}
                  options={gedungOptions}
                  required
                  className="text-sm"
                />
              </div>

              {/* Keterangan (full width) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Keterangan
                </label>
                <textarea
                  name="ket"
                  value={formData.ket || ''}
                  onChange={handleChange}
                  rows={windowWidth < 640 ? 2 : 3}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Tambahkan catatan atau keterangan tentang ruangan..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-500">
                    Maksimal 500 karakter. Informasi tambahan yang berguna.
                  </p>
                  <span className="text-xs text-slate-400">
                    {formData.ket?.length || 0}/500
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer dengan tombol aksi */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4 md:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  isEditing ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isEditing ? 'Mengedit Data' : 'Data Baru'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {isEditing && existingId && (
                <div className="flex gap-2 mb-2 sm:mb-0 sm:mr-2">
                  <button
                    onClick={handleViewDetail}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg sm:rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <Eye size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Lihat Detail</span>
                    <span className="sm:hidden">Detail</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg sm:rounded-xl transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Hapus</span>
                    <span className="sm:hidden">Hapus</span>
                  </button>
                </div>
              )}
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg sm:rounded-xl hover:bg-slate-50 transition duration-200 flex-1 sm:flex-none text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg sm:rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none shadow-lg shadow-blue-500/25"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span className="hidden sm:inline">Menyimpan...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} className="sm:w-5 sm:h-5" />
                      <span>{isEditing ? "Perbarui" : "Simpan"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-200">
              <div className="flex items-center text-xs sm:text-sm text-amber-600 bg-amber-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                <AlertCircle size={14} className="sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                <span className="text-xs">Edit data akan memperbarui informasi di database secara permanen</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Komponen InteractiveMap dengan desain modern ---
const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  svgContent, 
  onRoomClick,
  onRoomHover,
  hoveredRoomId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventListenersRef = useRef<Map<Element, () => void>>(new Map());
  const [scale, setScale] = useState(1);

  // Setup event listeners dengan efek hover warna saja
  const setupEventListeners = useCallback(() => {
    if (!containerRef.current || !svgContent) return;

    const container = containerRef.current;
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Atur ukuran SVG agar tidak memanjang
    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.maxHeight = '100%';
    svgElement.style.objectFit = 'contain';
    svgElement.style.display = 'block';

    // Cleanup existing listeners
    eventListenersRef.current.forEach((cleanup) => cleanup());
    eventListenersRef.current.clear();

    // Find all interactive elements (rooms)
    const interactiveElements = svgElement.querySelectorAll('[id^="room"], [class*="room"], rect, path, polygon, circle');
    
    interactiveElements.forEach((element) => {
      const id = element.getAttribute('id');
      const className = element.getAttribute('class') || '';
      
      // Skip non-room elements
      if (!id && !className.includes('room')) return;
      
      const roomId = id || className.split(' ').find(cls => cls.includes('room')) || 'unknown';

      const handleClick = () => {
        console.log('Room clicked:', roomId);
        onRoomClick(roomId);
      };

      const handleMouseEnter = () => {
        if (element instanceof SVGElement) {
          // Simpan warna asli
          const originalFill = element.getAttribute('fill') || '#E2E8F0';
          const originalStroke = element.getAttribute('stroke') || 'none';
          const originalStrokeWidth = element.getAttribute('stroke-width') || '0';
          
          element.setAttribute('data-original-fill', originalFill);
          element.setAttribute('data-original-stroke', originalStroke);
          element.setAttribute('data-original-stroke-width', originalStrokeWidth);
          
          // Hanya ubah warna fill dan stroke, tanpa efek lainnya
          element.style.transition = 'fill 0.3s ease, stroke 0.3s ease';
          element.style.fill = '#3B82F6'; // Warna biru saat hover
          element.style.stroke = '#1D4ED8';
          element.style.strokeWidth = '2';
          element.style.cursor = 'pointer';
          
          // Panggil callback hover (jika ada)
          if (onRoomHover) {
            onRoomHover(roomId);
          }
        }
      };

      const handleMouseLeave = () => {
        if (element instanceof SVGElement) {
          // Kembalikan ke warna asli
          const originalFill = element.getAttribute('data-original-fill');
          const originalStroke = element.getAttribute('data-original-stroke');
          const originalStrokeWidth = element.getAttribute('data-original-stroke-width');
          
          element.style.fill = originalFill || '';
          element.style.stroke = originalStroke || '';
          element.style.strokeWidth = originalStrokeWidth || '';
          element.style.cursor = '';
          
          // Panggil callback hover dengan null
          if (onRoomHover) {
            onRoomHover(null);
          }
        }
      };

      const handleMouseDown = () => {
        if (element instanceof SVGElement) {
          element.style.fill = '#2563EB';
        }
      };

      const handleMouseUp = () => {
        if (element instanceof SVGElement) {
          element.style.fill = '#3B82F6';
        }
      };

      // Add event listeners
      element.addEventListener('click', handleClick);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mouseup', handleMouseUp);

      // Store cleanup function
      const cleanup = () => {
        element.removeEventListener('click', handleClick);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mouseup', handleMouseUp);
      };

      eventListenersRef.current.set(element, cleanup);
    });

    // Return cleanup function
    return () => {
      eventListenersRef.current.forEach((cleanup) => cleanup());
      eventListenersRef.current.clear();
    };
  }, [svgContent, onRoomClick, onRoomHover]);

  // Setup listeners when SVG content changes
  useEffect(() => {
    const cleanup = setupEventListeners();
    return cleanup;
  }, [setupEventListeners]);

  // Handle dynamic content
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
    
    <div className="w-full h-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] relative border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-white shadow-lg">
      <TransformWrapper
        initialScale={1}
        minScale={0.3}
        maxScale={8}
        wheel={{ step: 0.1 }}
        panning={{ 
          excluded: ["input", "select", "textarea", "button", "label"],
          velocityDisabled: false
        }}
        centerOnInit={true}
        centerZoomedOut={true}
        onZoom={(ref) => setScale(ref.state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Floating Control Panel */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-6 z-10 space-y-2 sm:space-y-3">
              <div className="bg-white/95 backdrop-blur-sm p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-1 sm:mb-2 px-1">Navigasi</div>
                <div className="flex gap-1 sm:gap-1.5">
                  <button
                    onClick={() => zoomIn()}
                    className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-all active:scale-95 shadow-sm"
                    title="Zoom In"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl hover:bg-blue-100 transition-all active:scale-95 shadow-sm"
                    title="Zoom Out"
                  >
                    <span className="text-sm sm:text-lg font-bold">−</span>
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-2 sm:p-2.5 bg-slate-100 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
                    title="Reset Zoom"
                  >
                    <RefreshCwIcon size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="mt-2 text-[10px] sm:text-xs text-slate-500 font-medium px-1">
                  Zoom: <span className="font-bold">{Math.round(scale * 100)}%</span>
                </div>
              </div>
            </div>

            <TransformComponent
              wrapperStyle={{ 
                width: "100%", 
                height: "100%",
                position: "relative"
              }}
              contentStyle={{ 
                width: "100%", 
                height: "100%", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                padding: "20px"
              }}
            >
              <div
                ref={containerRef}
                id="svg-map-container"
                className="w-full h-full flex justify-center items-center"
                dangerouslySetInnerHTML={{ __html: svgContent }}
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  overflow: 'hidden'
                }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Status Bar */}
      <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 bg-white/95 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl shadow-lg border border-slate-200">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-600">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-medium text-xs sm:text-sm">Sistem Aktif</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Klik ruangan untuk detail</span>
        </div>
      </div>
    </div>
  );
};

// --- Komponen StatCard untuk Dashboard ---
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
  trend?: string;
}> = ({ title, value, icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700',
    amber: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-700',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-700',
  };

  return (
    <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border ${colorClasses[color]} transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              <span className={`text-xs font-semibold ${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">dari bulan lalu</span>
            </div>
          )}
        </div>
        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${color === 'blue' ? 'bg-blue-100' : color === 'emerald' ? 'bg-emerald-100' : color === 'amber' ? 'bg-amber-100' : 'bg-purple-100'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// --- Komponen UserModal untuk Create/Edit User ---
interface UserModalProps {
  mode: 'create' | 'edit';
  user?: UserData | null;
  onClose: () => void;
  onSave: (userData: any) => void;
}

const UserModal: React.FC<UserModalProps> = ({ mode, user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    password: '',
    confirmPassword: '',
    role: user?.role || 'user'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi
    if (!formData.name || !formData.username || !formData.role) {
      alert('Harap isi semua field yang wajib!');
      return;
    }

    if (mode === 'create') {
      if (!formData.password) {
        alert('Password wajib diisi!');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Password dan Confirm Password tidak cocok!');
        return;
      }
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                {mode === 'create' ? 'Tambah User Baru' : 'Edit User'}
              </h3>
              <p className="text-red-100 text-sm mt-1">
                {mode === 'create' ? 'Isi data user baru' : 'Perbarui informasi user'}
              </p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Masukkan username"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {mode === 'create' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={mode === 'create' ? 'Masukkan password' : 'Kosongkan jika tidak diubah'}
              required={mode === 'create'}
            />
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Konfirmasi password"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/25"
            >
              {mode === 'create' ? 'Simpan' : 'Perbarui'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Komponen Utama dengan Role dari AuthContext ---
export default function DashboardWithMap() {
  // Di bagian state declarations, tambahkan:
  const isSubmittingRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAdmin, getUserRole, isLoading } = useAuth();

  const [active, setActive] = useState("dashboard");
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
  const [selectedGedung, setSelectedGedung] = useState("");
  const [lantaiOptions, setLantaiOptions] = useState<Array<{value: string, label: string}>>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // --- STATE UNTUK ADMIN PANEL (User Management) ---
  const [users, setUsers] = useState<UserData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loginActivities, setLoginActivities] = useState<LoginActivityData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [sortField, setSortField] = useState<'id' | 'name' | 'username' | 'role' | 'createdAt'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [adminTable, setAdminTable] = useState<'users' | 'activities' | 'logins'>('users');
  const [showAdminTableMenu, setShowAdminTableMenu] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminPerPage, setAdminPerPage] = useState(10);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);

  // Tambahkan ini setelah deklarasi state (sekitar baris 1000-an)
useEffect(() => {
  const loadFromPath = async () => {
    if (!pathname || pathname === '/') return;

    const gedung = getGedungFromPath(pathname);
    const lantai = getLantaiFromPath(pathname);

    if (gedung) {
      setSelectedBuilding(gedung);
      setActive('lantai');
      
      const content = await loadSvgContent(gedung, lantai || undefined);
      if (content) {
        setSvgContent(content);
      }
    }
  };

  loadFromPath();
}, [pathname]);
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // --- END PAGINATION STATE ---

  // State untuk hover room
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  
  // --- Data Gedung untuk Peta Interaktif ---
  const buildings = [
    { name: 'Tamansari 1', code: 'T1', totalFloors: 4, totalRooms: 120 },
    { name: 'Kedokteran', code: 'FK', totalFloors: 12, totalRooms: 85 },
    { name: 'Dekanat', code: 'DN', totalFloors: 12, totalRooms: 45 },
    { name: 'Pascasarjana', code: 'PS', totalFloors: 6, totalRooms: 60 }
  ];

  // --- FUNGSI LOGOUT DARI AUTH CONTEXT ---
  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      await logout();
      router.push('/');
    }
  };

  // --- FUNGSI UNTUK MENDAPATKAN ROLE ---
  const getUserRoleFromAuth = () => {
    return getUserRole() || 'viewer';
  };

  // --- FUNGSI UNTUK CEK AKSES ADMIN ---
  const checkAdminAccess = () => {
    return isAdmin();
  };

  // Fetch users
  // Ganti fetchUsers yang menggunakan mock data dengan yang menggunakan API

const fetchUsers = useCallback(async () => {
  if (!checkAdminAccess()) return;
  
  setIsLoadingUsers(true);
  try {
    const result = await apiService.getUsers(0, 100);
    if (result.success && result.data) {
      // Transform data dari API ke format yang diharapkan komponen
      const transformedUsers = result.data.map(user => ({
        id: user.id || 0,
        name: user.name,
        username: user.username,
        role: user.role,
        createdAt: user.created_at || new Date().toISOString().split('T')[0]
      }));
      setUsers(transformedUsers);
    } else {
      // console.error('Failed to fetch users:', result.error);
      // // Fallback ke mock data jika API error
      // // const mockUsers: UserData[] = [
      // //   { id: 1, name: 'Admin User', username: 'admin', email: 'admin@university.ac.id', role: 'admin', createdAt: '2024-01-01' },
      // //   { id: 2, name: 'Regular User', username: 'user', email: 'user@university.ac.id', role: 'user', createdAt: '2024-01-02' },
      // // ];
      // setUsers(mockUsers);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    setIsLoadingUsers(false);
  }
}, [checkAdminAccess]);
  // Fetch login activities

const fetchLoginActivities = useCallback(async () => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  if (!token) {
    console.error("Token tidak ditemukan");
    return;
  }

  try {
    const res = await fetch(
      "http://localhost:9000/api/v1/auth/admin/login-history",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    // 🔥 mapping dari backend → format frontend
    const mapped: LoginActivityData[] = data.history.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      ipAddress: item.ip_address,
      username: item.username,
      status: item.status,
      userAgent: item.user_agent,
      lastLogin: item.login_time,
    }));

    setLoginActivities(mapped);
  } catch (err) {
    console.error("Error fetch login history:", err);
  }
}, []);


  useEffect(() => {
    if (active === "admin" && checkAdminAccess()) {
      fetchUsers();
      fetchLoginActivities();
    }
  }, [active]);

  // --- Menu Items dengan Role-Based Access Control dari AuthContext ---
  const getMenuItems = () => {
    const userRole = getUserRoleFromAuth();
    const allMenuItems = [
      { name: "Dashboard", icon: <Home size={20} />, id: "dashboard", roles: ['admin', 'viewer'] },
      { name: "Denah Interaktif", icon: <Building size={20} />, id: "lantai", roles: ['admin', 'viewer'] },
      { name: "Manajemen Data", icon: <Settings size={20} />, id: "manajemen", roles: ['admin', 'viewer' ] },
      { name: "History Proteksi", icon: <Clock size={20} />, id: "history", roles: ['admin', 'viewer'] },
      { name: "Admin Panel", icon: <Shield size={20} />, id: "admin", roles: ['admin', 'viewer'] },
      { name: "Logout", icon: <LogOut size={20} />, id: "logout", roles: ['admin', 'viewer'] },
    ];
    
    return allMenuItems.filter(item => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  // --- HANDLE SET ACTIVE DENGAN ROLE CHECK ---
  const handleSetActive = (id: string) => {
    if (id === "logout") {
      handleLogout();
    } else if (id === "admin" && !checkAdminAccess()) {
      alert('Anda tidak memiliki akses ke Admin Panel');
      return;
    } else {
      setActive(id);
      setMenuOpen(false);
    }
  };

  // Track window width for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if mobile view
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // --- PAGINATION CALCULATIONS ---
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredRooms.length);
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / rowsPerPage));
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions.search, filterOptions.gedung, filterOptions.fakultas, filterOptions.lantai, filterOptions.subUnit]);
  // --- END PAGINATION CALCULATIONS ---

  // Filter users untuk admin panel
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         user.username?.toLowerCase().includes(userSearchQuery.toLowerCase())
    const matchesRole = selectedRole ? user.role === selectedRole : true;
    return matchesSearch && matchesRole;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const result = await apiService.getStatistics();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

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

  // Load SVG dengan perbaikan ukuran
  useEffect(() => {
    if (active === "lantai" && !svgContent) {
      fetch("/lantai3.svg")
        .then((res) => {
          if (!res.ok) throw new Error("SVG not found");
          return res.text();
        })
        .then((data) => {
          // Proses SVG untuk memastikan ukuran yang tepat
          let processedSvg = data;
          
          // Tambahkan styling untuk SVG
          processedSvg = processedSvg.replace(
            '<svg',
            '<svg style="width: 100%; height: 100%; max-height: 100vh; object-fit: contain; display: block;" preserveAspectRatio="xMidYMid meet"'
          );
          
          setSvgContent(processedSvg);
        })
        .catch(error => {
          console.error("Failed to load SVG:", error);
          // Buat placeholder SVG yang responsif
          setSvgContent(`
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px; color: #64748b;">🏢</div>
                <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Peta Denah Lantai 3</h3>
                <p style="color: #64748b; margin-bottom: 16px; font-size: 14px;">File lantai3.svg sedang dimuat atau tidak ditemukan</p>
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
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
    
    if (key === 'gedung') {
      setSelectedGedung(value);
      const lantaiOpts = getLantaiOptions(value);
      setLantaiOptions(lantaiOpts);
      if (lantaiOpts.length > 0) {
        setFilterOptions(prev => ({ ...prev, lantai: lantaiOpts[0].value }));
      }
    }
  };

  const resetFilters = () => {
    setFilterOptions({
      search: "",
      gedung: "",
      fakultas: "",
      lantai: "",
      subUnit: "",
    });
    setSelectedGedung("");
    setLantaiOptions([]);
    setFilteredRooms(roomsData);
  };

  const handleBuildingSelect = (buildingName: string) => {
  setSelectedBuilding(buildingName);
  setSelectedFloor(null); // reset lantai
  setSvgContent("");
  const path = getBuildingPath(buildingName);
  router.push(path);
};

const handleFloorSelect = (buildingName: string, floor: string) => {
  setSelectedBuilding(buildingName);
  setSelectedFloor(floor);
  setSvgContent("");
  const path = getBuildingPath(buildingName, floor);
  router.push(path);
};

  // Ekstrak nilai unik untuk dropdown filter
  const fakultasOptions = Array.from(new Set(roomsData.map(room => room.fk)));
  const lantaiOptionsFromData = Array.from(new Set(roomsData.map(room => room.lantai.toString()))).sort();
  const subUnitOptions = Array.from(new Set(
    roomsData
      .map(room => room.subUnit)
      .filter(subUnit => subUnit && subUnit.trim() !== "")
  ));

  const currentLantaiOptions = lantaiOptions.length > 0 ? lantaiOptions : 
    lantaiOptionsFromData.map(lantai => ({ value: lantai, label: `Lantai ${lantai}` }));

  // Handle user save
  // Tambahkan di bagian atas file (setelah interface)
const extractErrorMessage = (error: any): string => {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object') {
    // Coba berbagai kemungkinan field error
    if (error.message) return error.message;
    if (error.error) return error.error;
    if (error.msg) return error.msg;
    if (error.detail) return error.detail;
    if (error.description) return error.description;
    
    // Jika response dari API dengan format tertentu
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.error) return error.response.data.error;
    
    // Terakhir, coba stringify
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error object';
    }
  }
  
  return String(error);
};


const handleUserSave = async (userData: any) => {
  // Tambahkan flag untuk mencegah double submit
  if (isSubmittingRef.current) return;
  isSubmittingRef.current = true;
  
  try {
    if (userModalMode === 'create') {
      const token = localStorage.getItem('access_token');

      console.log('🔍 Debug Info:');
      console.log('1. Token exists:', !!token);

      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          console.log('2. Token payload:', payload);
          console.log('3. Token expired:', payload.exp * 1000 < Date.now());
        } catch (e) {
          console.log('2. Token tidak bisa didecode');
        }
      }

      if (!token) {
        alert('Token tidak ditemukan. Silakan login ulang.');
        isSubmittingRef.current = false;
        return;
      }

      // CEK HEALTH - Boleh retain untuk debugging
      try {
        const healthRes = await fetch('http://localhost:9000/', {
          method: 'GET'
        });
        console.log('4. Root endpoint status:', healthRes.status);
      } catch (e) {
        console.error('❌ Backend tidak bisa diakses:', e);
        alert('Backend tidak bisa diakses. Pastikan backend running di port 9000');
        isSubmittingRef.current = false;
        return;
      }

      // ✅ GUNAKAN SATU API CALL SAJA - LANGSUNG PAKAI apiService
      console.log('📤 Sending create user request:', {
        username: userData.username,
        name: userData.name,
        role: userData.role
      });

      try {
        const result = await apiService.createUser({
          username: userData.username,
          name: userData.name,
          password: userData.password,
          role: userData.role
        });

        console.log('📥 Create user response:', result);

        if (result.success && result.data) {
          await fetchUsers();
          alert('✅ User berhasil ditambahkan!');
          setShowUserModal(false);
          setEditingUser(null);
        } else {
          console.error('❌ Create user failed:', result.error);
          alert(`❌ Gagal menambah user: ${extractErrorMessage(result.error)}`);
        }
      } catch (error) {
        console.error('🔥 Exception in create user:', error);
        alert(`❌ Terjadi kesalahan saat menambah user: ${extractErrorMessage(error)}`);
      }
    }
    else if (editingUser) {
      // Untuk edit mode
      const updateData: any = {
        name: userData.name,
        role: userData.role
      };
      
      if (userData.username !== editingUser.username) {
        updateData.username = userData.username;
      }
      
      if (userData.password) {
        updateData.password = userData.password;
      }

      const result = await apiService.updateUser(editingUser.id, updateData);

      if (result.success && result.data) {
        await fetchUsers();
        alert('✅ User berhasil diperbarui!');
        setShowUserModal(false);
        setEditingUser(null);
      } else {
        alert(`❌ Gagal memperbarui user: ${extractErrorMessage(result.error)}`);
      }
    }
  } catch (error) {
    console.error('Error saving user:', error);
    alert(`❌ Terjadi kesalahan saat menyimpan user: ${extractErrorMessage(error)}`);
  } finally {
    // Reset flag setelah selesai (dengan timeout kecil untuk mencegah double click cepat)
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 1000);
  }
};

  // Handle user delete
  // Update handleUserDelete untuk menggunakan API

const handleUserDelete = async (userId: number, userName: string) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)) return;
  
  try {
    const result = await apiService.deleteUser(userId);
    if (result.success) {
      await fetchUsers();
      alert('✅ User berhasil dihapus!');
    } else {
      alert(`❌ Gagal menghapus user: ${extractErrorMessage(result.error)}`);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert(`❌ Terjadi kesalahan saat menghapus user: ${extractErrorMessage(error)}`);
  }
};


  // --- LOADING STATE DARI AUTH ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Memuat Dashboard</h2>
          <p className="text-slate-600">Harap tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  // --- TIDAK LOGIN - REDIRECT ---
  if (!user) {
    router.push('/');
    return null;
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
     {/* Modern Navbar dengan Role dari AuthContext */}
<nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
  <div className="px-3 sm:px-4 lg:px-8">
    <div className="flex items-center justify-between h-14 sm:h-16">
      {/* Logo Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg">
          <Building className="text-white w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            YAYASAN UNISBA
          </h1>
          <p className="text-xs text-slate-600 truncate">
            Sistem Denah Digital
          </p>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center gap-1">
        {/* Dashboard */}
        <button
          onClick={() => handleSetActive('dashboard')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
            active === 'dashboard'
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
          }`}
        >
          <Home size={18} />
          <span>Dashboard</span>
        </button>

        {/* Denah Interaktif */}
        <button
          onClick={() => handleSetActive('lantai')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
            active === 'lantai'
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
          }`}
        >
          <Building size={18} />
          <span>Denah Interaktif</span>
        </button>

        {/* Manajemen Data */}
        <button
          onClick={() => handleSetActive('manajemen')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
            active === 'manajemen'
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
          }`}
        >
          <Settings size={18} />
          <span>Manajemen Data</span>
        </button>

        {/* History Proteksi */}
        <button
          onClick={() => handleSetActive('history')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
            active === 'history'
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
          }`}
        >
          <Clock size={18} />
          <span>History Proteksi</span>
        </button>

        {/* Admin Panel dengan Dropdown */}
        {checkAdminAccess() && (
          <div className="relative ml-2">
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
                active === 'admin'
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25"
                  : "text-slate-700 hover:bg-slate-100 hover:text-red-700"
              }`}
            >
              <Shield size={18} />
              <span>Admin Panel</span>
              <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${showAdminMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showAdminMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu Admin</p>
                </div>
                
                <button
                  onClick={() => {
                    setAdminTable('users');
                    setActive('admin');
                    setShowAdminMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all duration-150 flex items-center gap-3 ${
                    adminTable === 'users' && active === 'admin' ? 'bg-red-50 text-red-700' : 'text-slate-700'
                  }`}
                >
                  <span className="text-lg">👥</span>
                  <span className="flex-1">List User</span>
                </button>
                
                <button
                  onClick={() => {
                    setAdminTable('activities');
                    setActive('admin');
                    setShowAdminMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all duration-150 flex items-center gap-3 ${
                    adminTable === 'activities' && active === 'admin' ? 'bg-red-50 text-red-700' : 'text-slate-700'
                  }`}
                >
                  <span className="text-lg">📊</span>
                  <span className="flex-1">Activity User</span>
                </button>
                
                <button
                  onClick={() => {
                    setAdminTable('logins');
                    setActive('admin');
                    setShowAdminMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all duration-150 flex items-center gap-3 ${
                    adminTable === 'logins' && active === 'admin' ? 'bg-red-50 text-red-700' : 'text-slate-700'
                  }`}
                >
                  <span className="text-lg">🔐</span>
                  <span className="flex-1">Activity Login</span>
                </button>

                <div className="border-t border-slate-100 my-2"></div>
                
                {/* Tombol Logout di dropdown admin */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-all duration-150 flex items-center gap-3"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Logout Button untuk non-admin (tanpa dropdown) */}
        {!checkAdminAccess() && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 ml-2"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* Right Section - User Info & API Status */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* API Status */}
        <div className="hidden sm:block">
          <ApiStatusIndicator />
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-lg sm:rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-900 truncate max-w-[100px]">
                  {user?.username || 'User'}
                </span>
                <RoleBadge role={getUserRoleFromAuth()} size="sm" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Button */}
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
        {/* User Info Mobile */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{user?.username || 'User'}</p>
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={getUserRoleFromAuth()} size="sm" />
              <span className="text-xs text-slate-500"></span>
            </div>
          </div>
        </div>

        {/* Menu Items Mobile */}
        <div className="space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => handleSetActive('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              active === 'dashboard'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${active === 'dashboard' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              <Home size={18} />
            </div>
            <span className="text-sm font-medium">Dashboard</span>
          </button>

          {/* Denah Interaktif */}
          <button
            onClick={() => handleSetActive('lantai')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              active === 'lantai'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${active === 'lantai' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              <Building size={18} />
            </div>
            <span className="text-sm font-medium">Denah Interaktif</span>
          </button>

          {/* Manajemen Data */}
          <button
            onClick={() => handleSetActive('manajemen')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              active === 'manajemen'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${active === 'manajemen' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              <Settings size={18} />
            </div>
            <span className="text-sm font-medium">Manajemen Data</span>
          </button>

          {/* History Proteksi */}
          <button
            onClick={() => handleSetActive('history')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              active === 'history'
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${active === 'history' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              <Clock size={18} />
            </div>
            <span className="text-sm font-medium">History Proteksi</span>
          </button>

          {/* Admin Panel untuk mobile */}
          {checkAdminAccess() && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin Panel</p>
              </div>
              
              <button
                onClick={() => {
                  setAdminTable('users');
                  setActive('admin');
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  active === 'admin' && adminTable === 'users'
                    ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${active === 'admin' && adminTable === 'users' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                  <span className="text-lg">👥</span>
                </div>
                <span className="text-sm font-medium">List User</span>
              </button>

              <button
                onClick={() => {
                  setAdminTable('activities');
                  setActive('admin');
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  active === 'admin' && adminTable === 'activities'
                    ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${active === 'admin' && adminTable === 'activities' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                  <span className="text-lg">📊</span>
                </div>
                <span className="text-sm font-medium">Activity User</span>
              </button>

              <button
                onClick={() => {
                  setAdminTable('logins');
                  setActive('admin');
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  active === 'admin' && adminTable === 'logins'
                    ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${active === 'admin' && adminTable === 'logins' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                  <span className="text-lg">🔐</span>
                </div>
                <span className="text-sm font-medium">Activity Login</span>
              </button>
            </div>
          )}

          {/* Logout Mobile */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all"
            >
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <LogOut size={18} />
              </div>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* API Status Mobile */}
          <div className="mt-3 px-3">
            <ApiStatusIndicator />
          </div>
        </div>
      </div>
    </div>
  )}
</nav>

      {/* Main Content Area */}
      <main className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div className={`p-2 rounded-lg sm:rounded-xl ${
                  active === 'dashboard' ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700' :
                  active === 'lantai' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700' :
                  active === 'manajemen' ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700' :
                  active === 'history' ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700' :
                  active === 'admin' ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700' :
                  'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700'
                }`}>
                  {menuItems.find(item => item.id === active)?.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">
                    {menuItems.find(item => item.id === active)?.name || 'Dashboard'}
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm truncate">
                    {active === 'dashboard' && 'Overview sistem dan monitoring real-time'}
                    {active === 'lantai' && 'Sistem denah digital terintegrasi'}
                    {active === 'manajemen' && 'Kelola data ruangan secara lengkap'}
                    {active === 'history' && 'Riwayat pengecekan alat proteksi kebakaran'}
                    {active === 'admin' && 'Manajemen pengguna dan hak akses sistem'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {active === "manajemen" && (
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 font-medium text-xs sm:text-sm"
                  title="Export data ke JSON"
                >
                  <Download size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Export Data</span>
                  <span className="sm:hidden">Export</span>
                </button>
              )}
              
              {active === "admin" && checkAdminAccess() && (
                <button
                  onClick={() => {
                    setUserModalMode('create');
                    setEditingUser(null);
                    setShowUserModal(true);
                  }}
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

        {/* Content Section */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Dashboard */}
          {active === "dashboard" && (
            <div className="p-3 sm:p-4 md:p-6">
              {/* Welcome Card */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold">
                        Selamat datang, {user?.username || 'User'}!
                      </h3>
                      <RoleBadge role={getUserRoleFromAuth()} />
                    </div>
                    <p className="text-blue-100 text-sm">
                      Anda login sebagai <span className="font-semibold">{getUserRoleFromAuth()}</span> 
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                      <p className="text-xs text-blue-100">Terakhir login</p>
                      <p className="text-sm font-semibold">{new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className={`mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl ${
                apiStatus === 'online' ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200' :
                apiStatus === 'offline' ? 'bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200' :
                'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">
                      {apiStatus === 'online' ? '✅ Sistem Berjalan Normal' :
                       apiStatus === 'offline' ? '⚠️ Sistem Sedang Offline' :
                       '🔄 Memeriksa Status Sistem...'}
                    </h3>
                    <p className="text-slate-700 text-xs sm:text-sm">
                      {apiStatus === 'online' 
                        ? 'Semua layanan berfungsi dengan baik. Sistem akan terus memantau koneksi ke server.'
                        : apiStatus === 'offline'
                        ? 'Beberapa fitur mungkin terbatas. Periksa koneksi internet atau server.'
                        : 'Sedang memeriksa status sistem...'}
                    </p>
                  </div>
                  <button
                    onClick={() => checkApiStatus()}
                    className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all font-medium text-slate-700 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mt-3 md:mt-0"
                  >
                    <RefreshCwIcon size={14} className="sm:w-4 sm:h-4" />
                    Refresh Status
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                  <StatCard
                    title="Total Ruangan"
                    value={stats.total_ruangan || 0}
                    icon={<Building size={18} className="sm:w-5 sm:h-5" />}
                    color="blue"
                    trend="+12%"
                  />
                  <StatCard
                    title="Jumlah Gedung"
                    value={stats.gedung_count || 0}
                    icon={<Home size={18} className="sm:w-5 sm:h-5" />}
                    color="emerald"
                    trend="+5%"
                  />
                  <StatCard
                    title="Fakultas"
                    value={Object.keys(stats.fakultas_distribution || {}).length || 0}
                    icon={<BarChart3 size={18} className="sm:w-5 sm:h-5" />}
                    color="amber"
                  />
                  <StatCard
                    title="Data Aktif"
                    value={stats.active_data || "100%"}
                    icon={<CheckCircle size={18} className="sm:w-5 sm:h-5" />}
                    color="purple"
                  />
                </div>
              )}

              {/* Information Panel */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                    <FileText size={18} className="text-white sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">Tentang Sistem</h4>
                    <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                      Sistem Denah Digital Gedung Dekanat merupakan platform terintegrasi untuk 
                      manajemen data ruangan secara real-time. Dengan teknologi modern, sistem ini 
                      memungkinkan pengelolaan data yang efisien dan pengambilan keputusan yang lebih baik.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs sm:text-sm text-slate-700">Data tersimpan di database MySQL</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs sm:text-sm text-slate-700">Update real-time melalui API</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs sm:text-sm text-slate-700">Ekspor data dalam format JSON</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History */}
          {active === "history" && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
                <div className="mb-3 sm:mb-0">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">History Pengecekan Alat Proteksi</h3>
                  <p className="text-slate-600 text-xs sm:text-sm">Riwayat lengkap pengecekan dan pemeliharaan alat proteksi kebakaran</p>
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl">
                  <span className="text-xs sm:text-sm font-medium text-blue-700">
                    Total: <span className="font-bold">{8}</span> record
                  </span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          History ID
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Alat Proteksi
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Tanggal
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Expired
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[...Array(8)].map((_, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                                index === 5 ? 'bg-rose-100 text-rose-700' :
                                index === 1 || index === 7 ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                <span className="text-xs font-bold">H{index + 1}</span>
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-900">
                                HR{String(index + 1).padStart(3, '0')}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className="text-xs sm:text-sm font-medium text-slate-900">
                              {[
                                "APAR Tipe ABC 6kg",
                                "APAR Tipe CO2 9kg",
                                "APAR Tipe ABC 12kg",
                                "Hydrant Box",
                                "APAR Tipe ABC 6kg",
                                "APAR Tipe Foam 9kg",
                                "Fire Blanket",
                                "APAR Tipe ABC 3kg"
                              ][index]}
                            </p>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className="text-xs sm:text-sm text-slate-900">
                              {[
                                "15-06-2024",
                                "20-05-2024",
                                "10-09-2024",
                                "05-06-2024",
                                "28-08-2024",
                                "15-03-2024",
                                "01-10-2024",
                                "30-07-2024"
                              ][index]}
                            </p>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold ${
                              index === 5 ? 'bg-rose-100 text-rose-800' :
                              index === 1 || index === 7 ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {index === 5 ? 'Expired' : 
                               index === 1 || index === 7 ? 'Rendah' : 
                               'Normal'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className={`text-xs sm:text-sm ${
                              index === 5 ? 'text-rose-600 font-medium' : 'text-slate-900'
                            }`}>
                              {[
                                "15-01-2025",
                                "20-11-2024",
                                "10-03-2025",
                                "05-12-2024",
                                "28-02-2025",
                                "15-09-2024",
                                "01-04-2026",
                                "30-01-2025"
                              ][index]}
                            </p>
                          </td>
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <p className="text-xs sm:text-sm text-slate-700 max-w-xs truncate">
                              {[
                                "Kondisi baik, segel utuh",
                                "Perlu isi ulang tekanan",
                                "Pemeriksaan rutin, kondisi prima",
                                "Siap pakai, selang lengkap",
                                "Pemeriksaan rutin",
                                "Sudah expired, perlu penggantian",
                                "Kondisi baru, belum pernah digunakan",
                                "Tekanan di bawah standar"
                              ][index]}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg sm:rounded-xl flex-shrink-0">
                    <AlertCircle size={16} className="text-blue-600 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1.5 text-sm sm:text-base">Informasi Status</h4>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400"></div>
                        <span className="text-xs sm:text-sm text-slate-700">Normal/Baik</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-400"></div>
                        <span className="text-xs sm:text-sm text-slate-700">Rendah</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-rose-400"></div>
                        <span className="text-xs sm:text-sm text-slate-700">Expired</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Peta Interaktif */}
          {active === "lantai" && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-1">🗺️ Eksplorasi Denah Kampus Interaktif</h3>
                <p className="text-slate-600 text-xs sm:text-sm">Gunakan peta interaktif untuk mengeksplorasi denah gedung, klik ruangan untuk melihat detail informasi</p>
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
                      <div className="inline-flex items-center justify-center mb-3 sm:mb-6">
                        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600"></div>
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-1.5">Memuat Peta Denah</h4>
                      <p className="text-slate-600 text-xs sm:text-sm">Harap tunggu sebentar...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 sm:mt-6">
                <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Pilih Gedung</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
                  {buildings.map((building) => (
                    <button
                      key={building.name}
                      onClick={() => setSelectedBuilding(building.name)} 
                      className={`group relative overflow-hidden bg-gradient-to-br text-left p-3 sm:p-4 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
                        selectedBuilding === building.name 
                          ? 'from-blue-50 to-blue-100 border border-blue-500 shadow-lg' 
                          : 'from-white to-slate-50 border border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0">
                          <div className={`text-sm sm:text-base font-bold truncate ${
                            selectedBuilding === building.name ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-700'
                          }`}>
                            {building.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate">{building.code}</div>
                        </div>
                        <div className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ml-2 ${
                          selectedBuilding === building.name 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                        }`}>
                          {building.totalFloors}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs sm:text-sm text-slate-600 mt-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        <span>{building.totalRooms} Ruangan</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {selectedBuilding && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
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
                          href={`/lantai/${floor.replace(' ', '-').toLowerCase()}`}
                          className="group relative overflow-hidden bg-gradient-to-b from-white to-slate-50 border border-slate-200 text-center p-2 sm:p-3 rounded-lg hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 hover:translate-y-[-2px] transition-all duration-200"
                        >
                          <div className="relative z-10">
                            <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 mb-0.5">
                              {floor.includes('B') ? `B${floor.slice(1)}` : floor === 'Atap' ? 'R' : floor}
                            </div>
                            <div className="text-xs text-slate-500 group-hover:text-blue-600 truncate">
                              {floor.includes('B') ? `B${floor.slice(1)}` : floor === 'Atap' ? 'Atap' : `Lt ${floor}`}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manajemen Data */}
          {active === "manajemen" && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="text"
                        placeholder="Cari ruangan, fakultas, kode..."
                        value={filterOptions.search}
                        onChange={(e) => {
                          handleFilterChange('search', e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder-slate-400 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-medium text-xs sm:text-sm"
                    >
                      <Filter size={14} className="sm:w-4 sm:h-4" />
                      <span>{showFilters ? 'Sembunyikan' : 'Filter'}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleApiOperation(fetchRoomsData);
                        setCurrentPage(1);
                      }}
                      disabled={isLoadingRooms}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
                    >
                      <Upload size={14} className="sm:w-4 sm:h-4" />
                      <span>{isLoadingRooms ? "Memuat..." : "Refresh"}</span>
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg sm:rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Gedung</label>
                        <select
                          value={filterOptions.gedung}
                          onChange={(e) => {
                            handleFilterChange('gedung', e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                        >
                          <option value="">Semua Gedung</option>
                          {gedungOptions.map((gedung) => (
                            <option key={gedung.value} value={gedung.value}>
                              {gedung.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Fakultas</label>
                        <select
                          value={filterOptions.fakultas}
                          onChange={(e) => {
                            handleFilterChange('fakultas', e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                        >
                          <option value="">Semua Fakultas</option>
                          {fakultasOptions.map((fakultas) => (
                            <option key={fakultas} value={fakultas}>
                              {fakultas}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Lantai</label>
                        <select
                          value={filterOptions.lantai}
                          onChange={(e) => {
                            handleFilterChange('lantai', e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
                        >
                          <option value="">Semua Lantai</option>
                          {currentLantaiOptions.map((lantai) => (
                            <option key={lantai.value} value={lantai.value}>
                              {lantai.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">Sub Unit</label>
                        <select
                          value={filterOptions.subUnit}
                          onChange={(e) => {
                            handleFilterChange('subUnit', e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700"
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
                    
                    {(filterOptions.search || filterOptions.gedung || filterOptions.fakultas || filterOptions.lantai || filterOptions.subUnit) && (
                      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="text-xs sm:text-sm text-slate-600 flex flex-wrap gap-1">
                          Filter aktif: 
                          {filterOptions.search && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                              Pencarian: "{filterOptions.search}"
                            </span>
                          )}
                          {filterOptions.gedung && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                              Gedung: {filterOptions.gedung}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            resetFilters();
                            setCurrentPage(1);
                          }}
                          className="px-3 py-1.5 text-xs sm:text-sm text-slate-700 hover:text-slate-900 font-medium"
                        >
                          Reset Semua Filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-slate-900">
                    Data Ruangan
                  </h4>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    Menampilkan <span className="font-bold text-blue-600">{filteredRooms.length}</span> dari <span className="font-bold">{roomsData.length}</span> ruangan
                  </p>
                </div>
                
                {filteredRooms.length > 0 && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden sm:block text-xs sm:text-sm text-slate-600">
                      Halaman {currentPage} dari {totalPages}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm text-slate-700">Baris:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {isLoadingRooms ? (
                <div className="py-8 sm:py-12 text-center">
                  <div className="inline-flex items-center justify-center mb-3">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
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
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              No
                            </th>
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Kode
                            </th>
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Ruangan
                            </th>
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Fakultas
                            </th>
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Lantai
                            </th>
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Gedung
                            </th>
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Ukuran
                            </th>
                            <th className="px-3 sm:px-4 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Aksi
                            </th>
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
                                  <span className="text-xs sm:text-sm font-medium text-slate-900">
                                    #{room.no}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                                      {room.ruangan}
                                    </p>
                                    {room.subUnit && (
                                      <p className="text-xs text-slate-500 truncate">
                                        {room.subUnit}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <p className="text-xs sm:text-sm text-slate-700 truncate">
                                    {room.fk}
                                  </p>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    room.lantai === 1 ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700' :
                                    room.lantai === 2 ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700' :
                                    room.lantai === 3 ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700' :
                                    'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700'
                                  }`}>
                                    Lt {room.lantai}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <p className="text-xs sm:text-sm text-slate-700 truncate">
                                    {room.gedung}
                                  </p>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <p className="text-xs sm:text-sm text-slate-700">
                                    {room.ukuranR ? (
                                      <span className="font-medium text-emerald-600">
                                        {room.ukuranR} m²
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </p>
                                </td>
                                <td className="px-3 sm:px-4 py-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setPopupRoomId(`room${room.no}`)}
                                      disabled={apiStatus === 'offline'}
                                      className="p-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all disabled:opacity-50"
                                      title="Edit data"
                                    >
                                      <Edit size={12} className="sm:w-4 sm:h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (room.id) {
                                          router.push(`/ruangan/${room.id}`);
                                        }
                                      }}
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
                                          if (result.success) {
                                            fetchRoomsData();
                                            alert('Data berhasil dihapus');
                                          }
                                        });
                                      }}
                                      disabled={apiStatus === 'offline'}
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
                                    {roomsData.length === 0 ? 'Belum ada data ruangan' : 'Data tidak ditemukan'}
                                  </h4>
                                  <p className="text-slate-600 mb-4 max-w-xs sm:max-w-md text-xs sm:text-sm text-center">
                                    {roomsData.length === 0 
                                      ? apiStatus === 'offline'
                                        ? "Tidak dapat memuat data karena API sedang offline."
                                        : "Klik ruangan pada peta untuk menambahkan data."
                                      : "Tidak ada data yang sesuai dengan filter pencarian."}
                                  </p>
                                  <div className="flex gap-2">
                                    {roomsData.length === 0 && apiStatus === 'offline' && (
                                      <button
                                        onClick={() => checkApiStatus()}
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-xs sm:text-sm"
                                      >
                                        Coba Koneksi Ulang
                                      </button>
                                    )}
                                    {(roomsData.length > 0 || filterOptions.search) && (
                                      <button
                                        onClick={() => {
                                          resetFilters();
                                          setCurrentPage(1);
                                        }}
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 rounded-lg sm:rounded-xl hover:from-slate-300 hover:to-slate-400 transition-all font-medium text-xs sm:text-sm"
                                      >
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

                  {filteredRooms.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="text-xs sm:text-sm text-slate-600">
                        Menampilkan {startIndex + 1} - {endIndex} dari {filteredRooms.length} data
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"
                          title="Halaman pertama"
                        >
                          <ChevronsLeft size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"
                          title="Sebelumnya"
                        >
                          <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        
                        <div className="flex items-center gap-0.5 mx-1">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/25'
                                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          {totalPages > 5 && (
                            <span className="px-1 text-slate-500">...</span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"
                          title="Selanjutnya"
                        >
                          <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="p-1.5 sm:p-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"
                          title="Halaman terakhir"
                        >
                          <ChevronsRight size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Admin Panel - Hanya untuk admin */}
          {active === "admin" && checkAdminAccess() && (
            <div className="p-3 sm:p-4 md:p-6">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-red-700 flex items-center gap-2">
                        <Shield className="text-red-500" size={24} />
                        Admin Panel
                      </h3>
                      <p className="text-slate-600 mt-1">
                        Kelola pengguna dan pantau aktivitas sistem
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowAdminTableMenu(!showAdminTableMenu)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all duration-200"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {adminTable === 'users' && '👥 List User'}
                          {adminTable === 'activities' && '📊 Activity User'}
                          {adminTable === 'logins' && '🔐 Activity Login'}
                        </span>
                        <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showAdminTableMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showAdminTableMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <button
                            onClick={() => {
                              setAdminTable('users');
                              setShowAdminTableMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all duration-150 flex items-center gap-3 ${
                              adminTable === 'users' ? 'bg-red-50 text-red-700' : 'text-slate-700'
                            }`}
                          >
                            <span className="text-lg">👥</span>
                            <span className="flex-1">List User</span>
                          </button>
                          <button
                            onClick={() => {
                              setAdminTable('activities');
                              setShowAdminTableMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all duration-150 flex items-center gap-3 ${
                              adminTable === 'activities' ? 'bg-red-50 text-red-700' : 'text-slate-700'
                            }`}
                          >
                            <span className="text-lg">📊</span>
                            <span className="flex-1">Activity User</span>
                          </button>
                          <button
                            onClick={() => {
                              setAdminTable('logins');
                              setShowAdminTableMenu(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-all duration-150 flex items-center gap-3 ${
                              adminTable === 'logins' ? 'bg-red-50 text-red-700' : 'text-slate-700'
                            }`}
                          >
                            <span className="text-lg">🔐</span>
                            <span className="flex-1">Activity Login</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-96">
                    <input
                      type="text"
                      placeholder={`Cari ${
                        adminTable === 'users' ? 'nama, username, atau role...' :
                        adminTable === 'activities' ? 'nama, username, atau aktivitas...' :
                        'username, IP, atau agent...'
                      }`}
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 text-sm"
                    />
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Baris:</span>
                    <select
                      value={adminPerPage}
                      onChange={(e) => setAdminPerPage(Number(e.target.value))}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 bg-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* LIST USER TABLE */}
                {adminTable === 'users' && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dibuat</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sortedUsers.map((user, index) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors duration-150 group">
                              <td className="px-4 py-3 text-sm">
                                <span className="text-slate-900">{index + 1}</span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-red-700">USR</span>
                                  </div>
                                  <span className="font-mono text-slate-900">{String(user.id).padStart(3, '0')}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{user.username}</td>
                              <td className="px-4 py-3">
                                <RoleBadge role={user.role} />
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{user.createdAt}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={() => {
                                      setUserModalMode('edit');
                                      setEditingUser(user);
                                      setShowUserModal(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                                    title="Edit user"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleUserDelete(user.id, user.name)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
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
                {adminTable === 'activities' && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Pengguna</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aktivitas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Waktu Kejadian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activities.filter(activity => 
                            activity.userName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            activity.username.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            activity.activity.toLowerCase().includes(adminSearchQuery.toLowerCase())
                          ).map((activity, index) => (
                            <tr key={activity.id} className="hover:bg-slate-50 transition-colors duration-150">
                              <td className="px-4 py-3 text-sm">
                                <span className="text-slate-900">{index + 1}</span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-purple-700">UID</span>
                                  </div>
                                  <span className="font-mono text-slate-900">{String(activity.userId).padStart(3, '0')}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{activity.userName}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{activity.username}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  activity.activity.includes('tambah') ? 'bg-emerald-100 text-emerald-700' :
                                  activity.activity.includes('hapus') ? 'bg-rose-100 text-rose-700' :
                                  activity.activity.includes('ubah') ? 'bg-amber-100 text-amber-700' :
                                  'bg-blue-100 text-blue-700'
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

                {/* ACTIVITY LOGIN TABLE */}
                {adminTable === 'logins' && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID Users</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP Address</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aktivitas</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Agent User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Terakhir Login</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {loginActivities.filter(login => 
                            login.username.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                            login.ipAddress.includes(adminSearchQuery) ||
                            login.userAgent.toLowerCase().includes(adminSearchQuery.toLowerCase())
                          ).map((login, index) => (
                            <tr key={login.id} className="hover:bg-slate-50 transition-colors duration-150">
                              <td className="px-4 py-3 text-sm">
                                <span className="text-slate-900">{index + 1}</span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-indigo-700">UID</span>
                                  </div>
                                  <span className="font-mono text-slate-900">{String(login.userId).padStart(3, '0')}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-mono text-slate-600">{login.ipAddress}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{login.username}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  login.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {login.status === 'success' ? 'Login Berhasil' : 'Login Gagal'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-slate-600">{login.userAgent}</span>
                              </td>
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

                {/* Simple Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Halaman {adminCurrentPage} dari 8
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAdminCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={adminCurrentPage === 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((page) => (
                        <button
                          key={page}
                          onClick={() => setAdminCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm transition-all duration-200 ${
                            page === adminCurrentPage ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <span className="px-2 text-slate-400">...</span>
                      <button 
                        onClick={() => setAdminCurrentPage(8)}
                        className={`w-8 h-8 rounded-lg text-sm transition-all duration-200 ${
                          8 === adminCurrentPage ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        8
                      </button>
                    </div>
                    <button 
                      onClick={() => setAdminCurrentPage(prev => Math.min(prev + 1, 8))}
                      disabled={adminCurrentPage === 8}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Info Panel - Hak Akses */}
                <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                      <Shield size={20} className="text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Informasi Hak Akses:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          <span className="text-slate-700"><span className="font-semibold">Admin</span>: Dapat mengelola user dan data</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-slate-700"><span className="font-semibold">Viewer</span>: Hanya dapat melihat data ruangan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modern Footer */}
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
              <p className="text-xs text-slate-600">
                © {new Date().getFullYear()} UNISBA - Yayasan
              </p>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-xs sm:text-sm text-slate-600">
                Jl. Tamansari No. 24-26 Bandung
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Login sebagai: {user?.username || 'User'} ({getUserRoleFromAuth()})
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Room Popup */}
      {popupRoomId && (
        <RoomPopup 
          roomId={popupRoomId} 
          onClose={closePopup}
        />
      )}

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          mode={userModalMode}
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={handleUserSave}
        />
      )}
    </div>
  );
}