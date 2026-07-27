'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { loadSettingsFromServer } from '@/stores/settings-store';
import { recordDeviceLogin } from '@/lib/services/device-service';
import { supabase } from '@/lib/supabase/client';

export default function LandingPage() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);

  // ─── Session check + auto-redirect ───
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, router]);

  // ─── Login method tab ───
  const [method, setMethod] = useState<'password' | 'magic'>('password');

  // ─── Password fields ───
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [detectedAdmin, setDetectedAdmin] = useState(false);

  useEffect(() => {
    if (email.toLowerCase() === 'admin') {
      setDetectedAdmin(true);
      setEmail('phongprot.vn@gmail.com');
    } else {
      setDetectedAdmin(false);
    }
  }, [email]);

  // ─── Magic link state ───
  const [magicSent, setMagicSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');

  // ─── Loading / Error ───
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Toast ───
  const showToast = useCallback((msg: string) => {
    const el = document.getElementById('l-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout((el as any)._t);
    (el as any)._t = setTimeout(() => el.classList.remove('show'), 2200);
  }, []);

  // ─── Password login ───
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Vui lòng nhập email'); return; }
    if (!password.trim()) { setError('Vui lòng nhập mật khẩu'); return; }
    setLoading(true);
    showToast('Đang đăng nhập...');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (signInError) {
        setError(signInError.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không đúng' : signInError.message);
        return;
      }
      if (data.user) {
        // Fetch real name from profiles table
        let realName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || '';
        let userRole: 'public' | 'viewer' | 'contributor' | 'admin' | undefined;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', data.user.id)
            .single();
          if (profile?.name) realName = profile.name;
          userRole = profile?.role;
        } catch { /* fallback to metadata */ }
        if (!realName) realName = data.user.email?.split('@')[0] || '';
        // Extract session_id from sign-in response
        let sid: string | null = null;
        try {
          const tok = data.session?.access_token;
          if (tok) {
            const b64 = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            sid = JSON.parse(atob(b64))?.session_id || null;
          }
        } catch { /* non-critical */ }
        login({
          id: data.user.id,
          email: data.user.email || email.trim(),
          name: realName,
          avatar: data.user.user_metadata?.avatar_url || '',
          role: userRole || 'viewer',
        });
        loadSettingsFromServer(data.user.id);
        recordDeviceLogin(data.user.id, 'password', sid);
        router.push('/dashboard');
      }
    } catch {
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally { setLoading(false); }
  };

  // ─── Magic Link ───
  const handleSendMagic = async () => {
    const targetEmail = magicEmail.trim() || email.trim();
    if (!targetEmail) { showToast('⚠️ Vui lòng nhập email'); return; }
    setLoading(true);
    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: { shouldCreateUser: false },
      });
      if (magicError) {
        showToast('❌ ' + magicError.message);
        return;
      }
      setMagicSent(true);
      setMagicEmail(targetEmail);
    } catch {
      showToast('❌ Lỗi kết nối');
    } finally { setLoading(false); }
  };

  // ─── Google OAuth ───
  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      });
      if (oauthError) showToast('❌ ' + oauthError.message);
    } catch {
      showToast('❌ Lỗi kết nối');
    } finally { setLoading(false); }
  };

  // ─── Constants ───
  const features = [
    { icon: 'heart', label: 'Quan hệ', desc: 'Quản lý mối quan hệ quan trọng' },
    { icon: 'calendar', label: 'Sự kiện', desc: 'Ghi nhớ & theo dõi mọi sự kiện' },
    { icon: 'image', label: 'Ký ức', desc: 'Lưu giữ những khoảnh khắc đáng nhớ' },
    { icon: 'brain', label: 'AI Insight', desc: 'Phân tích & gợi ý thông minh' },
    { icon: 'shield', label: 'Bảo mật', desc: 'Dữ liệu của bạn luôn được bảo vệ' },
  ];

  function featureIcon(name: string) {
    const s = { width: 34, height: 34, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
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
      {/* ─── Toast ─── */}
      <div id="l-toast"
        className="fixed top-5 left-1/2 -translate-x-1/2 -translate-y-5 scale-90 bg-black/85 backdrop-blur-xl text-white px-[22px] py-3 rounded-[26px] text-[13px] font-semibold z-[100] opacity-0 pointer-events-none shadow-[0_16px_40px_rgba(0,0,0,.25)] transition-all duration-[400ms]"
        style={{ transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)' }} />
      <style>{`#l-toast.show{opacity:1;transform:translateX(-50%)translateY(0)scale(1)}`}</style>

      {/* ─── SCREEN ─── */}
      <div className="flex h-screen overflow-hidden">

        {/* ══════ LEFT: BRAND + COVER ══════ */}
        <div className="hidden md:flex w-[60%] relative overflow-hidden flex-col p-[40px_56px_32px] text-white"
          style={{ background: '#050203' }}>

          {/* Cover image — screen blend, dark overlay */}
          <div className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(/images/bg-panel-left.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }} />
          <div className="absolute inset-0 z-[1]"
            style={{
              background: `
                radial-gradient(ellipse at 78% 42%, rgba(20,0,3,.08) 0%, rgba(5,2,3,.2) 48%, rgba(5,2,3,.55) 82%),
                linear-gradient(90deg, rgba(5,2,3,.5) 0%, rgba(5,2,3,.2) 30%, rgba(5,2,3,.05) 50%, rgba(5,2,3,.1) 66%, rgba(5,2,3,.3) 100%),
                linear-gradient(180deg, rgba(5,2,3,.08) 0%, rgba(5,2,3,.03) 35%, rgba(5,2,3,.35) 100%)
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
            <div className="flex flex-col justify-center flex-1 w-full pt-[20px]">
              <div className="max-w-[430px]">
                <h1 className="text-[38px] font-extrabold leading-[1.2] tracking-[-1px]">
                  Quản lý <span style={{ color: '#FF3B4E' }}>toàn bộ</span><br />
                  <span style={{ color: '#FF3B4E' }}>cuộc sống</span> của bạn
                </h1>
                <div className="h-[4px] rounded-full mt-[8px] mb-[16px]"
                  style={{ width: '180px', background: 'linear-gradient(90deg,#E6002D,#FF3B4E)' }} />
                <p className="text-[14.5px] leading-[1.65]" style={{ color: 'rgba(255,255,255,.62)' }}>
                  Mọi mối quan hệ, sự kiện, ký ức và mục tiêu<br />
                  cuộc đời được kết nối trong một không gian<br />
                  riêng tư, an toàn.
                </p>

                <div className="flex flex-col items-start gap-[32px] mt-[32px]">
                  <Link href="/register"
                    className="inline-flex items-center gap-[9px] px-[26px] py-[15px] rounded-[14px] text-[14.5px] font-bold text-white no-underline"
                    style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 100%)', boxShadow: '0 14px 34px rgba(214,0,50,.4)' }}>
                    🚀 Bắt đầu miễn phí
                  </Link>
                </div>
              </div>
            </div>

            {/* Features — equal spacing, spread across full panel */}
            <div className="w-full mt-auto pb-[4px]">
              <div className="w-full" style={{ paddingLeft: '28px', paddingRight: '28px' }}>
                <div className="flex items-stretch" style={{ gap: '28px' }}>
                  {features.map((f, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center text-center relative"
                      style={{ minWidth: '100px', maxWidth: '180px' }}>
                      {i > 0 && (
                        <div className="absolute top-1/2 -translate-y-1/2 w-[1px] h-6 bg-white/12"
                          style={{ left: '-14px' }} />
                      )}
                      <div className="mb-[6px]" style={{ color: '#FF3B4E' }}>
                        {featureIcon(f.icon)}
                      </div>
                      <div className="text-[12px] font-bold mb-[3px] whitespace-nowrap">{f.label}</div>
                      <div className="text-[10px] leading-[1.4] text-center line-clamp-2"
                        style={{ color: 'rgba(255,255,255,.45)' }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[12px] text-center pt-[12px] pb-[4px]" style={{ color: 'rgba(255,255,255,.35)' }}>
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
                  style={{ background: 'linear-gradient(135deg,#8A0020 0%,#D60032 45%,#FF4B3A 100%)' }}>P</div>
                <span className="text-[20px] font-extrabold text-[#101010]">Prot Life</span>
              </div>
              <p className="text-[13px] text-[#9CA3AF]">Đăng nhập để tiếp tục</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-[16px] p-[12px_14px] rounded-[12px] text-[12.5px] font-semibold"
                style={{ background: 'rgba(230,0,45,.06)', border: '1px solid rgba(230,0,45,.12)', color: '#E6002D' }}>
                {error}
              </div>
            )}

            {/* Detected admin */}
            {detectedAdmin && (
              <div className="mb-[16px] p-[12px_14px] rounded-[12px] text-[12.5px] font-semibold flex items-center gap-2"
                style={{ background: 'rgba(52,199,89,.06)', border: '1px solid rgba(52,199,89,.12)', color: '#34C759' }}>
                🛡️ Đã phát hiện Admin
              </div>
            )}

            {/* Title */}
            <div className="text-[24px] font-extrabold mb-[4px]" style={{ color: 'var(--color-text-primary, #101010)' }}>Đăng nhập</div>
            <div className="text-[13px] mb-[22px]" style={{ color: '#9CA3AF' }}>Đăng nhập để tiếp tục</div>

            {/* Method tabs */}
            <div className="flex rounded-[12px] p-[4px] mb-[22px]"
              style={{ background: '#F4F4F6' }}>
              <button onClick={() => setMethod('password')}
                className={`flex-1 text-center py-[9px] rounded-[9px] text-[12.5px] font-bold border-none cursor-pointer transition-all duration-[180ms] ${
                  method === 'password'
                    ? 'text-[#E6002D] shadow-[0_2px_8px_rgba(0,0,0,.06)]'
                    : 'text-[#6B7280] bg-transparent'
                }`}
                style={method === 'password' ? { background: '#fff', color: 'var(--color-primary, #E6002D)' } : undefined}>
                Mật khẩu
              </button>
              <button onClick={() => setMethod('magic')}
                className={`flex-1 text-center py-[9px] rounded-[9px] text-[12.5px] font-bold border-none cursor-pointer transition-all duration-[180ms] ${
                  method === 'magic'
                    ? 'text-[#E6002D] shadow-[0_2px_8px_rgba(0,0,0,.06)]'
                    : 'text-[#6B7280] bg-transparent'
                }`}
                style={method === 'magic' ? { background: '#fff', color: 'var(--color-primary, #E6002D)' } : undefined}>
                Magic Link
              </button>
            </div>

            {/* ─── PASSWORD MODE ─── */}
            {method === 'password' && (
              <form onSubmit={handlePasswordLogin}>
                {/* Email */}
                <div className="mb-[16px]">
                  <label className="block text-[11px] font-extrabold tracking-[.4px] uppercase mb-[7px]"
                    style={{ color: '#6B7280' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full px-[14px] py-[12px] rounded-[11px] text-[13.5px] outline-none transition-colors"
                    style={{ border: '1.5px solid #EEEEF1', background: '#FAFAFB' }}
                    onFocus={e => { e.target.style.borderColor = '#E6002D'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#EEEEF1'; e.target.style.background = '#FAFAFB'; }}
                    autoComplete="email" />
                </div>

                {/* Password */}
                <div className="mb-[16px]">
                  <label className="block text-[11px] font-extrabold tracking-[.4px] uppercase mb-[7px]"
                    style={{ color: '#6B7280' }}>Mật khẩu</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-[14px] py-[12px] rounded-[11px] text-[13.5px] outline-none transition-colors"
                      style={{ border: '1.5px solid #EEEEF1', background: '#FAFAFB', paddingRight: '40px' }}
                      onFocus={e => { e.target.style.borderColor = '#E6002D'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#EEEEF1'; e.target.style.background = '#FAFAFB'; }}
                      autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-[15px]"
                      style={{ color: '#9CA3AF' }}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end -mt-[8px] mb-[18px]">
                  <button type="button" onClick={() => showToast('🔐 Chức năng đặt lại mật khẩu đang phát triển')}
                    className="text-[12px] font-bold bg-transparent border-none cursor-pointer"
                    style={{ color: 'var(--color-primary, #E6002D)' }}>
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full py-[13.5px] rounded-[13px] border-none text-[14px] font-extrabold text-white cursor-pointer active:scale-[.98] transition-transform disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg,#8A0020 0%,#D60032 45%,#FF4B3A 100%)',
                    boxShadow: '0 12px 28px rgba(184,0,31,.28)',
                  }}>
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin align-middle" />
                  ) : 'Đăng nhập'}
                </button>
              </form>
            )}

            {/* ─── MAGIC LINK MODE ─── */}
            {method === 'magic' && (
              <>
                {!magicSent ? (
                  /* State A: form */
                  <div>
                    <div className="mb-[16px]">
                      <label className="block text-[11px] font-extrabold tracking-[.4px] uppercase mb-[7px]"
                        style={{ color: '#6B7280' }}>Email</label>
                      <input id="magicEmail" type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className="w-full px-[14px] py-[12px] rounded-[11px] text-[13.5px] outline-none transition-colors"
                        style={{ border: '1.5px solid #EEEEF1', background: '#FAFAFB' }}
                        onFocus={e => { e.target.style.borderColor = '#E6002D'; e.target.style.background = '#fff'; }}
                        onBlur={e => { e.target.style.borderColor = '#EEEEF1'; e.target.style.background = '#FAFAFB'; }} />
                    </div>
                    <button type="button" onClick={handleSendMagic} disabled={loading}
                      className="w-full py-[13.5px] rounded-[13px] border-none text-[14px] font-extrabold text-white cursor-pointer active:scale-[.98] transition-transform disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg,#8A0020 0%,#D60032 45%,#FF4B3A 100%)',
                        boxShadow: '0 12px 28px rgba(184,0,31,.28)',
                      }}>
                      {loading
                        ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin align-middle" />
                        : 'Gửi link đăng nhập'}
                    </button>
                  </div>
                ) : (
                  /* State B: success */
                  <div className="text-center py-[20px]">
                    <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-[24px] mx-auto mb-[18px]"
                      style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      ✓
                    </div>
                    <h3 className="text-[16px] font-extrabold mb-[8px]">Đã gửi link đăng nhập!</h3>
                    <p className="text-[12.5px] leading-[1.6] mb-[18px]" style={{ color: '#6B7280' }}>
                      Kiểm tra hộp thư <strong className="text-[#101010]">{magicEmail}</strong> và bấm vào link để đăng nhập — không cần nhớ mật khẩu.
                    </p>
                    <button type="button" onClick={handleSendMagic} disabled={loading}
                      className="text-[12.5px] font-bold bg-transparent border-none cursor-pointer"
                      style={{ color: 'var(--color-primary, #E6002D)' }}>
                      Gửi lại email
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ─── DIVIDER ─── */}
            <div className="flex items-center gap-[12px] my-[22px]">
              <span className="flex-1 h-[1px]" style={{ background: '#EEEEF1' }} />
              <span className="text-[11.5px] font-semibold shrink-0" style={{ color: '#9CA3AF' }}>Hoặc</span>
              <span className="flex-1 h-[1px]" style={{ background: '#EEEEF1' }} />
            </div>

            {/* ─── OAUTH: Google only ─── */}
            <div className="flex flex-col gap-[10px]">
              <button onClick={() => {
                  showToast('↗️ Chuyển tới Google...');
                  handleGoogle();
                }} disabled={loading}
                className="w-full py-[11.5px] rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-[10px] cursor-pointer transition-colors disabled:opacity-50"
                style={{ background: '#fff', border: '1.5px solid #EEEEF1', color: '#101010' }}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.6 8.6 0 0 0 9 0 9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
                </svg>
                Đăng nhập với Google
              </button>
            </div>

            {/* ─── SIGNUP ─── */}
            <div className="text-center mt-[26px] text-[12.5px]" style={{ color: '#6B7280' }}>
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-bold no-underline" style={{ color: 'var(--color-primary, #E6002D)' }}>
                Đăng ký ngay
              </Link>
            </div>

            {/* Footer mobile */}
            <div className="md:hidden text-center mt-[32px] text-[11px] text-[#9CA3AF] font-medium">
              Made with ♥ by Prot
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
