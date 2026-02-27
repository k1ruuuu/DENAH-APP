'use client';

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Save,
  Eye,
  Trash2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { apiService, MasterData } from "@/services/api";
import { ResponsiveInput, ResponsiveSelect } from "@/components/ui/FormElements";
import { GEDUNG_OPTIONS, UNIT_KERJA_OPTIONS } from "@/constants";
import {
  getSubUnitsByFakultas,
  getFakultasKey,
  getFakultasRoomByNo,
  createFakultasRoom,
  updateFakultasRoom,
  deleteFakultasRoom,
} from "@/utils";
import type { FormData, FakultasKey } from "@/types";

// --- Props ---

interface RoomPopupProps {
  roomId: string | null;
  onClose: () => void;
}

// --- Helper ---

const getPopupSizeClass = (width: number): string => {
  if (width < 640) return "w-[95vw] max-h-[90vh]";
  if (width < 1024) return "w-[90vw] max-h-[85vh]";
  return "w-[800px] max-h-[80vh]";
};

const getScrollableHeightClass = (width: number): string => {
  if (width < 640) return "max-h-[calc(90vh-140px)]";
  if (width < 1024) return "max-h-[calc(85vh-160px)]";
  return "max-h-[calc(80vh-180px)]";
};

// Semua tabel fakultas yang dicek saat load data berdasarkan nomor ruangan
const ALL_FAKULTAS_KEYS: FakultasKey[] = [
  "fk_ekonomi",
  "fk_syariah",
  "fk_tarbiyah",
  "fk_teknik",
  "fk_hukum",
  "fk_fikom",
];

// --- Komponen Utama ---

export const RoomPopup: React.FC<RoomPopupProps> = ({ roomId, onClose }) => {
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
  // Track dari tabel mana data ini berasal — untuk routing CRUD yang tepat
  const [sourceKey, setSourceKey] = useState<FakultasKey>("fk_ekonomi");
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [customSubUnit, setCustomSubUnit] = useState("");
  const [showCustomSubUnit, setShowCustomSubUnit] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // --- Window Resize ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Klik di luar popup ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // --- Load Master Data ---
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

  // --- Load Room Data ---
  // Cari data berdasarkan nomor ruangan di SEMUA tabel fakultas secara paralel.
  // Tabel pertama yang mengembalikan data valid = sumber data ruangan ini.
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      setIsLoading(true);
      try {
        const no = parseInt(roomId.replace(/\D/g, ""));
        if (isNaN(no)) return;

        // Cari di semua tabel sekaligus
        const results = await Promise.allSettled(
          ALL_FAKULTAS_KEYS.map((key) => getFakultasRoomByNo(key, no))
        );

        let found = false;
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const key = ALL_FAKULTAS_KEYS[i];

          if (
            result.status === "fulfilled" &&
            result.value.success &&
            result.value.data
          ) {
            const roomData = result.value.data;

            setFormData({
              no: roomData.no,
              fk: roomData.fk,
              subUnit: roomData.subUnit ?? "",
              ruangan: roomData.ruangan,
              lantai: roomData.lantai,
              gedung: roomData.gedung,
              ukuranR: roomData.ukuranR,
              ket: roomData.ket ?? "",
            });

            // Tandai subUnit custom jika tidak ada di daftar predefined
            const predefined = getSubUnitsByFakultas(roomData.fk);
            if (roomData.subUnit && !predefined.some((o) => o.value === roomData.subUnit)) {
              setCustomSubUnit(roomData.subUnit);
              setShowCustomSubUnit(true);
            }

            setExistingId(roomData.id ?? null);
            setSourceKey(key);         // ← simpan tabel sumber
            setIsEditing(true);
            found = true;
            break; // stop setelah ketemu di tabel pertama
          }
        }

        // Jika tidak ditemukan di mana pun = data baru
        if (!found) {
          setFormData((prev) => ({ ...prev, no, ruangan: `Ruangan ${roomId}` }));
          setIsEditing(false);
          setExistingId(null);
          setSourceKey("fk_ekonomi"); // default untuk data baru
        }
      } catch (error) {
        console.error("Error fetching room data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  // --- Sub Unit Options ---
  const getSubUnitOptions = () => {
    if (!formData.fk) return [];

    const predefined = getSubUnitsByFakultas(formData.fk);
    const additional: Array<{ value: string; label: string }> = [];

    if (masterData?.subUnits[formData.fk]) {
      for (const subUnit of masterData.subUnits[formData.fk]) {
        if (!predefined.some((p) => p.value === subUnit.value)) {
          additional.push(subUnit);
        }
      }
    }

    return [...predefined, ...additional];
  };

  // --- Handlers ---
  const handleFakultasChange = (value: string) => {
    setFormData((prev) => ({ ...prev, fk: value, subUnit: "" }));
    setShowCustomSubUnit(false);
    setCustomSubUnit("");

    // Saat user ganti fakultas pada data BARU, update sourceKey otomatis
    if (!isEditing) {
      setSourceKey(getFakultasKey(value));
    }
  };

  const handleSubUnitChange = (value: string) => {
    if (value === "custom") {
      setShowCustomSubUnit(true);
      setFormData((prev) => ({ ...prev, subUnit: "" }));
    } else {
      setShowCustomSubUnit(false);
      setFormData((prev) => ({ ...prev, subUnit: value }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "fk") {
      handleFakultasChange(value);
    } else if (name === "subUnit") {
      handleSubUnitChange(value);
    } else if (["no", "lantai", "ukuranR"].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomSubUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSubUnit(e.target.value);
    setFormData((prev) => ({ ...prev, subUnit: e.target.value }));
  };

  // --- Submit: routing ke endpoint yang sesuai fakultas ---
  const handleSubmit = async () => {
    if (!formData.no || !formData.fk || !formData.ruangan || !formData.gedung) {
      alert("Harap isi semua field yang wajib!");
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        subUnit: showCustomSubUnit ? customSubUnit : formData.subUnit,
      };

      // Tentukan tabel tujuan berdasarkan field `fk` yang dipilih user.
      // Untuk edit: gunakan sourceKey (tabel asal). 
      // Untuk create: gunakan key dari pilihan fk saat ini.
      const targetKey: FakultasKey = isEditing
        ? sourceKey
        : getFakultasKey(formData.fk);

      const result =
        isEditing && existingId
          ? await updateFakultasRoom(targetKey, existingId, submitData)
          : await createFakultasRoom(targetKey, submitData);

      if (result.success) {
        alert(isEditing ? "Data berhasil diperbarui!" : "Data berhasil disimpan!");
        onClose();
      } else {
        alert(`Gagal menyimpan data: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Delete: routing ke endpoint yang sesuai tabel sumber ---
  const handleDelete = async () => {
    if (!existingId || !confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    setIsLoading(true);
    try {
      const result = await deleteFakultasRoom(sourceKey, existingId);
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
      window.open(`/ruangan/${existingId}`, "_blank");
    } else {
      alert("Simpan data terlebih dahulu untuk melihat detail");
    }
  };

  if (!roomId) return null;

  const subUnitOptions = getSubUnitOptions();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
      <div
        ref={popupRef}
        className={`bg-white rounded-xl sm:rounded-2xl shadow-2xl mx-auto overflow-hidden border border-slate-200 ${getPopupSizeClass(windowWidth)} flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                {isEditing ? "Edit Data Ruangan" : "Tambah Data Ruangan"}
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
              <>
                <div className="bg-emerald-500/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-emerald-100 text-xs">
                  Mode Edit
                </div>
                {/* Tampilkan tabel sumber agar mudah di-debug */}
                <div className="bg-white/10 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-white/70 text-xs">
                  Sumber: <span className="font-mono">{sourceKey}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className={`p-3 sm:p-4 md:p-6 overflow-y-auto flex-1 ${getScrollableHeightClass(windowWidth)}`}
        >
          {isLoading ? (
            <div className="py-8 sm:py-12 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600" />
              </div>
              <p className="mt-3 sm:mt-4 text-slate-600 font-medium text-sm sm:text-base">
                Memuat data ruangan...
              </p>
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
                  options={UNIT_KERJA_OPTIONS}
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
                {/* Sub Unit */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sub Unit{" "}
                    {!formData.fk && (
                      <span className="text-xs font-normal text-slate-500">
                        (Pilih fakultas terlebih dahulu)
                      </span>
                    )}
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
                          {subUnitOptions.map((option) => (
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
                    value={formData.ukuranR ?? ""}
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
                  options={GEDUNG_OPTIONS}
                  required
                  className="text-sm"
                />
              </div>

              {/* Keterangan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Keterangan
                </label>
                <textarea
                  name="ket"
                  value={formData.ket ?? ""}
                  onChange={handleChange}
                  rows={windowWidth < 640 ? 2 : 3}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Tambahkan catatan atau keterangan tentang ruangan..."
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-slate-500">Maksimal 500 karakter.</p>
                  <span className="text-xs text-slate-400">{formData.ket?.length ?? 0}/500</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4 md:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    isEditing ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isEditing ? "Mengedit Data" : "Data Baru"}
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
                    Hapus
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
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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
                <span className="text-xs">
                  Edit data akan memperbarui informasi di database secara permanen
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};