import { SUB_UNIT_MAPPING, FLOORS_BY_BUILDING, LANTAI_BY_GEDUNG } from "@/constants";
import { apiService, RoomData, ApiResponse } from "@/services/api";
import type { FakultasKey, RoomWithSource } from "@/types";

// --- Navigasi & Path ---

export const getBuildingPath = (gedung: string, lantai?: string): string => {
  const gedungMap: Record<string, string> = {
    Dekanat: "dekanat",
    "Tamansari 1": "tamansari1",
    Kedokteran: "kedokteran",
    Pascasarjana: "pascasarjana",
  };
  const pathGedung = gedungMap[gedung];
  return lantai ? `/${pathGedung}/${lantai}` : `/${pathGedung}`;
};

export const getGedungFromPath = (path: string): string | null => {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const pathMap: Record<string, string> = {
    dekanat: "Dekanat",
    tamansari1: "Tamansari 1",
    kedokteran: "Kedokteran",
    pascasarjana: "Pascasarjana",
  };

  return pathMap[parts[0]] ?? null;
};

export const getLantaiFromPath = (path: string): string | null => {
  const parts = path.split("/").filter(Boolean);
  return parts.length >= 2 ? parts[1] : null;
};

// --- Gedung & Lantai ---

export const getLantaiOptions = (gedung: string) => {
  return LANTAI_BY_GEDUNG[gedung] ?? [];
};

export const getFloorsByBuilding = (building: string | null): string[] => {
  if (!building) return [];
  return FLOORS_BY_BUILDING[building] ?? [];
};

// --- Sub Unit ---

export const getSubUnitsByFakultas = (
  fakultas: string
): Array<{ value: string; label: string }> => {
  return SUB_UNIT_MAPPING[fakultas] ?? [];
};

// --- SVG Loader ---

export const loadSvgContent = async (
  gedung: string,
  lantai?: string
): Promise<string | null> => {
  try {
    let fileName = "";

    if (gedung === "Dekanat") {
      fileName = lantai ? `lantai${lantai}.svg` : "denahv2.svg";
    } else if (gedung === "Kedokteran") {
      const lantaiKey = lantai?.toLowerCase().replace(" ", "_");
      fileName = lantai ? `lantai${lantaiKey}_kedokteran.svg` : "kedokteran.svg";
    } else if (gedung === "Pascasarjana") {
      const lantaiKey = lantai?.toLowerCase().replace(" ", "_");
      fileName = lantai ? `lantai${lantaiKey}_pasca.svg` : "pascasarjana.svg";
    }

    const response = await fetch(`/${fileName}`);
    return await response.text();
  } catch (error) {
    console.error("Gagal load SVG:", error);
    return null;
  }
};

// --- Error Handling ---

export const extractErrorMessage = (error: unknown): string => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.msg === "string") return obj.msg;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.description === "string") return obj.description;

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error object";
    }
  }

  return String(error);
};

// --- Data Export ---

export const exportToJson = (data: unknown[], filename: string): void => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileName = `${filename}-${new Date().toISOString().split("T")[0]}.json`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileName);
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
};

// ============================================================
// --- Multi-Fakultas API Helpers ---
// ============================================================

/**
 * Mapping dari FakultasKey ke label yang tampil di UI
 */
export const FAKULTAS_KEY_LABEL: Record<FakultasKey, string> = {
  fk_ekonomi:  "Fakultas Ekonomi dan Bisnis",
  fk_syariah:  "Fakultas Syariah",
  fk_tarbiyah: "Fakultas Tarbiyah dan Keguruan",
  fk_teknik:   "Fakultas Teknik",
  fk_hukum:    "Fakultas Hukum",
  fk_fikom:    "Fakultas Ilmu Komunikasi",
};

/**
 * Mapping nilai field `fk` (dari database) → FakultasKey (endpoint)
 * Dipakai untuk menentukan ke endpoint mana CRUD diarahkan.
 */
export const FK_VALUE_TO_KEY: Record<string, FakultasKey> = {
  "Fakultas Ekonomi dan Bisnis":       "fk_ekonomi",
  "Fakultas Syariah":                   "fk_syariah",
  "Fakultas Tarbiyah dan Keguruan":    "fk_tarbiyah",
  "Fakultas Teknik":                    "fk_teknik",
  "Fakultas Hukum":                     "fk_hukum",
  "Fakultas Ilmu Komunikasi":           "fk_fikom",
};

/**
 * Kembalikan FakultasKey berdasarkan nilai fk pada data ruangan.
 * Default ke fk_ekonomi jika tidak ditemukan.
 */
export const getFakultasKey = (fkValue: string): FakultasKey => {
  return FK_VALUE_TO_KEY[fkValue] ?? "fk_ekonomi";
};

// ---- GET (fetch list) ----
type FetchFn = (skip?: number, limit?: number) => Promise<ApiResponse<RoomData[]>>;

const FETCH_MAP: Record<FakultasKey, FetchFn> = {
  fk_ekonomi:  (s, l) => apiService.getFakultasEkonomi(s, l),
  fk_syariah:  (s, l) => apiService.getFakultasSyariah(s, l),
  fk_tarbiyah: (s, l) => apiService.getFakultasTarbiyah(s, l),
  fk_teknik:   (s, l) => apiService.getFakultasTeknik(s, l),
  fk_hukum:    (s, l) => apiService.getFakultasHukum(s, l),
  fk_fikom:    (s, l) => apiService.getFakultasFikom(s, l),
};

/**
 * Ambil semua data ruangan dari seluruh tabel fakultas secara paralel,
 * lalu gabungkan jadi satu array RoomWithSource[].
 */
export const fetchAllFakultasRooms = async (): Promise<RoomWithSource[]> => {
  const keys = Object.keys(FETCH_MAP) as FakultasKey[];

  const results = await Promise.allSettled(
    keys.map((key) => FETCH_MAP[key](0, 1000))
  );

  const combined: RoomWithSource[] = [];

  results.forEach((result, idx) => {
    const key = keys[idx];
    if (result.status === "fulfilled" && result.value.success && result.value.data) {
      result.value.data.forEach((room) => {
        combined.push({ ...room, _source: key });
      });
    } else {
      console.warn(`Gagal mengambil data dari ${key}:`, 
        result.status === "rejected" ? result.reason : result.value.error
      );
    }
  });

  return combined;
};

// ---- GET by No ----
const FETCH_BY_NO_MAP: Record<FakultasKey, (no: number) => Promise<ApiResponse<RoomData>>> = {
  fk_ekonomi:  (no) => apiService.getFakultasEkonomiByNo(no),
  fk_syariah:  (no) => apiService.getFakultasSyariahByNo(no),
  fk_tarbiyah: (no) => apiService.getFakultaTarbiyahsByNo(no),
  fk_teknik:   (no) => apiService.getFakultasTeknikByNo(no),
  fk_hukum:    (no) => apiService.getFakultasHukumByNo(no),
  fk_fikom:    (no) => apiService.getFakultasFikomByNo(no),
};

export const getFakultasRoomByNo = (
  key: FakultasKey,
  no: number
): Promise<ApiResponse<RoomData>> => FETCH_BY_NO_MAP[key](no);

// ---- CREATE ----
type CreateFn = (data: Omit<RoomData, "id" | "created_at">) => Promise<ApiResponse<RoomData>>;

const CREATE_MAP: Record<FakultasKey, CreateFn> = {
  fk_ekonomi:  (d) => apiService.createFakultasEkonomi(d),
  fk_syariah:  (d) => apiService.createFakultasSyariah(d),
  fk_tarbiyah: (d) => apiService.createFakultasTarbiyah(d),
  fk_teknik:   (d) => apiService.createFakultasTeknik(d),
  fk_hukum:    (d) => apiService.createFakultasHukum(d),
  fk_fikom:    (d) => apiService.createFakultasFikom(d),
};

export const createFakultasRoom = (
  key: FakultasKey,
  data: Omit<RoomData, "id" | "created_at">
): Promise<ApiResponse<RoomData>> => CREATE_MAP[key](data);

// ---- UPDATE ----
type UpdateFn = (id: number, data: Partial<RoomData>) => Promise<ApiResponse<RoomData>>;

const UPDATE_MAP: Record<FakultasKey, UpdateFn> = {
  fk_ekonomi:  (id, d) => apiService.updateFakultasEkonomi(id, d),
  fk_syariah:  (id, d) => apiService.updateFakultasSyariah(id, d),
  fk_tarbiyah: (id, d) => apiService.updateFakultasTarbiyah(id, d),
  fk_teknik:   (id, d) => apiService.updateFakultasTeknik(id, d),
  fk_hukum:    (id, d) => apiService.updateFakultasHukum(id, d),
  fk_fikom:    (id, d) => apiService.updateFakultasFikom(id, d),
};

export const updateFakultasRoom = (
  key: FakultasKey,
  id: number,
  data: Partial<RoomData>
): Promise<ApiResponse<RoomData>> => UPDATE_MAP[key](id, data);

// ---- DELETE ----
type DeleteFn = (id: number) => Promise<ApiResponse<{ message: string }>>;

const DELETE_MAP: Record<FakultasKey, DeleteFn> = {
  fk_ekonomi:  (id) => apiService.deleteFakultasEkonomi(id),
  fk_syariah:  (id) => apiService.deleteFakultasSyariah(id),
  fk_tarbiyah: (id) => apiService.deleteFakultasTarbiyah(id),
  fk_teknik:   (id) => apiService.deleteFakultasTeknik(id),
  fk_hukum:    (id) => apiService.deleteFakultasHukum(id),
  fk_fikom:    (id) => apiService.deleteFakultasFikom(id),
};

export const deleteFakultasRoom = (
  key: FakultasKey,
  id: number
): Promise<ApiResponse<{ message: string }>> => DELETE_MAP[key](id);