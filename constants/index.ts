// --- Data Gedung ---
export const GEDUNG_OPTIONS = [
  { value: "Tamansari 1", label: "Tamansari 1" },
  { value: "Kedokteran", label: "Kedokteran" },
  { value: "Dekanat", label: "Dekanat" },
  { value: "Pascasarjana", label: "Pascasarjana" },
];

// --- Data Unit Kerja (Fakultas) ---
export const UNIT_KERJA_OPTIONS = [
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

// --- Sub Unit per Fakultas ---
export const SUB_UNIT_MAPPING: Record<string, Array<{ value: string; label: string }>> = {
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

// --- Lantai per Gedung ---
export const LANTAI_BY_GEDUNG: Record<string, Array<{ value: string; label: string }>> = {
  "Tamansari 1": [
    { value: "1", label: "Lantai 1" },
    { value: "2", label: "Lantai 2" },
    { value: "3", label: "Lantai 3" },
    { value: "4", label: "Lantai 4" },
  ],
  "Kedokteran": [
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
    { value: "ATAP", label: "Atap" },
  ],
  "Dekanat": [
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
    { value: "9", label: "Lantai 9" },
  ],
  "Pascasarjana": [
    { value: "B1", label: "Basement 1" },
    { value: "1", label: "Lantai 1" },
    { value: "2", label: "Lantai 2" },
    { value: "3", label: "Lantai 3" },
    { value: "4", label: "Lantai 4" },
    { value: "5", label: "Lantai 5" },
  ],
};

// --- Daftar Lantai (nilai saja) per Gedung ---
export const FLOORS_BY_BUILDING: Record<string, string[]> = {
  "Tamansari 1": ["1", "2", "3", "4"],
  "Kedokteran": ["B2", "B1", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Atap"],
  "Dekanat": ["B3", "B2", "B1", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  "Pascasarjana": ["B1", "1", "2", "3", "4", "5"],
};

// --- Data Gedung untuk UI ---
export const BUILDINGS_DATA = [
  { name: "Tamansari 1", code: "T1", totalFloors: 4, totalRooms: 120 },
  { name: "Kedokteran", code: "FK", totalFloors: 12, totalRooms: 85 },
  { name: "Dekanat", code: "DN", totalFloors: 12, totalRooms: 45 },
  { name: "Pascasarjana", code: "PS", totalFloors: 6, totalRooms: 60 },
];

// --- Role Permissions ---
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["dashboard", "lantai", "manajemen", "history", "admin"],
  viewer: ["dashboard", "lantai"],
};

// --- Role Colors ---
export const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  super_admin: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: "text-red-600" },
  admin: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", icon: "text-orange-600" },
  manager: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: "text-blue-600" },
  staff: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: "text-green-600" },
  supervisor: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", icon: "text-purple-600" },
  technician: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", icon: "text-amber-600" },
  coordinator: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200", icon: "text-teal-600" },
  auditor: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", icon: "text-indigo-600" },
  viewer: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", icon: "text-gray-600" },
};

// --- Role Display Labels ---
export const ROLE_DISPLAY: Record<string, string> = {
  admin: "Admin",
  viewer: "Viewer",
};

// --- History Data (Static) ---
export const HISTORY_PROTEKSI = [
  { alatProteksi: "APAR Tipe ABC 6kg", tanggal: "15-06-2024", status: "Normal", expired: "15-01-2025", keterangan: "Kondisi baik, segel utuh" },
  { alatProteksi: "APAR Tipe CO2 9kg", tanggal: "20-05-2024", status: "Rendah", expired: "20-11-2024", keterangan: "Perlu isi ulang tekanan" },
  { alatProteksi: "APAR Tipe ABC 12kg", tanggal: "10-09-2024", status: "Normal", expired: "10-03-2025", keterangan: "Pemeriksaan rutin, kondisi prima" },
  { alatProteksi: "Hydrant Box", tanggal: "05-06-2024", status: "Normal", expired: "05-12-2024", keterangan: "Siap pakai, selang lengkap" },
  { alatProteksi: "APAR Tipe ABC 6kg", tanggal: "28-08-2024", status: "Normal", expired: "28-02-2025", keterangan: "Pemeriksaan rutin" },
  { alatProteksi: "APAR Tipe Foam 9kg", tanggal: "15-03-2024", status: "Expired", expired: "15-09-2024", keterangan: "Sudah expired, perlu penggantian" },
  { alatProteksi: "Fire Blanket", tanggal: "01-10-2024", status: "Normal", expired: "01-04-2026", keterangan: "Kondisi baru, belum pernah digunakan" },
  { alatProteksi: "APAR Tipe ABC 3kg", tanggal: "30-07-2024", status: "Rendah", expired: "30-01-2025", keterangan: "Tekanan di bawah standar" },
];