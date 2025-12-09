"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RuanganDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  // data denah by API
  const ruanganData: Record<string, any> = {
    ruang30300: { nama: "Ruang A", deskripsi: "Ruang utama dengan kapasitas 50 orang" },
    ruangB: { nama: "Ruang B", deskripsi: "Ruang rapat kecil dengan AC" },
  };

  useEffect(() => {
    if (id && ruanganData[id as string]) {
      setData(ruanganData[id as string]);
    }
  }, [id]);

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg">Ruangan tidak ditemukan</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push("/")}
        >
          Kembali ke Denah
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <h1 className="text-3xl font-bold mb-4">{data.nama}</h1>
      <p className="text-lg mb-8">{data.deskripsi}</p>
      <button
        onClick={() => router.push("/")}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        🔙 Kembali ke Denah
      </button>
    </div>
  );
}