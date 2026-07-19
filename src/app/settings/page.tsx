'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, X, Plus } from 'lucide-react';

// ─── Design Tokens ───
const C = {
  primary: '#E6002D',
  primaryDark: '#D60032',
  primaryLight: '#FF4B3A',
  gradPrimary: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)',
  border: '#EDEDF1',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
};

// ─── Types ───
type Tab = 'account' | 'data' | 'privacy' | 'notify' | 'appearance' | 'permissions' | 'backup';
type RoleKey = 'admin' | 'member' | 'viewer' | 'guest';
type ThemeMode = 'light' | 'dark' | 'system';
type DeviceStatus = 'active' | 'logged_out';
type SheetStatus = 'linked' | 'unlinked';
type OAuthStep = 1 | 2 | 3;
type ExportStep = 'form' | 'preview';

interface DeviceInfo { id: string; name: string; type: 'phone' | 'laptop' | 'tablet' | 'desktop'; location: string; lastActive: string; method: string; isCurrent: boolean; status: DeviceStatus; }

const isBrowser = typeof window !== 'undefined';

// ─── Helpers ───
function toast(msg: string) {
  const el = document.getElementById('settings-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout((el as any)._timer);
  (el as any)._timer = setTimeout(() => el.classList.remove('show'), 2200);
}

const ROLE_PERMS: Record<RoleKey, Record<string, boolean>> = {
  admin:  { view:true, add:true, edit:true, del:true, import:true, export:true, ai:true, users:true, system:true },
  member: { view:true, add:true, edit:true, del:false, import:false, export:true, ai:true, users:false, system:false },
  viewer: { view:true, add:false, edit:false, del:false, import:false, export:false, ai:false, users:false, system:false },
  guest:  { view:true, add:false, edit:false, del:false, import:false, export:false, ai:false, users:false, system:false },
};
const PERM_LABELS: [string, string][] = [
  ['view','Xem dữ liệu'], ['add','Thêm dữ liệu'], ['edit','Sửa dữ liệu'], ['del','Xoá dữ liệu'],
  ['import','Import dữ liệu'], ['export','Export dữ liệu'], ['ai','Sử dụng AI Insight'],
  ['users','Quản lý người dùng'], ['system','Cài đặt hệ thống'],
];
const ROLE_PRESETS: { key: RoleKey; label: string; desc: string; count: number }[] = [
  { key:'admin', label:'Admin', desc:'Toàn quyền quản lý', count:1 },
  { key:'member', label:'Member', desc:'Được mời, có thể đóng góp', count:4 },
  { key:'viewer', label:'Viewer', desc:'Chỉ xem, không chỉnh sửa', count:2 },
  { key:'guest', label:'Guest', desc:'Truy cập công khai, hạn chế', count:0 },
];
const TABS: { id: Tab; label: string }[] = [
  { id:'account', label:'Tài khoản' }, { id:'data', label:'Dữ liệu' },
  { id:'privacy', label:'Quyền riêng tư' }, { id:'notify', label:'Thông báo' },
  { id:'appearance', label:'Giao diện' }, { id:'permissions', label:'Phân quyền' },
  { id:'backup', label:'Sao lưu' },
];

// ─── Sub-components ───

function Card({ title, badge, children, className = '' }: { title?: string; badge?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05),0_2px_8px_rgba(0,0,0,.03)] mb-[18px] ${className}`}>
      {title && <div className="text-[14.5px] font-extrabold mb-[16px] flex items-center gap-2">{title}{badge}</div>}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`relative w-[42px] h-[25px] shrink-0 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} onClick={e => e.stopPropagation()}>
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
      />
      <span className="block w-full h-full rounded-[25px] transition-colors duration-200"
        style={{ background: checked ? C.primary : '#E5E5EA' }}>
        <span className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform duration-200"
          style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)', marginTop: '2px' }} />
      </span>
    </label>
  );
}

function ToggleRow({ title, desc, checked, onChange, disabled }: { title: string; desc?: string; checked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-[13px] border-b border-[#EDEDF1] last:border-b-0 gap-4">
      <div>
        <div className="text-[13px] font-bold">{title}</div>
        {desc && <div className="text-[11.5px] text-[#6B7280] mt-0.5">{desc}</div>}
      </div>
      <Toggle checked={!!checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[14px]">
      <label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ defaultValue, placeholder, type = 'text' }: { defaultValue?: string; placeholder?: string; type?: string }) {
  return <input type={type} className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white transition-colors" defaultValue={defaultValue} placeholder={placeholder} />;
}

function Select({ defaultValue, children, onChange }: { defaultValue?: string; children: React.ReactNode; onChange?: (v: string) => void }) {
  return (
    <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white transition-colors"
      defaultValue={defaultValue} onChange={e => onChange?.(e.target.value)}>
      {children}
    </select>
  );
}

function ButtonPrimary({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`w-full py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer active:scale-[.98] transition-transform ${className}`}
      style={{ background: C.gradPrimary, boxShadow: '0 10px 22px rgba(214,0,50,.25)' }}>
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick, danger, className = '' }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; className?: string }) {
  return (
    <button onClick={onClick}
      className={`w-full border py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center hover:bg-[#F5F5F7] transition-colors mb-[9px] ${className}`}
      style={{ borderColor: danger ? 'rgba(230,0,45,.25)' : C.border, color: danger ? C.primary : '#101010' }}>
      {children}
    </button>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: 'green' | 'primary' | 'future' }) {
  const bg = color === 'green' ? 'rgba(16,185,129,.1)' : color === 'primary' ? 'rgba(230,0,45,.1)' : 'rgba(139,92,246,.1)';
  const text = color === 'green' ? '#10B981' : color === 'primary' ? '#E6002D' : '#8B5CF6';
  return <span className="text-[9.5px] font-extrabold px-[7px] py-[2px] rounded-[6px] tracking-[.2px]" style={{ background: bg, color: text }}>{children}</span>;
}

// ─── ToggleSwitch row helper for tables ───
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative w-[42px] h-[25px] shrink-0 cursor-pointer" onClick={e => e.stopPropagation()}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="block w-full h-full rounded-[25px] transition-colors duration-200"
        style={{ background: checked ? C.primary : '#E5E5EA' }}>
        <span className="block w-[21px] h-[21px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,.25)] transition-transform duration-200"
          style={{ transform: checked ? 'translateX(17px)' : 'translateX(2px)', marginTop: '2px' }} />
      </span>
    </label>
  );
}

// ════════════════════════════════════════════════════════════════════════════════════
// ═══════ MAIN PAGE ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('account');

  // Account tab state
  const [profileName, setProfileName] = useState('Prot');
  const [profileEmail, setProfileEmail] = useState('prot@example.com');
  const [profilePhone, setProfilePhone] = useState('0912 345 678');
  const [profileDob, setProfileDob] = useState('27/10/1992');
  const [profileGender, setProfileGender] = useState('Nam');
  const [profileLang, setProfileLang] = useState('Tiếng Việt');
  const [profileTz, setProfileTz] = useState('(GMT+07:00) Bangkok, Hanoi, Jakarta');
  const [savedToast, setSavedToast] = useState(false);

  // Login methods
  const [loginMethods, setLoginMethods] = useState({ email: true, magicLink: true, google: false });

  // Device modal
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([
    { id:'d1', name:'iPhone 15 Pro · Safari', type:'phone', location:'TP. Hồ Chí Minh', lastActive:'vừa xong', method:'Google', isCurrent:true, status:'active' },
    { id:'d2', name:'MacBook Air · Chrome', type:'laptop', location:'TP. Hồ Chí Minh', lastActive:'3 giờ trước', method:'Email/Mật khẩu', isCurrent:false, status:'active' },
    { id:'d3', name:'iPad · Safari', type:'tablet', location:'Hà Nội', lastActive:'2 ngày trước', method:'Magic Link', isCurrent:false, status:'active' },
    { id:'d4', name:'Windows PC · Edge', type:'desktop', location:'Đà Nẵng', lastActive:'5 ngày trước', method:'Google', isCurrent:false, status:'active' },
  ]);

  const logoutDevice = useCallback((id: string) => {
    setDevices(d => d.map(dv => dv.id === id ? { ...dv, status: 'logged_out' as DeviceStatus } : dv));
    const dev = devices.find(d => d.id === id);
    toast(`✅ Đã đăng xuất "${dev?.name || ''}"`);
  }, [devices]);

  const logoutOthers = useCallback(() => {
    setDevices(d => d.map(dv => dv.isCurrent ? dv : { ...dv, status: 'logged_out' as DeviceStatus }));
    toast('✅ Đã đăng xuất khỏi mọi thiết bị khác');
  }, []);

  // Data tab state
  const [sheetStatus, setSheetStatus] = useState<SheetStatus>('linked');
  const [showOAuth, setShowOAuth] = useState(false);
  const [oauthStep, setOauthStep] = useState<OAuthStep>(1);
  const [googleCal, setGoogleCal] = useState(true);
  const [googleContacts, setGoogleContacts] = useState(false);
  const [googleDrive, setGoogleDrive] = useState(true);
  const [caldav, setCaldav] = useState(true);
  const [vcard, setVcard] = useState(true);

  const handleLinkGoogle = useCallback(() => { setOauthStep(1); setShowOAuth(true); }, []);
  const handleOAuthSuccess = useCallback(() => { setSheetStatus('linked'); setShowOAuth(false); toast('✅ Đã liên kết ProtLife_Data_Export.xlsx'); }, []);

  // Export modal
  const [showExport, setShowExport] = useState(false);
  const [exportStep, setExportStep] = useState<ExportStep>('form');
  const [exportFormat, setExportFormat] = useState('Word');
  const [exportScope, setExportScope] = useState('Tổng quan — tất cả dữ liệu');

  // Privacy tab state
  const [publicProfile, setPublicProfile] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [locationShare, setLocationShare] = useState(false);
  const [aiDataUse, setAiDataUse] = useState(true);
  const [anonymousStats, setAnonymousStats] = useState(true);

  // Notify tab state
  const [notifyBirthday, setNotifyBirthday] = useState(true);
  const [notifyEvent, setNotifyEvent] = useState(true);
  const [notifyAnniversary, setNotifyAnniversary] = useState(true);
  const [notifyAiSuggest, setNotifyAiSuggest] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotify, setEmailNotify] = useState(false);
  const [smsNotify, setSmsNotify] = useState(false);
  const [quietFrom, setQuietFrom] = useState('22:00');
  const [quietTo, setQuietTo] = useState('07:00');

  // Appearance tab state
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState('#E6002D');
  const [fontSize, setFontSize] = useState(2); // 0–4
  const [reduceMotion, setReduceMotion] = useState(false);
  const [haptic, setHaptic] = useState(true);

  // Permissions tab state
  const [selectedRole, setSelectedRole] = useState<RoleKey>('admin');

  // Backup tab state
  const [dailyBackup, setDailyBackup] = useState(true);
  const [monthlySnapshot, setMonthlySnapshot] = useState(true);
  const [r2Enabled, setR2Enabled] = useState(true);
  const [driveBackup, setDriveBackup] = useState(true);
  const [gitManifest, setGitManifest] = useState(true);

  return (
    <>
      {/* Toast */}
      <div id="settings-toast"
        className="fixed top-5 left-1/2 -translate-x-1/2 -translate-y-5 scale-90 bg-black/85 backdrop-blur-xl text-white px-[22px] py-3 rounded-[26px] text-[13px] font-semibold z-[100] opacity-0 pointer-events-none shadow-[0_16px_40px_rgba(0,0,0,.25)] transition-all duration-[400ms]"
        style={{ transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)' }} />
      <style>{`#settings-toast.show{opacity:1;transform:translateX(-50%)translateY(0)scale(1)}`}</style>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[19px] font-extrabold tracking-[-.3px]">Cài đặt</h1>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-[#EDEDF1] overflow-x-auto mb-5">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`relative bg-transparent border-none px-1 pb-3 mr-[22px] text-[13.5px] font-semibold whitespace-nowrap cursor-pointer transition-colors duration-150 ${
              activeTab === tab.id ? 'text-[#E6002D] font-bold' : 'text-[#9CA3AF] hover:text-[#101010]'
            }`}>
            {tab.label}
            {activeTab === tab.id && <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-[#E6002D] rounded-[2px]" />}
          </button>
        ))}
      </div>

      {/* ─── Tab panels ─── */}
      <div className="pb-[40px]">
        {activeTab === 'account' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            {/* Left: Profile info */}
            <Card title="Thông tin tài khoản">
              <div className="flex items-center gap-[14px] mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-[20px] shrink-0" style={{background: C.gradPrimary}}>P</div>
                <div>
                  <div className="font-bold text-[14px]">Prot</div>
                  <div className="text-[12px] text-[#9CA3AF] mb-1.5">Admin</div>
                </div>
              </div>
              <Field label="Họ và tên"><Input defaultValue={profileName} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email"><Input defaultValue={profileEmail} /></Field>
                <Field label="Số điện thoại"><Input defaultValue={profilePhone} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ngày sinh"><Input defaultValue={profileDob} /></Field>
                <Field label="Giới tính">
                  <Select defaultValue={profileGender} onChange={setProfileGender}>
                    <option>Nam</option><option>Nữ</option><option>Khác</option>
                  </Select>
                </Field>
              </div>
              <ButtonPrimary onClick={() => toast('✅ Đã lưu thay đổi')}>Lưu thay đổi</ButtonPrimary>
            </Card>

            <div>
              <Card title="Phương thức đăng nhập">
                <LoginRow icon="✉️" bg="#F1F1F4" label="Email / Mật khẩu" desc="prot@example.com" badge={loginMethods.email ? <Badge color="green">Đang dùng</Badge> : <button className="text-[11px] font-bold text-[#E6002D] cursor-pointer">Bật</button>} />
                <LoginRow icon="🔗" bg="rgba(139,92,246,.1)" label="Magic Link" desc="Đăng nhập không cần mật khẩu" badge={loginMethods.magicLink ? <Badge color="green">Đã bật</Badge> : <button className="text-[11px] font-bold text-[#E6002D] cursor-pointer">Bật</button>} />
                <LoginRow icon={<span style={{color:'#4285F4',fontWeight:800}}>G</span>} bg="#fff" border label="Google" desc="Chưa liên kết" action={
                  <button onClick={() => setLoginMethods(m => ({...m, google: true}))} className="border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer hover:bg-[#F5F5F7]">
                    {loginMethods.google ? 'Đã liên kết' : 'Liên kết'}
                  </button>
                } />
                <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-0.5 leading-relaxed">Cả 3 phương thức đều miễn phí qua Supabase Auth. Không dùng SMS OTP vì tốn phí nhà mạng.</div>
              </Card>

              <Card title="Bảo mật">
                <BtnOutline onClick={() => toast('🔐 Chức năng đổi mật khẩu')}>Đổi mật khẩu</BtnOutline>
                <BtnOutline onClick={() => setShowDeviceModal(true)}>📱 Quản lý thiết bị <span className="bg-[#E6002D] text-white text-[10px] font-extrabold px-[7px] py-[1px] rounded-[20px] ml-1.5">{devices.filter(d => d.status === 'active').length}</span></BtnOutline>
                <BtnOutline danger onClick={() => toast('🔒 Đã đăng xuất khỏi tất cả thiết bị')}>Đăng xuất tất cả</BtnOutline>
              </Card>

              <Card title="Ngôn ngữ">
                <Select defaultValue={profileLang} onChange={setProfileLang}><option>Tiếng Việt</option><option>English</option></Select>
              </Card>

              <Card title="Múi giờ">
                <Select defaultValue={profileTz} onChange={setProfileTz}>
                  <option>(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                  <option>(GMT+09:00) Tokyo, Seoul</option>
                </Select>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
              <Card title="Dung lượng sử dụng" badge={<Badge color="green">Gói Free — Supabase</Badge>}>
                <StorageBar label="Database (Postgres)" used="312 MB" total="500 MB" pct={62} />
                <StorageBar label="File Storage (ảnh/video)" used="840 MB" total="1 GB" pct={84} color="linear-gradient(135deg,#F59E0B,#FBBF24)" />
                <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-0.5 leading-relaxed">File Storage sắp đầy — vì đây là 2 hạn mức riêng biệt của Supabase Free (không phải 1 con số gộp chung).</div>
                <div className="mt-4 space-y-0">
                  <DataStat label="👥 Người thân & bạn bè" value="128 hồ sơ" />
                  <DataStat label="📅 Sự kiện đã tạo" value="64 sự kiện" />
                  <DataStat label="📸 Ký ức & hình ảnh" value="842 mục" />
                  <DataStat label="🗺️ Địa điểm đã lưu" value="37 địa điểm" />
                </div>
              </Card>
              <div>
                <Card title="Xuất / nhập dữ liệu">
                  <BtnOutline onClick={() => toast('⬇️ Đang xuất toàn bộ dữ liệu...')}>⬇️ Xuất toàn bộ dữ liệu (.json)</BtnOutline>
                  <BtnOutline onClick={() => { setExportStep('form'); setShowExport(true); }}>📄 Xuất báo cáo (Word / Excel / PDF)</BtnOutline>
                  <BtnOutline onClick={() => toast('⬆️ Đang mở file picker...')}>⬆️ Nhập từ file trên máy (.json/.csv/.xlsx)</BtnOutline>
                  <BtnOutline onClick={() => toast('☁️ Đang kết nối Google Picker...')}>☁️ Chọn file từ Google Drive</BtnOutline>
                </Card>
                <Card title="Hệ sinh thái Google">
                  <ToggleRow title="Google Calendar" desc="Đồng bộ sự kiện hai chiều" checked={googleCal} onChange={setGoogleCal} />
                  <ToggleRow title="Google Contacts" desc="Nhập danh bạ hàng loạt" checked={googleContacts} onChange={setGoogleContacts} />
                  <ToggleRow title="Google Drive" desc="Chọn tài liệu/ảnh để đính kèm" checked={googleDrive} onChange={setGoogleDrive} />
                </Card>
                <Card title={<span className="text-[14.5px] font-extrabold flex items-center gap-2">Nguồn mở rộng</span> as any}>
                  <ToggleRow title="CalDAV / file .ics" desc="Tương thích Apple Calendar, Outlook" checked={caldav} onChange={setCaldav} />
                  <ToggleRow title="vCard (.vcf)" desc="Nhập danh bạ từ mọi điện thoại/email" checked={vcard} onChange={setVcard} />
                  <div className="text-[10.5px] font-extrabold text-[#6B7280] uppercase tracking-[.6px] my-3">Sắp tới</div>
                  <ToggleRow title={<span>Strava <Badge color="future">Sắp ra mắt</Badge></span> as any} checked={false} disabled />
                  <ToggleRow title={<span>Spotify <Badge color="future">Sắp ra mắt</Badge></span> as any} checked={false} disabled />
                </Card>
              </div>
            </div>

            {/* Google Sheets Sync */}
            <Card>
              <div className="text-[14.5px] font-extrabold mb-[16px] flex items-center gap-2">🔄 Đồng bộ Google Sheets <Badge color="green">App → Sheet · Đang hoạt động</Badge></div>
              <div className="text-[12px] text-[#6B7280] mb-4 -mt-2.5 leading-relaxed">Mọi thay đổi trong app tự động đẩy sang Google Sheet — sửa trong Sheet <strong>chưa</strong> tự động đẩy ngược lại app (đang trong lộ trình).</div>
              <svg className="w-full h-auto max-w-[700px] my-1.5 mb-4" viewBox="0 0 700 130" xmlns="http://www.w3.org/2000/svg">
                <defs><marker id="a1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#D9D9DE"/></marker></defs>
                <rect x="0" y="35" width="150" height="60" rx="14" fill="#3ECF8E"/><text x="75" y="60" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">Supabase</text><text x="75" y="77" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="-apple-system,sans-serif">Postgres (nguồn)</text>
                <path d="M155 65 L200 65" stroke="#D9D9DE" strokeWidth="2" markerEnd="url(#a1)"/>
                <rect x="205" y="35" width="150" height="60" rx="14" fill="#F1F1F4" stroke="#E5E5EA"/><text x="280" y="60" textAnchor="middle" fill="#101010" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">DB Webhook</text><text x="280" y="77" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="-apple-system,sans-serif">có sẵn, miễn phí</text>
                <path d="M360 65 L405 65" stroke="#D9D9DE" strokeWidth="2" markerEnd="url(#a1)"/>
                <rect x="410" y="35" width="150" height="60" rx="14" fill="#101010"/><text x="485" y="60" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">Edge Function</text><text x="485" y="77" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily="-apple-system,sans-serif">500K lượt/tháng free</text>
                <path d="M565 65 L610 65" stroke="#D9D9DE" strokeWidth="2" markerEnd="url(#a1)"/>
                <rect x="615" y="35" width="85" height="60" rx="14" fill="#0F9D58"/><text x="657" y="60" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">Sheet</text><text x="657" y="77" textAnchor="middle" fill="#D1FAE5" fontSize="9" fontFamily="-apple-system,sans-serif">chỉ đọc</text>
              </svg>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  {sheetStatus === 'linked' ? (
                    <>
                      <div className="flex items-center gap-3 py-2.5">
                        <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background:'#0F9D58'}}>📊</div>
                        <div className="flex-1">
                          <div className="text-[13px] font-bold">ProtLife_Data_Export.xlsx</div>
                          <div className="text-[11.5px] text-[#6B7280] mt-0.5">Đã liên kết · Đồng bộ gần nhất: 4 phút trước</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => window.open('https://sheets.google.com','_blank')} className="flex-1 border border-[#EDEDF1] py-2.5 rounded-[12px] text-[12px] font-bold hover:bg-[#F5F5F7]">Mở Google Sheet ↗</button>
                        <button onClick={() => setSheetStatus('unlinked')} className="flex-1 border border-[rgba(230,0,45,.25)] py-2.5 rounded-[12px] text-[12px] font-bold text-[#E6002D] hover:bg-[#F5F5F7]">Ngắt liên kết</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 py-2.5">
                        <div className="w-9 h-9 rounded-[11px] flex items-center justify-center font-extrabold text-[15px] shrink-0" style={{background:'#E5E5EA',color:'#9CA3AF'}}>📊</div>
                        <div className="flex-1">
                          <div className="text-[13px] font-bold">Chưa liên kết Google Sheet</div>
                          <div className="text-[11.5px] text-[#6B7280] mt-0.5">Cần cấp quyền để bắt đầu đồng bộ</div>
                        </div>
                      </div>
                      <ButtonPrimary onClick={handleLinkGoogle} className="mt-2">🔗 Liên kết với Google</ButtonPrimary>
                    </>
                  )}
                  <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-2.5 leading-relaxed">Quyền <strong>riêng</strong>, tách khỏi đăng nhập app — dù dùng Email hay Google, vẫn cần cấp quyền này thêm 1 lần.</div>
                </div>
                <div>
                  <div className="text-[12.5px] font-extrabold mb-2.5">Log đồng bộ gần đây</div>
                  {[
                    ['ok','Cập nhật "Minh" · Sự kiện sinh nhật','4 phút trước'],
                    ['ok','Thêm mới "Chuyến Đà Lạt" vào sheet Ký ức','2 giờ trước'],
                    ['err','Dòng 42 sheet Người thân — sai định dạng ngày sinh','Hôm qua, 21:03'],
                    ['ok','Xoá "Cà phê với Minh" khỏi sheet Sự kiện','Hôm qua, 14:22'],
                  ].map(([type, text, time], i) => (
                    <div key={i} className={`flex items-start gap-2.5 py-[9px] border-b border-[#EDEDF1] last:border-b-0`}>
                      <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${type === 'err' ? 'bg-[#E6002D]' : 'bg-[#10B981]'}`} />
                      <div>
                        <div className={`text-[12.5px] font-semibold ${type === 'err' ? 'text-[#E6002D]' : ''}`}>{text}</div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5">{time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'privacy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Hiển thị hồ sơ">
              <ToggleRow title="Hồ sơ công khai" desc="Người khác có thể tìm thấy bạn" checked={publicProfile} onChange={setPublicProfile} />
              <ToggleRow title="Trạng thái hoạt động" desc="Hiện thời điểm bạn dùng app gần nhất" checked={onlineStatus} onChange={setOnlineStatus} />
              <ToggleRow title="Vị trí trong Bản đồ" desc="Chia sẻ địa điểm với nhóm gia đình" checked={locationShare} onChange={setLocationShare} />
            </Card>
            <div>
              <Card title="Chia sẻ dữ liệu">
                <ToggleRow title="Dùng dữ liệu để gợi ý AI" desc="Cải thiện độ chính xác gợi ý" checked={aiDataUse} onChange={setAiDataUse} />
                <ToggleRow title="Thống kê ẩn danh" desc="Giúp cải thiện chất lượng ứng dụng" checked={anonymousStats} onChange={setAnonymousStats} />
              </Card>
              <Card title="Danh sách chặn">
                <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 leading-relaxed">Bạn chưa chặn liên hệ nào. Người bị chặn sẽ không thể xem hồ sơ hay mời bạn vào sự kiện chung.</div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'notify' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Nhắc nhở">
              <ToggleRow title="Sinh nhật người thân & bạn bè" desc="Nhắc trước 3 ngày và trong ngày" checked={notifyBirthday} onChange={setNotifyBirthday} />
              <ToggleRow title="Sự kiện sắp diễn ra" desc="Nhắc trước 1 ngày" checked={notifyEvent} onChange={setNotifyEvent} />
              <ToggleRow title="Mốc kỷ niệm quan hệ" desc='VD: 1 năm ngày quen nhau' checked={notifyAnniversary} onChange={setNotifyAnniversary} />
              <ToggleRow title="Gợi ý hoạt động từ AI" desc='VD: "Lâu rồi chưa gặp Minh"' checked={notifyAiSuggest} onChange={setNotifyAiSuggest} />
            </Card>
            <div>
              <Card title="Kênh nhận thông báo">
                <ToggleRow title="Thông báo đẩy (Push)" checked={pushEnabled} onChange={setPushEnabled} />
                <ToggleRow title="Email" checked={emailNotify} onChange={setEmailNotify} />
                <ToggleRow title="SMS" checked={smsNotify} onChange={setSmsNotify} />
              </Card>
              <Card title="Giờ yên lặng">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Từ"><input type="time" className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D]" value={quietFrom} onChange={e => setQuietFrom(e.target.value)} /></Field>
                  <Field label="Đến"><input type="time" className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D]" value={quietTo} onChange={e => setQuietTo(e.target.value)} /></Field>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Chế độ hiển thị">
              <div className="grid grid-cols-3 gap-2.5 mb-[18px]">
                {([['light','Sáng','linear-gradient(180deg,#fff 0%,#F1F1F4 100%)'],['dark','Tối','linear-gradient(180deg,#2A2A2E 0%,#101012 100%)'],['system','Hệ thống','linear-gradient(90deg,#fff 50%,#101012 50%)']] as [ThemeMode, string, string][]).map(([id, label, bg]) => (
                  <div key={id} onClick={() => setTheme(id)}
                    className={`border-2 rounded-[14px] p-2.5 cursor-pointer text-center ${theme === id ? 'border-[#E6002D]' : 'border-[#EDEDF1]'}`}>
                    <div className="h-[52px] rounded-[9px] mb-2" style={{ background: bg, border: id === 'light' ? '1px solid #EDEDF1' : undefined }} />
                    <div className="text-[11.5px] font-bold">{label}</div>
                  </div>
                ))}
              </div>
              <div className="text-[14.5px] font-extrabold mb-3">Màu nhấn</div>
              <div className="flex gap-2.5">
                {['#E6002D','#8B5CF6','#10B981','#F59E0B','#0EA5E9'].map(c => (
                  <div key={c} onClick={() => setAccentColor(c)}
                    className={`w-[30px] h-[30px] rounded-full cursor-pointer flex items-center justify-center border-2 ${accentColor === c ? 'border-[#101010]' : 'border-transparent'}`}
                    style={{ background: c }}>
                    {accentColor === c && <Check size={13} className="text-white" strokeWidth={3} />}
                  </div>
                ))}
              </div>
            </Card>
            <div>
              <Card title="Cỡ chữ">
                <input type="range" min={0} max={4} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" style={{ accentColor: C.primary }} />
                <div className="flex justify-between text-[11.5px] text-[#6B7280] font-semibold mt-1">
                  <span>Nhỏ</span>
                  <span className="font-bold text-[#E6002D]">{['14px','15px','16px','18px','20px'][fontSize]}</span>
                  <span>Lớn</span>
                </div>
              </Card>
              <Card title="Khác">
                <ToggleRow title="Giảm hiệu ứng chuyển động" checked={reduceMotion} onChange={setReduceMotion} />
                <ToggleRow title="Rung phản hồi (Haptic)" checked={haptic} onChange={setHaptic} />
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
            <Card title="Quản lý vai trò">
              <table className="w-full text-[12.5px] border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[.4px]">
                    <th className="text-left px-2 pb-2.5 border-b border-[#EDEDF1]">Vai trò</th>
                    <th className="text-left px-2 pb-2.5 border-b border-[#EDEDF1]">Mô tả</th>
                    <th className="text-left px-2 pb-2.5 border-b border-[#EDEDF1]">SL</th>
                    <th className="px-2 pb-2.5 border-b border-[#EDEDF1]"></th>
                  </tr>
                </thead>
                <tbody>
                  {ROLE_PRESETS.map(r => (
                    <tr key={r.key} onClick={() => setSelectedRole(r.key)}
                      className={`cursor-pointer border-b border-[#EDEDF1] last:border-b-0 ${selectedRole === r.key ? 'bg-[rgba(230,0,45,.04)]' : 'hover:bg-[#FAFAFB]'}`}>
                      <td className="px-2 py-3"><RolePill role={r.key} label={r.label} /></td>
                      <td className="px-2 py-3 text-[12.5px]">{r.desc}</td>
                      <td className="px-2 py-3 text-[12.5px]">{r.count}</td>
                      <td className="px-2 py-3 text-right"><button className="bg-transparent border-none text-[#E6002D] font-bold text-[12px] cursor-pointer">Sửa</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card>
              <div className="text-[14.5px] font-extrabold mb-[16px]">Quyền chi tiết ({ROLE_PRESETS.find(r => r.key === selectedRole)?.label})</div>
              {PERM_LABELS.map(([key, label]) => {
                const on = ROLE_PERMS[selectedRole][key];
                return (
                  <div key={key} className={`flex items-center gap-2.5 py-[9px] text-[13px] font-semibold ${on ? '' : 'text-[#6B7280]'}`}>
                    <div className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0 ${on ? 'bg-[#10B981] text-white' : 'bg-[#F1F1F4] text-[#9CA3AF]'}`}>
                      {on ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                    </div>
                    {label}
                  </div>
                );
              })}
              <ButtonPrimary onClick={() => toast('➕ Chức năng thêm vai trò đang phát triển')} className="mt-3.5">+ Thêm vai trò</ButtonPrimary>
            </Card>
          </div>
        )}

        {activeTab === 'backup' && <BackupContent />}
      </div>

      {/* ═══ MODALS ═══ */}

      {showDeviceModal && (
        <Modal onClose={() => setShowDeviceModal(false)} title="Quản lý thiết bị" subtitle={`${devices.filter(d => d.status === 'active').length} thiết bị đang đăng nhập`}>
          <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mb-4 leading-relaxed">Danh sách thiết bị được ghi nhận qua Auth Hook, lưu trong bảng riêng.</div>
          {devices.map(d => (
            <div key={d.id} className={`flex items-center gap-3 py-[13px] border-b border-[#EDEDF1] last:border-b-0 transition-opacity ${d.status === 'logged_out' ? 'opacity-40' : ''}`}>
              <div className={`w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[17px] shrink-0 ${d.isCurrent ? 'bg-[rgba(230,0,45,.08)]' : 'bg-[#F1F1F4]'}`}>
                {d.type === 'phone' ? '📱' : d.type === 'laptop' ? '💻' : d.type === 'tablet' ? '📱' : '🖥️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold flex items-center gap-1.5 flex-wrap">
                  {d.name}
                  {d.isCurrent && <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] bg-[rgba(230,0,45,.1)] text-[#E6002D]">Thiết bị này</span>}
                </div>
                <div className="text-[11.5px] text-[#6B7280] mt-0.5">{d.location} · {d.lastActive} · {d.method}</div>
              </div>
              {!d.isCurrent && (d.status === 'logged_out'
                ? <span className="text-[11px] font-bold text-[#6B7280]">Đã đăng xuất</span>
                : <button onClick={() => logoutDevice(d.id)} className="border border-[#EDEDF1] px-3 py-[7px] rounded-[10px] text-[11.5px] font-bold text-[#E6002D] cursor-pointer hover:bg-[rgba(230,0,45,.06)]">Đăng xuất</button>
              )}
            </div>
          ))}
          <BtnOutline danger onClick={logoutOthers} className="mt-4">Đăng xuất tất cả thiết bị khác</BtnOutline>
          <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-2.5 leading-relaxed">Nút này dùng scope <code className="bg-[#F1F1F4] px-1.5 py-0.5 rounded-[5px] text-[11px]">others</code> có sẵn của Supabase Auth.</div>
        </Modal>
      )}

      {showExport && (
        <Modal onClose={() => setShowExport(false)} title={exportStep === 'form' ? 'Xuất báo cáo' : undefined} wide>
          {exportStep === 'form' ? (
            <>
              <div className="text-[12px] text-[#9CA3AF] mb-4 -mt-2">Chọn phạm vi, khoảng thời gian và định dạng</div>
              <Field label="Phạm vi báo cáo">
                <Select defaultValue={exportScope} onChange={setExportScope}>
                  <option>Tổng quan — tất cả dữ liệu</option>
                  <option>Chỉ Người thân & bạn bè</option>
                  <option>Chỉ Sự kiện</option>
                  <option>Chỉ Ký ức</option>
                </Select>
              </Field>
              <Field label="Khoảng thời gian">
                <Select><option>Toàn bộ thời gian</option><option>Năm nay (2026)</option><option>Tháng này</option><option>Tuỳ chỉnh...</option></Select>
              </Field>
              <Field label="Định dạng">
                <div className="flex gap-2">
                  {['Word','Excel','PDF'].map(f => (
                    <button key={f} onClick={() => setExportFormat(f)}
                      className={`flex-1 py-3 rounded-[14px] text-[13px] font-bold cursor-pointer text-center transition-all ${
                        exportFormat === f ? 'border-2 border-[#E6002D] bg-[rgba(230,0,45,.05)] text-[#E6002D]' : 'border border-[#EDEDF1] bg-white text-[#6B7280]'
                      }`}>
                      {f === 'Word' ? '📝' : f === 'Excel' ? '📊' : '📕'} {f}
                    </button>
                  ))}
                </div>
              </Field>
              <ButtonPrimary onClick={() => setExportStep('preview')} className="mt-2">Xem trước bản in →</ButtonPrimary>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setExportStep('form')} className="border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer hover:bg-[#F5F5F7]">← Quay lại</button>
                <button onClick={() => window.print()} className="border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer hover:bg-[#F5F5F7]">🖨️ In ngay</button>
                <button onClick={() => toast('⬇️ Đang tạo file ' + exportFormat + '...')} className="py-1.5 px-4 rounded-[9px] text-[11.5px] font-bold text-white cursor-pointer" style={{background: C.gradPrimary}}>⬇️ Tải {exportFormat}</button>
              </div>
              <div id="printArea" className="bg-white border border-[#EDEDF1] rounded-[14px] p-7 max-h-[50vh] overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,.06)]" style={{ fontFamily: "Georgia,'Times New Roman',serif", color: '#1a1a1a' }}>
                <div className="flex justify-between items-center mb-5" style={{ fontFamily: '-apple-system,sans-serif' }}>
                  <div className="flex items-center gap-[7px] font-extrabold text-[12px] tracking-[.5px]">
                    <div className="w-[24px] h-[24px] rounded-[9px] flex items-center justify-center text-white font-extrabold text-[11px]" style={{background: C.gradPrimary}}>P</div>
                    <span>PROT LIFE</span>
                  </div>
                  <div className="text-[11px] text-[#888]">18/07/2026</div>
                </div>
                <h1 className="text-[22px] font-bold mb-1">Báo cáo {exportScope.includes('Tổng quan') ? 'Tổng quan' : exportScope.replace('Chỉ ', '')}</h1>
                <div className="text-[12px] text-[#666] mb-5" style={{ fontFamily: '-apple-system,sans-serif' }}>Từ 01/01/2026 đến 18/07/2026</div>
                <div className="grid grid-cols-4 gap-2.5 mb-[22px]">
                  {[['128','Người thân & bạn bè'],['64','Sự kiện'],['842','Ký ức'],['37','Địa điểm']].map(([n,l]) => (
                    <div key={l} className="text-center border border-[#eee] rounded-[8px] p-2.5"><div className="text-[19px] font-extrabold">{n}</div><div className="text-[9.5px] text-[#777] mt-0.5">{l}</div></div>
                  ))}
                </div>
                <table className="w-full border-collapse text-[12px] mb-[22px]">
                  <thead><tr><th className="text-left border-b-2 border-[#1a1a1a] p-[6px_8px] text-[10.5px] uppercase tracking-[.3px]" style={{fontFamily:'-apple-system,sans-serif'}}>Tên</th><th className="text-left border-b-2 border-[#1a1a1a] p-[6px_8px] text-[10.5px] uppercase tracking-[.3px]" style={{fontFamily:'-apple-system,sans-serif'}}>Nhóm</th><th className="text-left border-b-2 border-[#1a1a1a] p-[6px_8px] text-[10.5px] uppercase tracking-[.3px]" style={{fontFamily:'-apple-system,sans-serif'}}>Lần gặp gần nhất</th></tr></thead>
                  <tbody>
                    {[['Minh Anh','Bạn bè · Đại học','2 tuần trước'],['Linh','Gia đình ruột','Hôm qua'],['Hải','Đồng nghiệp cũ','3 tháng trước'],['Thu Trang','Bạn bè · Cấp 3','1 tháng trước']].map(([n,g,t]) => (
                      <tr key={n}><td className="p-[7px_8px] border-b border-[#eee]">{n}</td><td className="p-[7px_8px] border-b border-[#eee]">{g}</td><td className="p-[7px_8px] border-b border-[#eee]">{t}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-[10px] text-[#999] text-center border-t border-[#eee] pt-2.5" style={{ fontFamily: '-apple-system,sans-serif' }}>Xuất bởi Prot Life · Trang 1/1 · 18/07/2026</div>
              </div>
            </>
          )}
        </Modal>
      )}

      {showOAuth && (
        <Modal onClose={() => { setShowOAuth(false); setOauthStep(1); }} narrow>
          {oauthStep === 1 && (
            <div className="text-center">
              <div className="w-11 h-11 rounded-full bg-[#4285F4] text-white font-extrabold text-[20px] flex items-center justify-center mx-auto mb-4">G</div>
              <div className="text-[16px] font-bold mb-1">Chọn tài khoản</div>
              <div className="text-[12px] text-[#6B7280] mb-4">để tiếp tục tới <strong>Prot Life</strong></div>
              <div onClick={() => setOauthStep(2)} className="flex items-center gap-3 p-3 border border-[#EDEDF1] rounded-[12px] mb-2 cursor-pointer hover:bg-[#FAFAFB]">
                <div className="w-[34px] h-[34px] rounded-full bg-[#4285F4] text-white font-bold text-[13px] flex items-center justify-center shrink-0">P</div>
                <div className="text-left"><div className="font-bold text-[13px]">Prot Nguyễn</div><div className="text-[11.5px] text-[#6B7280]">tk.prot@gmail.com</div></div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-[#EDEDF1] rounded-[12px] cursor-pointer hover:bg-[#FAFAFB]">
                <div className="w-[34px] h-[34px] rounded-full bg-[#9CA3AF] text-white font-bold text-[13px] flex items-center justify-center shrink-0">＋</div>
                <div className="text-[13px] font-semibold text-[#6B7280]">Dùng tài khoản khác</div>
              </div>
            </div>
          )}
          {oauthStep === 2 && (
            <div>
              <div className="text-center mb-4">
                <div className="w-11 h-11 rounded-full bg-[#101010] text-white font-extrabold text-[20px] flex items-center justify-center mx-auto">P</div>
                <div className="text-[15px] font-bold mt-3">Prot Life muốn truy cập tài khoản Google của bạn</div>
                <div className="text-[11.5px] text-[#6B7280] mt-1">tk.prot@gmail.com</div>
              </div>
              <div className="bg-[#FAFAFB] rounded-[14px] p-3.5 mb-3">
                <div className="text-[12.5px] py-1">📄 Xem, tạo và chỉnh sửa <strong>các file Google Sheets cụ thể</strong> mà bạn chọn</div>
                <div className="text-[12.5px] py-1 text-[#6B7280]">🚫 <strong>Không</strong> truy cập toàn bộ Drive, Gmail hay dữ liệu khác</div>
              </div>
              <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mb-4 leading-relaxed">Scope hẹp <code className="bg-[#F1F1F4] px-1.5 py-0.5 rounded-[5px] text-[11px]">drive.file</code> — chỉ thấy đúng file cậu chọn.</div>
              <div className="flex gap-2.5">
                <button onClick={() => { setShowOAuth(false); setOauthStep(1); }} className="flex-1 py-3 rounded-[12px] border-none text-[13px] font-bold bg-[#F1F1F4] text-[#6B7280] cursor-pointer">Từ chối</button>
                <button onClick={() => setOauthStep(3)} className="flex-1 py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer" style={{background: C.gradPrimary, boxShadow:'0 10px 22px rgba(214,0,50,.25)'}}>Cho phép</button>
              </div>
            </div>
          )}
          {oauthStep === 3 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto mb-4 text-[24px] font-bold">✓</div>
              <div className="text-[15px] font-bold mb-1.5">Đã tạo & liên kết Sheet mới</div>
              <div className="text-[12px] text-[#6B7280]">ProtLife_Data_Export.xlsx — sẵn sàng đồng bộ</div>
              <button onClick={handleOAuthSuccess} className="mt-6 py-3 px-6 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer" style={{background: C.gradPrimary}}>Hoàn tất</button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

// ═══════ Shared sub-components ═══════

function LoginRow({ icon, bg, border, label, desc, badge, action }: { icon: React.ReactNode; bg: string; border?: boolean; label: string; desc: string; badge?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-[11px] border-b border-[#EDEDF1] last:border-b-0">
      <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-[15px] shrink-0" style={{ background: bg, border: border ? '1px solid #EDEDF1' : undefined }}>{icon}</div>
      <div className="flex-1 min-w-0"><div className="text-[13px] font-bold">{label}</div><div className="text-[11.5px] text-[#6B7280] mt-0.5">{desc}</div></div>
      {badge || action}
    </div>
  );
}

function StorageBar({ label, used, total, pct, color }: { label: string; used: string; total: string; pct: number; color?: string }) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between text-[12px] font-bold mb-1.5"><span>{label}</span><span className="text-[#6B7280] font-semibold">{used} / {total}</span></div>
      <div className="w-full h-[9px] rounded-[6px] bg-[#F1F1F4] overflow-hidden">
        <div className="h-full rounded-[6px]" style={{ width: pct + '%', background: color || C.gradPrimary }} />
      </div>
    </div>
  );
}

function DataStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-[11px] border-b border-[#EDEDF1] text-[13px]">
      <span>{label}</span><span className="font-extrabold text-[#E6002D]">{value}</span>
    </div>
  );
}

function RolePill({ role, label }: { role: RoleKey; label: string }) {
  const styles: Record<RoleKey, { bg: string; text: string }> = {
    admin:  { bg: 'rgba(230,0,45,.1)', text: '#E6002D' },
    member: { bg: 'rgba(139,92,246,.1)', text: '#8B5CF6' },
    viewer: { bg: 'rgba(16,185,129,.1)', text: '#10B981' },
    guest:  { bg: '#F1F1F4', text: '#6B7280' },
  };
  return <span className="inline-block px-2.5 py-1 rounded-[8px] text-[11px] font-bold" style={{ background: styles[role].bg, color: styles[role].text }}>{label}</span>;
}

function Modal({ children, onClose, title, subtitle, wide, narrow }: { children: React.ReactNode; onClose: () => void; title?: string; subtitle?: string; wide?: boolean; narrow?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-[24px] p-[22px] shadow-[0_30px_80px_rgba(0,0,0,.25)] animate-[modalIn_.25s_cubic-bezier(.34,1.4,.64,1)_both] max-h-[85vh] overflow-y-auto ${
        narrow ? 'w-full max-w-[380px]' : wide ? 'w-full max-w-[560px]' : 'w-full max-w-[460px]'
      }`}>
        <style>{`@keyframes modalIn{from{transform:scale(.96)translateY(10px);opacity:0}to{transform:scale(1)translateY(0);opacity:1}}`}</style>
        {(title || subtitle) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && <div className="text-[17px] font-extrabold">{title}</div>}
              {subtitle && <div className="text-[12px] text-[#9CA3AF] mt-0.5">{subtitle}</div>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6B7280] hover:bg-[#F1F1F4] shrink-0"><X size={15} strokeWidth={1.8} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ═══════ Backup Tab Content ═══════
function BackupContent() {
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [monthlyEnabled, setMonthlyEnabled] = useState(true);
  const [r2On, setR2On] = useState(true);
  const [driveOn, setDriveOn] = useState(true);
  const [gitOn, setGitOn] = useState(true);

  return (
    <>
      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)] mb-[18px]">
        <div className="flex items-center gap-3 p-3.5 rounded-[14px] bg-[rgba(16,185,129,.06)] mb-4">
          <div className="w-[38px] h-[38px] rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0"><Check size={18} strokeWidth={2.4} /></div>
          <div>
            <div className="font-extrabold text-[13.5px]">An toàn theo nguyên tắc 3-2-1 · 100% miễn phí</div>
            <div className="text-[11.5px] text-[#6B7280]">3 bản sao · 2 loại lưu trữ · 1 nơi ngoại vi — lần gần nhất: hôm nay, 06:30</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            { num:'3', title:'Bản sao dữ liệu', desc:'1 chính + 2 dự phòng, không phụ thuộc 1 nơi duy nhất', tags:['Supabase','R2','Drive'], colors:['#3ECF8E','#F38020','#4285F4'] },
            { num:'2', title:'Loại lưu trữ khác nhau', desc:'Database, object storage và cloud — nếu 1 loại hỏng, loại kia còn', tags:['Database','Object Storage','Personal Cloud'], outline:true },
            { num:'1', title:'Bản lưu ngoại vi', desc:'R2 và Drive khác nhà cung cấp với Supabase', tags:['Cloudflare R2','Google Drive'], colors:['#F38020','#4285F4'] },
          ].map(s => (
            <div key={s.num} className="bg-[#FAFAFB] border border-[#EDEDF1] rounded-[16px] p-4">
              <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white font-extrabold text-[14px] mb-2.5" style={{background: C.gradPrimary}}>{s.num}</div>
              <div className="text-[13px] font-extrabold mb-1.5">{s.title}</div>
              <div className="text-[11.5px] text-[#6B7280] leading-relaxed mb-3">{s.desc}</div>
              <div className="flex flex-wrap gap-1.5">
                {'colors' in s
                  ? s.tags.map((t, j) => <span key={t} className="text-[10.5px] font-bold px-[9px] py-1 rounded-[8px] text-white" style={{background: (s as any).colors![j]}}>{t}</span>)
                  : s.tags.map(t => <span key={t} className="text-[10.5px] font-bold px-[9px] py-1 rounded-[8px] border border-[#EDEDF1] text-[#6B7280]">{t}</span>)
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#F8F8FA] to-[#F1F1F4] border border-[#EDEDF1] rounded-[18px] p-[22px] mb-[18px]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background:'#24292F'}}>G</div>
          <div className="flex-1">
            <div className="text-[13px] font-bold flex items-center flex-wrap gap-1.5">GitHub Actions <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] bg-[rgba(36,41,47,.08)]">Engine · 2.000 phút/tháng free</span></div>
            <div className="text-[11.5px] text-[#6B7280] mt-0.5 leading-relaxed">Chạy cron hằng ngày & hằng tháng — không dùng Vercel Cron vì Free 1 lần/ngày. GitHub Actions không giới hạn giờ, đồng thời giúp Supabase khỏi bị tạm dừng do 7 ngày không hoạt động.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-[18px] items-start">
        <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)]">
          <div className="text-[14.5px] font-extrabold mb-4">Điểm lưu trữ</div>
          {[
            { icon:'S', bg:'#3ECF8E', name:'Supabase', badge:'Bản chính', badgeType:'primary', desc:'Postgres + Storage sống — không backup tự động gói Free' },
            { icon:'R', bg:'#F38020', name:'Cloudflare R2', badge:'Ngoại vi · Kỹ thuật', badgeType:'offsite', desc:'10GB free, 0đ tải xuống — backup hằng ngày + dump tháng', toggle:[r2On, setR2On] },
            { icon:'D', bg:'#4285F4', name:'Google Drive', badge:'Ngoại vi · Cá nhân', badgeType:'offsite', desc:'Chỉ dump nén hằng tháng — cậu tự mở, không cần code', toggle:[driveOn, setDriveOn] },
            { icon:'G', bg:'#24292F', name:'GitHub', badge:'Version control', badgeType:'offsite', desc:'Manifest.json nhẹ (checksum), mỗi tháng 1 commit', toggle:[gitOn, setGitOn] },
          ].map(node => (
            <div key={node.name} className="flex items-center gap-3 py-[13px] border-b border-[#EDEDF1] last:border-b-0">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background: node.bg}}>{node.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold flex items-center flex-wrap gap-1.5">
                  {node.name}
                  <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] ${
                    node.badgeType === 'primary' ? 'bg-[rgba(230,0,45,.1)] text-[#E6002D]' : 'bg-[rgba(16,185,129,.1)] text-[#10B981]'
                  }`}>{node.badge}</span>
                </div>
                <div className="text-[11.5px] text-[#6B7280] mt-0.5">{node.desc}</div>
              </div>
              {'toggle' in node && node.toggle
                ? <ToggleSwitch checked={node.toggle[0] as boolean} onChange={node.toggle[1] as (v: boolean) => void} />
                : <span className="text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-[7px] bg-[rgba(16,185,129,.1)] text-[#10B981]">Đang chạy</span>
              }
            </div>
          ))}
          <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-0.5 leading-relaxed">Media (ảnh/video) chỉ mirror 1 bản trên R2, đồng bộ incremental — không nhân bản lại mỗi tháng.</div>
        </div>

        <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)]">
          <div className="text-[14.5px] font-extrabold mb-4">Tự động hoá</div>
          <ToggleRow title="Sao lưu hằng ngày" desc="03:00 UTC — dump database, nén lên R2" checked={dailyEnabled} onChange={setDailyEnabled} />
          <ToggleRow title="Snapshot hàng tháng" desc="Ngày 1, 03:00 UTC — R2 + Drive" checked={monthlyEnabled} onChange={setMonthlyEnabled} />
          <ButtonPrimary onClick={() => toast('⏳ Đang chạy sao lưu...')} className="mt-3.5">Sao lưu ngay</ButtonPrimary>
        </div>
      </div>

      <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05)] mt-[18px]">
        <div className="text-[14.5px] font-extrabold mb-4">Snapshot hàng tháng</div>
        <div className="text-[12px] text-[#6B7280] mb-4 -mt-2 leading-relaxed">Sao lưu ngày <strong>ghi đè</strong> bản cũ (chỉ R2). Snapshot tháng <strong>đóng băng vĩnh viễn</strong> một mốc, gửi R2 + Drive — cho phép quay lại chính xác trạng thái app tháng bất kỳ.</div>
        <div className="grid grid-cols-2 gap-3 mb-[18px]">
          <Field label="Chính sách lưu giữ">
            <Select defaultValue="Giữ 12 tháng gần nhất, tự xoá bản cũ hơn">
              <option>Giữ 12 tháng gần nhất, tự xoá bản cũ hơn</option>
              <option>Giữ 24 tháng gần nhất</option>
              <option>Giữ vĩnh viễn mốc Tháng 1 mỗi năm, còn xoay vòng 12 tháng</option>
            </Select>
          </Field>
          <Field label="Ngày chụp snapshot">
            <Select defaultValue="Ngày 1 hằng tháng, 03:00">
              <option>Ngày 1 hằng tháng, 03:00</option>
              <option>Ngày cuối tháng, 03:00</option>
            </Select>
          </Field>
        </div>
        <div className="space-y-0">
          {[
            { date:'Tháng 7 / 2026', badge:'Mới nhất', meta:'42 MB · R2 + Drive · manifest GitHub', current:true },
            { date:'Tháng 6 / 2026', meta:'39 MB · R2 + Drive' },
            { date:'Tháng 5 / 2026', meta:'37 MB · R2 + Drive' },
            { date:'Tháng 1 / 2026', badge:'Giữ vĩnh viễn', meta:'31 MB · Mốc đầu năm', pin:true },
          ].map(s => (
            <div key={s.date} className="flex items-center gap-3 py-3 border-b border-[#EDEDF1] last:border-b-0">
              <div className={`w-[11px] h-[11px] rounded-full shrink-0 ${
                s.current ? 'bg-[#E6002D] shadow-[0_0_0_4px_rgba(230,0,45,.15)]' :
                s.pin ? 'bg-[#8B5CF6] shadow-[0_0_0_4px_rgba(139,92,246,.15)]' : 'bg-[#D9D9DE]'
              }`} />
              <div className="flex-1">
                <div className="text-[13px] font-bold flex items-center gap-2 flex-wrap">
                  {s.date}
                  {s.badge && <span className={`text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-[7px] ${s.pin ? 'bg-[rgba(139,92,246,.1)] text-[#8B5CF6]' : 'bg-[rgba(16,185,129,.1)] text-[#10B981]'}`}>{s.badge}</span>}
                </div>
                <div className="text-[11.5px] text-[#6B7280] mt-0.5">{s.meta}</div>
              </div>
              <button onClick={() => toast('⏳ Đang khôi phục...')} className="text-[#E6002D] font-bold text-[12px] cursor-pointer bg-transparent border-none">{s.current ? 'Xem lại' : 'Khôi phục'}</button>
            </div>
          ))}
        </div>
        <button onClick={() => toast('📜 Đang tải...')} className="w-full border border-[#EDEDF1] py-2.5 rounded-[12px] text-[12px] font-bold cursor-pointer mt-3.5 hover:bg-[#F5F5F7]">Xem toàn bộ lịch sử snapshot</button>
      </div>
    </>
  );
}
