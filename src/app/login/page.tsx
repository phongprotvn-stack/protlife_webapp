'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles } from 'lucide-react';
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
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);

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
        let userRole: 'public' | 'viewer' | 'contributor' | 'admin' | undefined;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', data.user.id)
            .single();
          if (profile?.name) realName = profile.name;
          userRole = profile?.role;
        } catch { /* fallback */ }
        if (!realName) realName = data.user.email?.split('@')[0] || 'User';
        // Extract session_id from sign-in response
        let sid: string | null = null;
        try {
          const tok = (data as any).session?.access_token;
          if (tok) {
            const b64 = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            sid = JSON.parse(atob(b64))?.session_id || null;
          }
        } catch { /* non-critical */ }
        login({
          id: data.user.id,
          email: data.user.email || email,
          name: realName,
          role: userRole || 'viewer',
        });
        loadSettingsFromServer(data.user.id);
        recordDeviceLogin(data.user.id, 'password', sid);
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

  const handleSocialLogin = useCallback((provider: 'google') => {
    setSocialLoading(provider);
    setError('');

    setTimeout(() => {
      setSocialLoading(null);
      setError('Đăng nhập bằng Google đang được phát triển. Vui lòng đăng nhập bằng email.');
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
        let userRole: 'public' | 'viewer' | 'contributor' | 'admin' | undefined;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', u.id)
            .single();
          if (profile?.name) realName = profile.name;
          userRole = profile?.role;
        } catch { /* fallback */ }
        if (!realName) realName = u.email?.split('@')[0] || 'User';
        // Extract session_id from existing session
        let sessionSid: string | null = null;
        try {
          const tok = session.access_token;
          if (tok) {
            const b64 = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            sessionSid = JSON.parse(atob(b64))?.session_id || null;
          }
        } catch { /* non-critical */ }
        login({
          id: u.id,
          email: u.email || '',
          name: realName,
          role: userRole || 'viewer',
        });
        loadSettingsFromServer(u.id);
        recordDeviceLogin(u.id, 'session', sessionSid);
        router.push('/dashboard');
      }
    });
  }, []);

  const isAdminEmail = email === 'phongprot.vn@gmail.com';

  // ─── SVG icons for feature row ───
  const features = [
    { icon: 'heart', label: 'Quan hệ', desc: 'Quản lý mối quan hệ quan trọng' },
    { icon: 'calendar', label: 'Sự kiện', desc: 'Ghi nhớ và theo dõi mọi sự kiện' },
    { icon: 'image', label: 'Ký ức', desc: 'Lưu giữ những khoảnh khắc đáng nhớ' },
    { icon: 'brain', label: 'AI Insight', desc: 'Phân tích & gợi ý thông minh' },
    { icon: 'shield', label: 'Bảo mật', desc: 'Dữ liệu của bạn luôn được bảo vệ' },
  ];

  function featureIcon(name: string) {
    const s = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (name) {
      case 'heart':
        return <svg {...s}><path d="M20.8 8.6c0-3-2.2-5-5-5-1.9 0-3.4 1-4.3 2.5C10.6 4.6 9.1 3.6 7.2 3.6c-2.8 0-5 2-5 5 0 5.5 9.3 10.8 9.3 10.8s9.3-5.3 9.3-10.8z"/></svg>;
      case 'calendar':
        return <svg {...s}><rect x="3.5" y="5" width="17" height="16" rx="2.2"/><path d="M3.5 9.8h17M8 3v4M16 3v4"/></svg>;
      case 'image':
        return <svg {...s}><rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><circle cx="9" cy="10" r="1.7"/><path d="M4 17l4.8-4.6a1.8 1.8 0 0 1 2.4 0L15 16"/><path d="M13 15l1.8-1.7a1.8 1.8 0 0 1 2.4 0l3.3 3"/></svg>;
      case 'brain':
        return <svg {...s}><path d="M9 4.2a3 3 0 0 0-3 3v.4A2.8 2.8 0 0 0 4.5 10c0 .9.4 1.7 1.1 2.2A3 3 0 0 0 5 14a3 3 0 0 0 2.2 2.9A2.9 2.9 0 0 0 10 20a2 2 0 0 0 2-2V7a2.8 2.8 0 0 0-3-2.8z"/><path d="M15 4.2a3 3 0 0 1 3 3v.4a2.8 2.8 0 0 1 1.5 2.4c0 .9-.4 1.7-1.1 2.2A3 3 0 0 1 19 14a3 3 0 0 1-2.2 2.9A2.9 2.9 0 0 1 14 20a2 2 0 0 1-2-2V7a2.8 2.8 0 0 1 3-2.8z"/></svg>;
      case 'shield':
        return <svg {...s}><path d="M12 3.3l7 2.6v5.4c0 4.6-3 8.2-7 9.4-4-1.2-7-4.8-7-9.4V5.9z"/><path d="M12 10.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/><path d="M12 13.7v2.3"/></svg>;
      default: return null;
    }
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">

        {/* ══════ LEFT: BRAND + COVER ══════ */}
        <div className="hidden md:flex w-[60%] relative overflow-hidden flex-col p-[40px_56px_32px] text-white"
          style={{ background: '#050203' }}>

          {/* Cover image — screen blend, dark overlay */}
          <div className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(/images/protlife-cover.jpg)',
              backgroundSize: '130%',
              backgroundPosition: '82% 48%',
              backgroundRepeat: 'no-repeat',
              mixBlendMode: 'screen',
              opacity: 0.9,
            }} />
          <div className="absolute inset-0 z-[1]"
            style={{
              background: `
                radial-gradient(ellipse at 78% 42%, rgba(20,0,3,.05) 0%, rgba(5,2,3,.35) 48%, #050203 82%),
                linear-gradient(90deg, rgba(5,2,3,.92) 0%, rgba(5,2,3,.55) 42%, rgba(5,2,3,.2) 66%, rgba(5,2,3,.5) 100%),
                linear-gradient(180deg, rgba(5,2,3,.15) 0%, rgba(5,2,3,.05) 35%, rgba(5,2,3,.65) 100%)
              `,
            }} />

          {/* Content (above layers) */}
          <div className="relative z-[2] flex flex-col h-full">

            {/* Brand */}
            <div className="flex items-center gap-[12px]">
              <div className="w-[44px] h-[44px] rounded-[13px] flex items-center justify-center font-extrabold text-[20px] text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 100%)', boxShadow: '0 8px 20px rgba(230,0,45,.4)' }}>
                P
              </div>
              <div>
                <div className="font-extrabold text-[19px] tracking-[-.2px]">Prot Life</div>
                <div className="text-[12px] mt-[1px]" style={{ color: 'rgba(255,255,255,.55)' }}>Hệ điều hành cuộc sống cá nhân</div>
              </div>
            </div>

            {/* Hero */}
            <div className="my-auto max-w-[430px] pt-[20px]">
              <h1 className="text-[38px] font-extrabold leading-[1.2] tracking-[-1px]">
                Quản lý <span style={{ color: '#FF3B4E' }}>toàn bộ</span><br />
                <span style={{ color: '#FF3B4E' }}>cuộc sống</span> của bạn
              </h1>
              <div className="w-[64px] h-[4px] rounded-full mb-[16px]"
                style={{ background: 'linear-gradient(90deg,#E6002D,#FF3B4E)' }} />
              <p className="text-[14.5px] leading-[1.65]" style={{ color: 'rgba(255,255,255,.62)' }}>
                Mọi mối quan hệ, sự kiện, ký ức và mục tiêu<br />
                cuộc đời được kết nối trong một không gian<br />
                riêng tư, an toàn.
              </p>

              {/* CTA */}
              <Link href="/register"
                className="inline-flex items-center gap-[9px] px-[26px] py-[15px] rounded-[14px] text-[14.5px] font-bold text-white no-underline"
                style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 100%)', boxShadow: '0 14px 34px rgba(214,0,50,.4)' }}>
                🚀 Bắt đầu miễn phí
              </Link>

              {/* Feature row — 5 items */}
              <div className="flex justify-between gap-[12px] mt-[56px]" style={{ maxWidth: '560px' }}>
                {features.map((f, i) => (
                  <div key={i} className="flex-1 text-left">
                    <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center mb-[11px]"
                      style={{ background: 'rgba(230,0,45,.08)', border: '1.3px solid rgba(230,0,45,.45)', color: '#FF3B4E' }}>
                      {featureIcon(f.icon)}
                    </div>
                    <div className="text-[12.5px] font-bold whitespace-nowrap mb-[4px]">{f.label}</div>
                    <div className="text-[10.5px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.45)' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-[12px] text-center mt-[24px]" style={{ color: 'rgba(255,255,255,.35)' }}>
              Made with <span style={{ color: '#FF3B4E' }}>♥</span> by <b style={{ color: 'rgba(255,255,255,.6)' }}>Prot</b>
            </div>
          </div>
        </div>

        {/* ══════ RIGHT: LOGIN FORM ══════ */}
        <div
          className="bg-white flex items-center justify-center p-[40px] overflow-y-auto"
          style={{ width: '46%', minWidth: '420px' }}>
          <div className="w-full max-w-[380px]">

            {/* Mobile brand */}
            <div className="md:hidden text-center mb-8">
              <div className="inline-flex items-center gap-2.5 mb-4">
                <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center font-extrabold text-[17px] text-white"
                  style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 100%)' }}>P</div>
                <span className="text-[20px] font-extrabold text-[#101010]">Prot Life</span>
              </div>
              <p className="text-[13px] text-[#9CA3AF]">Đăng nhập để tiếp tục</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-[16px] p-[12px_14px] rounded-[12px] text-[12.5px] font-semibold flex items-center gap-2"
                style={{ background: 'rgba(230,0,45,.06)', border: '1px solid rgba(230,0,45,.12)', color: '#E6002D' }}>
                <ShieldCheck size={14} />
                {error}
              </div>
            )}

            {/* Detected admin */}
            {detectedAdmin && (
              <div className="mb-[16px] p-[12px_14px] rounded-[12px] text-[12.5px] font-semibold flex items-center gap-2"
                style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.12)', color: '#34C759' }}>
                <Sparkles size={14} />
                Đã phát hiện — tự động map sang email admin
              </div>
            )}

            {/* Title */}
            <div className="text-[24px] font-extrabold mb-[4px]" style={{ color: '#101010' }}>Đăng nhập</div>
            <div className="text-[13px] mb-[22px]" style={{ color: '#9CA3AF' }}>Đăng nhập để tiếp tục</div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="mb-[16px]">
                <label className="block text-[11px] font-extrabold tracking-[.4px] uppercase mb-[7px]"
                  style={{ color: '#6B7280' }}>Email hoặc tên đăng nhập</label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="phongprot.vn@gmail.com"
                    className="w-full px-[14px] py-[12px] rounded-[11px] text-[13.5px] outline-none transition-colors"
                    style={{ border: '1.5px solid #EEEEF1', background: '#FAFAFB' }}
                    onFocus={e => { e.target.style.borderColor = '#E6002D'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#EEEEF1'; e.target.style.background = '#FAFAFB'; }}
                    autoComplete="email" />
                  {detectedAdmin && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#10B981]">
                      <ShieldCheck size={18} />
                    </span>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="mb-[16px]">
                <label className="block text-[11px] font-extrabold tracking-[.4px] uppercase mb-[7px]"
                  style={{ color: '#6B7280' }}>Mật khẩu</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-[14px] py-[12px] rounded-[11px] text-[13.5px] outline-none transition-colors"
                    style={{ border: '1.5px solid #EEEEF1', background: '#FAFAFB', paddingRight: '42px' }}
                    onFocus={e => { e.target.style.borderColor = '#E6002D'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#EEEEF1'; e.target.style.background = '#FAFAFB'; }}
                    autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[15px]"
                    style={{ color: '#9CA3AF' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Options row */}
              <div className="flex items-center justify-between -mt-[8px] mb-[18px]">
                <button type="button" onClick={handleQuickAdmin}
                  className="text-[12px] font-medium flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
                  style={{ color: '#6B7280' }}>
                  <ShieldCheck size={14} />
                  Đăng nhập nhanh
                </button>
                <button type="button"
                  className="text-[12px] font-bold bg-transparent border-none cursor-pointer"
                  style={{ color: '#E6002D' }}>
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className="w-full py-[13.5px] rounded-[13px] border-none text-[14px] font-extrabold text-white cursor-pointer active:scale-[.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 100%)',
                  boxShadow: '0 12px 28px rgba(214,0,50,.3)',
                }}>
                {isLoading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin align-middle" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-[12px] my-[22px]">
              <span className="flex-1 h-[1px]" style={{ background: '#EEEEF1' }} />
              <span className="text-[11.5px] font-semibold shrink-0" style={{ color: '#9CA3AF' }}>Hoặc</span>
              <span className="flex-1 h-[1px]" style={{ background: '#EEEEF1' }} />
            </div>

            {/* Google OAuth */}
            <div className="flex flex-col gap-[10px]">
              <button type="button" onClick={() => handleSocialLogin('google')}
                disabled={isLoading || socialLoading !== null}
                className="w-full py-[11.5px] rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-[10px] cursor-pointer transition-colors disabled:opacity-50"
                style={{ background: '#fff', border: '1.5px solid #EEEEF1', color: '#101010' }}>
                {socialLoading === 'google' ? (
                  <span className="inline-block w-5 h-5 border-2 border-[#9CA3AF]/30 border-t-[#9CA3AF] rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.6 8.6 0 0 0 9 0 9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
                  </svg>
                )}
                Tiếp tục với Google
              </button>
            </div>

            {/* Register link */}
            <div className="text-center mt-[26px] text-[12.5px]" style={{ color: '#6B7280' }}>
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-bold no-underline" style={{ color: '#E6002D' }}>
                Đăng ký ngay
              </Link>
            </div>

            {/* Version */}
            <div className="text-center mt-[20px] text-[10px] font-medium tracking-[.3px]" style={{ color: 'rgba(142,142,147,.4)' }}>
              © 2026 PROT LIFE v1.0.3 — All right reserved
            </div>

            {/* Footer mobile */}
            <div className="md:hidden text-center mt-[20px] text-[11px] text-[#9CA3AF] font-medium">
              Made with ♥ by Prot
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
