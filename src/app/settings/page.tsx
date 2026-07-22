'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Check, X, Sun, Moon, Monitor, Eye, EyeOff,
  User, Shield, Bell, Palette, Database, Users, Calendar, BookHeart, MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore, fontSizeValue } from '@/stores/settings-store';
import type { SettingsState, ThemeMode } from '@/stores/settings-store';
import { settingsService, AppDataStats } from '@/lib/services/settings-service';
import { getUserDevices, deleteOtherDevices, getCurrentDeviceId, formatDeviceName, getDeviceIcon } from '@/lib/services/device-service';
import type { UserDevice } from '@/lib/services/device-service';
import { supabase } from '@/lib/supabase/client';

// ─── Types ───
type Tab = 'account' | 'data' | 'privacy' | 'notify' | 'appearance' | 'permissions' | 'backup';
type RoleKey = 'public' | 'viewer' | 'contributor' | 'admin';

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id:'account', label:'Tài khoản', icon: User },
  { id:'data', label:'Dữ liệu', icon: Database },
  { id:'privacy', label:'Quyền riêng tư', icon: Shield },
  { id:'notify', label:'Thông báo', icon: Bell },
  { id:'appearance', label:'Giao diện', icon: Palette },
  { id:'permissions', label:'Phân quyền', icon: Users },
  { id:'backup', label:'Sao lưu', icon: Database },
];

// ─── Helpers ───
function toast(msg: string) {
  const el = document.getElementById('s-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout((el as any)._t);
  (el as any)._t = setTimeout(() => el.classList.remove('show'), 2200);
}

// ─── Reusable widgets ───

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`relative w-[42px] h-[25px] shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} onClick={e => e.stopPropagation()}>
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled}
        onChange={e => onChange?.(e.target.checked)} />
      <span className="block w-full h-full rounded-[25px] transition-colors duration-200"
        style={{ background: checked ? 'var(--color-primary)' : '#E5E5EA' }}>
        <span className="block w-[21px] h-[21px] bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)', marginTop: '2px' }} />
      </span>
    </label>
  );
}

function ToggleRow({ title, desc, checked, onChange, disabled }: { title: string; desc?: string; checked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-[13px] border-b border-[#EDEDF1] last:border-b-0 gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold truncate">{title}</div>
        {desc && <div className="text-[11.5px] text-[#6B7280] mt-0.5">{desc}</div>}
      </div>
      <Toggle checked={!!checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Btn({ children, onClick, danger, className = '', disabled = false }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; className?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full px-4 py-[11px] rounded-[11px] text-[13px] font-bold text-center transition-all duration-150 ${
        danger ? 'text-[#E6002D] hover:bg-[rgba(230,0,45,.06)]' : 'text-[#6B7280] hover:bg-[#F1F1F4]'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >{children}</button>
  );
}

function BtnP({ children, onClick, className = '', disabled = false }: { children: React.ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full px-4 py-[11px] rounded-[11px] text-[13px] font-bold text-center transition-all duration-150 text-white ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      style={{ background: 'var(--color-primary)' }}
    >{children}</button>
  );
}

function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05),0_2px_8px_rgba(0,0,0,.03)] mb-[18px] ${className}`}>
      {title && <div className="text-[14.5px] font-extrabold mb-[16px]">{title}</div>}
      {children}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[24px] p-[22px] shadow-[0_30px_80px_rgba(0,0,0,.25)] w-full max-w-[480px] max-h-[85vh] overflow-y-auto animate-[modalIn_.25s_cubic-bezier(.34,1.4,.64,1)_both]">
        <style>{`@keyframes modalIn{from{transform:scale(.96)translateY(10px);opacity:0}to{transform:scale(1)translateY(0);opacity:1}}`}</style>
        {title && (
          <div className="flex items-start justify-between mb-4">
            <div className="text-[17px] font-extrabold">{title}</div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6B7280] hover:bg-[#F1F1F4] shrink-0"><X size={15} strokeWidth={1.8} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Theme icon ───
function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === 'light') return <Sun size={14} />;
  if (mode === 'dark') return <Moon size={14} />;
  return <Monitor size={14} />;
}

// ════════════════════════════════════════════════════════════════════════
// ═══════  SETTINGS PAGE — Real data, real persistence  ═══════════
// ════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  // ¤ Auth (real user data)
  const authUser = useAuthStore(s => s.user);
  const authLogout = useAuthStore(s => s.logout);
  const setSigningOut = useAuthStore(s => s.setSigningOut);

  // ¤ Settings store (persisted to localStorage — will sync to DB later)
  const s = useSettingsStore();
  const setSetting = s.set;

  // ¤ Real data stats
  const [stats, setStats] = useState<AppDataStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    settingsService.getDataStats().then(d => { setStats(d); setLoadingStats(false); }).catch(() => setLoadingStats(false));
  }, []);

  // ¤ Tab
  const [tab, setTab] = useState<Tab>('account');

  // ¤ Account form
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(authUser?.name || s.displayName || '');
  const [editEmail] = useState(authUser?.email || s.displayEmail || '');
  const [editPhone, setEditPhone] = useState(s.phone);
  const [editDob, setEditDob] = useState(s.dob);
  const [editGender, setEditGender] = useState(s.gender);
  const userEmail = authUser?.email || '';

  const handleSaveProfile = useCallback(async () => {
    // Lưu vào Zustand/localStorage
    setSetting({ displayName: editName, phone: editPhone, dob: editDob, gender: editGender, displayEmail: editEmail });
    // Đồng bộ lên Supabase
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: authUser?.id,
        name: editName,
        email: authUser?.email,
      });
      if (error) throw error;
      // Cập nhật luôn auth store để persist qua F5
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().login({ ...currentUser, name: editName });
      }
      toast('✅ Đã lưu thông tin cá nhân');
    } catch (e: any) {
      toast('❌ Lỗi khi lưu lên server: ' + (e?.message || 'Không xác định'));
    }
    setEditing(false);
  }, [editName, editPhone, editDob, editGender, editEmail, setSetting, authUser?.id]);

  // ¤ Google Sheets
  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string | null>(null);

  // Check OAuth result from URL params + fetch status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gResult = params.get('google');
    if (gResult === 'linked') {
      // Clean URL
      window.history.replaceState({}, '', '/settings');
      toast('✅ Đã liên kết Google Sheets thành công!');
      setGoogleLinked(true);
    } else if (gResult === 'denied') {
      window.history.replaceState({}, '', '/settings');
      toast('ℹ️ Bạn đã huỷ cấp quyền Google.');
    } else if (gResult === 'error') {
      window.history.replaceState({}, '', '/settings');
      const reason = params.get('reason') || 'unknown';
      toast('❌ Lỗi liên kết Google: ' + ({ config:'Thiếu cấu hình', state:'Lỗi bảo mật', token:'Không nhận được token', db:'Lỗi lưu dữ liệu', network:'Lỗi mạng' }[reason] || reason));
    }
    // Fetch current link status
    fetch('/api/auth/google/status').then(r => r.json()).then(d => {
      setGoogleLinked(d.linked);
      if (d.sheetUrl) setGoogleSheetUrl(d.sheetUrl);
    }).catch(() => {}).finally(() => setGoogleLoading(false));
  }, []);

  // ¤ Device management
  const [showDevices, setShowDevices] = useState(false);
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const loadDevices = useCallback(async () => {
    if (!authUser?.id) return;
    setDevicesLoading(true);
    try {
      const list = await getUserDevices();
      setDevices(list);
    } catch { /* silent */ }
    setDevicesLoading(false);
  }, [authUser?.id]);
  const handleDeleteDevice = useCallback(async (deviceId: string, sessionId: string | null) => {
    try {
      // If no session_id (old records before Part 11), call edge function anyway
      // The edge function handles null session_id by deleting device record directly
      const { error } = await supabase.functions.invoke('revoke-device-session', {
        body: { session_id: sessionId, device_row_id: deviceId }
      });
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Lỗi từ máy chủ');
      setDevices(d => d.filter(x => x.id !== deviceId));
      toast('✅ Đã đăng xuất thiết bị');
    } catch (e: any) {
      toast('❌ ' + (e?.message || 'Lỗi khi đăng xuất thiết bị'));
    }
  }, []);
  const handleDeleteOtherDevices = useCallback(async () => {
    const curId = getCurrentDeviceId();
    if (!curId) { toast('❌ Không xác định được thiết bị hiện tại'); return; }
    try {
      await deleteOtherDevices(curId);
      setDevices(d => d.filter(x => x.id === curId));
      toast('✅ Đã đăng xuất khỏi mọi thiết bị khác');
    } catch { toast('❌ Lỗi khi đăng xuất'); }
  }, []);

  // ¤ Change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = useCallback(async () => {
    setChangeError('');
    if (newPassword.length < 6) {
      setChangeError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('Mật khẩu nhập lại không khớp');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast('✅ Đã đổi mật khẩu');
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setChangeError(e?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  return (
    <>
      {/* Toast */}
      <div id="s-toast"
        className="fixed top-5 left-1/2 -translate-x-1/2 -translate-y-5 scale-90 bg-black/85 backdrop-blur-xl text-white px-[22px] py-3 rounded-[26px] text-[13px] font-semibold z-[100] opacity-0 pointer-events-none shadow-[0_16px_40px_rgba(0,0,0,.25)] transition-all duration-[400ms]"
        style={{ transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)' }} />
      <style>{`#s-toast.show{opacity:1;transform:translateX(-50%)translateY(0)scale(1)}`}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[19px] font-extrabold tracking-[-.3px]">Cài đặt</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#EDEDF1] overflow-x-auto mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative bg-transparent border-none px-1 pb-3 mr-[22px] text-[13.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              tab === t.id ? 'text-[var(--color-primary)] font-bold' : 'text-[#9CA3AF] hover:text-[#101010]'
            }`}>
            <t.icon size={13} strokeWidth={tab === t.id ? 2.5 : 1.8} />
            {t.label}
            {tab === t.id && <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] rounded-[2px]" style={{background: 'var(--color-primary)'}} />}
          </button>
        ))}
      </div>

      {/* ─── Content ─── */}
      <div className="pb-[40px]">

        {/* ═══ TÀI KHOẢN ═══ */}
        {tab === 'account' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Thông tin cá nhân">
              <div className="flex items-center gap-[14px] mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-[20px] shrink-0"
                  style={{background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)'}}>
                  {(authUser?.name || 'P')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-[14px]">{authUser?.name || 'Chưa đặt tên'}</div>
                  <div className="text-[12px] text-[#6B7280]">
                    {authUser?.role === 'admin' ? 'Admin' :
                     authUser?.role === 'contributor' ? 'Người đóng góp' :
                     authUser?.role === 'viewer' ? 'Chỉ xem' :
                     authUser?.role === 'public' ? 'Khách công khai' : ''}</div>
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5">{userEmail}</div>
                </div>
              </div>
              <div className="mb-[14px]">
                <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Tên hiển thị</label>
                <input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
                  value={editName} onChange={e => { setEditName(e.target.value); setEditing(true); }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="mb-[14px]">
                  <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Email</label>
                  <input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] text-[#6B7280] outline-none cursor-not-allowed" value={editEmail} disabled />
                </div>
                <div className="mb-[14px]">
                  <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Số điện thoại</label>
                  <input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)]"
                    value={editPhone} onChange={e => { setEditPhone(e.target.value); setEditing(true); }} placeholder="Chưa có" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="mb-[14px]">
                  <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Ngày sinh</label>
                  <input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)]"
                    value={editDob} onChange={e => { setEditDob(e.target.value); setEditing(true); }} placeholder="VD: 27/10/1992" />
                </div>
                <div className="mb-[14px]">
                  <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Giới tính</label>
                  <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)]"
                    value={editGender} onChange={e => { setEditGender(e.target.value); setEditing(true); }}>
                    <option>Nam</option><option>Nữ</option><option>Khác</option>
                  </select>
                </div>
              </div>
              {editing && <BtnP onClick={handleSaveProfile}>Lưu thay đổi</BtnP>}
              {!editing && (
                <div className="text-[11.5px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 leading-relaxed">
                  Thông tin được lưu trên thiết bị này. Sync lên database sẽ có trong bản cập nhật sau.
                </div>
              )}
            </Card>

            <div>
              <Card title="Bảo mật">
                <Btn onClick={() => setShowChangePassword(true)}>Đổi mật khẩu</Btn>
                <Btn onClick={() => { setShowDevices(true); loadDevices(); }}>📱 Quản lý thiết bị</Btn>
                <Btn danger onClick={async () => {
                  setSigningOut(true);
                  await supabase.auth.signOut().catch(() => {});
                  authLogout();
                  toast('🔒 Đã đăng xuất');
                  window.location.href = '/login';
                }}>Đăng xuất khỏi thiết bị này</Btn>
              </Card>

              <Card title="Ngôn ngữ">
                <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)]"
                  value={s.language} onChange={e => setSetting({ language: e.target.value as any })}>
                  <option>Tiếng Việt</option><option>English</option>
                </select>
              </Card>

              <Card title="Múi giờ">
                <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)]"
                  value={s.timezone} onChange={e => setSetting({ timezone: e.target.value })}>
                  <option>(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                  <option>(GMT+09:00) Tokyo, Seoul</option>
                </select>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ DỮ LIỆU ═══ */}
        {tab === 'data' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
              <Card title="Dung lượng sử dụng">
                {loadingStats ? (
                  <div className="text-[13px] text-[#6B7280] py-4">Đang tải...</div>
                ) : stats ? (
                  <>
                    <StorageBar label="Database (Postgres)" used={`${stats.isEstimate ? '~' : ''}${stats.storageDbMb} MB`} total={`${stats.totalDbMb} MB`} pct={Math.round((stats.storageDbMb / stats.totalDbMb) * 100)} estimate={stats.isEstimate} />
                    <StorageBar label="File Storage" used={`${stats.isEstimate ? '~' : ''}${stats.storageFileMb} MB`} total={`${stats.totalFileMb} MB`} pct={Math.round((stats.storageFileMb / stats.totalFileMb) * 100)} color="linear-gradient(135deg,#F59E0B,#FBBF24)" estimate={stats.isEstimate} />
                    <div className="mt-4 space-y-0">
                      <DataStat label="👥 Người thân & bạn bè" value={`${stats.contacts} hồ sơ`} />
                      <DataStat label="📅 Sự kiện" value={`${stats.events} sự kiện`} />
                      <DataStat label="📸 Ký ức" value={`${stats.memories} mục`} />
                      <DataStat label="🗺️ Địa điểm đã lưu" value={`${stats.places} địa điểm`} />
                    </div>
                  </>
                ) : (
                  <div className="text-[13px] text-[#E6002D] py-4">Không thể tải dữ liệu</div>
                )}
              </Card>

              <div>
                <Card title="Xuất / nhập dữ liệu">
                  <Btn onClick={() => handleExportAll(stats)}>⬇️ Xuất toàn bộ dữ liệu (.json)</Btn>
                  <Btn onClick={() => toast('📄 Tính năng xuất báo cáo đang phát triển')}>📄 Xuất báo cáo</Btn>
                  <Btn onClick={() => toast('⬆️ Tính năng đang phát triển')}>⬆️ Nhập từ file (.json/.csv)</Btn>
                </Card>
                <Card title="Tích hợp Google">
                  <ToggleRow title="Google Calendar" desc="Đồng bộ sự kiện" checked={s.googleCalendar} onChange={v => setSetting({ googleCalendar: v })} />
                  <ToggleRow title="Google Contacts" desc="Nhập danh bạ" checked={s.googleContacts} onChange={v => setSetting({ googleContacts: v })} />
                  <ToggleRow title="Google Drive" desc="Chọn file đính kèm" checked={s.googleDrive} onChange={v => setSetting({ googleDrive: v })} />
                </Card>
              </div>
            </div>

            {/* Google Sheets Sync */}
            <Card>
              <div className="text-[14.5px] font-extrabold mb-[12px] flex items-center gap-2">🔄 Đồng bộ Google Sheets</div>
              <div className="text-[12px] text-[#6B7280] mb-4 leading-relaxed">Mọi thay đổi trong app tự động đẩy sang Google Sheet — sửa trong Sheet <strong>chưa</strong> tự động đẩy ngược lại app.</div>
              {googleLoading ? (
                <div className="text-[13px] text-[#6B7280] py-2">Đang kiểm tra...</div>
              ) : googleLinked ? (
                <div className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background:'#0F9D58'}}>📊</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold">ProtLife_Data_Export.xlsx</div>
                    <div className="text-[11.5px] text-[#6B7280] mt-0.5">Đã liên kết{googleSheetUrl ? ' · ' : ''}{googleSheetUrl && <a href={googleSheetUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{color:'var(--color-primary)'}}>Mở Sheet</a>}</div>
                  </div>
                  <button onClick={async () => {
                    try {
                      const res = await fetch('/api/auth/google/unlink', { method: 'POST' });
                      if (!res.ok) throw new Error();
                      setGoogleLinked(false);
                      setGoogleSheetUrl(null);
                      toast('🔌 Đã ngắt liên kết Google Sheet');
                    } catch {
                      toast('❌ Lỗi khi ngắt kết nối');
                    }
                  }} className="border border-[rgba(var(--color-primary-rgb),.25)] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold" style={{color: 'var(--color-primary)'}}>Ngắt kết nối</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-[11px] flex items-center justify-center font-extrabold text-[15px] shrink-0" style={{background:'#E5E5EA',color:'#9CA3AF'}}>📊</div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold">Chưa liên kết</div>
                    <div className="text-[11.5px] text-[#6B7280] mt-0.5">Cần cấp quyền Google để đồng bộ</div>
                  </div>
                  <BtnP onClick={() => { window.location.href = '/api/auth/google'; }} className="!w-auto px-4">🔗 Liên kết</BtnP>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ═══ QUYỀN RIÊNG TƯ ═══ */}
        {tab === 'privacy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Hiển thị hồ sơ">
              <ToggleRow title="Hồ sơ công khai" desc="Người khác tìm thấy bạn" checked={s.publicProfile} onChange={v => setSetting({ publicProfile: v })} />
              <ToggleRow title="Trạng thái hoạt động" desc="Hiện thời điểm dùng app" checked={s.onlineStatus} onChange={v => setSetting({ onlineStatus: v })} />
              <ToggleRow title="Vị trí trong Bản đồ" desc="Chia sẻ với nhóm gia đình" checked={s.locationShare} onChange={v => setSetting({ locationShare: v })} />
            </Card>
            <div>
              <Card title="Dữ liệu & AI">
                <ToggleRow title="Dùng dữ liệu gợi ý AI" desc="Cải thiện độ chính xác" checked={s.aiDataUse} onChange={v => setSetting({ aiDataUse: v })} />
                <ToggleRow title="Thống kê ẩn danh" desc="Giúp cải thiện app" checked={s.anonymousStats} onChange={v => setSetting({ anonymousStats: v })} />
              </Card>
              <Card title="Danh sách chặn">
                <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3">Bạn chưa chặn ai. Người bị chặn không thể xem hồ sơ hay mời vào sự kiện.</div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ THÔNG BÁO ═══ */}
        {tab === 'notify' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Nhắc nhở">
              <ToggleRow title="Sinh nhật" desc="Trước 3 ngày + trong ngày" checked={s.notifyBirthday} onChange={v => setSetting({ notifyBirthday: v })} />
              <ToggleRow title="Sự kiện sắp tới" desc="Nhắc trước 1 ngày" checked={s.notifyEventReminder} onChange={v => setSetting({ notifyEventReminder: v })} />
              <ToggleRow title="Kỷ niệm quan hệ" desc='VD: 1 năm ngày quen' checked={s.notifyAnniversary} onChange={v => setSetting({ notifyAnniversary: v })} />
              <ToggleRow title="Gợi ý AI" desc='VD: "Lâu rồi chưa gặp Minh"' checked={s.notifyAiSuggest} onChange={v => setSetting({ notifyAiSuggest: v })} />
            </Card>
            <div>
              <Card title="Kênh thông báo">
                <ToggleRow title="Push" checked={s.pushEnabled} onChange={v => setSetting({ pushEnabled: v })} />
                <ToggleRow title="Email" checked={s.emailNotify} onChange={v => setSetting({ emailNotify: v })} />
                <ToggleRow title="SMS" checked={s.smsNotify} onChange={v => setSetting({ smsNotify: v })} />
              </Card>
              <Card title="Giờ yên lặng">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Từ</label>
                    <input type="time" className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)]"
                      value={s.quietFrom} onChange={e => setSetting({ quietFrom: e.target.value })} /></div>
                  <div><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Đến</label>
                    <input type="time" className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)]"
                      value={s.quietTo} onChange={e => setSetting({ quietTo: e.target.value })} /></div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══ GIAO DIỆN ═══ */}
        {tab === 'appearance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Chế độ hiển thị">
              <div className="grid grid-cols-3 gap-2.5 mb-[18px]">
                {(['light', 'dark', 'system'] as ThemeMode[]).map(m => (
                  <div key={m} onClick={() => setSetting({ theme: m })}
                    className={`border-2 rounded-[14px] p-2.5 cursor-pointer text-center ${s.theme === m ? 'border-[var(--color-primary)]' : 'border-[#EDEDF1]'}`}>
                    <div className="h-[52px] rounded-[9px] mb-2 flex items-center justify-center text-[20px]"
                      style={{ background: m === 'light' ? 'linear-gradient(180deg,#fff,#F1F1F4)' : m === 'dark' ? 'linear-gradient(180deg,#2A2A2E,#101012)' : 'linear-gradient(90deg,#fff 50%,#101012 50%)', border: m === 'light' ? '1px solid #EDEDF1' : undefined }}>
                      <ThemeIcon mode={m} />
                    </div>
                    <div className="text-[11.5px] font-bold">{m === 'light' ? 'Sáng' : m === 'dark' ? 'Tối' : 'Hệ thống'}</div>
                  </div>
                ))}
              </div>
              <div className="text-[14.5px] font-extrabold mb-3">Màu nhấn</div>
              <div className="flex gap-2.5">
                {['#E6002D','#8B5CF6','#10B981','#F59E0B','#0EA5E9'].map(c => (
                  <div key={c} onClick={() => setSetting({ accentColor: c })}
                    className={`w-[30px] h-[30px] rounded-full cursor-pointer flex items-center justify-center border-2 ${s.accentColor === c ? 'border-[#101010]' : 'border-transparent'}`}
                    style={{ background: c }}>
                    {s.accentColor === c && <Check size={13} className="text-white" strokeWidth={3} />}
                  </div>
                ))}
              </div>
            </Card>
            <div>
              <Card title="Cỡ chữ">
                <input type="range" min={0} max={4} value={s.fontSize} onChange={e => setSetting({ fontSize: Number(e.target.value) })} className="w-full" style={{ accentColor: 'var(--color-primary)' }} />
                <div className="flex justify-between text-[11.5px] text-[#6B7280] font-semibold mt-1">
                  <span>Nhỏ</span>
                  <span className="font-bold" style={{color: 'var(--color-primary)'}}>{fontSizeValue(s.fontSize)}</span>
                  <span>Lớn</span>
                </div>
              </Card>
              <Card title="Khác">
                <ToggleRow title="Giảm hiệu ứng chuyển động" checked={s.reduceMotion} onChange={v => setSetting({ reduceMotion: v })} />
                <ToggleRow title="Rung phản hồi (Haptic)" checked={s.haptic} onChange={v => setSetting({ haptic: v })} />
              </Card>
            </div>
          </div>
        )}

        {/* ═══ PHÂN QUYỀN ═══ */}
        {tab === 'permissions' && <PermissionsTab />}

        {/* ═══ SAO LƯU ═══ */}
        {tab === 'backup' && <BackupTab />}

      </div>

      {/* ─── CHANGE PASSWORD MODAL ─── */}
      {showChangePassword && (
        <Modal title="Đổi mật khẩu" onClose={() => { setShowChangePassword(false); setChangeError(''); setNewPassword(''); setConfirmPassword(''); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors pr-10"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Nhập lại mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {changeError && (
              <div className="text-[12px] text-[#E6002D] bg-[rgba(230,0,45,.06)] rounded-[10px] px-3 py-2">{changeError}</div>
            )}

            <div className="flex gap-3 pt-1">
              <Btn onClick={() => { setShowChangePassword(false); setChangeError(''); setNewPassword(''); setConfirmPassword(''); }}>Huỷ</Btn>
              <BtnP onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </BtnP>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── DEVICE MODAL ─── */}
      {showDevices && (
        <Modal title="Quản lý thiết bị" onClose={() => setShowDevices(false)}>
          {devicesLoading ? (
            <div className="text-[13px] text-[#6B7280] py-4 text-center">Đang tải...</div>
          ) : devices.length === 0 ? (
            <div className="text-[13px] text-[#6B7280] py-4 text-center">Chưa có thiết bị nào được ghi nhận.</div>
          ) : (
            <>
              {devices.map(d => {
                const isCurrent = d.id === getCurrentDeviceId();
                return (
                  <div key={d.id} className={`flex items-center gap-3 py-[13px] border-b border-[#EDEDF1] ${isCurrent ? '' : ''}`}>
                    <div className={`w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[17px] shrink-0 ${isCurrent ? 'bg-[rgba(var(--color-primary-rgb),.08)]' : 'bg-[#F1F1F4]'}`}>
                      {getDeviceIcon(d.device_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold flex items-center gap-1.5">
                        {formatDeviceName(d.device_name)}
                        {isCurrent && <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px]" style={{background: 'rgba(var(--color-primary-rgb),.1)', color: 'var(--color-primary)'}}>Thiết bị này</span>}
                      </div>
                      <div className="text-[11.5px] text-[#6B7280] mt-0.5">
                        {d.login_method === 'password' ? 'Mật khẩu' : d.login_method === 'session' ? 'Phiên' : d.login_method} · {new Date(d.last_active).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    {!isCurrent && (
                      <button onClick={() => handleDeleteDevice(d.id, d.session_id)} className="border border-[#EDEDF1] px-3 py-[7px] rounded-[10px] text-[11.5px] font-bold cursor-pointer hover:bg-[rgba(var(--color-primary-rgb),.06)]" style={{color: 'var(--color-primary)'}}>Đăng xuất</button>
                    )}
                    {isCurrent && (
                      <span className="text-[11px] text-[#6B7280] font-bold">Đang dùng</span>
                    )}
                  </div>
                );
              })}
              {devices.length > 1 && (
                <Btn danger onClick={handleDeleteOtherDevices} className="mt-4">Đăng xuất tất cả thiết bị khác</Btn>
              )}
              <p className="text-[10.5px] text-[#6B7280] mt-3 leading-relaxed">Có thể mất tới 15 phút để có hiệu lực trên thiết bị kia.</p>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

// ─── Sub-components ───

function StorageBar({ label, used, total, pct, color, estimate }: { label: string; used: string; total: string; pct: number; color?: string; estimate?: boolean }) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between text-[12px] font-bold mb-1.5"><span>{label}</span><span className="text-[#6B7280] font-semibold">{used} / {total}{estimate ? <span className="text-[10px] text-[#9CA3AF] font-normal ml-1">(ước tính)</span> : null}</span></div>
      <div className="w-full h-[9px] rounded-[6px] bg-[#F1F1F4] overflow-hidden">
        <div className="h-full rounded-[6px]" style={{ width: Math.min(pct, 100) + '%', background: color || 'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)' }} />
      </div>
    </div>
  );
}

function DataStat({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-[11px] border-b border-[#EDEDF1] text-[13px]"><span>{label}</span><span className="font-extrabold" style={{color: 'var(--color-primary)'}}>{value}</span></div>;
}

function RolePill({ role, label }: { role: RoleKey; label: string }) {
  const map: Record<RoleKey, { bg: string; text: string }> = {
    admin: { bg: 'rgba(var(--color-primary-rgb),.1)', text: 'var(--color-primary)' },
    contributor: { bg: 'rgba(139,92,246,.1)', text: '#8B5CF6' },
    viewer: { bg: 'rgba(16,185,129,.1)', text: '#10B981' },
    public: { bg: '#F1F1F4', text: '#6B7280' },
  };
  return <span className="inline-block px-2.5 py-1 rounded-[8px] text-[11px] font-bold" style={{ background: map[role].bg, color: map[role].text }}>{label}</span>;
}

// ─── Permissions Tab ───
function PermissionsTab() {
  const [roleCounts, setRoleCounts] = useState<Record<RoleKey, number>>({
    admin: 0, contributor: 0, viewer: 0, public: 0,
  });
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('profiles').select('role');
      if (cancelled) return;
      const counts: Record<RoleKey, number> = { admin: 0, contributor: 0, viewer: 0, public: 0 };
      (data || []).forEach(p => {
        const r = p.role as RoleKey;
        if (r in counts) counts[r]++;
      });
      setRoleCounts(counts);
    })().catch(() => {}).finally(() => { if (!cancelled) setLoadingRoles(false); });
    return () => { cancelled = true; };
  }, []);

  const PERM_LABELS: [string, string][] = [
    ['view','Xem dữ liệu'], ['add','Thêm mới'], ['edit','Sửa'], ['del','Xoá'],
    ['import','Import'], ['export','Export'], ['ai','AI Insight'],
  ];
  return (
    <Card>
      <div className="text-[14.5px] font-extrabold mb-4">Phân quyền thành viên</div>
      <div className="text-[12px] text-[#6B7280] mb-4">Vai trò của bạn: <strong>Quản trị viên</strong> — toàn quyền.</div>
      <table className="w-full text-[12.5px] border-collapse">
        <thead><tr className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[.4px]"><th className="text-left px-2 pb-2.5 border-b border-[#EDEDF1]">Vai trò</th><th className="text-left px-2 pb-2.5 border-b border-[#EDEDF1]">Quyền</th><th className="text-left px-2 pb-2.5 border-b border-[#EDEDF1]">SL</th></tr></thead>
        <tbody>
          {[
            { key:'admin' as RoleKey, label:'Admin', desc:'Toàn quyền quản lý', count: roleCounts.admin },
            { key:'contributor' as RoleKey, label:'Người đóng góp', desc:'Được thêm/sửa dữ liệu, không xoá', count: roleCounts.contributor },
            { key:'viewer' as RoleKey, label:'Chỉ xem', desc:'Xem được, không chỉnh sửa', count: roleCounts.viewer },
            { key:'public' as RoleKey, label:'Khách công khai', desc:'Xem giới hạn qua link chia sẻ', count: roleCounts.public },
          ].map(r => (
            <tr key={r.key} className="border-b border-[#EDEDF1] hover:bg-[#FAFAFB]">
              <td className="px-2 py-3"><RolePill role={r.key} label={r.label} /></td>
              <td className="px-2 py-3 text-[12px] text-[#6B7280]">{r.desc}</td>
              <td className="px-2 py-3 text-[12.5px]">{loadingRoles ? '...' : r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─── Backup Tab ───
function BackupTab() {
  const s = useSettingsStore();
  const setSetting = s.set;

  return (
    <>
      <Card>
        <div className="flex items-center gap-3 p-3.5 rounded-[14px] bg-[rgba(16,185,129,.06)] mb-4">
          <div className="w-[38px] h-[38px] rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0"><Check size={18} strokeWidth={2.4} /></div>
          <div>
            <div className="font-extrabold text-[13.5px]">Nguyên tắc 3-2-1 · Miễn phí</div>
            <div className="text-[11.5px] text-[#6B7280]">3 bản sao · 2 loại lưu trữ · 1 nơi ngoại vi</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[{ n:'3', t:'Bản sao', d:'1 chính + 2 dự phòng', tg:['Supabase','R2','Drive'], cl:['#3ECF8E','#F38020','#4285F4'] },
            { n:'2', t:'Loại lưu trữ', d:'Database, object, cloud', tg:['DB','Object','Cloud'] },
            { n:'1', t:'Ngoại vi', d:'R2 + Drive ≠ Supabase', tg:['R2','Drive'], cl:['#F38020','#4285F4'] },
          ].map(x => (
            <div key={x.n} className="bg-[#FAFAFB] border border-[#EDEDF1] rounded-[16px] p-4">
              <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white font-extrabold text-[14px] mb-2.5"
                style={{background:'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)'}}>{x.n}</div>
              <div className="text-[13px] font-extrabold mb-1.5">{x.t}</div>
              <div className="text-[11.5px] text-[#6B7280] mb-3">{x.d}</div>
              <div className="flex flex-wrap gap-1.5">
                {x.tg.map((t, j) => (
                  <span key={t} className="text-[10.5px] font-bold px-[9px] py-1 rounded-[8px]"
                    style={{ background: (x as any).cl?.[j] || '#EDEDF1', color: (x as any).cl?.[j] ? '#fff' : '#6B7280', border: !(x as any).cl?.[j] ? '1px solid' : undefined }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="bg-gradient-to-br from-[#F8F8FA] to-[#F1F1F4] border border-[#EDEDF1] rounded-[18px] p-[22px] mb-[18px]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background:'#24292F'}}>G</div>
          <div className="flex-1">
            <div className="text-[13px] font-bold flex items-center flex-wrap gap-1.5">GitHub Actions <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] bg-[rgba(36,41,47,.08)]">Engine · 2.000 phút/tháng free</span></div>
            <div className="text-[11.5px] text-[#6B7280] mt-0.5">Chạy cron backup hằng ngày & tháng. <strong>Chưa active</strong> — cần thiết lập GitHub Secrets.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-[18px] items-start">
        <Card title="Điểm lưu trữ">
          {[
            { i:'S', bg:'#3ECF8E', n:'Supabase', b:'Bản chính', d:'Postgres + Storage sống', status:true },
            { i:'R', bg:'#F38020', n:'Cloudflare R2', b:'Ngoại vi', d:'10GB free, 0đ tải', tog:[s.r2Enabled, (v:boolean) => setSetting({ r2Enabled: v })] },
            { i:'D', bg:'#4285F4', n:'Google Drive', b:'Cá nhân', d:'Dump nén hằng tháng', tog:[s.driveBackup, (v:boolean) => setSetting({ driveBackup: v })] },
            { i:'G', bg:'#24292F', n:'GitHub', b:'Version', d:'Manifest.json nhẹ', tog:[s.gitManifest, (v:boolean) => setSetting({ gitManifest: v })] },
          ].map(node => (
            <div key={node.n} className="flex items-center gap-3 py-[13px] border-b border-[#EDEDF1] last:border-b-0">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background: (node as any).bg}}>{node.i}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold flex items-center gap-1.5">{node.n}<span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] bg-[rgba(16,185,129,.1)] text-[#10B981]">{node.b}</span></div>
                <div className="text-[11.5px] text-[#6B7280] mt-0.5">{node.d}</div>
              </div>
              {'status' in node && node.status
                ? <span className="text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-[7px] bg-[rgba(16,185,129,.1)] text-[#10B981]">Đang chạy</span>
                : 'tog' in node
                  ? <Toggle checked={(node as any).tog[0]} onChange={(node as any).tog[1]} />
                  : null
              }
            </div>
          ))}
        </Card>

        <Card title="Tự động hoá">
          <ToggleRow title="Sao lưu hằng ngày" desc="03:00 UTC → R2" checked={s.dailyBackup} onChange={v => setSetting({ dailyBackup: v })} />
          <ToggleRow title="Snapshot tháng" desc="Ngày 1 → R2 + Drive" checked={s.monthlySnapshot} onChange={v => setSetting({ monthlySnapshot: v })} />
          <BtnP onClick={() => toast('⏳ Cần thiết lập GitHub Actions trước')}>Sao lưu ngay</BtnP>
        </Card>
      </div>
    </>
  );
}

// ─── Export helper ───
async function handleExportAll(stats: AppDataStats | null) {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const [contacts, events, memories] = await Promise.all([
      supabase.from('contacts').select('*'),
      supabase.from('events').select('*'),
      supabase.from('memories').select('*'),
    ]);
    const data = {
      exportedAt: new Date().toISOString(),
      summary: stats,
      contacts: contacts.data || [],
      events: events.data || [],
      memories: memories.data || [],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `protlife_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`✅ Đã xuất ${(contacts.data?.length || 0) + (events.data?.length || 0) + (memories.data?.length || 0)} mục`);
  } catch (e) {
    toast('❌ Lỗi khi xuất dữ liệu');
  }
}
