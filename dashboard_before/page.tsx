"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { 
  Home, Building, Settings, Menu, X, Save, Upload, Download, 
  Search, Filter, AlertCircle, CheckCircle, Clock, LogOut, 
  Users, Map as MapIcon, Database, BarChart, RefreshCw, Trash2, AlertTriangle,
  Flame, Shield
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService, RoomData, MasterData, DuplicateCheckResult } from "@/services/api";

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
  // Tambahan untuk fakultas lain
  kapasitas?: number;
  status?: string;
  peralatan?: string;
  catatan?: string;
  luas?: number;
  jenis_lab?: string;
  peralatan_utama?: string;
  kapasitas_mahasiswa?: number;
  asisten_lab?: string;
  tipe_ruangan?: string;
  kapasitas_duduk?: number;
  fasilitas?: string;
  akses_internet?: boolean;
  kondisi?: string;
  tipe?: string;
  peralatan_audio?: string;
  peralatan_video?: string;
  kapasitas_produksi?: number;
  jadwal_maintenance?: string;
  tipe_pembelajaran?: string;
  kapasitas_kelas?: number;
  media_pembelajaran?: string;
  laboratorium_pendukung?: string;
  khusus_disabilitas?: boolean;
}

// Tipe Data untuk Hydrant/APAR
interface HydrantData {
  id: number;
  proteksi: string;
  tanggalPengisian: string;
  tanggalPengecekan: string;
  kapasitas: number;
  tekanan: number;
  expired: string;
  history_record?: string;
  keterangan?: string;
  lokasi?: string;
  kondisi: 'baik' | 'perlu_perbaikan' | 'rusak' | 'kadaluarsa';
  warna: string;
}

interface RoomPopupProps {
  roomId: string | null;
  onClose: () => void;
  roomData?: RoomData;
}

interface HydrantPopupProps {
  hydrantId: string | null;
  onClose: () => void;
  hydrantData?: HydrantData;
}

interface InteractiveMapProps {
  svgContent: string;
  onRoomClick: (roomId: string) => void;
  onHydrantClick: (hydrantId: string) => void;
}

// --- Tipe untuk Filter ---
interface FilterOptions {
  search: string;
  gedung: string;
  fakultas: string;
  lantai: string;
  subUnit: string;
  fakultasType: string;
  showDuplicatesOnly: boolean;
}

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
      
      const result = await apiService.testConnection();
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

  // Format waktu terakhir pengecekan
  const getLastCheckedText = useCallback(() => {
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
  }, [lastChecked]);

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
          text: 'API Online',
          iconComponent: <CheckCircle size={14} className="text-green-600" />
        };
      case 'offline':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          text: 'API Offline',
          iconComponent: <AlertCircle size={14} className="text-red-600" />
        };
      case 'checking':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          border: 'border-yellow-200',
          text: 'Checking...',
          iconComponent: <Clock size={14} className="text-yellow-600" />
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          text: 'Unknown',
          iconComponent: <AlertCircle size={14} className="text-gray-600" />
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="relative">
      <button
        onClick={() => checkApiStatus()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border} transition-all duration-300 hover:shadow-sm active:scale-95 min-w-[120px] justify-center`}
        aria-label={`API Status: ${apiStatus}`}
      >
        <div className="flex items-center gap-2">
          {statusConfig.iconComponent}
          <div className="flex flex-col items-start">
            <span className={`text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.text}
            </span>
            {responseTime && apiStatus === 'online' && (
              <span className="text-[10px] text-gray-500">
                {responseTime}ms
              </span>
            )}
          </div>
        </div>
      </button>
      
      {/* Tooltip dengan info detail */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-64">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-gray-700">
            <div className="font-medium mb-1">Status Sistem</div>
            <div className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">Status API:</span>
                <span className={`font-bold ${statusConfig.color}`}>
                  {statusConfig.text}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">Terakhir diperiksa:</span>
                <span>{getLastCheckedText()}</span>
              </div>
              {responseTime && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-300">Response time:</span>
                  <span className={responseTime > 1000 ? 'text-yellow-400' : 'text-green-400'}>
                    {responseTime} ms
                  </span>
                </div>
              )}
              <div className="text-gray-400 text-[10px] mt-2 pt-1 border-t border-gray-700 text-center">
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

// --- Komponen RoomPopup ---
const RoomPopup: React.FC<RoomPopupProps> = ({ roomId, onClose, roomData }) => {
  const [selectedFakultasType, setSelectedFakultasType] = useState<string>('ekonomi');
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
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<DuplicateCheckResult | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Map fakultas type ke nama lengkap
  const fakultasTypeNames: Record<string, string> = {
    'ekonomi': 'Fakultas Ekonomi dan Bisnis',
    'syariah': 'Fakultas Syariah',
    'teknik': 'Fakultas Teknik',
    'hukum': 'Fakultas Hukum',
    'fikom': 'Fakultas Ilmu Komunikasi',
    'tarbiyah': 'Fakultas Tarbiyah dan Keguruan'
  };

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
      
      if (formData.subUnit && !subs.some(sub => sub.value === formData.subUnit)) {
        setFormData(prev => ({ ...prev, subUnit: "" }));
      }
    } else {
      setFilteredSubUnits([]);
    }
  }, [formData.fk, masterData]);

  // Cek data dari API saat roomId berubah atau roomData prop
  useEffect(() => {
    if (!roomId && !roomData) return;

    const fetchRoomData = async () => {
      setIsLoading(true);
      try {
        if (roomData) {
          // Mode edit dari prop
          setSelectedFakultasType(roomData.fakultas_type || 'ekonomi');
          setFormData({
            no: roomData.no,
            fk: roomData.fk,
            subUnit: roomData.subUnit || "",
            ruangan: roomData.ruangan,
            lantai: roomData.lantai,
            gedung: roomData.gedung,
            ukuranR: roomData.ukuranR,
            ket: roomData.ket || "",
            // Add other fields
            kapasitas: roomData.kapasitas,
            status: roomData.status,
            peralatan: roomData.peralatan,
            catatan: roomData.catatan,
            luas: roomData.luas,
            jenis_lab: roomData.jenis_lab,
            peralatan_utama: roomData.peralatan_utama,
            kapasitas_mahasiswa: roomData.kapasitas_mahasiswa,
            asisten_lab: roomData.asisten_lab,
            tipe_ruangan: roomData.tipe_ruangan,
            kapasitas_duduk: roomData.kapasitas_duduk,
            fasilitas: roomData.fasilitas,
            akses_internet: roomData.akses_internet,
            kondisi: roomData.kondisi,
            tipe: roomData.tipe,
            peralatan_audio: roomData.peralatan_audio,
            peralatan_video: roomData.peralatan_video,
            kapasitas_produksi: roomData.kapasitas_produksi,
            jadwal_maintenance: roomData.jadwal_maintenance,
            tipe_pembelajaran: roomData.tipe_pembelajaran,
            kapasitas_kelas: roomData.kapasitas_kelas,
            media_pembelajaran: roomData.media_pembelajaran,
            laboratorium_pendukung: roomData.laboratorium_pendukung,
            khusus_disabilitas: roomData.khusus_disabilitas,
          });
          setExistingId(roomData.id || null);
          setIsEditing(true);
        } else if (roomId) {
          // Mode dari klik denah - cari data existing
          const no = parseInt(roomId.replace(/\D/g, ''));
          if (!isNaN(no)) {
            // Cari di semua fakultas
            const allResult = await apiService.getAllRooms();
            if (allResult.success && allResult.data) {
              const existingRoom = allResult.data.find(room => room.no === no);
              if (existingRoom) {
                setSelectedFakultasType(existingRoom.fakultas_type || 'ekonomi');
                setFormData({
                  no: existingRoom.no,
                  fk: existingRoom.fk,
                  subUnit: existingRoom.subUnit || "",
                  ruangan: existingRoom.ruangan,
                  lantai: existingRoom.lantai,
                  gedung: existingRoom.gedung,
                  ukuranR: existingRoom.ukuranR,
                  ket: existingRoom.ket || "",
                  kapasitas: existingRoom.kapasitas,
                  status: existingRoom.status,
                  peralatan: existingRoom.peralatan,
                  catatan: existingRoom.catatan,
                  luas: existingRoom.luas,
                  jenis_lab: existingRoom.jenis_lab,
                  peralatan_utama: existingRoom.peralatan_utama,
                  kapasitas_mahasiswa: existingRoom.kapasitas_mahasiswa,
                  asisten_lab: existingRoom.asisten_lab,
                  tipe_ruangan: existingRoom.tipe_ruangan,
                  kapasitas_duduk: existingRoom.kapasitas_duduk,
                  fasilitas: existingRoom.fasilitas,
                  akses_internet: existingRoom.akses_internet,
                  kondisi: existingRoom.kondisi,
                  tipe: existingRoom.tipe,
                  peralatan_audio: existingRoom.peralatan_audio,
                  peralatan_video: existingRoom.peralatan_video,
                  kapasitas_produksi: existingRoom.kapasitas_produksi,
                  jadwal_maintenance: existingRoom.jadwal_maintenance,
                  tipe_pembelajaran: existingRoom.tipe_pembelajaran,
                  kapasitas_kelas: existingRoom.kapasitas_kelas,
                  media_pembelajaran: existingRoom.media_pembelajaran,
                  laboratorium_pendukung: existingRoom.laboratorium_pendukung,
                  khusus_disabilitas: existingRoom.khusus_disabilitas,
                });
                setExistingId(existingRoom.id || null);
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
          }
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, roomData]);

  // Fungsi untuk cek duplikat real-time
  const checkDuplicate = useCallback(async () => {
    if (!formData.no || !formData.gedung || !selectedFakultasType) {
      setDuplicateCheckResult(null);
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      const duplicateData = {
        no: formData.no,
        gedung: formData.gedung,
        lantai: formData.lantai,
        fakultas_type: selectedFakultasType,
        excludeId: existingId || undefined
      };

      const result = await apiService.checkDuplicate(selectedFakultasType, duplicateData);
      
      if (result.success && result.data) {
        setDuplicateCheckResult(result.data);
      } else {
        setDuplicateCheckResult(null);
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
      setDuplicateCheckResult(null);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, [formData.no, formData.gedung, formData.lantai, selectedFakultasType, existingId]);

  // Cek duplikat saat data berubah
  useEffect(() => {
    const timer = setTimeout(() => {
      checkDuplicate();
    }, 500);

    return () => clearTimeout(timer);
  }, [checkDuplicate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === "fk") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subUnit: "" // Reset subUnit saat ganti fakultas
      }));
    } else if (name === "no" || name === "lantai" || name === "ukuranR" || 
               name === "kapasitas" || name === "kapasitas_mahasiswa" || 
               name === "kapasitas_duduk" || name === "kapasitas_produksi" || 
               name === "kapasitas_kelas" || name === "luas") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    // Validasi required fields
    if (!formData.no || !formData.fk || !formData.ruangan || !formData.gedung) {
      alert("Harap isi semua field yang wajib!");
      return;
    }

    // Cek duplikat sebelum submit
    if (duplicateCheckResult?.isDuplicate) {
      const confirmDuplicate = window.confirm(
        `⚠️ PERINGATAN: Data duplikat terdeteksi!\n\n` +
        `Kode: ${formData.no}\n` +
        `Gedung: ${formData.gedung}\n` +
        `Lantai: ${formData.lantai}\n\n` +
        `Data yang sama sudah ada di:\n` +
        `• ${duplicateCheckResult.existingRoom?.ruangan || 'Unknown'}\n` +
        `• Fakultas: ${duplicateCheckResult.existingRoom?.fk || 'Unknown'}\n\n` +
        `Apakah Anda yakin ingin melanjutkan?`
      );
      
      if (!confirmDuplicate) {
        return;
      }
    }

    setIsLoading(true);
    
    try {
      if (isEditing && existingId) {
        // Update existing data
        const result = await apiService.updateRoom(selectedFakultasType, existingId, formData);
        if (result.success) {
          alert("Data berhasil diperbarui!");
          onClose();
        } else {
          alert(`Gagal memperbarui data: ${result.error}`);
        }
      } else {
        // Create new data
        const result = await apiService.createRoom(selectedFakultasType, formData);
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
      const result = await apiService.deleteRoom(selectedFakultasType, existingId);
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
      window.open(`/ruangan/${existingId}?type=${selectedFakultasType}`, '_blank');
    } else {
      alert("Simpan data terlebih dahulu untuk melihat detail");
    }
  };

  // Render form fields berdasarkan tipe fakultas
  const renderAdditionalFields = () => {
    switch (selectedFakultasType) {
      case 'syariah':
        return (
          <>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Kapasitas
              </label>
              <input
                type="number"
                name="kapasitas"
                value={formData.kapasitas || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Status
              </label>
              <select
                name="status"
                value={formData.status || 'tersedia'}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg"
              >
                <option value="tersedia">Tersedia</option>
                <option value="dipakai">Dipakai</option>
                <option value="perbaikan">Perbaikan</option>
              </select>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Peralatan
              </label>
              <textarea
                name="peralatan"
                value={formData.peralatan || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg"
              />
            </div>
          </>
        );

      case 'teknik':
        return (
          <>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Luas (m²)
              </label>
              <input
                type="number"
                step="0.1"
                name="luas"
                value={formData.luas || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Jenis Laboratorium
              </label>
              <input
                type="text"
                name="jenis_lab"
                value={formData.jenis_lab || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Kapasitas Mahasiswa
              </label>
              <input
                type="number"
                name="kapasitas_mahasiswa"
                value={formData.kapasitas_mahasiswa || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg"
              />
            </div>
          </>
        );

      // Add cases for other faculties...
      
      default:
        return null;
    }
  };

  if (!roomId && !roomData) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-4 relative border-t-4 border-blue-600 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-red-500 p-1 rounded-full transition-colors z-10"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Building size={20} className="text-blue-600" />
          {isEditing ? 'Edit Data Ruangan' : 'Tambah Data Ruangan'}
        </h2>

        {/* Duplicate Warning Banner */}
        {duplicateCheckResult?.isDuplicate && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-600 flex-shrink-0" size={16} />
              <span className="font-semibold text-red-700">⚠️ DATA DUPLIKAT TERDETEKSI</span>
            </div>
            <div className="text-sm text-red-600">
              <p className="mb-1">Data dengan kombinasi yang sama sudah ada:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Ruangan: {duplicateCheckResult.existingRoom?.ruangan}</li>
                <li>Fakultas: {duplicateCheckResult.existingRoom?.fk}</li>
                <li>Sub Unit: {duplicateCheckResult.existingRoom?.subUnit || '-'}</li>
              </ul>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Select Fakultas Type */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Bagian <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedFakultasType}
                onChange={(e) => setSelectedFakultasType(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isEditing}
              >
                <option value="ekonomi">Fakultas Ekonomi dan Bisnis</option>
                <option value="syariah">Fakultas Syariah</option>
                <option value="teknik">Fakultas Teknik</option>
                <option value="hukum">Fakultas Hukum</option>
                <option value="fikom">Fakultas Ilmu Komunikasi (FIKOM)</option>
                <option value="tarbiyah">Fakultas Tarbiyah dan Keguruan</option>
              </select>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Kode Ruangan <span className="text-red-500">*</span>
                {isCheckingDuplicate && (
                  <span className="ml-2 text-xs text-yellow-600">(Mengecek duplikat...)</span>
                )}
              </label>
              <input
                type="number"
                name="no"
                value={formData.no}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  duplicateCheckResult?.isDuplicate 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`}
                required
                disabled={isEditing}
              />
              {duplicateCheckResult?.isDuplicate && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Kode sudah digunakan di ruangan lain
                </p>
              )}
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Fakultas <span className="text-red-500">*</span>
              </label>
              <select
                name="fk"
                value={formData.fk}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                Sub Unit
                {formData.fk && (
                  <span className="text-xs text-gray-500">
                    ({filteredSubUnits.length} opsi)
                  </span>
                )}
              </label>
              <select
                name="subUnit"
                value={formData.subUnit}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
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
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Nama Ruangan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ruangan"
                value={formData.ruangan}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Lantai
                </label>
                <input
                  type="number"
                  name="lantai"
                  value={formData.lantai}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    duplicateCheckResult?.isDuplicate 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Gedung <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="gedung"
                  value={formData.gedung}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    duplicateCheckResult?.isDuplicate 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Common fields for all */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {selectedFakultasType === 'ekonomi' && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                    Ukuran (m²)
                  </label>
                  <input
                    type="number"
                    name="ukuranR"
                    value={formData.ukuranR || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              
              <div className={selectedFakultasType === 'ekonomi' ? '' : 'sm:col-span-2'}>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Keterangan
                </label>
                <textarea
                  name="ket"
                  value={formData.ket || ''}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Additional fields based on fakultas type */}
            {renderAdditionalFields()}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex-1 font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base ${
                  duplicateCheckResult?.isDuplicate
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Save size={18} />
                {isLoading ? "Menyimpan..." : (duplicateCheckResult?.isDuplicate ? "Simpan (Duplikat)" : (isEditing ? "Update" : "Simpan"))}
              </button>
              
              {isEditing && (
                <>
                  <button
                    onClick={handleViewDetail}
                    className="px-3 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition duration-300 text-sm sm:text-base whitespace-nowrap"
                  >
                    Lihat Detail
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-3 sm:px-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition duration-300 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                  >
                    Hapus
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="text-xs text-center text-gray-500 mt-4 space-y-1">
          <p>Tipe: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{fakultasTypeNames[selectedFakultasType]}</code></p>
          {(roomId || roomData?.no) && (
            <p>Kode: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{roomId || roomData?.no}</code></p>
          )}
          {duplicateCheckResult && (
            <p className="text-xs">
              Status Duplikat: 
              <span className={`ml-1 font-bold ${
                duplicateCheckResult.isDuplicate ? 'text-red-600' : 'text-green-600'
              }`}>
                {duplicateCheckResult.isDuplicate ? '⚠️ Terdeteksi' : '✅ Aman'}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Komponen HydrantPopup ---
const HydrantPopup: React.FC<HydrantPopupProps> = ({ hydrantId, onClose, hydrantData }) => {
  const [formData, setFormData] = useState<HydrantData>({
    id: hydrantId === '1013' ? 1013 : 0,
    proteksi: '',
    tanggalPengisian: '',
    tanggalPengecekan: '',
    kapasitas: 0,
    tekanan: 0,
    expired: '',
    history_record: '',
    keterangan: '',
    lokasi: '',
    kondisi: 'baik',
    warna: 'Merah'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Inisialisasi data saat komponen mount
  useEffect(() => {
    if (hydrantData) {
      setFormData(hydrantData);
      setIsEditing(true);
    } else if (hydrantId === '1013') {
      // Default data untuk hydrant ID 1013 (warna merah)
      setFormData({
        id: 1013,
        proteksi: 'APAR',
        tanggalPengisian: new Date().toISOString().split('T')[0],
        tanggalPengecekan: new Date().toISOString().split('T')[0],
        kapasitas: 6,
        tekanan: 15,
        expired: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        history_record: 'APAR warna merah - Standar gedung',
        keterangan: 'Lokasi: Lorong tengah lantai 3',
        lokasi: 'Lorong Tengah Lantai 3',
        kondisi: 'baik',
        warna: 'Merah'
      });
    }
  }, [hydrantId, hydrantData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'kapasitas' || name === 'tekanan') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    // Validasi required fields
    if (!formData.proteksi || !formData.tanggalPengisian || !formData.tanggalPengecekan || 
        !formData.kapasitas || !formData.tekanan || !formData.expired) {
      alert("Harap isi semua field yang wajib (bertanda *)!");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulasi API call - ganti dengan API service yang sesuai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isEditing) {
        alert("Data hydrant berhasil diperbarui!");
      } else {
        alert("Data hydrant berhasil disimpan!");
      }
      onClose();
    } catch (error) {
      console.error("Error saving hydrant data:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus data hydrant ini?")) return;

    setIsLoading(true);
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Data hydrant berhasil dihapus!");
      onClose();
    } catch (error) {
      console.error("Error deleting hydrant data:", error);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hydrantId) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-2 sm:mx-4 relative border-t-4 border-red-600 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-500 hover:text-red-500 p-1 rounded-full transition-colors z-10"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Flame size={20} className="text-red-600" />
          {isEditing ? 'Edit Data Hydrant/APAR' : 'Tambah Data Hydrant/APAR'}
          {hydrantId === '1013' && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
              ID: 1013
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">Memuat data...</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* ID (readonly untuk 1013) */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                ID Hydrant <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg bg-gray-50"
                readOnly={hydrantId === '1013'}
                disabled={hydrantId === '1013'}
              />
              {hydrantId === '1013' && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ ID 1013 adalah identifikasi khusus untuk hydrant warna merah
                </p>
              )}
            </div>

            {/* Proteksi */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Jenis Proteksi <span className="text-red-500">*</span>
              </label>
              <select
                name="proteksi"
                value={formData.proteksi}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="">Pilih Jenis Proteksi</option>
                <option value="APAR">APAR (Alat Pemadam Api Ringan)</option>
                <option value="HYDRANT">Hydrant</option>
                <option value="SPRINKLER">Sprinkler</option>
                <option value="FIRE_ALARM">Fire Alarm</option>
                <option value="FIRE_EXTINGUISHER">Fire Extinguisher</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Tanggal Pengisian */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Tanggal Pengisian <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalPengisian"
                  value={formData.tanggalPengisian}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              {/* Tanggal Pengecekan */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Tanggal Pengecekan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalPengecekan"
                  value={formData.tanggalPengecekan}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Kapasitas */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Kapasitas <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.01"
                    name="kapasitas"
                    value={formData.kapasitas}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <span className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 text-sm flex items-center">
                    Kg
                  </span>
                </div>
              </div>

              {/* Tekanan */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                  Tekanan <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="0.1"
                    name="tekanan"
                    value={formData.tekanan}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <span className="bg-gray-100 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 text-sm flex items-center">
                    Bar
                  </span>
                </div>
              </div>
            </div>

            {/* Expired */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Tanggal Expired <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expired"
                value={formData.expired}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            {/* Warna */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Warna
              </label>
              <div className="flex items-center gap-3">
                <select
                  name="warna"
                  value={formData.warna}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Merah">Merah</option>
                  <option value="Kuning">Kuning</option>
                  <option value="Hijau">Hijau</option>
                  <option value="Biru">Biru</option>
                </select>
                <div 
                  className="w-8 h-8 rounded-lg border border-gray-300"
                  style={{ backgroundColor: formData.warna === 'Merah' ? '#dc2626' : 
                           formData.warna === 'Kuning' ? '#fbbf24' : 
                           formData.warna === 'Hijau' ? '#10b981' : '#3b82f6' }}
                />
              </div>
            </div>

            {/* Kondisi */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Kondisi <span className="text-red-500">*</span>
              </label>
              <select
                name="kondisi"
                value={formData.kondisi}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="baik">Baik</option>
                <option value="perlu_perbaikan">Perlu Perbaikan</option>
                <option value="rusak">Rusak</option>
                <option value="kadaluarsa">Kadaluarsa</option>
              </select>
            </div>

            {/* Lokasi */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Lokasi
              </label>
              <input
                type="text"
                name="lokasi"
                value={formData.lokasi || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Contoh: Lorong Tengah Lantai 3"
              />
            </div>

            {/* History Record */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                History Record
              </label>
              <textarea
                name="history_record"
                value={formData.history_record || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                placeholder="Catatan riwayat perawatan, pengisian, atau pengecekan sebelumnya..."
              />
            </div>

            {/* Keterangan */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Keterangan
              </label>
              <textarea
                name="keterangan"
                value={formData.keterangan || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                placeholder="Keterangan tambahan..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white"
              >
                <Save size={18} />
                {isLoading ? "Menyimpan..." : (isEditing ? "Update" : "Simpan")}
              </button>
              
              {isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-3 sm:px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition duration-300 disabled:opacity-50 text-sm sm:text-base whitespace-nowrap"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="text-xs text-center text-gray-500 mt-4 space-y-1">
          <p>ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{formData.id}</code></p>
          <p>Status: <span className={`font-bold ${
            formData.kondisi === 'baik' ? 'text-green-600' :
            formData.kondisi === 'perlu_perbaikan' ? 'text-yellow-600' :
            formData.kondisi === 'rusak' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {formData.kondisi === 'baik' ? '✅ Baik' :
             formData.kondisi === 'perlu_perbaikan' ? '⚠️ Perlu Perbaikan' :
             formData.kondisi === 'rusak' ? '❌ Rusak' : '⏰ Kadaluarsa'}
          </span></p>
          {hydrantId === '1013' && (
            <p className="text-red-600 font-bold">⚠️ Hydrant warna merah - Prioritas utama</p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Komponen InteractiveMap ---
const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  svgContent, 
  onRoomClick,
  onHydrantClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (!containerRef.current || !svgContent) return;

    const container = containerRef.current;
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Cleanup existing listeners
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Find all interactive elements
    const interactiveElements = svgElement.querySelectorAll('[id]');
    
    const cleanupFunctions: (() => void)[] = [];

    interactiveElements.forEach((element) => {
      const id = element.getAttribute('id');
      if (!id || id === 'svg-map-container') return;

      const handleClick = () => {
        // Deteksi apakah ini hydrant (berdasarkan ID 1013) atau ruangan
        if (id === '1013' || id.includes('hydrant') || id.includes('apar')) {
          onHydrantClick(id);
        } else {
          onRoomClick(id);
        }
      };

      const handleMouseEnter = () => {
        if (element instanceof SVGElement) {
          element.style.transition = 'fill 0.3s ease';
          // Warna berbeda untuk hydrant vs ruangan
          if (id === '1013' || id.includes('hydrant') || id.includes('apar')) {
            element.style.fill = '#f87171'; // merah untuk hydrant
          } else {
            element.style.fill = '#90CDF4'; // biru untuk ruangan
          }
          element.style.cursor = 'pointer';
          element.style.stroke = '#000';
          element.style.strokeWidth = '2';
        }
      };

      const handleMouseLeave = () => {
        if (element instanceof SVGElement) {
          element.style.fill = '';
          element.style.cursor = '';
          element.style.stroke = '';
          element.style.strokeWidth = '';
        }
      };

      // Add event listeners
      element.addEventListener('click', handleClick);
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);

      // Store cleanup function
      cleanupFunctions.push(() => {
        element.removeEventListener('click', handleClick);
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
      });
    });

    // Store combined cleanup function
    cleanupRef.current = () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };

    // Return cleanup function
    return cleanupRef.current;
  }, [svgContent, onRoomClick, onHydrantClick]);

  // Setup listeners when SVG content changes
  useEffect(() => {
    const cleanup = setupEventListeners();
    return () => {
      if (cleanup) cleanup();
    };
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
      <div className="absolute top-4 left-4 bg-white/90 p-2 rounded text-xs text-gray-600 shadow-md border border-gray-200 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded"></div>
          <span>Klik ruangan untuk detail</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Klik hydrant merah untuk detail</span>
        </div>
        <div className="text-xs text-gray-500">Scroll untuk zoom</div>
      </div>
    </div>
  );
};

// --- Komponen Utama Dashboard ---
export default function DashboardWithMap() {
  const router = useRouter();
  const [active, setActive] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [svgContent, setSvgContent] = useState("");
  const [popupRoomId, setPopupRoomId] = useState<string | null>(null);
  const [popupHydrantId, setPopupHydrantId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [selectedHydrant, setSelectedHydrant] = useState<HydrantData | null>(null);
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [hydrantsData, setHydrantsData] = useState<HydrantData[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomData[]>([]);
  const [filteredHydrants, setFilteredHydrants] = useState<HydrantData[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingHydrants, setIsLoadingHydrants] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: "",
    gedung: "",
    fakultas: "",
    lantai: "",
    subUnit: "",
    fakultasType: "",
    showDuplicatesOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeDataTab, setActiveDataTab] = useState<'ruangan' | 'hydrant'>('ruangan');
  const { apiStatus, checkApiStatus } = useApiStatus();

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // --- END PAGINATION STATE ---

  // --- REF untuk menghindari circular dependencies ---
  const fetchRoomsDataRef = useRef<() => Promise<void>>();

  const lantai = [1, 2, 3, 4, 5, 6, 7, 8];

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, id: "dashboard" },
    { name: "Denah Interaktif", icon: <Building size={20} />, id: "lantai" },
    { name: "Manajemen Data", icon: <Database size={20} />, id: "manajemen" },
    { name: "Statistik", icon: <BarChart size={20}/>, id: "statistik"},
    { name: "History Hydrant", icon: <Clock size={20}/>, id: "history"},
    { name: "Logout", icon: <LogOut size={20}/>, id: "logout"},
  ];

  // Fakultas type options
  const fakultasTypeOptions = useMemo(() => [
    { value: '', label: 'Semua Fakultas' },
    { value: 'ekonomi', label: 'Fakultas Ekonomi' },
    { value: 'syariah', label: 'Fakultas Syariah' },
    { value: 'teknik', label: 'Fakultas Teknik' },
    { value: 'hukum', label: 'Fakultas Hukum' },
    { value: 'fikom', label: 'Fakultas FIKOM' },
    { value: 'tarbiyah', label: 'Fakultas Tarbiyah' }
  ], []);

  // Fakultas type names for display
  const fakultasTypeNames: Record<string, string> = useMemo(() => ({
    'ekonomi': 'Fakultas Ekonomi dan Bisnis',
    'syariah': 'Fakultas Syariah',
    'teknik': 'Fakultas Teknik',
    'hukum': 'Fakultas Hukum',
    'fikom': 'Fakultas Ilmu Komunikasi',
    'tarbiyah': 'Fakultas Tarbiyah dan Keguruan',
    'unknown': 'Tidak Diketahui'
  }), []);

  // --- FUNGSI DETEKSI DUPLIKAT ---
  const findDuplicateRooms = useMemo(() => {
    if (!roomsData.length) return [];

    const seen = new Map<string, RoomData[]>();
    const duplicates: RoomData[] = [];

    roomsData.forEach(room => {
      // Buat key unik berdasarkan kombinasi yang harus unik
      const key = `${room.no}-${room.gedung}-${room.lantai}-${room.fakultas_type || 'ekonomi'}`;
      
      if (!seen.has(key)) {
        seen.set(key, [room]);
      } else {
        const existing = seen.get(key)!;
        existing.push(room);
        duplicates.push(room); // Data ini adalah duplikat
      }
    });

    return duplicates;
  }, [roomsData]);

  const duplicateCount = findDuplicateRooms.length;

  // --- PAGINATION CALCULATIONS ---
  const currentData = activeDataTab === 'ruangan' ? filteredRooms : filteredHydrants;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, currentData.length);
  const totalPages = Math.max(1, Math.ceil(currentData.length / rowsPerPage));
  const paginatedData = currentData.slice(startIndex, endIndex);

  // Reset ke halaman 1 saat filter berubah atau tab berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions.search, filterOptions.gedung, filterOptions.fakultas, 
      filterOptions.lantai, filterOptions.subUnit, filterOptions.fakultasType,
      filterOptions.showDuplicatesOnly, activeDataTab]);
  // --- END PAGINATION CALCULATIONS ---

  // Fetch data ruangan dari SEMUA FAKULTAS dengan deduplikasi
  const fetchRoomsData = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const result = await apiService.getAllRooms();
      
      if (result.success && result.data) {
        // Fungsi untuk menghapus duplikat di client side sebagai fallback
        const removeDuplicates = (rooms: RoomData[]): RoomData[] => {
          const seen = new Set<string>();
          const uniqueRooms: RoomData[] = [];
          const duplicateLogs: string[] = [];
          
          rooms.forEach(room => {
            const key = `${room.no}-${room.gedung}-${room.lantai}-${room.fakultas_type || 'ekonomi'}`;
            
            if (!seen.has(key)) {
              seen.add(key);
              uniqueRooms.push(room);
            } else {
              duplicateLogs.push(`Duplikat: ${key} - ${room.ruangan}`);
            }
          });
          
          if (duplicateLogs.length > 0) {
            console.warn("Data duplikat ditemukan:", duplicateLogs);
          }
          
          return uniqueRooms;
        };

        const cleanedData = removeDuplicates(result.data);
        
        // Log jika ada perbedaan
        if (result.data.length !== cleanedData.length) {
          console.log(`Deduplikasi: ${result.data.length} → ${cleanedData.length} data (${result.data.length - cleanedData.length} duplikat dihapus)`);
        }
        
        setRoomsData(cleanedData);
        setFilteredRooms(cleanedData);
      } else {
        console.error('Failed to load rooms:', result.error);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // Fetch data hydrant
  const fetchHydrantsData = useCallback(async () => {
    setIsLoadingHydrants(true);
    try {
      // Simulasi API call - ganti dengan API service yang sesuai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Data dummy untuk hydrant
      const dummyHydrants: HydrantData[] = [
        {
          id: 1013,
          proteksi: 'APAR',
          tanggalPengisian: '2024-01-15',
          tanggalPengecekan: '2024-06-15',
          kapasitas: 6,
          tekanan: 15,
          expired: '2025-01-15',
          history_record: 'APAR warna merah - Standar gedung',
          keterangan: 'Lokasi: Lorong tengah lantai 3',
          lokasi: 'Lorong Tengah Lantai 3',
          kondisi: 'baik',
          warna: 'Merah'
        },
        {
          id: 1014,
          proteksi: 'Hydrant',
          tanggalPengisian: '2024-02-20',
          tanggalPengecekan: '2024-07-20',
          kapasitas: 50,
          tekanan: 10,
          expired: '2025-02-20',
          history_record: 'Hydrant utama gedung',
          keterangan: 'Lokasi: Dekat tangga darurat',
          lokasi: 'Dekat Tangga Darurat',
          kondisi: 'baik',
          warna: 'Merah'
        },
        {
          id: 1015,
          proteksi: 'APAR',
          tanggalPengisian: '2024-03-10',
          tanggalPengecekan: '2024-08-10',
          kapasitas: 4,
          tekanan: 12,
          expired: '2025-03-10',
          history_record: 'APAR warna kuning',
          keterangan: 'Lokasi: Ruang dosen',
          lokasi: 'Ruang Dosen',
          kondisi: 'perlu_perbaikan',
          warna: 'Kuning'
        }
      ];
      
      setHydrantsData(dummyHydrants);
      setFilteredHydrants(dummyHydrants);
    } catch (error) {
      console.error("Error fetching hydrants:", error);
    } finally {
      setIsLoadingHydrants(false);
    }
  }, []);

  // Simpan fungsi ke ref
  useEffect(() => {
    fetchRoomsDataRef.current = fetchRoomsData;
  }, [fetchRoomsData]);

  // Fungsi untuk membersihkan data duplikat
  const cleanDuplicates = useCallback(async () => {
    if (duplicateCount === 0) {
      alert("Tidak ada data duplikat untuk dibersihkan.");
      return;
    }

    if (!confirm(`Anda yakin ingin membersihkan ${duplicateCount} data duplikat?`)) {
      return;
    }

    try {
      const result = await apiService.cleanDuplicates();
      if (result.success) {
        alert(`✅ Berhasil membersihkan ${result.data?.cleanedCount || 0} data duplikat.`);
        // Panggil fungsi melalui ref untuk menghindari circular dependency
        if (fetchRoomsDataRef.current) {
          await fetchRoomsDataRef.current();
        }
      } else {
        alert(`❌ Gagal membersihkan duplikat: ${result.error}`);
      }
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      alert("❌ Terjadi kesalahan saat membersihkan duplikat.");
    }
  }, [duplicateCount]);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const result = await apiService.getStatistics();
      if (result.success) {
        setStats(result.data);
      } else {
        // Calculate from local data
        const allRooms = await apiService.getAllRooms();
        if (allRooms.success && allRooms.data) {
          const calculatedStats = {
            total_ruangan: allRooms.data.length,
            total_hydrant: hydrantsData.length,
            gedung_count: new Set(allRooms.data.map(r => r.gedung)).size,
            lantai_distribution: {} as Record<number, number>,
            fakultas_distribution: {} as Record<string, number>,
            fakultas_type_distribution: {} as Record<string, number>,
            hydrant_kondisi_distribution: {} as Record<string, number>,
            duplicate_count: duplicateCount
          };

          allRooms.data.forEach(room => {
            calculatedStats.lantai_distribution[room.lantai] = 
              (calculatedStats.lantai_distribution[room.lantai] || 0) + 1;
            
            calculatedStats.fakultas_distribution[room.fk] = 
              (calculatedStats.fakultas_distribution[room.fk] || 0) + 1;
            
            const fakultasType = room.fakultas_type || 'unknown';
            calculatedStats.fakultas_type_distribution[fakultasType] = 
              (calculatedStats.fakultas_type_distribution[fakultasType] || 0) + 1;
          });

          // Hitung distribusi kondisi hydrant
          hydrantsData.forEach(hydrant => {
            calculatedStats.hydrant_kondisi_distribution[hydrant.kondisi] = 
              (calculatedStats.hydrant_kondisi_distribution[hydrant.kondisi] || 0) + 1;
          });

          setStats(calculatedStats);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [duplicateCount, hydrantsData]);

  // Filter rooms berdasarkan kriteria
  const applyFilters = useCallback(() => {
    let result = [...roomsData];

    // Filter by search (mencari di semua field)
    if (filterOptions.search.trim()) {
      const searchLower = filterOptions.search.toLowerCase().trim();
      result = result.filter(room => 
        room.ruangan.toLowerCase().includes(searchLower) ||
        room.fk.toLowerCase().includes(searchLower) ||
        (room.subUnit && room.subUnit.toLowerCase().includes(searchLower)) ||
        room.gedung.toLowerCase().includes(searchLower) ||
        room.no.toString().includes(filterOptions.search) ||
        (room.fakultas_type && room.fakultas_type.toLowerCase().includes(searchLower))
      );
    }

    // Filter by fakultas type
    if (filterOptions.fakultasType.trim()) {
      result = result.filter(room => 
        room.fakultas_type === filterOptions.fakultasType
      );
    }

    // Filter by gedung
    if (filterOptions.gedung.trim()) {
      result = result.filter(room => 
        room.gedung.toLowerCase() === filterOptions.gedung.toLowerCase().trim()
      );
    }

    // Filter by fakultas name
    if (filterOptions.fakultas.trim()) {
      result = result.filter(room => 
        room.fk.toLowerCase() === filterOptions.fakultas.toLowerCase().trim()
      );
    }

    // Filter by lantai
    if (filterOptions.lantai.trim()) {
      result = result.filter(room => 
        room.lantai.toString() === filterOptions.lantai
      );
    }

    // Filter by subUnit
    if (filterOptions.subUnit.trim()) {
      result = result.filter(room => 
        room.subUnit && room.subUnit.toLowerCase() === filterOptions.subUnit.toLowerCase().trim()
      );
    }

    // Filter untuk hanya menampilkan duplikat
    if (filterOptions.showDuplicatesOnly) {
      const duplicateKeys = new Set<string>();
      const duplicateMap = new Map<string, RoomData[]>();
      
      result.forEach(room => {
        const key = `${room.no}-${room.gedung}-${room.lantai}-${room.fakultas_type || 'ekonomi'}`;
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, [room]);
        } else {
          duplicateMap.get(key)!.push(room);
        }
      });
      
      // Hanya ambil keys yang punya lebih dari 1 data
      duplicateMap.forEach((rooms, key) => {
        if (rooms.length > 1) {
          duplicateKeys.add(key);
        }
      });
      
      result = result.filter(room => {
        const key = `${room.no}-${room.gedung}-${room.lantai}-${room.fakultas_type || 'ekonomi'}`;
        return duplicateKeys.has(key);
      });
    }

    setFilteredRooms(result);
  }, [roomsData, filterOptions]);

  // Filter hydrants
  const filterHydrants = useCallback(() => {
    let result = [...hydrantsData];

    // Filter by search
    if (filterOptions.search.trim()) {
      const searchLower = filterOptions.search.toLowerCase().trim();
      result = result.filter(hydrant => 
        hydrant.proteksi.toLowerCase().includes(searchLower) ||
        hydrant.lokasi?.toLowerCase().includes(searchLower) ||
        hydrant.keterangan?.toLowerCase().includes(searchLower) ||
        hydrant.id.toString().includes(filterOptions.search) ||
        hydrant.warna.toLowerCase().includes(searchLower) ||
        hydrant.kondisi.toLowerCase().includes(searchLower)
      );
    }

    setFilteredHydrants(result);
  }, [hydrantsData, filterOptions.search]);

  // Terapkan filter saat filterOptions berubah
  useEffect(() => {
    if (activeDataTab === 'ruangan') {
      applyFilters();
    } else {
      filterHydrants();
    }
  }, [applyFilters, filterHydrants, activeDataTab]);

  // Load SVG for interactive map
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
                <svg class="text-gray-400 mx-auto mb-4" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Peta Denah</h3>
                <p class="text-gray-500">File lantai3.svg tidak ditemukan</p>
                <p class="text-sm text-gray-400 mt-2">Pastikan file ada di folder public/</p>
              </div>
            </div>
          `);
        });
    }
  }, [active, svgContent]);

  // Load data saat komponen mount dan saat tab berubah
  useEffect(() => {
    if (active === "dashboard" || active === "statistik") {
      fetchStatistics();
    } else if (active === "manajemen") {
      if (activeDataTab === 'ruangan') {
        fetchRoomsData();
      } else {
        fetchHydrantsData();
      }
    } else if (active === "history") {
      fetchHydrantsData();
    }
  }, [active, fetchStatistics, fetchRoomsData, fetchHydrantsData, activeDataTab]);

  const handleLogout = useCallback(() => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      router.push('/login');
    }
  }, [router]);

  // Handle logout when clicked
  useEffect(() => {
    if (active === 'logout') {
      handleLogout();
    }
  }, [active, handleLogout]);

  const closePopup = useCallback(() => {
    setPopupRoomId(null);
    setPopupHydrantId(null);
    setSelectedRoom(null);
    setSelectedHydrant(null);
  }, []);

  const handleRoomClick = useCallback((roomId: string) => {
    setPopupRoomId(roomId);
  }, []);

  const handleHydrantClick = useCallback((hydrantId: string) => {
    setPopupHydrantId(hydrantId);
  }, []);

  const handleEditRoom = useCallback((room: RoomData) => {
    setSelectedRoom(room);
  }, []);

  const handleEditHydrant = useCallback((hydrant: HydrantData) => {
    setSelectedHydrant(hydrant);
  }, []);

  const handleDeleteRoom = useCallback(async (room: RoomData) => {
    if (!room.id || !confirm(`Hapus data ruangan "${room.ruangan}"?`)) return;
    
    try {
      const type = room.fakultas_type || 'ekonomi';
      const result = await apiService.deleteRoom(type, room.id);
      
      if (result.success) {
        alert('✅ Data berhasil dihapus');
        // Panggil fungsi melalui ref
        if (fetchRoomsDataRef.current) {
          await fetchRoomsDataRef.current();
        }
      } else {
        alert(`❌ Gagal menghapus: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('❌ Terjadi kesalahan saat menghapus data');
    }
  }, []);

  const handleDeleteHydrant = useCallback(async (hydrant: HydrantData) => {
    if (!confirm(`Hapus data hydrant ID ${hydrant.id}?`)) return;
    
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('✅ Data hydrant berhasil dihapus');
      await fetchHydrantsData();
    } catch (error) {
      console.error('Error deleting hydrant:', error);
      alert('❌ Terjadi kesalahan saat menghapus data');
    }
  }, [fetchHydrantsData]);

  const handleExportData = useCallback(() => {
    let dataStr = '';
    let filename = '';
    
    if (activeDataTab === 'ruangan') {
      dataStr = JSON.stringify(filteredRooms, null, 2);
      filename = `data-ruangan-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      dataStr = JSON.stringify(filteredHydrants, null, 2);
      filename = `data-hydrant-${new Date().toISOString().split('T')[0]}.json`;
    }
    
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }, [filteredRooms, filteredHydrants, activeDataTab]);

  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string | boolean) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterOptions({
      search: "",
      gedung: "",
      fakultas: "",
      lantai: "",
      subUnit: "",
      fakultasType: "",
      showDuplicatesOnly: false,
    });
    setFilteredRooms(roomsData);
    setFilteredHydrants(hydrantsData);
  }, [roomsData, hydrantsData]);

  // Ekstrak nilai unik untuk dropdown filter
  const { gedungOptions, fakultasOptions, lantaiOptions, subUnitOptions } = useMemo(() => {
    const gedungSet = new Set<string>();
    const fakultasSet = new Set<string>();
    const lantaiSet = new Set<string>();
    const subUnitSet = new Set<string>();

    roomsData.forEach(room => {
      if (room.gedung) gedungSet.add(room.gedung);
      if (room.fk) fakultasSet.add(room.fk);
      lantaiSet.add(room.lantai.toString());
      if (room.subUnit && room.subUnit.trim()) {
        subUnitSet.add(room.subUnit);
      }
    });

    return {
      gedungOptions: Array.from(gedungSet),
      fakultasOptions: Array.from(fakultasSet),
      lantaiOptions: Array.from(lantaiSet).sort((a, b) => parseInt(a) - parseInt(b)),
      subUnitOptions: Array.from(subUnitSet)
    };
  }, [roomsData]);

  const handleApiOperation = useCallback(async (operation: () => Promise<any>) => {
    if (apiStatus === 'offline') {
      if (!confirm('API sedang offline. Apakah Anda ingin mencoba melanjutkan?')) {
        return;
      }
    }
    
    try {
      await operation();
    } catch (error) {
      console.error('Operation failed:', error);
      await checkApiStatus();
    }
  }, [apiStatus, checkApiStatus]);

  // Cek apakah sebuah room adalah duplikat
  const isRoomDuplicate = useCallback((room: RoomData): boolean => {
    return findDuplicateRooms.some(dup => 
      dup.no === room.no && 
      dup.gedung === room.gedung && 
      dup.lantai === room.lantai &&
      dup.fakultas_type === room.fakultas_type &&
      dup.id !== room.id // Bukan data yang sama
    );
  }, [findDuplicateRooms]);

  // Render tabel untuk ruangan
  const renderRoomsTable = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Responsive Table Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="min-w-full inline-block align-middle">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full border border-gray-200 rounded-lg bg-white">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Kode
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Ruangan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Fakultas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Tipe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Sub Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Lantai
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Gedung
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length > 0 ? (
                    (paginatedData as RoomData[]).map((room, index) => {
                      const isDuplicate = isRoomDuplicate(room);
                      
                      return (
                        <tr key={`${room.fakultas_type}-${room.id}-${room.no}`} 
                            className={`hover:bg-gray-50 transition-colors ${
                              isDuplicate ? 'bg-red-50 border-l-4 border-red-500' : ''
                            }`}>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 font-mono">
                                {room.no}
                              </span>
                              {isDuplicate && (
                                <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded border border-red-200">
                                  Dup
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900 font-medium">
                              {room.ruangan}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700">
                              {room.fk}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                room.fakultas_type === 'ekonomi' ? 'bg-blue-100 text-blue-800' :
                                room.fakultas_type === 'syariah' ? 'bg-green-100 text-green-800' :
                                room.fakultas_type === 'teknik' ? 'bg-yellow-100 text-yellow-800' :
                                room.fakultas_type === 'hukum' ? 'bg-purple-100 text-purple-800' :
                                room.fakultas_type === 'fikom' ? 'bg-pink-100 text-pink-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {room.fakultas_type ? fakultasTypeNames[room.fakultas_type]?.substring(10) || room.fakultas_type : 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700">
                              {room.subUnit || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                room.lantai === 1 ? 'bg-blue-50 text-blue-700' :
                                room.lantai === 2 ? 'bg-green-50 text-green-700' :
                                room.lantai === 3 ? 'bg-yellow-50 text-yellow-700' :
                                'bg-purple-50 text-purple-700'
                              }`}>
                                <span className="text-xs font-bold">{room.lantai}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700">
                              {room.gedung}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                isDuplicate 
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-green-100 text-green-700 border border-green-200'
                              }`}>
                                {isDuplicate ? '⚠️ Duplikat' : '✅ Unik'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditRoom(room)}
                                disabled={apiStatus === 'offline'}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit data ruangan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room)}
                                disabled={apiStatus === 'offline'}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Hapus data ruangan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {roomsData.length === 0 ? 'Belum ada data ruangan' : 'Data tidak ditemukan'}
                          </h4>
                          <p className="text-gray-600 mb-4 max-w-md mx-auto">
                            {roomsData.length === 0 
                              ? apiStatus === 'offline'
                                ? "Tidak dapat memuat data karena API sedang offline."
                                : "Klik ruangan pada peta untuk menambahkan data."
                              : filterOptions.showDuplicatesOnly && duplicateCount === 0
                                ? "Tidak ada data duplikat ditemukan. 🎉"
                                : "Tidak ada data yang sesuai dengan filter pencarian."}
                          </p>
                          <div className="flex gap-3">
                            {roomsData.length === 0 && apiStatus === 'offline' && (
                              <button
                                onClick={() => checkApiStatus()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                Coba Koneksi Ulang
                              </button>
                            )}
                            {(roomsData.length > 0 || filterOptions.search) && (
                              <button
                                onClick={() => {
                                  resetFilters();
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedData.length > 0 ? (
                (paginatedData as RoomData[]).map((room, index) => {
                  const isDuplicate = isRoomDuplicate(room);
                  
                  return (
                    <div key={`${room.fakultas_type}-${room.id}-${room.no}-mobile`} 
                         className={`bg-white border rounded-lg p-4 shadow-sm ${
                           isDuplicate 
                             ? 'border-red-300 bg-red-50 border-l-4 border-l-red-500' 
                             : 'border-gray-200'
                         }`}>
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base">{room.ruangan}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                                  Kode: {room.no}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  room.fakultas_type === 'ekonomi' ? 'bg-blue-100 text-blue-800' :
                                  room.fakultas_type === 'syariah' ? 'bg-green-100 text-green-800' :
                                  room.fakultas_type === 'teknik' ? 'bg-yellow-100 text-yellow-800' :
                                  room.fakultas_type === 'hukum' ? 'bg-purple-100 text-purple-800' :
                                  room.fakultas_type === 'fikom' ? 'bg-pink-100 text-pink-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {room.fakultas_type ? room.fakultas_type.toUpperCase() : 'UKN'}
                                </span>
                                {isDuplicate && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                                    ⚠️ Duplikat
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditRoom(room)}
                              disabled={apiStatus === 'offline'}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Fakultas:</span>
                            <p className="text-gray-800">{room.fk}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Sub Unit:</span>
                            <p className="text-gray-800">{room.subUnit || '-'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Gedung:</span>
                            <p className="text-gray-800">{room.gedung}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Lantai:</span>
                            <p className="text-gray-800">{room.lantai}</p>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            disabled={apiStatus === 'offline'}
                            className="w-full py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Hapus Data
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {roomsData.length === 0 ? 'Belum ada data ruangan' : 'Data tidak ditemukan'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {roomsData.length === 0 
                      ? apiStatus === 'offline'
                        ? "Tidak dapat memuat data karena API sedang offline."
                        : "Klik ruangan pada peta untuk menambahkan data."
                      : filterOptions.showDuplicatesOnly && duplicateCount === 0
                        ? "Tidak ada data duplikat ditemukan. 🎉"
                        : "Tidak ada data yang sesuai dengan filter pencarian."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render tabel untuk hydrant
  const renderHydrantsTable = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Responsive Table Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="min-w-full inline-block align-middle">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="min-w-full border border-gray-200 rounded-lg bg-white">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Proteksi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Warna
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Lokasi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Kapasitas (Kg)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Tekanan (Bar)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Tgl Cek
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Kondisi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.length > 0 ? (
                    (paginatedData as HydrantData[]).map((hydrant, index) => (
                      <tr key={`hydrant-${hydrant.id}`} 
                          className={`hover:bg-gray-50 transition-colors ${
                            hydrant.id === 1013 ? 'bg-red-50 border-l-4 border-red-500' : ''
                          }`}>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {hydrant.id}
                            </span>
                            {hydrant.id === 1013 && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded border border-red-200">
                                Merah
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-medium">
                            {hydrant.proteksi}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: hydrant.warna === 'Merah' ? '#dc2626' : 
                                       hydrant.warna === 'Kuning' ? '#fbbf24' : 
                                       hydrant.warna === 'Hijau' ? '#10b981' : '#3b82f6' }}
                            />
                            <span className="text-sm text-gray-700">
                              {hydrant.warna}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700">
                            {hydrant.lokasi || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {hydrant.kapasitas} Kg
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {hydrant.tekanan} Bar
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {hydrant.tanggalPengecekan}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                              hydrant.kondisi === 'baik' ? 'bg-green-100 text-green-800 border border-green-200' :
                              hydrant.kondisi === 'perlu_perbaikan' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              hydrant.kondisi === 'rusak' ? 'bg-red-100 text-red-800 border border-red-200' :
                              'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {hydrant.kondisi === 'baik' ? '✅ Baik' :
                               hydrant.kondisi === 'perlu_perbaikan' ? '⚠️ Perlu Perbaikan' :
                               hydrant.kondisi === 'rusak' ? '❌ Rusak' : '⏰ Kadaluarsa'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditHydrant(hydrant)}
                              disabled={apiStatus === 'offline'}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit data hydrant"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteHydrant(hydrant)}
                              disabled={apiStatus === 'offline'}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus data hydrant"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Flame className="w-8 h-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {hydrantsData.length === 0 ? 'Belum ada data hydrant' : 'Data tidak ditemukan'}
                          </h4>
                          <p className="text-gray-600 mb-4 max-w-md mx-auto">
                            {hydrantsData.length === 0 
                              ? "Belum ada data hydrant/APAR yang tersimpan."
                              : "Tidak ada data yang sesuai dengan filter pencarian."}
                          </p>
                          <div className="flex gap-3">
                            {hydrantsData.length === 0 && (
                              <button
                                onClick={() => fetchHydrantsData()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                              >
                                <RefreshCw size={14} />
                                Load Data
                              </button>
                            )}
                            {filterOptions.search && (
                              <button
                                onClick={() => {
                                  resetFilters();
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedData.length > 0 ? (
                (paginatedData as HydrantData[]).map((hydrant, index) => (
                  <div key={`hydrant-${hydrant.id}-mobile`} 
                       className={`bg-white border rounded-lg p-4 shadow-sm ${
                         hydrant.id === 1013 
                           ? 'border-red-300 bg-red-50 border-l-4 border-l-red-500' 
                           : 'border-gray-200'
                       }`}>
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                              {hydrant.proteksi} ID: {hydrant.id}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-4 h-4 rounded border border-gray-300"
                                  style={{ backgroundColor: hydrant.warna === 'Merah' ? '#dc2626' : 
                                           hydrant.warna === 'Kuning' ? '#fbbf24' : 
                                           hydrant.warna === 'Hijau' ? '#10b981' : '#3b82f6' }}
                                />
                                <span className="text-xs text-gray-700">{hydrant.warna}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                hydrant.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                hydrant.kondisi === 'perlu_perbaikan' ? 'bg-yellow-100 text-yellow-800' :
                                hydrant.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {hydrant.kondisi === 'baik' ? 'Baik' :
                                 hydrant.kondisi === 'perlu_perbaikan' ? 'Perlu Perbaikan' :
                                 hydrant.kondisi === 'rusak' ? 'Rusak' : 'Kadaluarsa'}
                              </span>
                              {hydrant.id === 1013 && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                                  Merah
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditHydrant(hydrant)}
                            disabled={apiStatus === 'offline'}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Lokasi:</span>
                          <p className="text-gray-800">{hydrant.lokasi || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Kapasitas:</span>
                          <p className="text-gray-800">{hydrant.kapasitas} Kg</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Tekanan:</span>
                          <p className="text-gray-800">{hydrant.tekanan} Bar</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Tgl Cek:</span>
                          <p className="text-gray-800">{hydrant.tanggalPengecekan}</p>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <div className="pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleDeleteHydrant(hydrant)}
                          disabled={apiStatus === 'offline'}
                          className="w-full py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus Data
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Flame className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {hydrantsData.length === 0 ? 'Belum ada data hydrant' : 'Data tidak ditemukan'}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {hydrantsData.length === 0 
                      ? "Belum ada data hydrant/APAR yang tersimpan."
                      : "Tidak ada data yang sesuai dengan filter pencarian."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render dashboard content based on active tab
  const renderContent = useCallback(() => {
    switch (active) {
      case 'dashboard':
        return (
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

            {/* Duplicate Warning Card */}
            {duplicateCount > 0 && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-700">⚠️ Data Duplikat Terdeteksi</h4>
                    <p className="text-sm text-red-600 mt-1">
                      Terdapat <span className="font-bold">{duplicateCount}</span> data duplikat yang perlu ditindaklanjuti.
                    </p>
                    <p className="text-xs text-red-500 mt-2">
                      Duplikat terjadi ketika ada ruangan dengan kombinasi kode, gedung, dan lantai yang sama.
                    </p>
                  </div>
                  <button
                    onClick={() => setActive('manajemen')}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Database size={14} />
                    Kelola Data
                  </button>
                </div>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-700">Total Ruangan</h4>
                  <p className="text-3xl font-bold text-gray-800">{stats.total_ruangan || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">Semua fakultas</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-700">Jumlah Hydrant</h4>
                  <p className="text-3xl font-bold text-gray-800">{stats.total_hydrant || 0}</p>
                  <p className="text-sm text-gray-600 mt-1">APAR & Hydrant</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-700">Fakultas Terdata</h4>
                  <p className="text-3xl font-bold text-gray-800">
                    {stats.fakultas_type_distribution ? Object.keys(stats.fakultas_type_distribution).length : 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Dari 6 fakultas</p>
                </div>
                <div className={`p-4 rounded-lg border-l-4 ${
                  duplicateCount > 0 ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'
                }`}>
                  <h4 className={`font-semibold ${
                    duplicateCount > 0 ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    {duplicateCount > 0 ? 'Data Duplikat' : 'Lantai'}
                  </h4>
                  <p className={`text-3xl font-bold ${
                    duplicateCount > 0 ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    {duplicateCount > 0 ? duplicateCount : (Object.keys(stats.lantai_distribution || {}).length || 0)}
                  </p>
                  <p className={`text-sm mt-1 ${
                    duplicateCount > 0 ? 'text-red-500' : 'text-gray-600'
                  }`}>
                    {duplicateCount > 0 ? 'Perlu pembersihan' : 'Lantai terisi'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fakultas Distribution */}
              {stats?.fakultas_type_distribution && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Distribusi per Fakultas</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.fakultas_type_distribution).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{fakultasTypeNames[type] || type}</span>
                        <span className="font-bold text-blue-600">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hydrant Status */}
              {stats?.hydrant_kondisi_distribution && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Flame size={16} className="text-red-500" />
                    Status Hydrant/APAR
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(stats.hydrant_kondisi_distribution).map(([kondisi, count]) => (
                      <div key={kondisi} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                          {kondisi === 'baik' ? '✅ Baik' :
                           kondisi === 'perlu_perbaikan' ? '⚠️ Perlu Perbaikan' :
                           kondisi === 'rusak' ? '❌ Rusak' : '⏰ Kadaluarsa'}
                        </span>
                        <span className={`font-bold ${
                          kondisi === 'baik' ? 'text-green-600' :
                          kondisi === 'perlu_perbaikan' ? 'text-yellow-600' :
                          kondisi === 'rusak' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {count as number}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* System Info */}
            <div className="mt-6 bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-600">
              <h4 className="font-semibold text-blue-700 mb-2">Informasi Sistem</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Sistem Denah Digital Gedung Dekanat terintegrasi dengan API database. 
                Klik ruangan atau hydrant pada peta untuk menambah atau mengedit data.
              </p>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>• Data tersimpan di database MySQL</p>
                <p>• Update real-time melalui API</p>
                <p>• Status API: <span className={
                  apiStatus === 'online' ? 'text-green-600 font-bold' :
                  apiStatus === 'offline' ? 'text-red-600 font-bold' :
                  'text-yellow-600 font-bold'
                }>{apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Checking...'}</span></p>
                <p>• Ekspor data dalam format JSON</p>
                <p>• Mendukung 6 fakultas berbeda</p>
                <p>• Deteksi duplikat real-time</p>
                <p>• Manajemen hydrant/APAR terpisah</p>
              </div>
            </div>
          </div>
        );

      case 'statistik':
        return (
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
              <BarChart className="text-blue-500" size={24} /> Statistik Data
            </h3>
            
            {stats ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-700 mb-2">Total Ruangan</h4>
                    <div className="text-3xl font-bold text-blue-600">{stats.total_ruangan || 0}</div>
                    <p className="text-sm text-gray-500 mt-1">Ruangan terdata</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-700 mb-2">Total Hydrant</h4>
                    <div className="text-3xl font-bold text-red-600">{stats.total_hydrant || 0}</div>
                    <p className="text-sm text-gray-500 mt-1">APAR & Hydrant</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-700 mb-2">Gedung</h4>
                    <div className="text-3xl font-bold text-green-600">{stats.gedung_count || 0}</div>
                    <p className="text-sm text-gray-500 mt-1">Gedung berbeda</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-700 mb-2">Fakultas</h4>
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.fakultas_type_distribution ? Object.keys(stats.fakultas_type_distribution).length : 0}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Fakultas aktif</p>
                  </div>
                </div>

                {/* Duplicate Stats */}
                {duplicateCount > 0 && (
                  <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-red-800">Data Duplikat</h4>
                      <button
                        onClick={() => setActive('manajemen')}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Kelola Duplikat
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{duplicateCount}</div>
                        <div className="text-sm text-gray-600">Total Duplikat</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {((duplicateCount / roomsData.length) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Persentase</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {roomsData.length - duplicateCount}
                        </div>
                        <div className="text-sm text-gray-600">Data Unik</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hydrant Status Distribution */}
                {stats.hydrant_kondisi_distribution && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Flame size={20} className="text-red-500" />
                      Distribusi Kondisi Hydrant/APAR
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(stats.hydrant_kondisi_distribution).map(([kondisi, count]) => (
                        <div key={kondisi} className="flex items-center">
                          <div className="w-48">
                            <span className="text-sm text-gray-700 flex items-center gap-2">
                              {kondisi === 'baik' ? '✅ Baik' :
                               kondisi === 'perlu_perbaikan' ? '⚠️ Perlu Perbaikan' :
                               kondisi === 'rusak' ? '❌ Rusak' : '⏰ Kadaluarsa'}
                            </span>
                          </div>
                          <div className="flex-1 ml-4">
                            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full"
                                style={{ 
                                  width: `${((count as number) / stats.total_hydrant) * 100}%`,
                                  backgroundColor: kondisi === 'baik' ? '#10b981' :
                                                 kondisi === 'perlu_perbaikan' ? '#fbbf24' :
                                                 kondisi === 'rusak' ? '#ef4444' : '#6b7280'
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <span className={`font-bold ${
                              kondisi === 'baik' ? 'text-green-600' :
                              kondisi === 'perlu_perbaikan' ? 'text-yellow-600' :
                              kondisi === 'rusak' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {count as number}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({Math.round(((count as number) / stats.total_hydrant) * 100)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fakultas Distribution */}
                {stats.fakultas_type_distribution && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Distribusi Data per Fakultas</h4>
                    <div className="space-y-3">
                      {Object.entries(stats.fakultas_type_distribution).map(([type, count]) => (
                        <div key={type} className="flex items-center">
                          <div className="w-48">
                            <span className="text-sm text-gray-700">{fakultasTypeNames[type] || type}</span>
                          </div>
                          <div className="flex-1 ml-4">
                            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${((count as number) / stats.total_ruangan) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-right">
                            <span className="font-bold text-blue-600">{count as number}</span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({Math.round(((count as number) / stats.total_ruangan) * 100)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lantai Distribution */}
                {stats.lantai_distribution && (
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4">Distribusi Data per Lantai</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(stats.lantai_distribution)
                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                        .map(([lantai, count]) => (
                        <div key={lantai} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{count as number}</div>
                          <div className="text-sm text-gray-600">Lantai {lantai}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Memuat statistik...</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-700 flex items-center gap-2">
                <Clock className="text-blue-500" size={24} /> History Pengecekan Hydrant/APAR
              </h3>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                Total: <span className="font-bold text-blue-600">{hydrantsData.length}</span> record
              </div>
            </div>

            {/* Tabel History */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      No
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      ID
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Proteksi
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tgl Pengisian
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tgl Cek
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Kapasitas
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Tekanan
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Expired
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Kondisi
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hydrantsData.length > 0 ? (
                    hydrantsData.map((hydrant, index) => (
                      <tr key={hydrant.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {hydrant.id}
                          {hydrant.id === 1013 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              Merah
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 whitespace-nowrap max-w-[120px] truncate">
                          {hydrant.proteksi}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {hydrant.tanggalPengisian}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {hydrant.tanggalPengecekan}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {hydrant.kapasitas} Kg
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {hydrant.tekanan} Bar
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {hydrant.expired}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            hydrant.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                            hydrant.kondisi === 'perlu_perbaikan' ? 'bg-yellow-100 text-yellow-800' :
                            hydrant.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {hydrant.kondisi === 'baik' ? 'Baik' :
                             hydrant.kondisi === 'perlu_perbaikan' ? 'Perlu Perbaikan' :
                             hydrant.kondisi === 'rusak' ? 'Rusak' : 'Kadaluarsa'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate">
                          {hydrant.keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Flame className="w-12 h-12 text-gray-400 mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Belum ada data history
                          </h4>
                          <p className="text-gray-600 mb-4 max-w-md mx-auto">
                            Tidak ada data hydrant/APAR yang tersimpan.
                          </p>
                          <button
                            onClick={() => fetchHydrantsData()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                          >
                            <RefreshCw size={14} />
                            Load Data
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Informasi */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Informasi Tabel History</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Total record: <span className="font-bold">{hydrantsData.length}</span> data pengecekan alat proteksi kebakaran.</p>
                    <p>Hydrant ID <span className="font-bold text-red-600">1013</span> adalah alat warna merah dengan prioritas utama.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'lantai':
        return (
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
                  onHydrantClick={handleHydrantClick}
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

            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-3">Legenda:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-400 rounded border border-gray-300"></div>
                  <span className="text-sm text-gray-600">Ruangan - Klik untuk detail/edit</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded border border-gray-300"></div>
                  <span className="text-sm text-gray-600">Hydrant/APAR - Klik untuk detail/edit</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-600 rounded-full border border-gray-300"></div>
                  <span className="text-sm text-gray-600 font-bold text-red-600">ID 1013 - Hydrant warna merah (prioritas)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'manajemen':
        return (
          <div className="h-full flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-blue-700 flex items-center gap-2">
                <Database className="text-blue-500" size={24} />
                Manajemen Data
              </h3>
              <div className="text-sm text-gray-500">
                {activeDataTab === 'ruangan' ? (
                  <>
                    Total: <span className="font-bold text-blue-600">{roomsData.length}</span> ruangan
                    {duplicateCount > 0 && (
                      <span className="ml-2 text-red-600 font-bold">
                        ({duplicateCount} duplikat)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Total: <span className="font-bold text-red-600">{hydrantsData.length}</span> hydrant/APAR
                  </>
                )}
              </div>
            </div>
            
            {/* Peringatan jika API offline */}
            {apiStatus === 'offline' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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

            {/* Data Type Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveDataTab('ruangan')}
                  className={`py-2 px-4 font-medium text-sm sm:text-base border-b-2 transition-colors ${
                    activeDataTab === 'ruangan'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building size={16} />
                    Data Ruangan
                  </div>
                </button>
                <button
                  onClick={() => setActiveDataTab('hydrant')}
                  className={`py-2 px-4 font-medium text-sm sm:text-base border-b-2 transition-colors ${
                    activeDataTab === 'hydrant'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Flame size={16} />
                    Data Hydrant/APAR
                  </div>
                </button>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      activeDataTab === 'ruangan' 
                        ? "Cari ruangan, fakultas, atau kode..." 
                        : "Cari hydrant, lokasi, ID..."
                    }
                    value={filterOptions.search}
                    onChange={(e) => {
                      handleFilterChange('search', e.target.value);
                    }}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (activeDataTab === 'ruangan') {
                        handleApiOperation(fetchRoomsData);
                      } else {
                        handleApiOperation(fetchHydrantsData);
                      }
                    }}
                    disabled={activeDataTab === 'ruangan' ? isLoadingRooms : isLoadingHydrants}
                    className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap text-sm"
                  >
                    <Upload size={16} />
                    {activeDataTab === 'ruangan' 
                      ? (isLoadingRooms ? "Memuat..." : "Refresh") 
                      : (isLoadingHydrants ? "Memuat..." : "Refresh")
                    }
                  </button>
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-sm"
                  >
                    <Download size={16} />
                    Export
                  </button>
                  {activeDataTab === 'ruangan' && duplicateCount > 0 && (
                    <button
                      onClick={cleanDuplicates}
                      disabled={isLoadingRooms}
                      className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap text-sm"
                    >
                      <Trash2 size={16} />
                      Bersihkan Duplikat
                    </button>
                  )}
                </div>
              </div>
              
              {/* Quick Filters Row */}
              <div className="mt-4 flex flex-wrap gap-2">
                {activeDataTab === 'ruangan' && (
                  <>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
                    >
                      <Filter size={14} />
                      {showFilters ? 'Sembunyikan Filter' : 'Filter Lanjutan'}
                    </button>
                    
                    {/* Toggle Show Duplicates Only */}
                    <button
                      onClick={() => {
                        handleFilterChange('showDuplicatesOnly', !filterOptions.showDuplicatesOnly);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                        filterOptions.showDuplicatesOnly
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <AlertTriangle size={14} />
                      {filterOptions.showDuplicatesOnly ? 'Tampilkan Semua' : 'Hanya Duplikat'}
                    </button>
                  </>
                )}
                
                {filterOptions.search && (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg text-sm">
                    <span className="text-blue-700">Pencarian: "{filterOptions.search}"</span>
                    <button 
                      onClick={() => {
                        handleFilterChange('search', '');
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {(filterOptions.gedung || filterOptions.fakultas || filterOptions.lantai || filterOptions.subUnit || filterOptions.fakultasType || filterOptions.showDuplicatesOnly) && (
                  <button
                    onClick={() => {
                      resetFilters();
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters for Ruangan */}
            {showFilters && activeDataTab === 'ruangan' && (
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filter by Fakultas Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipe Fakultas
                    </label>
                    <select
                      value={filterOptions.fakultasType}
                      onChange={(e) => {
                        handleFilterChange('fakultasType', e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {fakultasTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Gedung */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gedung
                    </label>
                    <select
                      value={filterOptions.gedung}
                      onChange={(e) => {
                        handleFilterChange('gedung', e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      Fakultas
                    </label>
                    <select
                      value={filterOptions.fakultas}
                      onChange={(e) => {
                        handleFilterChange('fakultas', e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                      Lantai
                    </label>
                    <select
                      value={filterOptions.lantai}
                      onChange={(e) => {
                        handleFilterChange('lantai', e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Semua Lantai</option>
                      {lantaiOptions.map((lantai) => (
                        <option key={lantai} value={lantai}>
                          Lantai {lantai}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Data Counter & Pagination Info */}
            <div className="mb-4 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Menampilkan <span className="font-medium text-blue-600">{currentData.length}</span> dari <span className="font-medium">{
                  activeDataTab === 'ruangan' ? roomsData.length : hydrantsData.length
                }</span> data
                {activeDataTab === 'ruangan' && duplicateCount > 0 && (
                  <span className="ml-2 text-red-600">
                    ({duplicateCount} duplikat)
                  </span>
                )}
                {filterOptions.search && (
                  <button 
                    onClick={() => {
                      resetFilters();
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Tampilkan semua
                  </button>
                )}
              </div>
              
              {/* Pagination Info */}
              {currentData.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="hidden sm:block">
                    Halaman {currentPage} dari {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Baris per halaman:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
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

            {/* Loading State */}
            {(activeDataTab === 'ruangan' ? isLoadingRooms : isLoadingHydrants) ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Memuat data dari API...</p>
              </div>
            ) : (
              <>
                {/* Render Table based on active tab */}
                {activeDataTab === 'ruangan' ? renderRoomsTable() : renderHydrantsTable()}

                {/* Pagination Controls */}
                {currentData.length > 0 && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-gray-600 order-2 sm:order-1">
                      Menampilkan {startIndex + 1} - {endIndex} dari {currentData.length} data
                    </div>
                    
                    <div className="flex items-center gap-2 order-1 sm:order-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-sm"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Sebelumnya</span>
                        <span className="sm:hidden">Prev</span>
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {totalPages <= 5 ? (
                          [...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })
                        ) : (
                          <>
                            {currentPage > 2 && (
                              <button
                                onClick={() => setCurrentPage(1)}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm border border-gray-300 hover:bg-gray-50 text-gray-700"
                              >
                                1
                              </button>
                            )}
                            
                            {currentPage > 3 && (
                              <span className="px-1 text-gray-500">...</span>
                            )}
                            
                            {[...Array(Math.min(3, totalPages))].map((_, i) => {
                              let pageNum = currentPage - 1 + i;
                              if (pageNum < 1) pageNum = i + 1;
                              if (pageNum > totalPages) return null;
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm ${
                                    currentPage === pageNum
                                      ? 'bg-blue-600 text-white' :
                                      'border border-gray-300 hover:bg-gray-50 text-gray-700'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            {currentPage < totalPages - 2 && (
                              <span className="px-1 text-gray-500">...</span>
                            )}
                            
                            {currentPage < totalPages - 1 && (
                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-sm border border-gray-300 hover:bg-gray-50 text-gray-700"
                              >
                                {totalPages}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-sm"
                      >
                        <span className="hidden sm:inline">Selanjutnya</span>
                        <span className="sm:hidden">Next</span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [
    active, 
    apiStatus, 
    checkApiStatus, 
    stats, 
    fakultasTypeNames, 
    lantai, 
    svgContent, 
    handleRoomClick,
    handleHydrantClick,
    roomsData,
    hydrantsData,
    isLoadingRooms,
    isLoadingHydrants,
    filterOptions,
    showFilters,
    activeDataTab,
    fakultasTypeOptions,
    gedungOptions,
    fakultasOptions,
    lantaiOptions,
    handleFilterChange,
    handleApiOperation,
    fetchRoomsData,
    fetchHydrantsData,
    handleExportData,
    cleanDuplicates,
    resetFilters,
    startIndex,
    endIndex,
    currentData,
    totalPages,
    paginatedData,
    handleEditRoom,
    handleEditHydrant,
    handleDeleteRoom,
    handleDeleteHydrant,
    rowsPerPage,
    currentPage,
    setCurrentPage,
    setRowsPerPage,
    duplicateCount,
    findDuplicateRooms,
    isRoomDuplicate
  ]);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 w-full bg-white shadow-lg border-b border-gray-100">
        <div className="flex items-center justify-between p-3 sm:p-4 max-w-7xl mx-auto">
          {/* Logo/Title Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
              <Building className="text-white" size={18} />
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-blue-800 truncate leading-tight">
                Gedung Dekanat
              </h1>
              <p className="text-xs text-gray-600 truncate leading-tight">
                Sistem Denah Digital + Hydrant
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === 'logout' ? handleLogout() : setActive(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm font-medium whitespace-nowrap min-w-[70px] justify-center ${
                  active === item.id
                    ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="hidden lg:inline text-xs">{item.name}</span>
                <span className="lg:hidden text-xs">
                  {item.name === "Dashboard" ? "Home" : 
                   item.name === "Denah Interaktif" ? "Denah" :
                   item.name === "Manajemen Data" ? "Data" :
                   item.name === "Statistik" ? "Stats" :
                   item.name === "History Hydrant" ? "History" : item.name}
                </span>
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 ml-2">
            <div className="hidden sm:block">
              <ApiStatusIndicator />
            </div>
            
            <div className="flex items-center gap-2 md:hidden">
              <div className="sm:hidden">
                <ApiStatusIndicator />
              </div>
              <button
                className="text-gray-700 hover:text-blue-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'logout') {
                        handleLogout();
                      } else {
                        setActive(item.id);
                        setMenuOpen(false);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                      active === item.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-1 ${
                      active === item.id ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto w-full bg-gray-50/50">
        <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-16 max-w-7xl mx-auto w-full flex flex-col min-h-full">
          {/* Header */}
          <header className="mb-4 sm:mb-6 pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold capitalize text-gray-800">
                  {menuItems.find(item => item.id === active)?.name || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {active === 'dashboard' && 'Overview sistem dan monitoring API'}
                  {active === 'lantai' && 'Denah interaktif lantai 3 Gedung Dekanat'}
                  {active === 'manajemen' && 'Kelola data ruangan dan hydrant'}
                  {active === 'statistik' && 'Statistik dan analisis data'}
                  {active === 'history' && 'Riwayat pengecekan hydrant/APAR'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-center">
                <div className="md:hidden">
                  <ApiStatusIndicator />
                </div>
                
                {active === "manajemen" && activeDataTab === 'ruangan' && duplicateCount > 0 && (
                  <div className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span className="font-semibold">{duplicateCount} duplikat</span>
                  </div>
                )}
                
                {active === "men" && (
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition whitespace-nowrap"
                    title="Export data ke JSON"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Export Data</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                )}
                
                {active === "lantai" && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                    <span className="font-medium">Tips:</span> Klik ruangan/hydrant untuk detail
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content Section */}
          <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-100 flex-1 min-h-[600px] flex flex-col">
            {renderContent()}
            
            {/* API Status Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <div>
                  Status API: <span className={
                    apiStatus === 'online' ? 'text-green-600 font-bold' :
                    apiStatus === 'offline' ? 'text-red-600 font-bold' :
                    'text-yellow-600 font-bold'
                  }>{apiStatus}</span>
                  {apiStatus === 'offline' && (
                    <span className="ml-2 text-red-500">• Beberapa fitur mungkin terbatas</span>
                  )}
                </div>
                {duplicateCount > 0 && active !== 'manajemen' && activeDataTab === 'ruangan' && (
                  <button
                    onClick={() => {
                      setActive('manajemen');
                      setActiveDataTab('ruangan');
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline flex items-center gap-1"
                  >
                    <AlertTriangle size={12} />
                    {duplicateCount} data duplikat
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <footer className="mt-8 text-center py-6 text-gray-400 border-t border-gray-200">
        © {new Date().getFullYear()} UNISSA - Sistem Denah Digital + Hydrant v1.0
      </footer>

      {/* Popup untuk Ruangan */}
      {(popupRoomId || selectedRoom) && (
        <RoomPopup 
          roomId={popupRoomId}
          roomData={selectedRoom}
          onClose={closePopup}
        />
      )}

      {/* Popup untuk Hydrant */}
      {(popupHydrantId || selectedHydrant) && (
        <HydrantPopup 
          hydrantId={popupHydrantId}
          hydrantData={selectedHydrant}
          onClose={closePopup}
        />
      )}
    </div>
  );
}