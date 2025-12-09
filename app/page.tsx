"use client";
import { useState, useEffect, useCallback } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Home, Building, Settings, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Komponen Popup (Tema Light Mode/Biru) ---
/**
 * Menampilkan detail ruangan dalam mode popup.
 * @param {object} props
 * @param {string | null} props.roomId - ID ruangan yang diklik.
 * @param {() => void} props.onClose - Fungsi untuk menutup popup.
 */
// --- Tipe Data (Tambahan) ---

interface FormData {
  kodeRuangan: string;
  unitKerja: string;
  subUnitKerja: string;
  bagian: string;
  ukuran?: string;      // opsional
  ruangan: string;
  lokasi: string;
  keterangan?: string;  // opsional
}


// Data statis untuk Dropdown
const unitKerjaOptions = [
  { value: "01", label: "01. Fakultas Syariah" },
  { value: "02", label: "02. Fakultas Dakwah" },
  { value: "03", label: "03. Fakultas Tarbiyah dan Keguruan" },
  { value: "04", label: "04. Fakultas Hukum" },
  { value: "05", label: "05. Fakultas Psikologi" },
  { value: "06", label: "06. Fakultas MIPA" },
  { value: "07", label: "07. Fakultas Teknik" },
  { value: "08", label: "08. Fakultas Ilmu Komunikasi" },
  { value: "09", label: "09. Fakultas Ekonomi dan Bisnis" },
  { value: "10", label: "10. Fakultas Kedokteran" },
];

const subUnitKerjaOptions = [
  { value: "01", label: "01. Prodi Manajemen" },
  { value: "02", label: "02. Prodi Akuntansi" },
  { value: "03", label: "03. Prodi Ekonomi Pembangunan" },
  { value: "04", label: "04. Sekertariat Fakultas" },
  { value: "05", label: "05. Prodi Magister Akuntansi" },
  { value: "06", label: "06. Prodi Magister Manajemen" },
  { value: "07", label: "07. Prodi Doktor Manajemen" },

];

// --- Data simulasi untuk RoomPopup ---
const mockRuanganData = {
    ruang30300: { nama: "Ruang Rapat Utama" },
    ruangB: { nama: "Ruang Rapat Kecil B" },
    ruangC: { nama: "Ruang Seminar C" },
};

// --- KOMPONEN ROOM POPUP BARU (GANTI SELURUH KOMPONEN INI) ---

const RoomPopup: React.FC<RoomPopupProps> = ({ roomId, onClose }) => {
  const initialData: FormData = {
    kodeRuangan: roomId || "",
    unitKerja: "",
    subUnitKerja: "",
    bagian: "",
    ruangan: mockRuanganData[roomId as keyof typeof mockRuanganData]?.nama || "",
    lokasi: roomId || "",
    ukuran: "", // Harus string kosong
    keterangan: ""
  };



  const [formData, setFormData] = useState<FormData>(initialData);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});



useEffect(() => {
  if (!roomId) return;

  setFormData(prev => {
    // Kalau popup sudah punya data untuk room yang sama → JANGAN RESET
    if (prev.kodeRuangan === roomId) return prev;

    return {
      kodeRuangan: roomId,
      unitKerja: "",
      subUnitKerja: "",
      bagian: "",
      ruangan: mockRuanganData[roomId as keyof typeof mockRuanganData]?.nama || "",
      lokasi: roomId,
      ukuran: "",
      keterangan: ""
    };
  });

  setFormErrors({});
}, [roomId]);



  if (!roomId) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Hapus error saat input diubah
    setFormErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleGenerate = () => {
    const errors: Record<string, boolean> = {};
    let hasError = false;

    // Validasi fields required
    if (!formData.kodeRuangan) { errors.kodeRuangan = true; hasError = true; }
    if (!formData.unitKerja) { errors.unitKerja = true; hasError = true; }
    if (!formData.subUnitKerja) { errors.subUnitKerja = true; hasError = true; }
    if (!formData.ruangan) { errors.ruangan = true; hasError = true; }
    if (!formData.lokasi) { errors.lokasi = true; hasError = true; }

    setFormErrors(errors);
    if (hasError) {
      alert("Harap lengkapi semua kolom yang wajib diisi!");
      return;
    }

    // LOGIKA GENERATE DATA DI SINI

    // Anda bisa mengirim data ke API, atau menampilkannya.

    console.log("Data yang akan digenerate:", formData);

    alert(`Data berhasil digenerate!\nKode Ruangan: ${formData.kodeRuangan}\nUnit Kerja: ${unitKerjaOptions.find(u => u.value === formData.unitKerja)?.label}\nRuangan: ${formData.ruangan}`);
    onClose(); // Tutup popup setelah generate

  };

  // Helper untuk input field
const InputField = ({
  label,
  name,
  required = false,
  type = "text",
  children
}: {
  label: string;
  name: keyof FormData;
  required?: boolean;
  type?: string;
  children?: React.ReactNode;
}) => {
  const error = formErrors[name];

  return (
    <div className="flex flex-col space-y-1">
      <label className={`text-sm font-medium ${error ? "text-red-600" : "text-gray-700"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Kalau ada children, berarti select → JANGAN render <input> */}
      {children ? (
        children
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name] ?? ""}     // <-- FIX paling penting
          onChange={handleChange}
          className={`px-3 py-2 border rounded-lg text-gray-700 transition
            ${error ? "border-red-500 ring-2 ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"}`}
        />
      )}
    </div>
  );
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
      className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full relative border-t-4 border-blue-600 transform transition-all duration-300 scale-100 opacity-100"
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
        <h3 className="text-xl font-bold mb-6 text-blue-700">✍️ Formulir Data Ruangan</h3>
          <div className="space-y-4">

              {/* Kode Ruangan */}
              <div className="flex flex-col space-y-1">
                  <label htmlFor="kodeRuangan" className="text-sm font-medium text-gray-700">Kode Ruangan</label>
                  <input
                      id="kodeRuangan"
                      type="text"
                      name="kodeRuangan"
                      value={formData.kodeRuangan}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full text-gray-700 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      autoComplete="off"
                  />
              </div>

              {/* Unit Kerja */}
              <div className="flex flex-col space-y-1">
                  <label htmlFor="unitKerja" className="text-sm font-medium text-gray-700">Unit Kerja</label>
                  <select
                      id="unitKerja"
                      name="unitKerja"
                      value={formData.unitKerja}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full bg-white text-gray-700 transition appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                      <option value="" disabled>Pilih Unit Kerja</option>
                      {unitKerjaOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                  </select>
              </div>

              {/* Sub Unit Kerja */}
              <div className="flex flex-col space-y-1">
                  <label htmlFor="subUnitKerja" className="text-sm font-medium text-gray-700">Sub Unit Kerja</label>
                  <select
                      id="subUnitKerja"
                      name="subUnitKerja"
                      value={formData.subUnitKerja}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full bg-white text-gray-700 transition appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                      <option value="" disabled>Pilih Sub Unit Kerja</option>
                      {subUnitKerjaOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                  </select>
              </div>

              {/* Nama Ruangan */}
              <div className="flex flex-col space-y-1">
                  <label htmlFor="ruangan" className="text-sm font-medium text-gray-700">Nama Ruangan</label>
                  <input
                      id="ruangan"
                      type="text"
                      name="ruangan"
                      placeholder="Dapur"
                      value={formData.ruangan}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full text-gray-700 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      autoComplete="off"
                  />
              </div>

              {/* Lokasi */}
              <div className="flex flex-col space-y-1">
                  <label htmlFor="lokasi" className="text-sm font-medium text-gray-700">Lokasi</label>
                  <input
                      id="lokasi"
                      type="text"
                      name="lokasi"
                      placeholder="Nama Gedung & Lantai"
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full text-gray-700 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      autoComplete="off"
                  />
              </div>

              {/* Ukuran M² */}
              <div className="flex flex-col space-y-1">
                  <label htmlFor="ukuran" className="text-sm font-medium text-gray-700">Ukuran M²</label>
                  <input
                      id="ukuran"
                      type="text"
                      name="ukuran"
                      placeholder="3 x 4 meter"
                      value={formData.ukuran}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full text-gray-700 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      autoComplete="off"
                  />
              </div>

              {/* Keterangan */}
              <div className="flex flex-col space-y-1">
                  <label htmlFor="keterangan" className="text-sm font-medium text-gray-700">Keterangan</label>
                  <input
                      id="keterangan"
                      type="text" // Lebih baik diubah menjadi textarea jika ingin input panjang
                      name="keterangan"
                      placeholder="Keterangan "
                      value={formData.keterangan}
                      onChange={handleChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-full text-gray-700 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                      autoComplete="off"
                  />
              </div>
              
          </div>

          {/* Button Generate (Hanya memastikan warna sudah jelas: Hijau terang) */}
          <button
              onClick={handleGenerate}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 w-full shadow-lg text-center inline-flex items-center justify-center gap-2"
          >
              <Settings size={20} />
              Generate Data
          </button>

        <p className="text-xs text-center text-gray-500 mt-3">
          Form ini hanya muncul ketika area ruangan di peta diklik.
        </p>
      </div>
    </div>
  );
};

// --- Tipe Data ---

interface RoomPopupProps {
  roomId: string | null;
  onClose: () => void;
}

interface InteractiveMapProps {
  svgContent: string | "loading"; // Menentukan bahwa konten bisa berupa string SVG atau status "loading"
  setPopupRoomId: (roomId: string | null) => void; // Menentukan bahwa ini adalah fungsi yang menerima string atau null
  setHoveredRoomId: (roomId: string | null) => void;
  popupRoomId?: string | null; 
}

// DEFINISI TIPE UNTUK ITEM MENU (Ini mengatasi masalah `Home`, `size`, `className` jika terjadi di dalam map)

interface MenuItem {
    name: string;
    icon: React.ReactNode; // Menggunakan React.ReactNode untuk menampung komponen <Home size={20} />
    id: "dashboard" | "lantai" | "pengaturan";
}

// Data simulasi untuk RoomPopup (diambil dari file [id]/page.tsx)

// ----------------------------------------------------------------
// --- Komponen Peta Interaktif (Hanya SVG dan Zoom/Pan) ---
/**
 * Menampilkan peta SVG dengan fungsionalitas zoom, pan, dan klik interaktif.
 * @param {object} props
 * @param {string} props.svgContent - Konten string SVG.
 * @param {(roomId: string | null) => void} props.setPopupRoomId - State setter untuk menampilkan popup.
 */

const InteractiveMap: React.FC<InteractiveMapProps> = ({ svgContent, setPopupRoomId, popupRoomId }) => {

    
    // Gunakan ref atau containerID yang unik untuk memastikan listener menempel ke SVG yang benar
    const containerId = "svg-map-container";

    // Callback untuk event handling, dijamin stabil
    const addSvgInteractions = useCallback(() => {
      if (!svgContent || svgContent === "loading") return;

      // ❗ MATIKAN SEMUA EVENT SVG SAAT POPUP TERBUKA
      if (popupRoomId) {
        return;
      };

      const svgContainer = document.querySelector(`#${containerId}`);
      if (!svgContainer || svgContainer.children.length === 0) return;

      const svg = svgContainer.children[0];
      if (svg.tagName.toLowerCase() !== 'svg') return;
        
            const handleRoomClick = (event: Event) => { // Perbaikan: Tambahkan tipe Event
            const el = event.currentTarget as SVGElement; // Perbaikan: Aset ke SVGElement/HTMLElement
            const id = el.getAttribute("id");
            // Pastikan ID ada dan bukan ID default SVG itu sendiri
            if (id && id.toLowerCase() !== containerId.toLowerCase()) { 
                setPopupRoomId(id);
            }
        };

        // Fungsi untuk menetapkan warna saat kursor masuk (Aksen Biru Muda)
            const handleMouseEnter = (event: Event) => { // Perbaikan: Tambahkan tipe Event
            const el = event.currentTarget as SVGElement;
            el.style.transition = "fill 0.3s ease, opacity 0.3s ease";
            el.style.fill = "#90CDF4"; // Warna Biru Muda yang lebih intens
            el.style.opacity = "0.8";
            el.style.cursor = "pointer";
        };

        // Fungsi untuk mengembalikan warna saat kursor keluar
            const handleMouseLeave = (event: Event) => {
            const el = event.currentTarget as SVGElement; // Lebih spesifik ke SVGElement
            el.style.fill = ""; 
            el.style.opacity = "1";
        };

        // Hanya ambil elemen yang memiliki ID (yaitu ruangan), kecuali container utamanya
        const elements = svg.querySelectorAll("path[id], rect[id], polygon[id]");
        
        // Tambahkan listener ke setiap elemen
        elements.forEach((el) => {
            // Tambahkan listener
            el.addEventListener("click", handleRoomClick);
            el.addEventListener("mouseenter", handleMouseEnter);
            el.addEventListener("mouseleave", handleMouseLeave);
        });

        // Clean-up function (Dikembalikan dari useEffect)
        return () => {
            elements.forEach((el) => {
                el.removeEventListener("click", handleRoomClick);
                el.removeEventListener("mouseenter", handleMouseEnter);
                el.removeEventListener("mouseleave", handleMouseLeave);
            });
        };
    }, [svgContent, setPopupRoomId, popupRoomId]); 

    // Panggil callback setelah SVG di-render
    useEffect(() => {
        // Gunakan setTimeout 0 untuk memastikan DOM sudah diperbarui
        const timeoutId = setTimeout(addSvgInteractions, 0); 
        return () => clearTimeout(timeoutId); // Clean-up timeout
    }, [svgContent, addSvgInteractions, popupRoomId]);


    return (
        <div className="w-full h-full min-h-[500px] relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
            <TransformWrapper
              initialScale={1}
              wheel={{ step: 0.1 }}
              doubleClick={{ disabled: true }}
              pinch={{ disabled: true }}
              panning={{ excluded: ["input", "select", "textarea", "button"] }}
              minScale={0.1}
              maxScale={5}
            >

                {/* Anda dapat menambahkan Reset Button di sini jika mau: {({ resetTransform }) => <button onClick={resetTransform}>Reset</button>} */}
                <TransformComponent
                    wrapperStyle={{ width: "100%", height: "100%" }}
                    contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                    {/* Kontainer SVG */}
                    <div
                        id={containerId}
                        // Tambahkan kelas untuk kontrol tata letak SVG
                        className="w-full h-full flex justify-center items-center" 
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                </TransformComponent>
            </TransformWrapper>
            <div className="absolute top-4 left-4 bg-white/90 p-2 rounded text-xs text-gray-600 shadow-md border border-gray-200">
                Klik ruangan untuk detail. Scroll/pinch untuk zoom.
            </div>
        </div>
    );
}

// -----------------------------------------------------------------

// --- Komponen Utama (Menggabungkan Dashboard dan Peta) ---
export default function DashboardWithMap() {
  const router = useRouter();
  const [active, setActive] = useState("lantai"); // Default ke Lantai untuk menunjukkan peta
  const [menuOpen, setMenuOpen] = useState(false);
  
  // State untuk Peta SVG
  // Gunakan type assertion untuk menghindari error typescript jika tidak menggunakan typescript
  const [svgContent, setSvgContent] = useState(""); 
  const [popupRoomId, setPopupRoomId] = useState<string | null>(null);

  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  const lantai = [1, 2, 3, 4, 5, 6, 7, 8];

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, id: "dashboard" },
    { name: "Daftar Lantai", icon: <Building size={20} />, id: "lantai" },
    { name: "Pengaturan", icon: <Settings size={20} />, id: "pengaturan" },
  ];
  
  // 1. Ambil SVG saat komponen dimuat atau aktif berubah ke 'lantai'
  useEffect(() => {
    // Memuat SVG hanya jika 'lantai' aktif dan belum dimuat sebelumnya
    if (active === "lantai" && svgContent === "") { 
        setSvgContent("loading"); // Set status loading agar tidak fetch berulang
        fetch("/lantai3.svg")
            .then((res) => {
                if (!res.ok) throw new Error("SVG not found");
                return res.text();
            })
            .then((data) => setSvgContent(data))
            .catch(error => {
                console.error("Failed to load SVG:", error);
                setSvgContent("<p class='text-red-500 text-center py-10'>Error: SVG lantai3.svg tidak ditemukan atau gagal dimuat.</p>");
            });
    }
  }, [active]); // Dependensi hanya 'active'

  // Fungsi untuk menutup popup
  const closePopup = () => {
    setPopupRoomId(null);
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-30 w-full bg-white shadow-lg border-b border-gray-100">
        <div className="flex items-center justify-between p-4 sm:px-8 max-w-7xl mx-auto">
          
          <div className="text-left flex flex-col">
            <h1 className="text-xl sm:text-2xl font-extrabold text-blue-700">
              Gedung Dekanat
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Jl. Tamansari No. 24-26
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
        
        <div className="px-4 sm:px-8 pt-4 sm:pt-8 **pb-16** max-w-7xl mx-auto w-full flex flex-col min-h-full">
            
            {/* Header Konten */}
            <header className="flex items-center justify-between mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-gray-200">
                <h2 className="text-2xl sm:text-3xl font-bold capitalize text-gray-800">
                    {menuItems.find(item => item.id === active)?.name || 'Dashboard'}
                </h2>
                <span className="text-gray-500 text-sm sm:text-base bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    Admin Area
                </span>
            </header>

            {/* Content Section */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-2xl border border-gray-100 flex-1 min-h-[600px] flex flex-col">
                {active === "dashboard" && (
                    <div className="h-full flex flex-col flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-700">
                            <Home className="inline mr-2 text-blue-500" size={24} /> Selamat Datang
                        </h3>
                        <div className="p-4 bg-blue-50/50 rounded-lg border-l-4 border-blue-600">
                            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                                Kelola denah lantai, ruangan, dan data terkait **Gedung Dekanat Tamansari** dengan antarmuka yang bersih dan terstruktur.
                            </p>
                        </div>
                    </div>
                )}

                {/* Tampilan Peta Interaktif (InteractiveMap) */}
                {active === "lantai" && (
                    <div className="h-full flex flex-col flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-5 text-blue-700">
                            <Building className="inline mr-2 text-blue-500" size={24} /> Denah Lantai (Interaktif)
                        </h3>
                        {/* Peta akan mengisi ruang yang tersisa */}
                        <div 
                          className={`flex-1 min-h-[500px] relative ${popupRoomId ? "pointer-events-none" : ""}`}
                        >
                            {svgContent && svgContent !== "loading" ? (
                                <InteractiveMap
                                    svgContent={svgContent}
                                    setPopupRoomId={setPopupRoomId}
                                    setHoveredRoomId={setHoveredRoomId}
                                />
                            ) : (
                                "Loading map..."
                            )}
                        </div>

                        
                        {/* Daftar Lantai (pilihan lain) */}
                           <div className="mt-8">
                                <h4 className="text-lg font-semibold mb-3 text-gray-700">Pilih Lantai Lain:</h4>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                    {lantai.map((n) => (
                                        <Link
                                            key={n}
                                            href={`/lantai/${n}`} // Contoh link per lantai
                                            className="bg-gray-100 border border-gray-300 text-center py-2 rounded transition hover:bg-blue-100 text-blue-700 text-sm font-medium shadow-sm"
                                        >
                                            Lantai {n}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                    </div>
                )}

                {active === "pengaturan" && (
                    <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold mb-4 text-blue-700">
                            <Settings className="inline mr-2 text-blue-500" size={24} /> Pengaturan Sistem
                        </h3>
                        <div className="p-4 bg-gray-100 rounded-lg border-l-4 border-gray-400">
                            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                                Bagian ini disediakan untuk opsi tema, profil admin, dan pengelolaan sistem lainnya yang akan datang.
                            </p>
                        </div>
                    </div>
                )}    
                 <footer className="mt-8 text-center py-6 text-gray-400 border-t border-gray-200">
                  © {new Date().getFullYear()} UNISBA Reserved
                 </footer>
            </section>
        </div>
      </main>
      
      {/* Komponen Popup (Ditempatkan di luar main agar z-index tetap tinggi) */}
      <RoomPopup 
        roomId={popupRoomId} 
        onClose={closePopup} 
      />
    </div>
    
  );
}