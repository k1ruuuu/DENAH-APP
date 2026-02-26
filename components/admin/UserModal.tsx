'use client';

import React, { useState } from "react";
import { X } from "lucide-react";
import type { UserData, UserModalMode } from "@/types";

interface UserFormData {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface UserModalProps {
  mode: UserModalMode;
  user?: UserData | null;
  onClose: () => void;
  onSave: (userData: UserFormData) => void;
}

export const UserModal: React.FC<UserModalProps> = ({ mode, user, onClose, onSave }) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name ?? "",
    username: user?.username ?? "",
    password: "",
    confirmPassword: "",
    role: user?.role ?? "user",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.username || !formData.role) {
      alert("Harap isi semua field yang wajib!");
      return;
    }

    if (mode === "create") {
      if (!formData.password) {
        alert("Password wajib diisi!");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("Password dan Confirm Password tidak cocok!");
        return;
      }
    }

    onSave(formData);
  };

  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                {mode === "create" ? "Tambah User Baru" : "Edit User"}
              </h3>
              <p className="text-red-100 text-sm mt-1">
                {mode === "create" ? "Isi data user baru" : "Perbarui informasi user"}
              </p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
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
              className={inputClass}
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
              className={inputClass}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password {mode === "create" && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClass}
              placeholder={mode === "create" ? "Masukkan password" : "Kosongkan jika tidak diubah"}
              required={mode === "create"}
            />
          </div>

          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
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
              className={inputClass}
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
              {mode === "create" ? "Simpan" : "Perbarui"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};