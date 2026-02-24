'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Shield, Mail, Key, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  user?: any | null;
  mode: 'create' | 'edit';
}

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin', color: 'red' },
  { value: 'admin', label: 'Admin', color: 'orange' },
  { value: 'manager', label: 'Manager', color: 'blue' },
  { value: 'staff', label: 'Staff', color: 'green' },
  { value: 'supervisor', label: 'Supervisor', color: 'purple' },
  { value: 'technician', label: 'Technician', color: 'amber' },
  { value: 'coordinator', label: 'Coordinator', color: 'teal' },
  { value: 'auditor', label: 'Auditor', color: 'indigo' },
  { value: 'viewer', label: 'Viewer', color: 'gray' }
];

export default function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'viewer'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  // Track window width
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          username: user.username || '',
          name: user.name || '',
          password: '',
          confirmPassword: '',
          role: user.role || 'viewer'
        });
      } else {
        setFormData({
          username: '',
          name: '',
          password: '',
          confirmPassword: '',
          role: 'viewer'
        });
      }
      setErrors({});
    }
  }, [isOpen, user, mode]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username wajib diisi';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username minimal 3 karakter';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi';
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    if (!formData.role) {
      newErrors.role = 'Role wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submitData = {
        username: formData.username,
        name: formData.name,
        role: formData.role
      };

      if (mode === 'create' && formData.password) {
        (submitData as any).password = formData.password;
      } else if (mode === 'edit' && formData.password) {
        (submitData as any).password = formData.password;
      }

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  // Responsive sizes
  const modalWidth = windowWidth < 640 ? 'w-[95%]' : 'w-[450px]';
  const isMobile = windowWidth < 640;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div 
        ref={modalRef}
        className={`bg-white rounded-xl shadow-2xl mx-auto ${modalWidth} max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-5 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <User size={isMobile ? 18 : 20} className="text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {mode === 'create' ? 'Tambah User Baru' : 'Edit User'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  {mode === 'create' ? 'Buat akun user baru di sistem' : 'Edit informasi user yang sudah ada'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={isMobile ? 18 : 20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  className={`w-full px-3 py-2.5 text-sm border ${errors.username ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all`}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.username}
                  </p>
                )}
              </div>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className={`w-full px-3 py-2.5 text-sm border ${errors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all`}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Role / Hak Akses <span className="text-rose-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-3 py-2.5 text-sm border ${errors.role ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all`}
                disabled={isLoading}
              >
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.role}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Password {mode === 'create' && <span className="text-rose-500">*</span>}
                {mode === 'edit' && <span className="text-xs font-normal text-slate-500 ml-1">(Kosongkan jika tidak diubah)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={mode === 'create' ? 'Masukkan password' : 'Password baru (opsional)'}
                  className={`w-full px-3 py-2.5 text-sm border ${errors.password ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all pr-10`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Konfirmasi Password {formData.password && <span className="text-rose-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  className={`w-full px-3 py-2.5 text-sm border ${errors.confirmPassword ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent transition-all pr-10`}
                  disabled={isLoading || !formData.password}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Shield size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-800 mb-1">Informasi Hak Akses:</p>
                  <ul className="text-xs text-blue-700 space-y-0.5">
                    <li>• Super Admin: Akses penuh ke semua fitur</li>
                    <li>• Admin: Dapat mengelola user dan data</li>
                    <li>• Manager: Mengelola data dan staff</li>
                    <li>• Staff: Hanya mengedit data ruangan</li>
                    <li>• Viewer: Hanya melihat data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-all text-sm"
              disabled={isLoading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{mode === 'create' ? 'Tambah User' : 'Simpan Perubahan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}