'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase/client';

export default function LandingPage() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);

  // ─── Session check ───
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

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
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.user.id)
            .single();
          if (profile?.name) realName = profile.name;
        } catch { /* fallback to metadata */ }
        if (!realName) realName = data.user.email?.split('@')[0] || '';
        login({
          id: data.user.id,
          email: data.user.email || email.trim(),
          name: realName,
          avatar: data.user.user_metadata?.avatar_url || '',
          role: 'admin',
        });
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
    { icon: '👥', label: 'Quản lý quan hệ', desc: 'Theo dõi kết nối, sinh nhật, tương tác' },
    { icon: '📅', label: 'Sự kiện & Ký ức', desc: 'Ghi lại mọi khoảnh khắc đáng nhớ' },
    { icon: '🧠', label: 'AI Insight', desc: 'Phân tích thông minh cuộc sống của bạn' },
    { icon: '🛡️', label: 'Bảo mật & Riêng tư', desc: 'Dữ liệu cá nhân được bảo vệ tuyệt đối' },
  ];

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
        <div className="hidden md:flex flex-1 relative overflow-hidden flex-col justify-between p-[44px_48px]"
          style={{ background: 'linear-gradient(135deg,#8A0020 0%,#D60032 45%,#FF4B3A 100%)' }}>

          {/* Cover image */}
          <div className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(/images/protlife-cover.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
              opacity: 0.55,
            }} />

          {/* Gradient overlay */}
          <div className="absolute inset-0 z-[1]"
            style={{
              background: 'linear-gradient(180deg, rgba(138,0,32,.55) 0%, rgba(138,0,32,.25) 30%, rgba(20,0,5,.65) 78%, rgba(10,0,2,.9) 100%)',
            }} />

          {/* Content (above layers) */}
          <div className="relative z-[2] flex flex-col h-full">

            {/* Brand */}
            <div className="flex items-center gap-[11px]">
              <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center font-extrabold text-[17px] text-white"
                style={{ background: 'rgba(255,255,255,.14)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.25)' }}>
                P
              </div>
              <div>
                <div className="font-extrabold text-[17px] text-white">Prot Life</div>
                <div className="text-[11.5px] text-white/75 mt-[1px]">Hệ điều hành cuộc sống cá nhân</div>
              </div>
            </div>

            {/* Hero */}
            <div className="my-auto max-w-[460px]">
              <h1 className="text-white text-[34px] font-extrabold leading-[1.2] tracking-[-.5px] mb-[14px]">
                Quản lý cuộc sống theo cách của bạn
              </h1>
              <p className="text-[14px] leading-[1.65] text-white/82 mb-[30px]">
                Một nền tảng cá nhân để quản lý quan hệ, sự kiện, ký ức và mục tiêu — tất cả trong một không gian riêng tư, bảo mật.
              </p>

              {/* Features grid 2×2 */}
              <div className="grid grid-cols-2 gap-[12px]">
                {features.map((f, i) => (
                  <div key={i} className="rounded-[16px] p-[16px] transition-colors"
                    style={{ background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.16)', backdropFilter: 'blur(10px)' }}>
                    <span className="text-[19px] mb-[8px] block">{f.icon}</span>
                    <div className="text-[13px] font-bold text-white mb-[3px]">{f.label}</div>
                    <div className="text-[11px] text-white/68 leading-[1.4]">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-[12px] text-white/55">Made with ♥ by Prot</div>
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

            {/* Session banner (conditional) */}
            {hasSession && (
              <div className="mb-[26px] p-[14px_16px] rounded-[14px]"
                style={{ background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                <div className="text-[12px] font-bold text-[#2563EB] mb-[8px]">Bạn đã đăng nhập</div>
                <button onClick={() => router.push('/dashboard')}
                  className="w-full py-[11px] rounded-[10px] border-none text-[13.5px] font-bold text-white cursor-pointer flex items-center justify-center gap-[6px]"
                  style={{ background: '#2563EB' }}>
                  Vào Dashboard →
                </button>
              </div>
            )}

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
              <button onClick={handleGoogle} disabled={loading}
                className="w-full py-[11.5px] rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-[10px] cursor-pointer transition-colors disabled:opacity-50"
                style={{ background: '#fff', border: '1.5px solid #EEEEF1', color: '#101010' }}>
                <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ background: '#4285F4' }}>G</span>
                Google
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
