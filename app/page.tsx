'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { 
  Building, 
  Lock, 
  Map, 
  Users, 
  Wifi, 
  MousePointerClick,
  ChevronRight,
  CheckCircle,
  Loader2,
  University,
  Smartphone,
  BarChart3,
  Shield,
  Globe,
  Key,
  AlertCircle,
  Home,
  User,
  Eye,
  EyeOff,
  LogIn,
  Database,
  Server
} from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Particle animation untuk background
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
      
      // Create particles on mouse move
      if (Math.random() > 0.7) {
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 1,
          speedX: (Math.random() - 0.5) * 2,
          speedY: (Math.random() - 0.5) * 2,
          color: `rgba(30, 64, 175, ${Math.random() * 0.3})`
        };
        setParticles(prev => [...prev.slice(-50), newParticle]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          size: p.size * 0.98
        })).filter(p => p.size > 0.5)
      );
    }, 50);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || username.length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    
    if (!password || password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      
      // Simpan status login
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', username);
      localStorage.setItem('userRole', getRoleByUsername(username));
      
      // Redirect after success animation
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }, 1500);
  };

  const getRoleByUsername = (username: string): string => {
    const roles: Record<string, string> = {
      'admin': 'Administrator',
      'operator': 'Operator',
      'viewer': 'Viewer',
      'staff': 'Staff',
      'dosen': 'Dosen',
      'mahasiswa': 'Mahasiswa'
    };
    
    return roles[username.toLowerCase()] || 'User';
  };

  const features = [
    { icon: <Map className="h-5 w-5" />, text: "Denah 3D Interaktif", desc: "Navigasi real-time" },
    { icon: <Building className="h-5 w-5" />, text: "Navigasi Ruangan", desc: "Smart routing" },
    { icon: <Users className="h-5 w-5" />, text: "Manajemen Pengguna", desc: "Role-based access" },
    { icon: <Wifi className="h-5 w-5" />, text: "IoT Integration", desc: "300+ sensor aktif" },
    { icon: <MousePointerClick className="h-5 w-5" />, text: "Kontrol Real-time", desc: "Instant control" },
    { icon: <Smartphone className="h-5 w-5" />, text: "Mobile Ready", desc: "Responsive design" },
  ];

  const stats = [
    { label: 'Total Lantai', value: '8', change: '+1', icon: <Building className="h-4 w-4" /> },
    { label: 'Ruangan Aktif', value: '156', change: '+5', icon: <Map className="h-4 w-4" /> },
    { label: 'Pengguna Aktif', value: '42', change: '+12', icon: <Users className="h-4 w-4" /> },
    { label: 'Sensor IoT', value: '289', change: '+23', icon: <Wifi className="h-4 w-4" /> },
  ];

  const defaultAccounts = [
    { role: 'Administrator', username: 'admin', password: 'admin123', color: 'bg-red-500/20 text-red-200' },
    { role: 'Operator Sistem', username: 'operator', password: 'operator123', color: 'bg-blue-500/20 text-blue-200' },
    { role: 'Staff Admin', username: 'staff', password: 'staff123', color: 'bg-green-500/20 text-green-200' },
    { role: 'Viewer Only', username: 'viewer', password: 'viewer123', color: 'bg-purple-500/20 text-purple-200' },
  ];

  const handleDemoLogin = (account: { username: string, password: string }) => {
    setUsername(account.username);
    setPassword(account.password);
    setTimeout(() => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setShowSuccess(true);
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', account.username);
        localStorage.setItem('userRole', getRoleByUsername(account.username));
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }, 1000);
    }, 300);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden relative"
    >
      {/* Animated Background Particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 10px ${particle.color}`
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1 }}
        />
      ))}

      {/* Animated Cursor Effect */}
      <motion.div
        className="fixed w-64 h-64 rounded-full bg-gradient-to-r from-blue-200/10 to-indigo-200/10 pointer-events-none z-0"
        animate={{
          x: cursorPosition.x - 128,
          y: cursorPosition.y - 128,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      />

      {/* Back to Home Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-blue-700 hover:bg-white hover:shadow-lg transition-all duration-300 border border-white/20"
        >
          <Home size={16} />
          <span className="text-sm font-medium">Kembali ke Dashboard</span>
        </Link>
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* Header dengan animasi */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl mb-4"
            >
              <University className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-900 mb-2 leading-tight"
            >
              Gedung Dekanat
            </motion.h1>
            
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 mb-3 leading-tight"
            >
              Sistem Denah Digital
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base"
            >
              Login dengan username dan password untuk mengakses sistem
            </motion.p>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Features List - Kiri */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full lg:w-2/5 max-w-lg"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
                <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                  <MousePointerClick className="h-6 w-6" />
                  Fitur Sistem Canggih
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      whileHover={{ scale: 1.03, x: 5 }}
                      className="flex flex-col p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-100/50 hover:to-indigo-100/50 border border-white/50 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <div className="text-blue-700">{feature.icon}</div>
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-800 font-semibold text-sm">{feature.text}</span>
                          <p className="text-gray-500 text-xs mt-0.5">{feature.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Quick Demo Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Login Cepat (Demo)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultAccounts.slice(0, 4).map((account, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleDemoLogin(account)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 transition-all duration-300"
                      >
                        <span className="text-xs font-medium text-blue-700">{account.role}</span>
                        <span className="text-xs text-gray-600">@{account.username}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Login Form - Tengah */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="w-full lg:w-1/3 max-w-md"
            >
              <AnimatePresence mode="wait">
                {/* Success Animation */}
                {showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-8 text-center shadow-2xl"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="inline-flex items-center justify-center p-4 bg-white rounded-full mb-6"
                    >
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">Login Berhasil!</h3>
                    <p className="text-emerald-100 text-sm">
                      Selamat datang, <span className="font-bold">{username}</span>!
                    </p>
                    <p className="text-emerald-100 text-sm mt-1">
                      Role: <span className="font-bold">{getRoleByUsername(username)}</span>
                    </p>
                    <p className="text-emerald-100 text-sm">Mengarahkan ke dashboard...</p>
                    
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: 0.5, duration: 1.5 }}
                      className="h-1.5 bg-white/30 rounded-full mt-6 overflow-hidden"
                    >
                      <div className="h-full bg-white/50 rounded-full" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20"
                  >
                    {/* Form Header */}
                    <div className="mb-6 text-center">
                      <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                        <User className="h-8 w-8 text-blue-700" />
                      </div>
                      <h3 className="text-2xl font-bold text-blue-800 mb-2">
                        Login Sistem
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Masukkan username dan password Anda
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      {/* Username Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Username
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                          </div>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-10 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 transition-all duration-300 outline-none text-gray-800 placeholder-gray-500 bg-white/50"
                            placeholder="Masukkan username"
                            required
                            minLength={3}
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 transition-all duration-300 outline-none text-gray-800 placeholder-gray-500 bg-white/50"
                            placeholder="Masukkan password"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                            Ingat saya
                          </label>
                        </div>
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          <Key className="h-3 w-3" />
                          Lupa password?
                        </button>
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={!loading ? { scale: 1.02 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                          loading
                            ? 'bg-gradient-to-r from-blue-400 to-indigo-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl'
                        }`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-base">Memproses login...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="h-5 w-5" />
                            <span className="text-base">Masuk ke Sistem</span>
                          </>
                        )}
                      </motion.button>

                      {/* Register Link */}
                      <div className="text-center pt-4 border-t border-gray-200/50">
                        <p className="text-gray-600 text-sm">
                          Belum punya akun?{' '}
                          <button className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                            Hubungi Administrator
                          </button>
                        </p>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stats/Info - Kanan */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="w-full lg:w-2/5 max-w-lg"
            >
              <div className="bg-gradient-to-br from-blue-900/90 to-indigo-900/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl text-white">
                <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                  <Server className="h-6 w-6" />
                  Informasi Sistem & Akun
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col p-4 rounded-xl bg-white/10 hover:bg-white/15 transition-all duration-300 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white/20 rounded-lg">
                            {stat.icon}
                          </div>
                          <span className="text-blue-200 text-xs font-medium">{stat.label}</span>
                        </div>
                        <span className="text-emerald-300 text-xs bg-emerald-900/30 px-2 py-1 rounded-full">
                          {stat.change}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{stat.value}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Default Accounts Section */}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h4 className="text-blue-200 text-sm font-medium mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Akun Default untuk Testing
                  </h4>
                  <div className="space-y-3">
                    {defaultAccounts.map((account, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                        onClick={() => handleDemoLogin(account)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${account.color}`}>
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{account.role}</div>
                            <div className="text-xs text-blue-300">@{account.username}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-amber-300 font-mono">{account.password}</div>
                          <div className="text-xs text-gray-400 mt-1">Klik untuk login</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* System Info */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Status Server:</span>
                      <span className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-300 font-medium">Online</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Database:</span>
                      <span className="text-white/80">MySQL v8.0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">API Version:</span>
                      <span className="text-white/80">v2.1.0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-200">Last Backup:</span>
                      <span className="text-white/80">2 jam yang lalu</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-12 pt-8 border-t border-gray-200/50"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 text-sm">Keamanan Terenkripsi AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 text-sm">Database Terkelola</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 text-sm">Server 24/7 Monitoring</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Gedung Dekanat - Sistem Denah Digital v2.1
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Hanya untuk penggunaan internal. Akses terbatas berdasarkan otorisasi.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Floating Elements Animation */}
      <motion.div
        animate={{
          y: [0, -20, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-10 w-4 h-4 rounded-full bg-blue-400/30 pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-1/4 right-10 w-6 h-6 rounded-full bg-indigo-400/20 pointer-events-none"
      />
    </div>
  );
}