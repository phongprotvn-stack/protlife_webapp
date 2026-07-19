'use client';

import { useState } from 'react';
import { X, Bell, MoreHorizontal, Sparkles, Check, ChevronRight, BookHeart, Users, Calendar, MapPin, Camera, FileText, Target, BarChart3, Home, Clock, Shield, Palette, Database, Globe } from 'lucide-react';

// ═══════════ Design Tokens ═══════════
const C = {
  primary: '#E6002D',
  primaryDark: '#D60032',
  primaryLight: '#FF4B3A',
  surface: '#F8F8FA',
  future: '#8B5CF6',
  green: '#10B981',
  textPrimary: '#101010',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#EDEDF1',
  gradPrimary: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 55%,#FF6A3D 100%)',
};

// ═══════════ Toast ═══════════
let toastTimer: ReturnType<typeof setTimeout>;
function showToast(msg: string) {
  const el = document.getElementById('global-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ═══════════ SVG helpers ═══════════
const checkSvg = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-[11px] h-[11px]"><path d="M5 13l4 4L19 7"/></svg>;
const xSvg = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-[11px] h-[11px]"><path d="M6 6l12 12M18 6L6 18"/></svg>;

// ═══════════ Types ═══════════
type Tab = 'account' | 'data' | 'privacy' | 'notify' | 'appearance' | 'permissions' | 'backup';
type Role = 'admin' | 'member' | 'viewer' | 'guest';
type SheetState = 'linked' | 'unlinked';
type OAuthStep = 1 | 2 | 3;

interface Device { name: string; icon: string; desc: string; isCurrent: boolean; loggedOut: boolean; }

const ROLES: Record<Role, { label: string; perms: Record<string, number> }> = {
  admin:  { label:'Admin',  perms:{view:1,add:1,edit:1,del:1,import:1,export:1,ai:1,users:1,system:1} },
  member: { label:'Member', perms:{view:1,add:1,edit:1,del:0,import:0,export:1,ai:1,users:0,system:0} },
  viewer: { label:'Viewer', perms:{view:1,add:0,edit:0,del:0,import:0,export:0,ai:0,users:0,system:0} },
  guest:  { label:'Guest',  perms:{view:1,add:0,edit:0,del:0,import:0,export:0,ai:0,users:0,system:0} },
};
const PERM_LABELS: [string, string][] = [
  ['view','Xem dữ liệu'], ['add','Thêm dữ liệu'], ['edit','Sửa dữ liệu'], ['del','Xoá dữ liệu'],
  ['import','Import dữ liệu'], ['export','Export dữ liệu'], ['ai','Sử dụng AI Insight'],
  ['users','Quản lý người dùng'], ['system','Cài đặt hệ thống'],
];

const TABS: { id: Tab; label: string }[] = [
  { id:'account', label:'Tài khoản' }, { id:'data', label:'Dữ liệu' },
  { id:'privacy', label:'Quyền riêng tư' }, { id:'notify', label:'Thông báo' },
  { id:'appearance', label:'Giao diện' }, { id:'permissions', label:'Phân quyền' },
  { id:'backup', label:'Sao lưu' },
];

// ═══════════ Shared Components ═══════════

function Card({ title, badge, children, className = '' }: { title?: string; badge?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className="bg-white border border-[#EDEDF1] rounded-[18px] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,.05),0_2px_8px_rgba(0,0,0,.03)] mb-[18px]" style={{ boxShadow: '0 8px 28px rgba(0,0,0,.05), 0 2px 8px rgba(0,0,0,.03)' }}>
      {title && (
        <div className="text-[14.5px] font-extrabold mb-[16px] flex items-center gap-2">
          {title}
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

function ToggleRow({ title, desc, checked, disabled }: { title: string; desc?: string; checked?: boolean; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-[13px] border-b border-[#EDEDF1] gap-4 last:border-b-0">
      <div>
        <div className="text-[13px] font-bold">{title}</div>
        {desc && <div className="text-[11.5px] text-[#6B7280] mt-0.5">{desc}</div>}
      </div>
      <label className="relative w-[42px] h-[25px] shrink-0 cursor-pointer">
        <input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked={checked} disabled={disabled} />
        <span className="absolute inset-0 bg-[#E5E5EA] rounded-[25px] transition-colors duration-200 peer-checked:bg-[#E6002D] after:content-[''] after:absolute after:w-[21px] after:h-[21px] after:left-[2px] after:top-[2px] after:bg-white after:rounded-full after:transition-transform after:duration-200 after:shadow-[0_1px_3px_rgba(0,0,0,.25)] peer-checked:after:translate-x-[17px] [&:has(input:checked)]:bg-[#E6002D] [&:has(input:disabled)]:opacity-40 [&:has(input:disabled)]:cursor-not-allowed" />
      </label>
    </div>
  );
}

function Badge({ children, color = 'green' }: { children: React.ReactNode; color?: string }) {
  const bg = color === 'green' ? 'rgba(16,185,129,.1)' : color === 'primary' ? 'rgba(230,0,45,.1)' : 'rgba(139,92,246,.1)';
  const text = color === 'green' ? '#10B981' : color === 'primary' ? '#E6002D' : '#8B5CF6';
  return (
    <span className="text-[9.5px] font-extrabold px-[7px] py-[2px] rounded-[6px] tracking-[.2px]" style={{ background: bg, color: text }}>
      {children}
    </span>
  );
}

// ═══════════ Page Component ═══════════
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [sheetState, setSheetState] = useState<SheetState>('linked');
  const [oauthStep, setOauthStep] = useState<OAuthStep>(1);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [exportStep, setExportStep] = useState<'form' | 'preview'>('form');
  const [exportFormat, setExportFormat] = useState('Word');
  const [exportScope, setExportScope] = useState('Tổng quan — tất cả dữ liệu');
  const [devices, setDevices] = useState<Device[]>([
    { name:'iPhone 15 Pro · Safari', icon:'📱', desc:'TP. Hồ Chí Minh · Hoạt động vừa xong · Đăng nhập qua Google', isCurrent:true, loggedOut:false },
    { name:'MacBook Air · Chrome', icon:'💻', desc:'TP. Hồ Chí Minh · Hoạt động 3 giờ trước · Đăng nhập qua Email/Mật khẩu', isCurrent:false, loggedOut:false },
    { name:'iPad · Safari', icon:'📱', desc:'Hà Nội · Hoạt động 2 ngày trước · Đăng nhập qua Magic Link', isCurrent:false, loggedOut:false },
    { name:'Windows PC · Edge', icon:'🖥️', desc:'Đà Nẵng · Hoạt động 5 ngày trước · Đăng nhập qua Google', isCurrent:false, loggedOut:false },
  ]);

  const logoutDevice = (name: string) => {
    setDevices(d => d.map(dv => dv.name === name ? { ...dv, loggedOut: true } : dv));
    showToast('✅ Đã đăng xuất thiết bị "' + name + '"');
  };
  const logoutOthers = () => {
    setDevices(d => d.map(dv => dv.isCurrent ? dv : { ...dv, loggedOut: true }));
    showToast('✅ Đã đăng xuất khỏi mọi thiết bị khác (scope: others)');
  };

  return (
    <>
      {/* Toast */}
      <div id="global-toast" className="fixed top-5 left-1/2 -translate-x-1/2 -translate-y-5 scale-90 bg-black/85 backdrop-blur-xl text-white px-[22px] py-3 rounded-[26px] text-[13px] font-semibold z-[100] opacity-0 pointer-events-none transition-all duration-400 shadow-[0_16px_40px_rgba(0,0,0,.25)]"
        style={{ transitionProperty: 'opacity, transform', transitionTimingFunction: 'cubic-bezier(.34,1.4,.64,1)' }}
      />
      <style>{`
        #global-toast.show { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        .switch-slider:has(input:checked) { background: #E6002D; }
      `}</style>

      <div className="flex h-screen overflow-hidden bg-[#F8F8FA] text-[#101010]">
        
        {/* ═══ SIDEBAR ═══ */}
        <aside className="w-[216px] bg-white border-r border-[#EDEDF1] flex flex-col shrink-0 max-md:hidden">
          <div className="flex items-center gap-[9px] px-5 pt-[22px] pb-[18px]">
            <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white font-extrabold text-[14px] shadow-[0_6px_14px_rgba(230,0,45,.3)]" style={{background: C.gradPrimary}}>P</div>
            <span className="font-extrabold text-[15px] tracking-[.3px]">PROT LIFE</span>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-1.5">
            {[
              ['Trang chủ', Home], ['Quan hệ', Users], ['Sự kiện', Calendar],
              ['Dòng thời gian', Clock], ['Ký ức', BookHeart], ['Bản đồ', MapPin],
              ['Tổ chức', Globe], ['Tài liệu', FileText], ['Mục tiêu', Target],
              ['Thống kê', BarChart3], ['AI Insight', Sparkles],
            ].map(([label, Icon]) => (
              <div key={label as string}
                className={`flex items-center gap-[11px] px-3 py-[9px] rounded-[12px] text-[13px] font-semibold mb-[2px] cursor-pointer transition-colors duration-150 ${
                  label === 'Dòng thời gian' ? 'bg-[rgba(230,0,45,.08)] text-[#E6002D]' : 'text-[#6B7280] hover:bg-[#F5F5F7]'
                }`}>
                <Icon size={17} strokeWidth={1.8} />
                {label as string}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-[10px] px-5 py-4 border-t border-[#EDEDF1]">
            <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0" style={{background: C.gradPrimary}}>P</div>
            <div>
              <div className="font-bold text-[13px]">Prot</div>
              <div className="text-[11px] text-[#9CA3AF]">Admin</div>
            </div>
          </div>
        </aside>

        {/* ═══ MAIN ═══ */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-5 pb-0">
            <h1 className="text-[19px] font-extrabold tracking-[-.3px]">Cài đặt</h1>
            <div className="flex items-center gap-1.5">
              {[
                [Bell, 'Thông báo'],
                [MoreHorizontal, 'Thêm tuỳ chọn'],
                [X, 'Đóng'],
              ].map(([Icon, title]) => (
                <button key={title as string} title={title as string}
                  className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6B7280] hover:bg-[#F1F1F4] transition-colors duration-150">
                  <Icon size={17} strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-7 pt-4 pb-0 border-b border-[#EDEDF1] overflow-x-auto">
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

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-7 pt-6 pb-[60px]">
            
            {/* ═══ TAB: TÀI KHOẢN ═══ */}
            {activeTab === 'account' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
                {/* Left: Thông tin tài khoản */}
                <Card title="Thông tin tài khoản">
                  <div className="flex items-center gap-[14px] mb-5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-[20px] shrink-0" style={{background: C.gradPrimary}}>P</div>
                    <div>
                      <div className="font-bold text-[14px]">Prot</div>
                      <div className="text-[12px] text-[#9CA3AF] mb-1.5">Admin</div>
                      <button className="bg-transparent border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer hover:bg-[#F5F5F7]">Thay đổi avatar</button>
                    </div>
                  </div>
                  <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Họ và tên</label><input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white" defaultValue="Prot" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Email</label><input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white" defaultValue="prot@example.com" /></div>
                    <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Số điện thoại</label><input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white" defaultValue="0912 345 678" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Ngày sinh</label><input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white" defaultValue="27/10/1992" /></div>
                    <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Giới tính</label>
                      <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white"><option>Nam</option><option>Nữ</option><option>Khác</option></select>
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer mt-1.5 active:scale-[.98]" style={{background: C.gradPrimary, boxShadow: '0 10px 22px rgba(214,0,50,.25)'}}>Lưu thay đổi</button>
                </Card>

                {/* Right column */}
                <div>
                  {/* Phương thức đăng nhập */}
                  <Card title="Phương thức đăng nhập">
                    <LoginMethodRow icon={<span>✉️</span>} bg="#F1F1F4" label="Email / Mật khẩu" desc="prot@example.com" badge={<Badge>Đang dùng</Badge>} />
                    <LoginMethodRow icon={<span>🔗</span>} bg="rgba(139,92,246,.1)" label="Magic Link" desc="Đăng nhập không cần mật khẩu qua email" badge={<Badge>Đã bật</Badge>} />
                    <LoginMethodRow icon={<span style={{color:'#4285F4',fontWeight:800}}>G</span>} bg="#fff" border label="Google" desc="Chưa liên kết tài khoản Google"
                      action={<button className="bg-transparent border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer hover:bg-[#F5F5F7]">Liên kết</button>} />
                    <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-0.5 leading-relaxed">Cả 3 phương thức đều miễn phí hoàn toàn qua Supabase Auth. Không dùng SMS OTP vì tốn phí nhà mạng.</div>
                  </Card>

                  {/* Bảo mật */}
                  <Card title="Bảo mật">
                    <button className="w-full bg-white border border-[#EDEDF1] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center mb-[9px] hover:bg-[#F5F5F7]">Đổi mật khẩu</button>
                    <button onClick={() => setShowDeviceModal(true)} className="w-full bg-white border border-[#EDEDF1] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center mb-[9px] hover:bg-[#F5F5F7]">
                      📱 Quản lý thiết bị <span className="bg-[#E6002D] text-white text-[10px] font-extrabold px-[7px] py-[1px] rounded-[20px] ml-1.5">4</span>
                    </button>
                    <button className="w-full bg-white border border-[rgba(230,0,45,.25)] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center hover:bg-[#F5F5F7]" style={{color: C.primary}}>Đăng xuất tất cả</button>
                  </Card>

                  {/* Ngôn ngữ */}
                  <Card title="Ngôn ngữ">
                    <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white">
                      <option>Tiếng Việt</option><option>English</option>
                    </select>
                  </Card>

                  {/* Múi giờ */}
                  <Card title="Múi giờ">
                    <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white">
                      <option>(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                      <option>(GMT+09:00) Tokyo, Seoul</option>
                    </select>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ TAB: DỮ LIỆU ═══ */}
            {activeTab === 'data' && <DataTab />}

            {/* ═══ TAB: QUYỀN RIÊNG TƯ ═══ */}
            {activeTab === 'privacy' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
                <Card title="Hiển thị hồ sơ">
                  <ToggleRow title="Hồ sơ công khai" desc="Người khác có thể tìm thấy bạn qua số điện thoại" />
                  <ToggleRow title="Trạng thái hoạt động" desc="Hiện thời điểm bạn dùng app gần nhất" checked />
                  <ToggleRow title="Vị trí trong Bản đồ" desc="Chia sẻ địa điểm hiện tại với nhóm gia đình" />
                </Card>
                <div>
                  <Card title="Chia sẻ dữ liệu">
                    <ToggleRow title="Dùng dữ liệu để gợi ý AI" desc="Cải thiện độ chính xác của gợi ý hoạt động" checked />
                    <ToggleRow title="Thống kê ẩn danh" desc="Giúp cải thiện chất lượng ứng dụng" checked />
                  </Card>
                  <Card title="Danh sách chặn">
                    <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 leading-relaxed">Bạn chưa chặn liên hệ nào. Người bị chặn sẽ không thể xem hồ sơ hay mời bạn vào sự kiện chung.</div>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ TAB: THÔNG BÁO ═══ */}
            {activeTab === 'notify' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
                <Card title="Nhắc nhở">
                  <ToggleRow title="Sinh nhật người thân & bạn bè" desc="Nhắc trước 3 ngày và trong ngày" checked />
                  <ToggleRow title="Sự kiện sắp diễn ra" desc="Nhắc trước 1 ngày" checked />
                  <ToggleRow title="Mốc kỷ niệm quan hệ" desc='VD: 1 năm ngày quen nhau' checked />
                  <ToggleRow title="Gợi ý hoạt động từ AI" desc='VD: "Lâu rồi chưa gặp Minh"' />
                </Card>
                <div>
                  <Card title="Kênh nhận thông báo">
                    <ToggleRow title="Thông báo đẩy (Push)" checked />
                    <ToggleRow title="Email" />
                    <ToggleRow title="SMS" />
                  </Card>
                  <Card title="Giờ yên lặng">
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Từ</label><input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white" defaultValue="22:00" /></div>
                      <div><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Đến</label><input className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white" defaultValue="07:00" /></div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ═══ TAB: GIAO DIỆN ═══ */}
            {activeTab === 'appearance' && <AppearanceTab />}

            {/* ═══ TAB: PHÂN QUYỀN ═══ */}
            {activeTab === 'permissions' && (
              <PermissionsTab selectedRole={selectedRole} onSelectRole={setSelectedRole} />
            )}

            {/* ═══ TAB: SAO LƯU ═══ */}
            {activeTab === 'backup' && <BackupTab />}

          </div>
        </main>
      </div>

      {/* ═══ MODAL: Quản lý thiết bị ═══ */}
      {showDeviceModal && <DeviceModal devices={devices} onClose={() => setShowDeviceModal(false)} onLogout={logoutDevice} onLogoutOthers={logoutOthers} />}

      {/* ═══ MODAL: Xuất báo cáo ═══ */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          exportStep={exportStep}
          setExportStep={setExportStep}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          exportScope={exportScope}
          setExportScope={setExportScope}
        />
      )}

      {/* ═══ MODAL: OAuth Google ═══ */}
      {showOAuthModal && (
        <OAuthModal
          onClose={() => { setShowOAuthModal(false); setOauthStep(1); }}
          oauthStep={oauthStep}
          setOauthStep={setOauthStep}
          onSuccess={() => { setSheetState('linked'); setShowOAuthModal(false); setOauthStep(1); showToast('✅ Đã liên kết ProtLife_Data_Export.xlsx'); }}
        />
      )}
    </>
  );
}

// ═══════════ Sub-components ═══════════

function LoginMethodRow({ icon, bg, border, label, desc, badge, action }: { icon: React.ReactNode; bg: string; border?: boolean; label: string; desc: string; badge?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-[11px] border-b border-[#EDEDF1] last:border-b-0">
      <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-[15px] shrink-0" style={{ background: bg, border: border ? '1px solid #EDEDF1' : undefined }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold">{label}</div>
        <div className="text-[11.5px] text-[#6B7280] mt-0.5">{desc}</div>
      </div>
      {badge || action}
    </div>
  );
}

// ═══════ Data Tab ═══════
function DataTab() {
  const [sheetState, setSheetState] = useState<SheetState>('linked');
  const [showOAuth, setShowOAuth] = useState(false);
  const [oauthStep, setOauthStep] = useState<OAuthStep>(1);
  const [showExport, setShowExport] = useState(false);
  const [exportStep, setExportStep] = useState<'form' | 'preview'>('form');
  const [exportFormat, setExportFormat] = useState('Word');
  const [exportScope, setExportScope] = useState('Tổng quan — tất cả dữ liệu');

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
        {/* Left: Storage */}
        <Card title="Dung lượng sử dụng" badge={<Badge color="green">Gói Free — Supabase</Badge>}>
          <div className="mb-[14px]">
            <div className="flex justify-between text-[12px] font-bold mb-1.5"><span>Database (Postgres)</span><span className="text-[#6B7280] font-semibold">312 MB / 500 MB</span></div>
            <div className="w-full h-[9px] rounded-[6px] bg-[#F1F1F4] overflow-hidden"><div className="h-full rounded-[6px]" style={{ width: '62%', background: C.gradPrimary }} /></div>
          </div>
          <div className="mb-[14px]">
            <div className="flex justify-between text-[12px] font-bold mb-1.5"><span>File Storage (ảnh/video)</span><span className="text-[#6B7280] font-semibold">840 MB / 1 GB</span></div>
            <div className="w-full h-[9px] rounded-[6px] bg-[#F1F1F4] overflow-hidden"><div className="h-full rounded-[6px]" style={{ width: '84%', background: 'linear-gradient(135deg,#F59E0B,#FBBF24)' }} /></div>
          </div>
          <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-0.5 leading-relaxed">File Storage sắp đầy — vì đây là 2 hạn mức riêng biệt của Supabase Free (không phải 1 con số gộp chung), nên khi hết ảnh/video sẽ chặn trước, dù Database vẫn còn chỗ.</div>
          <div className="mt-4">
            {[['👥 Người thân & bạn bè','128 hồ sơ'],['📅 Sự kiện đã tạo','64 sự kiện'],['📸 Ký ức & hình ảnh','842 mục'],['🗺️ Địa điểm đã lưu','37 địa điểm']].map(([l,v]) => (
              <div key={l as string} className="flex justify-between items-center py-[11px] border-b border-[#EDEDF1] last:border-b-0 text-[13px]">
                <span>{l as string}</span><span className="font-extrabold text-[#E6002D]">{v as string}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right */}
        <div>
          <Card title="Xuất / nhập dữ liệu">
            <button className="w-full bg-white border border-[#EDEDF1] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center mb-[9px] hover:bg-[#F5F5F7]">⬇️ Xuất toàn bộ dữ liệu (.json)</button>
            <button onClick={() => setShowExport(true)} className="w-full bg-white border border-[#EDEDF1] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center mb-[9px] hover:bg-[#F5F5F7]">📄 Xuất báo cáo (Word / Excel / PDF)</button>
            <button className="w-full bg-white border border-[#EDEDF1] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center mb-[9px] hover:bg-[#F5F5F7]">⬆️ Nhập từ file trên máy (.json/.csv/.xlsx/.vcf/.ics)</button>
            <button className="w-full bg-white border border-[#EDEDF1] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center hover:bg-[#F5F5F7]">☁️ Chọn file từ Google Drive</button>
          </Card>
          <Card title="Hệ sinh thái Google">
            <ToggleRow title="Google Calendar" desc="Đồng bộ sự kiện hai chiều" checked />
            <ToggleRow title="Google Contacts" desc="Nhập danh bạ hàng loạt, gợi ý người quen mới" />
            <ToggleRow title="Google Drive" desc="Chọn tài liệu/ảnh để đính kèm" checked />
            <ToggleRow title={<span>Google Photos <Badge color="future">Chỉ chọn thủ công</Badge></span> as any} desc="Từ 2025 Google chặn quét toàn bộ thư viện — chỉ chọn từng ảnh qua Picker" />
          </Card>
          <Card title={<span>Nguồn mở rộng · Chuẩn mở, miễn phí 100%</span> as any}>
            <ToggleRow title="CalDAV / file .ics" desc="Tương thích Apple Calendar, Outlook — không cần duyệt app" checked />
            <ToggleRow title="vCard (.vcf)" desc="Nhập danh bạ từ mọi điện thoại/email" checked />
            <ToggleRow title={<span>Google Takeout <Badge color="future">Nhập file thủ công</Badge></span> as any} desc="Người dùng tự tải Takeout rồi nhập file — né rào cản API Photos" />
            <div className="text-[10.5px] font-extrabold text-[#6B7280] uppercase tracking-[.6px] my-3.5 mb-2">Cân nhắc thêm · Sắp tới</div>
            <ToggleRow title={<span>Strava <Badge color="future">Sắp ra mắt</Badge></span> as any} desc="Hoạt động thể thao — API free tier ổn định" disabled />
            <ToggleRow title={<span>Spotify <Badge color="future">Sắp ra mắt</Badge></span> as any} desc="Lịch sử nghe nhạc làm giàu ký ức" disabled />
          </Card>
        </div>
      </div>

      {/* Google Sheets Sync — full width */}
      <Card>
        <div className="text-[14.5px] font-extrabold mb-[16px] flex items-center gap-2">
          🔄 Đồng bộ Google Sheets <Badge color="green">App → Sheet · Đang hoạt động</Badge>
        </div>
        <div className="text-[12px] text-[#6B7280] mb-4 -mt-2.5">Mọi thay đổi trong app (thêm/sửa/xoá người thân, sự kiện, ký ức) tự động đẩy sang Google Sheet — cậu có thể mở Sheet để xem, lọc, hoặc chia sẻ, nhưng sửa trong Sheet <strong>chưa</strong> tự động đẩy ngược lại app (nằm trong lộ trình tiếp theo).</div>

        {/* SVG diagram */}
        <svg className="w-full h-auto my-1.5 mb-1" viewBox="0 0 700 130" xmlns="http://www.w3.org/2000/svg">
          <defs><marker id="arrow1" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#D9D9DE"/></marker></defs>
          <rect x="0" y="35" width="150" height="60" rx="14" fill="#3ECF8E"/>
          <text x="75" y="60" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">Supabase</text>
          <text x="75" y="77" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="-apple-system,sans-serif">Postgres (nguồn)</text>
          <path d="M155 65 L200 65" stroke="#D9D9DE" strokeWidth="2" markerEnd="url(#arrow1)"/>
          <rect x="205" y="35" width="150" height="60" rx="14" fill="#F1F1F4" stroke="#E5E5EA"/>
          <text x="280" y="60" textAnchor="middle" fill="#101010" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">DB Webhook</text>
          <text x="280" y="77" textAnchor="middle" fill="#6B7280" fontSize="10" fontFamily="-apple-system,sans-serif">có sẵn, miễn phí</text>
          <path d="M360 65 L405 65" stroke="#D9D9DE" strokeWidth="2" markerEnd="url(#arrow1)"/>
          <rect x="410" y="35" width="150" height="60" rx="14" fill="#101010"/>
          <text x="485" y="60" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">Edge Function</text>
          <text x="485" y="77" textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily="-apple-system,sans-serif">500K lượt/tháng free</text>
          <path d="M565 65 L610 65" stroke="#D9D9DE" strokeWidth="2" markerEnd="url(#arrow1)"/>
          <rect x="615" y="35" width="85" height="60" rx="14" fill="#0F9D58"/>
          <text x="657" y="60" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="-apple-system,sans-serif">Sheet</text>
          <text x="657" y="77" textAnchor="middle" fill="#D1FAE5" fontSize="9" fontFamily="-apple-system,sans-serif">chỉ đọc</text>
        </svg>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mt-5">
          <div>
            {sheetState === 'linked' ? (
              <>
                <div className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background:'#0F9D58'}}>📊</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold">ProtLife_Data_Export.xlsx</div>
                    <div className="text-[11.5px] text-[#6B7280] mt-0.5">Đã liên kết qua tk.prot@gmail.com · Đồng bộ gần nhất: 4 phút trước</div>
                  </div>
                </div>
                <button onClick={() => window.open('https://sheets.google.com','_blank')} className="w-full bg-transparent border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer mt-2 hover:bg-[#F5F5F7]">Mở Google Sheet ↗</button>
                <button onClick={() => setSheetState('unlinked')} className="w-full bg-white border border-[rgba(230,0,45,.25)] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center mt-2 hover:bg-[#F5F5F7]" style={{color: C.primary}}>Ngắt liên kết</button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2.5">
                  <div className="w-9 h-9 rounded-[11px] flex items-center justify-center font-extrabold text-[15px] shrink-0" style={{background:'#E5E5EA',color:'#9CA3AF'}}>📊</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold">Chưa liên kết Google Sheet</div>
                    <div className="text-[11.5px] text-[#6B7280] mt-0.5">Cần cấp quyền qua tài khoản Google để bắt đầu đồng bộ</div>
                  </div>
                </div>
                <button onClick={() => setShowOAuth(true)} className="w-full py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer mt-2 active:scale-[.98]" style={{background: C.gradPrimary, boxShadow:'0 10px 22px rgba(214,0,50,.25)'}}>🔗 Liên kết với Google</button>
              </>
            )}
            <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-2.5 leading-relaxed">Đây là quyền <strong>riêng</strong>, tách khỏi việc đăng nhập app — dù cậu đăng nhập bằng Email hay Google, vẫn cần cấp quyền này thêm 1 lần.</div>
          </div>
          <div>
            <div className="text-[12.5px] font-extrabold mb-2.5">Log đồng bộ gần đây</div>
            {[
              ['ok','Cập nhật "Minh" · Sự kiện sinh nhật','4 phút trước'],
              ['ok','Thêm mới "Chuyến Đà Lạt" vào sheet Ký ức','2 giờ trước'],
              ['err','Lỗi: dòng 42 sheet Người thân — sai định dạng ngày sinh','Hôm qua, 21:03 · Xem chi tiết'],
              ['ok','Xoá "Cà phê với Minh" khỏi sheet Sự kiện','Hôm qua, 14:22'],
            ].map(([type,text,time],i) => (
              <div key={i} className={`flex items-start gap-2.5 py-[9px] border-b border-[#EDEDF1] last:border-b-0 ${type === 'err' ? 'text-[#E6002D]' : ''}`}>
                <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${type === 'err' ? 'bg-[#E6002D]' : 'bg-[#10B981]'}`} />
                <div>
                  <div className={`text-[12.5px] font-semibold ${type === 'err' ? 'text-[#E6002D]' : ''}`}>{text as string}</div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">{time as string}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Export modal */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          exportStep={exportStep}
          setExportStep={setExportStep}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          exportScope={exportScope}
          setExportScope={setExportScope}
        />
      )}

      {/* OAuth modal */}
      {showOAuth && (
        <OAuthModal
          onClose={() => { setShowOAuth(false); setOauthStep(1); }}
          oauthStep={oauthStep}
          setOauthStep={setOauthStep}
          onSuccess={() => { setSheetState('linked'); setShowOAuth(false); setOauthStep(1); showToast('✅ Đã liên kết ProtLife_Data_Export.xlsx'); }}
        />
      )}
    </>
  );
}

// ═══════ Appearance Tab ═══════
function AppearanceTab() {
  const [theme, setTheme] = useState('light');
  const [accent, setAccent] = useState('#E6002D');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
      <Card title="Chế độ hiển thị">
        <div className="grid grid-cols-3 gap-2.5 mb-[18px]">
          {[
            { id:'light', label:'Sáng', preview:'linear-gradient(180deg,#fff 0%,#F1F1F4 100%)' },
            { id:'dark', label:'Tối', preview:'linear-gradient(180deg,#2A2A2E 0%,#101012 100%)' },
            { id:'system', label:'Theo hệ thống', preview:'linear-gradient(90deg,#fff 50%,#101012 50%)' },
          ].map(t => (
            <div key={t.id} onClick={() => setTheme(t.id)}
              className={`border-2 rounded-[14px] p-2.5 cursor-pointer text-center ${theme === t.id ? 'border-[#E6002D]' : 'border-[#EDEDF1]'}`}>
              <div className="h-[52px] rounded-[9px] mb-2" style={{ background: t.preview, border: t.id === 'light' ? '1px solid #EDEDF1' : undefined }} />
              <div className="text-[11.5px] font-bold">{t.label}</div>
            </div>
          ))}
        </div>
        <div className="text-[14.5px] font-extrabold mb-1.5">Màu nhấn</div>
        <div className="flex gap-2.5 mt-1.5">
          {['#E6002D','#8B5CF6','#10B981','#F59E0B','#0EA5E9'].map(c => (
            <div key={c} onClick={() => setAccent(c)}
              className={`w-[30px] h-[30px] rounded-full cursor-pointer flex items-center justify-center border-2 ${accent === c ? 'border-[#101010]' : 'border-transparent'}`}
              style={{ background: c }}>
              {accent === c && <Check size={13} className="text-white" strokeWidth={3} />}
            </div>
          ))}
        </div>
      </Card>
      <div>
        <Card title="Cỡ chữ">
          <input type="range" min="0" max="4" defaultValue="1" className="w-full" style={{ accentColor: '#E6002D' }} />
          <div className="flex justify-between text-[11.5px] text-[#6B7280] font-semibold mt-1"><span>Nhỏ</span><span>Lớn</span></div>
        </Card>
        <Card title="Khác">
          <ToggleRow title="Giảm hiệu ứng chuyển động" />
          <ToggleRow title="Rung phản hồi (Haptic)" checked />
        </Card>
      </div>
    </div>
  );
}

// ═══════ Permissions Tab ═══════
function PermissionsTab({ selectedRole, onSelectRole }: { selectedRole: Role; onSelectRole: (r: Role) => void }) {
  const roles: { key: Role; pill: string; desc: string; count: number }[] = [
    { key:'admin', pill:'Admin', desc:'Toàn quyền quản lý', count:1 },
    { key:'member', pill:'Member', desc:'Được mời, có thể đóng góp', count:4 },
    { key:'viewer', pill:'Viewer', desc:'Chỉ xem, không chỉnh sửa', count:2 },
    { key:'guest', pill:'Guest', desc:'Truy cập công khai, hạn chế', count:0 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">
      <Card title="Quản lý vai trò">
        <div className="w-full text-[12.5px]">
          <div className="flex text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[.4px] px-2 pb-2.5 border-b border-[#EDEDF1]">
            <span className="flex-1">Vai trò</span><span className="flex-1">Mô tả</span><span className="w-[60px]">Số người</span><span className="w-[60px]"></span>
          </div>
          {roles.map(r => (
            <div key={r.key} onClick={() => onSelectRole(r.key)}
              className={`flex items-center px-2 py-3 border-b border-[#EDEDF1] last:border-b-0 cursor-pointer ${selectedRole === r.key ? 'bg-[rgba(230,0,45,.04)]' : 'hover:bg-[#FAFAFB]'}`}>
              <div className="flex-1"><span className={`inline-block px-2.5 py-1 rounded-[8px] text-[11px] font-bold ${
                r.key === 'admin' ? 'bg-[rgba(230,0,45,.1)] text-[#E6002D]' :
                r.key === 'member' ? 'bg-[rgba(139,92,246,.1)] text-[#8B5CF6]' :
                r.key === 'viewer' ? 'bg-[rgba(16,185,129,.1)] text-[#10B981]' :
                'bg-[#F1F1F4] text-[#6B7280]'
              }`}>{r.pill}</span></div>
              <div className="flex-1 text-[12.5px]">{r.desc}</div>
              <div className="w-[60px] text-[12.5px]">{r.count}</div>
              <div className="w-[60px]"><button className="bg-transparent border-none text-[#E6002D] font-bold text-[12px] cursor-pointer">Chỉnh sửa</button></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="text-[14.5px] font-extrabold mb-[16px]" id="permTitle">Quyền chi tiết ({ROLES[selectedRole].label})</div>
        {PERM_LABELS.map(([key, label]) => {
          const on = ROLES[selectedRole].perms[key];
          return (
            <div key={key} className={`flex items-center gap-2.5 py-[9px] text-[13px] font-semibold ${on ? '' : 'text-[#6B7280]'}`}>
              <div className={`w-[18px] h-[18px] rounded-[6px] flex items-center justify-center shrink-0 ${on ? 'bg-[#10B981] text-white' : 'bg-[#F1F1F4] text-[#9CA3AF]'}`}>
                {on ? checkSvg : xSvg}
              </div>
              {label}
            </div>
          );
        })}
        <button className="w-full py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer mt-3.5 active:scale-[.98]" style={{background: C.gradPrimary, boxShadow:'0 10px 22px rgba(214,0,50,.25)'}}>+ Thêm vai trò</button>
      </Card>
    </div>
  );
}

// ═══════ Backup Tab ═══════
function BackupTab() {
  return (
    <>
      {/* 3-2-1 Status */}
      <Card>
        <div className="flex items-center gap-3 p-3.5 rounded-[14px] bg-[rgba(16,185,129,.06)] mb-4">
          <div className="w-[38px] h-[38px] rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0">
            <Check size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div className="font-extrabold text-[13.5px]">An toàn theo nguyên tắc 3-2-1 · 100% miễn phí</div>
            <div className="text-[11.5px] text-[#6B7280]">3 bản sao · 2 loại lưu trữ · 1 nơi ngoại vi — lần gần nhất: hôm nay, 06:30</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            { num: '3', title:'Bản sao dữ liệu', desc:'1 bản chính + 2 bản dự phòng, không phụ thuộc vào 1 nơi lưu duy nhất', tags:['Supabase','R2','Drive'], tagColors:['#3ECF8E','#F38020','#4285F4'] },
            { num: '2', title:'Loại lưu trữ khác nhau', desc:'Database, object storage kỹ thuật và cloud cá nhân — nếu 1 loại gặp sự cố, loại kia vẫn còn', tags:['Database','Object Storage','Personal Cloud'], outline: true },
            { num: '1', title:'Bản lưu ngoại vi', desc:'R2 (Cloudflare) và Drive (Google) đều khác hoàn toàn nhà cung cấp với Supabase', tags:['Cloudflare R2','Google Drive'], tagColors:['#F38020','#4285F4'] },
          ].map(step => (
            <div key={step.num} className="bg-[#FAFAFB] border border-[#EDEDF1] rounded-[16px] p-4">
              <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white font-extrabold text-[14px] mb-2.5" style={{background: C.gradPrimary}}>{step.num}</div>
              <div className="text-[13px] font-extrabold mb-1.5">{step.title}</div>
              <div className="text-[11.5px] text-[#6B7280] leading-relaxed mb-3 min-h-[52px]">{step.desc}</div>
              <div className="flex flex-wrap gap-1.5">
                {'tagColors' in step
                  ? (step.tags as string[]).map((tag, j) => (
                      <span key={tag} className="text-[10.5px] font-bold px-[9px] py-1 rounded-[8px] text-white" style={{background: (step as any).tagColors[j]}}>{tag}</span>
                    ))
                  : (step.tags as string[]).map(tag => (
                      <span key={tag} className="text-[10.5px] font-bold px-[9px] py-1 rounded-[8px] border border-[#EDEDF1] text-[#6B7280]">{tag}</span>
                    ))
                }
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* GitHub Actions Engine */}
      <div className="bg-gradient-to-br from-[#F8F8FA] to-[#F1F1F4] border border-[#EDEDF1] rounded-[18px] p-[22px] mb-[18px]" style={{ boxShadow: '0 8px 28px rgba(0,0,0,.05), 0 2px 8px rgba(0,0,0,.03)' }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background:'#24292F'}}>G</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold flex items-center flex-wrap gap-1.5">GitHub Actions <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] bg-[rgba(36,41,47,.08)] text-[#101010]">Engine · Miễn phí 2.000 phút/tháng</span></div>
            <div className="text-[11.5px] text-[#6B7280] mt-0.5 leading-relaxed">Chạy cron hằng ngày &amp; hằng tháng — không dùng Vercel Cron vì gói Free chỉ cho phép 1 lần/ngày và không đúng giờ. GitHub Actions không giới hạn giờ chạy, đồng thời mỗi lần chạy vô tình giữ Supabase khỏi bị tạm dừng do 7 ngày không hoạt động.</div>
          </div>
        </div>
      </div>

      {/* Storage + Automation grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-[18px] items-start">
        <Card title="Điểm lưu trữ">
          {[
            { icon:'S', bg:'#3ECF8E', name:'Supabase', badge:'Bản chính', badgeType:'primary', desc:'Postgres + Storage sống của app — không có backup tự động ở gói Free', status:'Đang chạy', statusGreen:true },
            { icon:'R', bg:'#F38020', name:'Cloudflare R2', badge:'Ngoại vi · Kỹ thuật', badgeType:'offsite', desc:'10GB free, 0đ phí tải xuống — backup hằng ngày (rolling 14 ngày) + bản dump kỹ thuật hằng tháng', toggle:true },
            { icon:'D', bg:'#4285F4', name:'Google Drive', badge:'Ngoại vi · Cá nhân', badgeType:'offsite', desc:'Chỉ nhận bản dump nén hằng tháng — để cậu tự mở, tự tải bằng tay, không cần biết code', toggle:true },
            { icon:'G', bg:'#24292F', name:'GitHub', badge:'Version control', badgeType:'offsite', desc:'Chỉ giữ manifest.json nhẹ (checksum, danh sách file) — mỗi tháng 1 commit, không chứa file nặng', toggle:true },
          ].map(node => (
            <div key={node.name} className="flex items-center gap-3 py-[13px] border-b border-[#EDEDF1] last:border-b-0">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white font-extrabold text-[15px] shrink-0" style={{background: node.bg}}>{node.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold flex items-center flex-wrap gap-1.5">
                  {node.name}
                  {'badge' in node && (
                    <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] ${
                      node.badgeType === 'primary' ? 'bg-[rgba(230,0,45,.1)] text-[#E6002D]' : 'bg-[rgba(16,185,129,.1)] text-[#10B981]'
                    }`}>{node.badge}</span>
                  )}
                </div>
                <div className="text-[11.5px] text-[#6B7280] mt-0.5">{node.desc}</div>
              </div>
              {'status' in node && node.statusGreen
                ? <span className="text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-[7px] bg-[rgba(16,185,129,.1)] text-[#10B981]">Đang chạy</span>
                : 'toggle' in node && node.toggle
                  ? <label className="relative w-[42px] h-[25px] shrink-0 cursor-pointer"><input type="checkbox" className="opacity-0 w-0 h-0" defaultChecked /><span className="absolute inset-0 bg-[#E5E5EA] rounded-[25px] transition-colors duration-200 after:content-[''] after:absolute after:w-[21px] after:h-[21px] after:left-[2px] after:top-[2px] after:bg-white after:rounded-full after:transition-transform after:duration-200 after:shadow-[0_1px_3px_rgba(0,0,0,.25)] [&:has(input:checked)]:bg-[#E6002D] [&:has(input:checked)]:after:translate-x-[17px]" /></label>
                  : null
              }
            </div>
          ))}
          <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-0.5 leading-relaxed">Media (ảnh/video) chỉ mirror 1 bản duy nhất trên R2, đồng bộ kiểu incremental — không nhân bản lại mỗi tháng, tránh vượt 10GB free.</div>
        </Card>

        <Card title="Tự động hoá">
          <ToggleRow title="Sao lưu hằng ngày" desc="03:00 UTC — chỉ dump database, nén gửi lên R2" checked />
          <ToggleRow title="Snapshot hàng tháng" desc="Ngày 1, 03:00 UTC — gửi song song R2 + Drive" checked />
          <button className="w-full py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer mt-3.5 active:scale-[.98]" style={{background: C.gradPrimary, boxShadow:'0 10px 22px rgba(214,0,50,.25)'}}>Sao lưu ngay</button>
        </Card>
      </div>

      {/* Snapshot card */}
      <Card>
        <div className="text-[14.5px] font-extrabold mb-[16px]">Snapshot hàng tháng — khác gì sao lưu thường?</div>
        <div className="text-[12px] text-[#6B7280] mb-4 -mt-2.5 leading-relaxed">Sao lưu hằng ngày <strong>ghi đè</strong> bản trước để tiết kiệm dung lượng, chỉ nằm ở R2. Snapshot hàng tháng <strong>đóng băng vĩnh viễn</strong> một mốc, gửi đồng thời tới R2 (bản kỹ thuật) và Google Drive (bản cậu tự xem) — cho phép quay lại đúng trạng thái app ở một tháng bất kỳ, giống hệt cách "Bánh xe ký ức" cho phép nhìn lại quá khứ.</div>

        <div className="grid grid-cols-2 gap-3 mb-[18px]">
          <div><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Chính sách lưu giữ (retention)</label>
            <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white">
              <option>Giữ 12 tháng gần nhất, tự xoá bản cũ hơn</option>
              <option>Giữ 24 tháng gần nhất</option>
              <option>Giữ vĩnh viễn mốc Tháng 1 mỗi năm, còn lại xoay vòng 12 tháng</option>
            </select>
          </div>
          <div><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Ngày chụp snapshot</label>
            <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white">
              <option>Ngày 1 hằng tháng, 03:00</option>
              <option>Ngày cuối tháng, 03:00</option>
            </select>
          </div>
        </div>

        <div className="relative pl-1.5">
          {[
            { date:'Tháng 7 / 2026', badge:'Mới nhất', meta:'42 MB (dump) · Lưu tại R2 + Drive · manifest trên GitHub', dot:'current', btn:'Xem lại' },
            { date:'Tháng 6 / 2026', meta:'39 MB · R2 + Drive', btn:'Khôi phục' },
            { date:'Tháng 5 / 2026', meta:'37 MB · R2 + Drive', btn:'Khôi phục' },
            { date:'Tháng 1 / 2026', badge:'Giữ vĩnh viễn', meta:'31 MB · Mốc đầu năm · R2 + Drive', dot:'pinned', btn:'Khôi phục', pinBadge:true },
          ].map((snap, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-[#EDEDF1] last:border-b-0">
              <div className={`w-[11px] h-[11px] rounded-full shrink-0 ${
                snap.dot === 'current' ? 'bg-[#E6002D] shadow-[0_0_0_4px_rgba(230,0,45,.15)]' :
                snap.dot === 'pinned' ? 'bg-[#8B5CF6] shadow-[0_0_0_4px_rgba(139,92,246,.15)]' :
                'bg-[#D9D9DE]'
              }`} />
              <div className="flex-1">
                <div className="text-[13px] font-bold flex items-center gap-2">
                  {snap.date}
                  {snap.badge && <span className={`text-[10.5px] font-extrabold px-[9px] py-[3px] rounded-[7px] ${
                    snap.pinBadge ? 'bg-[rgba(139,92,246,.1)] text-[#8B5CF6]' : 'bg-[rgba(16,185,129,.1)] text-[#10B981]'
                  }`}>{snap.badge}</span>}
                </div>
                <div className="text-[11.5px] text-[#6B7280] mt-0.5">{snap.meta}</div>
              </div>
              <button className="bg-transparent border-none text-[#E6002D] font-bold text-[12px] cursor-pointer">{snap.btn}</button>
            </div>
          ))}
        </div>
        <button className="w-full bg-transparent border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer mt-3.5 hover:bg-[#F5F5F7]">Xem toàn bộ lịch sử snapshot</button>
      </Card>
    </>
  );
}

// ═══════ MODAL: Device Management ═══════
function DeviceModal({ devices, onClose, onLogout, onLogoutOthers }: {
  devices: Device[]; onClose: () => void; onLogout: (name: string) => void; onLogoutOthers: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[460px] max-h-[82vh] overflow-y-auto bg-white rounded-[24px] p-[22px] shadow-[0_30px_80px_rgba(0,0,0,.25)] animate-[modalIn_.25s_cubic-bezier(.34,1.4,.64,1)_both]">
        <style>{`@keyframes modalIn{from{transform:scale(.96)translateY(10px)}to{transform:scale(1)translateY(0)}}`}</style>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[17px] font-extrabold">Quản lý thiết bị</div>
            <div className="text-[12px] text-[#9CA3AF] mt-0.5">4 thiết bị đang đăng nhập</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6B7280] hover:bg-[#F1F1F4]"><X size={15} strokeWidth={1.8} /></button>
        </div>
        <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mb-4 leading-relaxed">Danh sách chi tiết từng thiết bị là phần tự xây thêm (Supabase chưa hỗ trợ sẵn) — ghi lại qua Auth Hook mỗi lần đăng nhập, lưu trong 1 bảng riêng.</div>
        {devices.map(d => (
          <div key={d.name} className={`flex items-center gap-3 py-[13px] border-b border-[#EDEDF1] last:border-b-0 transition-opacity duration-300 ${d.loggedOut ? 'opacity-40' : ''} ${d.isCurrent ? 'current' : ''}`}>
            <div className={`w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[17px] shrink-0 ${d.isCurrent ? 'bg-[rgba(230,0,45,.08)]' : 'bg-[#F1F1F4]'}`}>{d.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold flex items-center gap-1.5">
                {d.name}
                {d.isCurrent && <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-[6px] bg-[rgba(230,0,45,.1)] text-[#E6002D]">Thiết bị này</span>}
              </div>
              <div className="text-[11.5px] text-[#6B7280] mt-0.5">{d.desc}</div>
            </div>
            {d.isCurrent ? null : d.loggedOut
              ? <button disabled className="border border-[#EDEDF1] px-3 py-[7px] rounded-[10px] text-[11.5px] font-bold text-[#6B7280] cursor-default">Đã đăng xuất</button>
              : <button onClick={() => onLogout(d.name)} className="bg-transparent border border-[#EDEDF1] px-3 py-[7px] rounded-[10px] text-[11.5px] font-bold text-[#E6002D] cursor-pointer hover:bg-[rgba(230,0,45,.06)]">Đăng xuất</button>
            }
          </div>
        ))}
        <button onClick={onLogoutOthers} className="w-full bg-white border border-[rgba(230,0,45,.25)] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center mt-4 hover:bg-[#F5F5F7]" style={{color: C.primary}}>Đăng xuất tất cả thiết bị khác</button>
        <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mt-2.5 leading-relaxed">Nút này dùng scope <code className="bg-[#F1F1F4] px-1.5 py-0.5 rounded-[5px] text-[11px]">others</code> có sẵn của Supabase Auth — miễn phí, không cần code thêm.</div>
      </div>
    </div>
  );
}

// ═══════ MODAL: Export Report ═══════
function ExportModal({ onClose, exportStep, setExportStep, exportFormat, setExportFormat, exportScope, setExportScope }: {
  onClose: () => void; exportStep: 'form' | 'preview'; setExportStep: (s: 'form' | 'preview') => void;
  exportFormat: string; setExportFormat: (f: string) => void; exportScope: string; setExportScope: (s: string) => void;
}) {
  const [localScope, setLocalScope] = useState(exportScope);
  const [localFormat, setLocalFormat] = useState(exportFormat);

  return (
    <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[560px] max-h-[82vh] overflow-y-auto bg-white rounded-[24px] p-[22px] shadow-[0_30px_80px_rgba(0,0,0,.25)] animate-[modalIn_.25s_cubic-bezier(.34,1.4,.64,1)_both]">
        <style>{`@keyframes modalIn{from{transform:scale(.96)translateY(10px)}to{transform:scale(1)translateY(0)}}`}</style>
        
        {exportStep === 'form' ? (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[17px] font-extrabold">Xuất báo cáo</div>
                <div className="text-[12px] text-[#9CA3AF] mt-0.5">Chọn phạm vi, khoảng thời gian và định dạng</div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6B7280] hover:bg-[#F1F1F4]"><X size={15} strokeWidth={1.8} /></button>
            </div>
            <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Phạm vi báo cáo</label>
              <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white"
                value={localScope} onChange={e => setLocalScope(e.target.value)}>
                <option>Tổng quan — tất cả dữ liệu</option>
                <option>Chỉ Người thân & bạn bè</option>
                <option>Chỉ Sự kiện</option>
                <option>Chỉ Ký ức</option>
              </select>
            </div>
            <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Khoảng thời gian</label>
              <select className="w-full px-[13px] py-[11px] rounded-[11px] border border-[#EDEDF1] bg-[#FAFAFB] text-[13px] outline-none focus:border-[#E6002D] focus:bg-white">
                <option>Toàn bộ thời gian</option>
                <option>Năm nay (2026)</option>
                <option>Tháng này</option>
                <option>Tuỳ chỉnh...</option>
              </select>
            </div>
            <div className="mb-[14px]"><label className="block text-[12px] font-bold text-[#6B7280] mb-1.5">Định dạng</label>
              <div className="flex gap-2">
                {['Word','Excel','PDF'].map(f => (
                  <button key={f} onClick={() => setLocalFormat(f)}
                    className={`flex-1 py-3 rounded-[14px] border-1.5 text-[13px] font-bold cursor-pointer text-center transition-all duration-150 ${
                      localFormat === f ? 'border-[#E6002D] bg-[rgba(230,0,45,.05)] text-[#E6002D]' : 'border-[#EDEDF1] bg-white text-[#6B7280]'
                    }`}
                    style={{ borderWidth: 1.5 }}>
                    {f === 'Word' ? '📝' : f === 'Excel' ? '📊' : '📕'} {f}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setExportStep('preview')} className="w-full py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer mt-2 active:scale-[.98]" style={{background: C.gradPrimary, boxShadow:'0 10px 22px rgba(214,0,50,.25)'}}>Xem trước bản in →</button>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <button onClick={() => setExportStep('form')} className="bg-transparent border border-[#EDEDF1] px-3 py-1.5 rounded-[9px] text-[11.5px] font-bold cursor-pointer hover:bg-[#F5F5F7]">← Quay lại chỉnh</button>
              <button onClick={onClose} className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[#6B7280] hover:bg-[#F1F1F4]"><X size={15} strokeWidth={1.8} /></button>
            </div>
            <div id="printArea" className="bg-white border border-[#EDEDF1] rounded-[14px] p-7 mb-4 max-h-[46vh] overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,.06)]" style={{ fontFamily: "Georgia,'Times New Roman',serif", color: '#1a1a1a' }}>
              <div className="flex justify-between items-center mb-5" style={{ fontFamily: '-apple-system,sans-serif' }}>
                <div className="flex items-center gap-[7px] font-extrabold text-[12px] tracking-[.5px]">
                  <div className="w-[24px] h-[24px] rounded-[9px] flex items-center justify-center text-white font-extrabold text-[11px] shadow-[0_6px_14px_rgba(230,0,45,.3)]" style={{background: C.gradPrimary}}>P</div>
                  <span>PROT LIFE</span>
                </div>
                <div className="text-[11px] text-[#888]" style={{ fontFamily: '-apple-system,sans-serif' }}>18/07/2026</div>
              </div>
              <h1 className="text-[22px] font-bold mb-1">Báo cáo {localScope.includes('Tổng quan') ? 'Tổng quan' : localScope.replace('Chỉ ', '')}</h1>
              <div className="text-[12px] text-[#666] mb-5" style={{ fontFamily: '-apple-system,sans-serif' }}>Từ 01/01/2026 đến 18/07/2026</div>
              <div className="grid grid-cols-4 gap-2.5 mb-[22px]">
                {[['128','Người thân & bạn bè'],['64','Sự kiện'],['842','Ký ức'],['37','Địa điểm']].map(([n,l]) => (
                  <div key={l} className="text-center border border-[#eee] rounded-[8px] p-2.5">
                    <div className="text-[19px] font-extrabold">{n}</div>
                    <div className="text-[9.5px] text-[#777] mt-0.5" style={{ fontFamily: '-apple-system,sans-serif' }}>{l}</div>
                  </div>
                ))}
              </div>
              <table className="w-full border-collapse text-[12px] mb-[22px]">
                <thead><tr><th className="text-left border-b-2 border-[#1a1a1a] p-[6px_8px]" style={{ fontFamily: '-apple-system,sans-serif', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.3px' }}>Tên</th>
                  <th className="text-left border-b-2 border-[#1a1a1a] p-[6px_8px]" style={{ fontFamily: '-apple-system,sans-serif', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.3px' }}>Nhóm</th>
                  <th className="text-left border-b-2 border-[#1a1a1a] p-[6px_8px]" style={{ fontFamily: '-apple-system,sans-serif', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '.3px' }}>Lần gặp gần nhất</th></tr></thead>
                <tbody>
                  {[['Minh Anh','Bạn bè · Đại học','2 tuần trước'],['Linh','Gia đình ruột','Hôm qua'],['Hải','Đồng nghiệp cũ','3 tháng trước'],['Thu Trang','Bạn bè · Cấp 3','1 tháng trước']].map(([n,g,t]) => (
                    <tr key={n}><td className="p-[7px_8px] border-b border-[#eee]">{n}</td><td className="p-[7px_8px] border-b border-[#eee]">{g}</td><td className="p-[7px_8px] border-b border-[#eee]">{t}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] text-[#999] text-center border-t border-[#eee] pt-2.5" style={{ fontFamily: '-apple-system,sans-serif' }}>Xuất bởi Prot Life · Trang 1/1 · 18/07/2026</div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => window.print()} className="flex-1 bg-white border border-[#EDEDF1] py-3 px-4 rounded-[12px] text-[13px] font-bold cursor-pointer text-center hover:bg-[#F5F5F7]">🖨️ In ngay</button>
              <button onClick={() => showToast('⬇️ Đang tạo file ' + localFormat + '...')} className="flex-1 py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer active:scale-[.98]" style={{background: C.gradPrimary, boxShadow:'0 10px 22px rgba(214,0,50,.25)'}}>⬇️ Tải xuống ({localFormat})</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════ MODAL: OAuth Google Mock ═══════
function OAuthModal({ onClose, oauthStep, setOauthStep, onSuccess }: {
  onClose: () => void; oauthStep: OAuthStep; setOauthStep: (s: OAuthStep) => void; onSuccess: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-80 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[380px] bg-white rounded-[24px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,.25)] animate-[modalIn_.25s_cubic-bezier(.34,1.4,.64,1)_both]">
        <style>{`@keyframes modalIn{from{transform:scale(.96)translateY(10px)}to{transform:scale(1)translateY(0)}}`}</style>
        
        {oauthStep === 1 && (
          <div className="p-7 text-center">
            <div className="w-11 h-11 rounded-full bg-[#4285F4] text-white font-extrabold text-[20px] flex items-center justify-center mx-auto mb-[18px]">G</div>
            <div className="text-[16px] font-bold mt-3">Chọn tài khoản</div>
            <div className="text-[12px] text-[#6B7280] mt-0.5">để tiếp tục tới <strong>Prot Life</strong></div>
            <div onClick={() => setOauthStep(2)} className="flex items-center gap-3 p-[11px_10px] border border-[#EDEDF1] rounded-[12px] mt-4 mb-2 cursor-pointer hover:bg-[#FAFAFB]">
              <div className="w-[34px] h-[34px] rounded-full bg-[#4285F4] text-white font-bold text-[13px] flex items-center justify-center shrink-0">P</div>
              <div className="text-left"><div className="font-bold text-[13px]">Prot Nguyễn</div><div className="text-[11.5px] text-[#6B7280]">tk.prot@gmail.com</div></div>
            </div>
            <div className="flex items-center gap-3 p-[11px_10px] border border-[#EDEDF1] rounded-[12px] cursor-pointer hover:bg-[#FAFAFB]">
              <div className="w-[34px] h-[34px] rounded-full bg-[#9CA3AF] text-white font-bold text-[13px] flex items-center justify-center shrink-0">＋</div>
              <div className="text-[13px] font-semibold text-[#6B7280]">Dùng tài khoản khác</div>
            </div>
          </div>
        )}

        {oauthStep === 2 && (
          <div className="p-7">
            <div className="text-center mb-4">
              <div className="w-11 h-11 rounded-full bg-[#101010] text-white font-extrabold text-[20px] flex items-center justify-center mx-auto">P</div>
              <div className="text-[15px] font-bold mt-3">Prot Life muốn truy cập tài khoản Google của bạn</div>
              <div className="text-[11.5px] text-[#6B7280] mt-1">tk.prot@gmail.com</div>
            </div>
            <div className="bg-[#FAFAFB] rounded-[14px] p-3.5 mb-3">
              <div className="text-[12.5px] py-1">📄 Xem, tạo và chỉnh sửa <strong>các file Google Sheets cụ thể</strong> mà bạn chọn</div>
              <div className="text-[12.5px] py-1 text-[#6B7280]">🚫 <strong>Không</strong> truy cập toàn bộ Drive, Gmail hay dữ liệu khác</div>
            </div>
            <div className="text-[12px] text-[#6B7280] bg-[#FAFAFB] rounded-[12px] p-3 mb-4 leading-relaxed">Đây là scope hẹp <code className="bg-[#F1F1F4] px-1.5 py-0.5 rounded-[5px] text-[11px]">drive.file</code> — app chỉ thấy đúng file cậu chọn, không đọc được các file Drive khác.</div>
            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 py-3 rounded-[12px] border-none text-[13px] font-bold bg-[#F1F1F4] text-[#6B7280] cursor-pointer">Từ chối</button>
              <button onClick={() => { setOauthStep(3); setTimeout(onSuccess, 1400); }} className="flex-1 py-3 rounded-[12px] border-none text-[13px] font-bold text-white cursor-pointer" style={{background: C.gradPrimary, boxShadow:'0 10px 22px rgba(214,0,50,.25)'}}>Cho phép</button>
            </div>
          </div>
        )}

        {oauthStep === 3 && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto mb-4" style={{fontSize:24}}>✓</div>
            <div className="text-[15px] font-bold mb-1.5">Đã tạo & liên kết Sheet mới</div>
            <div className="text-[12px] text-[#6B7280]">ProtLife_Data_Export.xlsx — sẵn sàng đồng bộ</div>
          </div>
        )}
      </div>
    </div>
  );
}
