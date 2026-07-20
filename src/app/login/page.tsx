'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { loadSettingsFromServer } from '@/stores/settings-store';
import { recordDeviceLogin } from '@/lib/services/device-service';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
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

  // Auto-detect "admin" shortcut
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
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Fetch real name from profiles table
        let realName = data.user.user_metadata?.name || '';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.user.id)
            .single();
          if (profile?.name) realName = profile.name;
        } catch { /* fallback */ }
        if (!realName) realName = data.user.email?.split('@')[0] || 'User';
        login({
          id: data.user.id,
          email: data.user.email || email,
          name: realName,
          role: 'admin',
        });
        loadSettingsFromServer(data.user.id);
        recordDeviceLogin(data.user.id, 'password');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
      setIsLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    setEmail('phongprot.vn@gmail.com');
    setPassword('123456');
  };

  const handleSocialLogin = useCallback((provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    setError('');

    setTimeout(() => {
      setSocialLoading(null);
      setError(`Đăng nhập bằng ${provider === 'google' ? 'Google' : 'Apple'} đang được phát triển. Vui lòng đăng nhập bằng email.`);
    }, 1200);
  }, []);

  // Check if already authenticated with Supabase on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const existingUser = useAuthStore.getState().user;
        // Fetch real name from profiles table
        let realName = existingUser?.name || u.user_metadata?.name || '';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', u.id)
            .single();
          if (profile?.name) realName = profile.name;
        } catch { /* fallback */ }
        if (!realName) realName = u.email?.split('@')[0] || 'User';
        login({
          id: u.id,
          email: u.email || '',
          name: realName,
          role: 'admin',
        });
        loadSettingsFromServer(u.id);
        recordDeviceLogin(u.id, 'session');
        router.push('/dashboard');
      }
    });
  }, []);

  const isAdminEmail = email === 'phongprot.vn@gmail.com';

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-[160px] -right-[120px] w-[400px] h-[400px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #E6002D 0%, transparent 70%)' }} />
      <div className="absolute -bottom-[200px] -left-[120px] w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }} />

      <div className="flex-1 flex flex-col justify-center px-6 max-w-[420px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo + Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-[72px] h-[72px] rounded-[20px] gradient-primary mx-auto mb-5 flex items-center justify-center"
              style={{ boxShadow: '0 12px 32px rgba(230,0,45,0.25)' }}
            >
              <span className="text-white text-[30px] font-bold tracking-tight">PL</span>
            </motion.div>
            <h1 className="text-[32px] font-bold text-[#111] tracking-tight">Đăng nhập</h1>
            <p className="text-[15px] text-[#6B7280] mt-1.5 font-medium">
              Chào mừng trở lại với PROT LIFE
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-[18px]">
            {/* Email / Username */}
            <div>
              <label className="text-[12px] font-semibold text-[#6B7280] mb-[6px] block tracking-[0.3px] uppercase">
                Email hoặc tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="phongprot.vn@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-ios pr-10"
                  autoComplete="email"
                />
                {detectedAdmin && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <ShieldCheck size={18} className="text-[#10B981]" />
                  </motion.div>
                )}
              </div>
              {detectedAdmin && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-[#10B981] font-medium mt-1 flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  Đã phát hiện — tự động map sang email admin
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-[12px] font-semibold text-[#6B7280] mb-[6px] block tracking-[0.3px] uppercase">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-ios pr-[44px]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#111] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot + Quick Admin Row */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleQuickAdmin}
                className="text-[12px] font-medium text-[#6B7280] hover:text-[#111] transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                Đăng nhập nhanh
              </button>
              <button type="button" className="text-[12px] font-semibold text-[#E6002D] hover:opacity-80 transition-opacity">
                Quên mật khẩu?
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-[13px] text-[#E6002D] font-medium text-center bg-[#E6002D]/5 rounded-[10px] py-2.5"
              >
                {error}
              </motion.p>
            )}

            {/* Login button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.97 }}
              className="btn-ios-primary w-full h-[52px] text-[15px] relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  Đăng nhập
                </div>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-[24px]">
            <div className="flex-1 h-[1px] bg-[rgba(0,0,0,0.06)]" />
            <span className="text-[13px] text-[#8E8E93] font-medium">hoặc</span>
            <div className="flex-1 h-[1px] bg-[rgba(0,0,0,0.06)]" />
          </div>

          {/* Social login */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading || socialLoading !== null}
              className="w-full h-[50px] rounded-[14px] border border-[rgba(0,0,0,0.08)] flex items-center justify-center gap-3 text-[15px] font-medium text-[#111] hover:bg-[rgba(0,0,0,0.02)] hover:border-[rgba(0,0,0,0.12)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {socialLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-[#8E8E93]/30 border-t-[#8E8E93] rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Tiếp tục với Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('apple')}
              disabled={isLoading || socialLoading !== null}
              className="w-full h-[50px] rounded-[14px] border border-[rgba(0,0,0,0.08)] flex items-center justify-center gap-3 text-[15px] font-medium text-[#111] hover:bg-[rgba(0,0,0,0.02)] hover:border-[rgba(0,0,0,0.12)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {socialLoading === 'apple' ? (
                <div className="w-5 h-5 border-2 border-[#8E8E93]/30 border-t-[#8E8E93] rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#111" d="M17.05 20.28c-.98.95-2.05.82-3.08.38-1.07-.44-2.06-.48-3.1 0-1.3.63-1.98.48-2.74-.38C5.06 16.78 5.39 11.55 9 9.37c1.35-.85 2.66-.82 3.73.02.76.58 1.16.58 1.88 0 .97-.78 2.14-.86 3.3-.44 1.84.68 2.9 2.2 2.77 4.22-.14 1.7-1.08 2.65-2.63 3.11zM12.03 9.25c-.14-2.08 1.48-3.94 3.3-4.25.24 1.92-1.27 3.82-3.3 4.25z" />
                </svg>
              )}
              Tiếp tục với Apple
            </button>
          </div>

          {/* Register link */}
          <p className="text-center mt-8 text-[13px] text-[#8E8E93] font-medium">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-[#E6002D] font-semibold hover:opacity-80 transition-opacity">
              Đăng ký
            </Link>
          </p>

          {/* Version */}
          <p className="text-center mt-6 text-[10px] text-[#8E8E93]/40 font-medium tracking-[0.3px]">
            © 2026 PROT LIFE v1.0.3 — All right reserved
          </p>
        </motion.div>
      </div>
    </div>
  );
}
