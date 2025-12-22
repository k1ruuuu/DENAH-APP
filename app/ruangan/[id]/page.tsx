"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiService, RoomData } from "@/services/api";
import { 
  Building, 
  ArrowLeft, 
  MapPin, 
  Layers, 
  Square, 
  FileText,
  Edit,
  Trash2,
  Download,
  Printer,
  Share2,
  Copy,
  ExternalLink,
  Home,
  Database,
  Code
} from "lucide-react";
import Link from "next/link";

export default function RuanganDetail() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedRooms, setRelatedRooms] = useState<RoomData[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch data dari API berdasarkan ID
  const fetchRoomData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Coba cari berdasarkan nomor ruangan (prioritas utama)
      const no = parseInt(id as string);
      
      if (!isNaN(no)) {
        // Cari berdasarkan nomor ruangan
        const result = await apiService.getFakultasEkonomiByNo(no);
        if (result.success && result.data) {
          setData(result.data);
          await fetchRelatedRooms(result.data);
        } else {
          // Jika tidak ditemukan berdasarkan nomor, coba berdasarkan ID
          const byIdResult = await apiService.getFakultasEkonomiById(no);
          if (byIdResult.success && byIdResult.data) {
            setData(byIdResult.data);
            await fetchRelatedRooms(byIdResult.data);
          } else {
            setError("Ruangan tidak ditemukan dalam database");
          }
        }
      } else {
        setError("ID ruangan tidak valid (harus angka)");
      }
    } catch (err) {
      console.error("Error fetching room data:", err);
      setError("Gagal memuat data dari server");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedRooms = async (roomData: RoomData) => {
    try {
      const relatedResult = await apiService.getFakultasEkonomi(0, 10, {
        gedung: roomData.gedung,
      });
      if (relatedResult.success && relatedResult.data) {
        setRelatedRooms(
          relatedResult.data
            .filter(room => room.id !== roomData.id)
            .slice(0, 5)
        );
      }
    } catch (err) {
      console.error("Error fetching related rooms:", err);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [id]);

  const handleDelete = async () => {
    if (!data?.id || !confirm(`Yakin ingin menghapus data ruangan ${data.ruangan}?`)) return;
    
    setIsDeleting(true);
    try {
      const result = await apiService.deleteFakultasEkonomi(data.id);
      if (result.success) {
        alert("Data berhasil dihapus");
        router.push("/");
      } else {
        alert(`Gagal menghapus: ${result.error}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Terjadi kesalahan saat menghapus");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Data Ruangan: ${data?.ruangan}`,
        text: `Informasi ruangan ${data?.ruangan} di ${data?.gedung}, Lantai ${data?.lantai}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      alert("Link berhasil disalin ke clipboard!");
    }
  };

  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ruangan-${data?.no || data?.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getApiEndpoint = () => {
    if (!data) return '';
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1';
    return `${baseUrl}/fk_ekonomi/${data.id}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Memuat data ruangan...</h2>
          <p className="text-gray-500 mt-2">Sedang mengambil data dari database</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="text-red-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ruangan Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">
            {error || "Data ruangan tidak tersedia dalam database."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={20} />
              Kembali ke Dashboard
            </button>
            
            <Link
              href={`/?room=${id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <Edit size={20} />
              Buat Data Baru
            </Link>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">URL yang diminta:</p>
            <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
              /ruangan/{id}
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Kembali ke Dashboard</span>
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {data.ruangan}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">
                  {data.gedung} • Lantai {data.lantai}
                </p>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Kode: {data.no}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Printer size={18} />
                Cetak
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                {copiedUrl ? "✓ Tersalin" : <Copy size={18} />}
                {copiedUrl ? "Tersalin" : "Salin Link"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Left Column - Detail Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-500" size={24} />
                  Informasi Detail Ruangan
                </h2>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {data.no}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Code size={14} />
                      Kode Ruangan
                    </label>
                    <p className="text-lg font-semibold text-gray-800 mt-1">{data.no}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fakultas</label>
                    <p className="text-lg font-semibold text-gray-800">{data.fk}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sub Unit</label>
                    <p className="text-lg font-semibold text-gray-800">{data.subUnit || "-"}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      Lokasi Gedung
                    </label>
                    <p className="text-lg font-semibold text-gray-800 mt-1">{data.gedung}</p>
                    <Link
                      href={`/?gedung=${encodeURIComponent(data.gedung)}`}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                    >
                      Lihat semua ruangan di gedung ini <ExternalLink size={12} />
                    </Link>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Layers size={14} className="text-gray-400" />
                      Lantai
                    </label>
                    <p className="text-lg font-semibold text-gray-800">Lantai {data.lantai}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Square size={14} className="text-gray-400" />
                      Ukuran Ruangan
                    </label>
                    <p className="text-lg font-semibold text-gray-800">
                      {data.ukuranR ? `${data.ukuranR} m²` : "Tidak tersedia"}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Input</label>
                    <p className="text-gray-700">
                      {data.created_at 
                        ? new Date(data.created_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "-"
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Keterangan */}
              {data.ket && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-500 block mb-2">Keterangan</label>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {data.ket}
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                <Link
                  href={`/?room=${data.no}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Building size={20} />
                  Lihat di Peta
                </Link>

                <Link
                  href={`/?gedung=${encodeURIComponent(data.gedung)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Home size={20} />
                  Ruangan Lain ({data.gedung})
                </Link>
              </div>
            </div>

          {/* Right Column - Related & Stats */}
          <div className="space-y-8">
            {/* URL Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🔗 URL & Parameter</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">URL Saat Ini</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <code className="text-sm text-gray-700 break-all">
                      {window.location.href}
                    </code>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    URL menggunakan <strong>nomor ruangan ({data.no})</strong> bukan ID database
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Parameter URL</label>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <code className="text-sm text-blue-700 block mb-1">
                        /?room={data.no}
                      </code>
                      <p className="text-xs text-gray-600">
                        Buka peta dengan fokus pada ruangan ini
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Rooms */}
            {relatedRooms.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  🏢 Ruangan Lain di {data.gedung}
                </h3>
                <div className="space-y-3">
                  {relatedRooms.map((room) => (
                    <Link
                      key={room.id}
                      href={`/ruangan/${room.no}`}
                      className="block p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">
                            {room.ruangan}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Kode: {room.no} • Lantai {room.lantai}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-700">
                            {room.ukuranR ? `${room.ukuranR} m²` : "-"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/?gedung=${encodeURIComponent(data.gedung)}`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-4"
                >
                  Lihat semua ruangan di gedung ini →
                </Link>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">📊 Statistik Data</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm opacity-90">Data Diperbarui</p>
                  <p className="text-xl font-bold">
                    {data.created_at 
                      ? new Date(data.created_at).toLocaleDateString('id-ID')
                      : "Baru"
                    }
                  </p>
                </div>
                <div className="pt-4 border-t border-blue-400">
                  <p className="text-sm opacity-90">Status Database</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <p className="font-medium">Tersinkronisasi</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-blue-400">
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🚀 Tautan Cepat</h3>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <Home className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Dashboard Utama</p>
                    <p className="text-sm text-gray-500">Kembali ke halaman utama</p>
                  </div>
                </Link>
                
                <Link
                  href={`/?room=${data.no}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <Building className="text-green-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Lihat di Peta</p>
                    <p className="text-sm text-gray-500">Buka denah dengan ruangan ini</p>
                  </div>
                </Link>
                
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <p className="text-gray-600">
                © {new Date().getFullYear()} UNISBA - Sistem Denah Digital
              </p>
              <p className="text-sm text-gray-500">
                Data terhubung dengan API FastAPI • Database MySQL • Keamanan Sistem
              </p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                <Home size={16} />
                Dashboard
              </Link>
              <button
                onClick={() => window.open('/docs', '_blank')}
                className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
              >
                <Code size={16} />
                Dokumentasi API
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}