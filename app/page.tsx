"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Home, Building, Settings, Menu, X, Save, Upload, Download, Search, Filter, AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService, RoomData, MasterData } from "@/services/api";

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

  // Filter sub units based on selected faculty
  useEffect(() => {
    if (masterData && formData.fk) {
      const subs = masterData.subUnits[formData.fk] || [];
      setFilteredSubUnits(subs);
      
      // Reset subUnit if not in filtered list
      if (formData.subUnit && !subs.some(sub => sub.value === formData.subUnit)) {
        setFormData(prev => ({ ...prev, subUnit: "" }));
      }
    } else {
      setFilteredSubUnits([]);
    }
  }, [formData.fk, masterData]);

  // Cek data dari API saat roomId berubah
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      setIsLoading(true);
      try {
        // Coba cari berdasarkan nomor ruangan
        const no = parseInt(roomId.replace(/\D/g, ''));
        if (!isNaN(no)) {
          const result = await apiService.getFakultasEkonomiByNo(no);
          
          if (result.success && result.data) {
            // Data ditemukan, mode edit
            setFormData({
              no: result.data.no,
              fk: result.data.fk,
              subUnit: result.data.subUnit || "",
              ruangan: result.data.ruangan,
              lantai: result.data.lantai,
              gedung: result.data.gedung,
              ukuranR: result.data.ukuranR,
              ket: result.data.ket || "",
            });
            setExistingId(result.data.id || null);
            setIsEditing(true);
          } else {
            // Data tidak ditemukan, mode buat baru
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
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subUnit: "" // Reset subUnit saat ganti fakultas
      }));
    } else if (name === "no" || name === "lantai" || name === "ukuranR") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    // Validasi
    if (!formData.no || !formData.fk || !formData.ruangan || !formData.gedung) {
      alert("Harap isi semua field yang wajib!");
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing && existingId) {
        // Update existing data
        const result = await apiService.updateFakultasEkonomi(existingId, formData);
        if (result.success) {
          alert("Data berhasil diperbarui!");
          onClose();
        } else {
          alert(`Gagal memperbarui data: ${result.error}`);
        }
      } else {
        // Create new data
        const result = await apiService.createFakultasEkonomi(formData);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
        className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full relative border-t-4 border-blue-600"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 p-1 rounded-full transition-colors"
          aria-label="Tutup"
        >
          <X size={24} />
        </button>
        
        <h3 className="text-xl font-bold mb-6 text-blue-700">
          {isEditing ? "✏️ Edit Data Ruangan" : "➕ Tambah Data Ruangan"}
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Kode Ruangan <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="no"
                value={formData.no}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
                disabled={isEditing}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Fakultas <span className="text-red-500">*</span>
              </label>
              <select
                name="fk"
                value={formData.fk}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Pilih Fakultas</option>
                {masterData?.fakultas.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Sub Unit
                {formData.fk && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({filteredSubUnits.length} opsi)
                  </span>
                )}
              </label>
              <select
                name="subUnit"
                value={formData.subUnit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={!formData.fk}
              >
                <option value="">
                  {!formData.fk ? "Pilih fakultas dulu" : "Pilih Sub Unit"}
                </option>
                {filteredSubUnits.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Nama Ruangan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ruangan"
                value={formData.ruangan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Lantai
                </label>
                <input
                  type="number"
                  name="lantai"
                  value={formData.lantai}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Ukuran (m²)
                </label>
                <input
                  type="number"
                  name="ukuranR"
                  value={formData.ukuranR || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Gedung <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="gedung"
                value={formData.gedung}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Keterangan
              </label>
              <textarea
                name="ket"
                value={formData.ket || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={20} />
                {isLoading ? "Menyimpan..." : (isEditing ? "Update" : "Simpan")}
              </button>
              
              {isEditing && (
                <>
                  <button
                    onClick={handleViewDetail}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300"
                  >
                    Lihat Detail
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition duration-300 disabled:opacity-50"
                  >
                    Hapus
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="text-xs text-center text-gray-500 mt-4 space-y-1">
          <p>ID Ruangan: <code className="bg-gray-100 px-2 py-1 rounded">{roomId}</code></p>
        </div>
      </div>
    </div>
  );
};

// --- Komponen InteractiveMap FIXED ---
const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  svgContent, 
  onRoomClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventListenersRef = useRef<Map<Element, () => void>>(new Map());

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (!containerRef.current || !svgContent) return;

    const container = containerRef.current;
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Cleanup existing listeners
    eventListenersRef.current.forEach((cleanup) => cleanup());
    eventListenersRef.current.clear();

    // Find all interactive elements
    const interactiveElements = svgElement.querySelectorAll('[id]');
    
    interactiveElements.forEach((element) => {
      const id = element.getAttribute('id');
      if (!id || id === 'svg-map-container') return;

      const handleClick = () => {
        console.log('Room clicked:', id);
        onRoomClick(id);
      };

      const handleMouseEnter = () => {
        if (element instanceof SVGElement) {
          element.style.transition = 'fill 0.3s ease';
          element.style.fill = '#90CDF4';
          element.style.cursor = 'pointer';
        }
      };

      const handleMouseLeave = () => {
        if (element instanceof SVGElement) {
          element.style.fill = '';
          element.style.cursor = '';
        }
      };

      // Add event listeners
      element.addEventListener('click', handleClick);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      // Store cleanup function
      const cleanup = () => {
        element.removeEventListener('click', handleClick);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      };

      eventListenersRef.current.set(element, cleanup);
    });

    // Return cleanup function
    return () => {
      eventListenersRef.current.forEach((cleanup) => cleanup());
      eventListenersRef.current.clear();
    };
  }, [svgContent, onRoomClick]);

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
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 w-full bg-white shadow-lg border-b border-gray-100">
        <div className="flex items-center justify-between p-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-left flex flex-col">
            <h1 className="text-xl sm:text-2xl font-extrabold text-blue-700">
              Gedung Dekanat - Sistem Denah Digital
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Terintegrasi dengan API Database
            </p>
          </div>

          <button
            className="sm:hidden text-gray-700 hover:text-blue-700 p-2 rounded-full"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu size={24} />
          </button>

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
                      </div>
                    </div>
                  )}
                </div>

                {/* Daftar Lantai */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-3 text-gray-700">Pilih Lantai Lain:</h4>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                    {lantai.map((n) => (
                      <Link
                        key={n}
                        href={`/lantai/${n}`}
                        className="bg-gray-100 border border-gray-300 text-center py-2 rounded transition hover:bg-blue-100 text-blue-700 text-sm font-medium shadow-sm"
                      >
                        Lantai {n}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                </div>

                {isLoadingRooms ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data dari API...</p>
                  </div>
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

      {/* Popup */}
      {popupRoomId && (
        <RoomPopup 
          roomId={popupRoomId} 
          onClose={closePopup}
        />
      )}
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