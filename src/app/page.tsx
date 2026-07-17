'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Heart, ShieldCheck, Users, CalendarDays, Brain, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';

export default function LandingPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedAdmin, setDetectedAdmin] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    // No auto-redirect - landing page is standalone
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (email.toLowerCase() === 'admin') {
      setDetectedAdmin(true);
      setEmail('phongprot.vn@gmail.com');
    } else {
      setDetectedAdmin(false);
    }
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    if (!password.trim()) { setError('Vui lòng nhập mật khẩu'); return; }
    setIsLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng' : signInError.message);
        return;
      }
      if (data.user) {
        login({ id: data.user.id, email: data.user.email || '', name: data.user.user_metadata?.name || '', avatar: data.user.user_metadata?.avatar_url || '', role: 'admin' });
        router.push('/dashboard');
      }
    } catch { setError('Lỗi kết nối, vui lòng thử lại'); }
    finally { setIsLoading(false); }
  };

  const features = [
    { icon: Users, label: 'Quản lý quan hệ', desc: 'Theo dõi kết nối, sinh nhật, tương tác' },
    { icon: CalendarDays, label: 'Sự kiện & Ký ức', desc: 'Ghi lại mọi khoảnh khắc đáng nhớ' },
    { icon: Brain, label: 'AI Insight', desc: 'Phân tích thông minh cuộc sống của bạn' },
    { icon: ShieldCheck, label: 'Bảo mật & Riêng tư', desc: 'Dữ liệu cá nhân được bảo vệ tuyệt đối' },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* ─── LEFT: HERO / INTRO (Desktop only) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#E6002D] via-[#CC0028] to-[#99001E] flex-col justify-between p-10">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03]" />

        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-[14px] bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-[22px]">P</div>
            <div>
              <h1 className="text-white text-[24px] font-bold tracking-tight">Prot Life</h1>
              <p className="text-white/60 text-[11px] font-medium">Hệ điều hành cuộc sống cá nhân</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-white text-[40px] font-bold leading-[1.15] tracking-tight">
                Quản lý cuộc sống<br />
                <span className="text-white/80">theo cách của bạn</span>
              </h2>
              <p className="text-white/60 text-[15px] mt-4 max-w-[380px] leading-relaxed">
                Một nền tảng cá nhân để quản lý quan hệ, sự kiện, ký ức và mục tiêu — tất cả trong một không gian riêng tư, bảo mật.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              className="bg-white/10 backdrop-blur-sm rounded-[14px] p-4">
              <f.icon size={20} className="text-white/80 mb-2" />
              <p className="text-white text-[13px] font-semibold">{f.label}</p>
              <p className="text-white/50 text-[11px] mt-0.5">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-white/40 text-[12px] font-medium flex items-center gap-1">
          Made with <Heart size={12} className="text-white/60 fill-white/60" /> by Prot
        </p>
      </div>

      {/* ─── RIGHT: LOGIN FORM ─── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[380px]">
          {/* Logo (mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#E6002D] flex items-center justify-center text-white font-bold text-[18px]">P</div>
              <span className="text-[20px] font-bold text-[#111]">Prot Life</span>
            </div>
            <p className="text-[13px] text-[#8E8E93]">Đăng nhập để tiếp tục</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-[24px] font-bold text-[#111]">Đăng nhập</h2>
            <p className="text-[13px] text-[#8E8E93] mt-1">Đăng nhập để tiếp tục</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[10px] bg-[rgba(230,0,45,0.06)] border border-[rgba(230,0,45,0.12)]">
              <p className="text-[12px] text-[#E6002D] font-medium">{error}</p>
            </div>
          )}

          {detectedAdmin && (
            <div className="mb-4 p-3 rounded-[10px] bg-[rgba(52,199,89,0.06)] border border-[rgba(52,199,89,0.12)]">
              <p className="text-[12px] text-[#34C759] font-medium flex items-center gap-1">
                <ShieldCheck size={14}/> Đã phát hiện Admin
              </p>
            </div>
          )}

          {isLoggedIn && (
            <div className="mb-4 p-3 rounded-[10px] bg-[rgba(0,122,255,0.06)] border border-[rgba(0,122,255,0.12)]">
              <p className="text-[12px] text-[#007AFF] font-medium mb-2">Bạn đã đăng nhập</p>
              <button onClick={() => router.push('/dashboard')}
                className="w-full h-[42px] rounded-[10px] bg-[#007AFF] text-white text-[13px] font-semibold hover:bg-[#0066CC] transition-colors">
                Vào Dashboard →
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-[#6B7280] uppercase mb-1.5">Email</p>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full h-[46px] px-4 rounded-[10px] border border-[rgba(0,0,0,0.06)] text-[14px] text-[#111] bg-white placeholder:text-[#B0B0B8] focus:outline-none focus:ring-2 focus:ring-[#E6002D]/20 focus:border-[#E6002D] transition-all"
                autoComplete="email" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#6B7280] uppercase mb-1.5">Mật khẩu</p>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[46px] px-4 rounded-[10px] border border-[rgba(0,0,0,0.06)] text-[14px] text-[#111] bg-white placeholder:text-[#B0B0B8] focus:outline-none focus:ring-2 focus:ring-[#E6002D]/20 focus:border-[#E6002D] transition-all pr-10"
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93]">
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full h-[46px] rounded-[10px] bg-[#E6002D] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#CC0028] transition-colors disabled:opacity-50">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Đăng nhập'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[rgba(0,0,0,0.06)]"/></div>
            <div className="relative flex justify-center"><span className="px-3 text-[11px] font-medium text-[#B0B0B8] bg-white">Hoặc</span></div>
          </div>

          <div className="space-y-3">
            <button disabled className="w-full h-[46px] rounded-[10px] border border-[rgba(0,0,0,0.06)] text-[13px] font-medium text-[#5F6368] bg-white flex items-center justify-center gap-2.5 opacity-50 cursor-not-allowed">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button disabled className="w-full h-[46px] rounded-[10px] border border-[rgba(0,0,0,0.06)] text-[13px] font-medium text-[#5F6368] bg-white flex items-center justify-center gap-2.5 opacity-50 cursor-not-allowed">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#111" d="M17.57 12.7c0-3.13 2.55-4.63 2.66-4.71-1.45-2.12-3.7-2.41-4.5-2.44-1.92-.2-3.75 1.13-4.72 1.13-.97 0-2.48-1.1-4.08-1.07-2.1.03-4.04 1.22-5.12 3.1-2.18 3.79-.56 9.4 1.57 12.47 1.04 1.5 2.28 3.18 3.9 3.12 1.57-.06 2.16-1.01 4.05-1.01 1.89 0 2.43 1.01 4.08.98 1.69-.03 2.76-1.52 3.78-3.03 1.2-1.74 1.69-3.43 1.72-3.52-.04-.02-3.3-1.27-3.34-5.02zM14.66 4.64c.87-1.05 1.46-2.51 1.3-3.96-1.26.05-2.79.84-3.7 1.9-.81 1.94-.99 3.53-.87 3.87 1.34.1 2.7-.76 3.27-1.81z"/></svg>
              Apple
            </button>
          </div>

          <div className="lg:hidden mt-8 text-center">
            <p className="text-[11px] text-[#B0B0B8] font-medium flex items-center justify-center gap-1">
              Made with <Heart size={10} className="text-[#E6002D] fill-[#E6002D]"/> by Prot
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
