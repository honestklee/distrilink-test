'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { login } from '@/services/auth.services';
import demoAccounts from '@/data/demo-accounts.json';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AuthErrorInfo {
  title: string;
  message: string;
  tips?: string[];
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(demoAccounts[0]?.username || 'emilys');
  const [password, setPassword] = useState(demoAccounts[0]?.password || 'emilyspass');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<AuthErrorInfo | null>(null);
  const [hasCredentialError, setHasCredentialError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Cookies.get('user_session')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setHasCredentialError(false);
    setLoading(true);

    try {
      const user = await login({ username, password });
      Cookies.set('user_session', JSON.stringify(user), { expires: 1 });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_session', JSON.stringify(user));
      }
      router.push('/dashboard');
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : 'Login gagal, periksa kredensial Anda.';

      const isWrongCredential =
        rawMessage.toLowerCase().includes('salah') ||
        rawMessage.toLowerCase().includes('kredensial') ||
        rawMessage.toLowerCase().includes('credential') ||
        rawMessage.toLowerCase().includes('invalid');

      if (isWrongCredential) {
        setHasCredentialError(true);
        setError({
          title: 'Username atau Password Tidak Sesuai',
          message:
            'Kombinasi username atau password yang Anda masukkan salah. Sistem tidak dapat menemukan akun yang sesuai.',
          tips: [
            'Pastikan huruf besar dan huruf kecil sudah benar (periksa apakah tombol Caps Lock aktif).',
            'Pastikan tidak ada spasi yang tidak disengaja sebelum atau sesudah teks.',
            'Anda dapat mencoba menggunakan akun demo di bawah untuk login instan.',
          ],
        });
      } else {
        setError({
          title: 'Autentikasi Gagal',
          message: rawMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (error) {
      setError(null);
      setHasCredentialError(false);
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) {
      setError(null);
      setHasCredentialError(false);
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setHasCredentialError(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden min-h-[640px]">
          
          {/* Left Side: Brand & Value Proposition (Visible on lg screens) */}
          <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-10 flex-col justify-between text-white relative overflow-hidden">
            {/* Ambient light inside left panel */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Brand Logo & Tag */}
            <div>
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold tracking-wide text-white">Distrilink SAP</span>
              </div>

              <div className="mt-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sales Performance Intelligence 2.0
                </div>
                <h2 className="text-3xl font-extrabold leading-tight text-white tracking-tight">
                  Pantau & Optimalkan Kinerja Salesman dengan Akurat
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Platform analitik modern untuk monitoring kunjungan terencana vs realisasi, efektivitas visit, dan sebaran nilai order di seluruh wilayah.
                </p>
              </div>
            </div>

            {/* Feature Highlights Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Visualisasi Real-time</p>
                  <p className="text-[11px] text-slate-400">Grafik interaktif performa kunjungan & distribusi area</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Data Terverifikasi SAP</p>
                  <p className="text-[11px] text-slate-400">Sinkronisasi data penjualan & laporan OOS otomatis</p>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sistem Operasional Normal</span>
              </div>
              <span>v1.0.4 Enterprise</span>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="col-span-1 lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-600 rounded-xl text-white">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Distrilink SAP</h1>
                  <p className="text-xs text-slate-500">Sales Intelligence Platform</p>
                </div>
              </div>

              {/* Form Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang Kembali</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Masukkan kredensial Anda untuk mengakses dashboard analitik.
                </p>
              </div>

              {/* Informative Error Message Box */}
              {error && (
                <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-rose-100 rounded-xl text-rose-700 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-rose-900">{error.title}</p>
                      <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{error.message}</p>
                      
                      {error.tips && error.tips.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-rose-200/70">
                          <p className="text-[11px] font-bold text-rose-800 mb-1.5 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                            Petunjuk Bantuan:
                          </p>
                          <ul className="text-[11px] text-rose-700 space-y-1 pl-4 list-disc">
                            {error.tips.map((tip, idx) => (
                              <li key={idx} className="leading-snug">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Username
                    </label>
                    {hasCredentialError && (
                      <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Periksa username
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm placeholder-slate-400 outline-none transition ${
                        hasCredentialError
                          ? 'bg-rose-50/40 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10'
                      }`}
                      placeholder="Masukkan username Anda"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    {hasCredentialError ? (
                      <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Periksa password
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 hover:text-blue-600 cursor-pointer transition">
                        Lupa password?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm placeholder-slate-400 outline-none transition ${
                        hasCredentialError
                          ? 'bg-rose-50/40 border-rose-400 text-rose-900 focus:bg-white focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10'
                      }`}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sedang Masuk...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Account Quick Access Card */}
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Kredensial Uji Coba (DummyJSON Live)
                  </span>
                  <span className="text-[10px] text-slate-400">POST /auth/login</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => handleFillDemo(account.username, account.password)}
                      className="px-2 py-1.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium rounded-lg border border-slate-200 hover:border-blue-300 transition shadow-2xs text-left cursor-pointer"
                    >
                      <span className="block font-semibold text-[11px]">{account.name}</span>
                      <span className="block text-[10px] text-slate-400">{account.username}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  Klik akun di atas untuk mengisi kredensial valid secara instan.
                </p>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
              <p>Distrilink SAP Analytics &copy; {new Date().getFullYear()}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}