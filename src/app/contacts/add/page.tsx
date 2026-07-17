'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import { Heart, Camera, ArrowLeft, X, ChevronDown, Plus } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/lib/utils';

const RELATIONSHIPS = ['Family','Relative','Friend','Colleague','Neighbor','Teacher','Partner','Other'] as const;
const GENDERS = ['Male','Female','Other'] as const;
const STATUSES = ['Active','Lost Contact','Deceased','Blocked'] as const;

const ORG1_PRESETS = ['9A','Bạn cao học','Bạn du lịch','Bạn đại học','Bạn kết nối','Bạn tìm hiểu','Bang hội','Gia đình','Họ hàng','Nghĩa Tân','PCRT','Quảng Trị','SBV','TN1','VCB'];
const ORG2_PRESETS = ['3 Musketeers','Bộ 3 Nguyên tử','Sư đoàn Mõm'];

const SCORE_LABELS = [
  { min: 1,  max: 29, label: 'Quen biết' },
  { min: 30, max: 49, label: 'Bạn bè' },
  { min: 50, max: 69, label: 'Thân' },
  { min: 70, max: 89, label: 'Thâm tình' },
  { min: 90, max: 100, label: 'Ruột thịt' },
];

function getScoreLabel(score: number): string {
  for (const s of SCORE_LABELS) { if (score >= s.min && score <= s.max) return s.label; }
  return 'Chưa xác định';
}

export default function AddContactPage() {
  const router = useRouter();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    Name:'', Relationship:'Family', Gender:'', Birthday:'', Phone:'', Email:'',
    Organization1:'', Organization2:'', RelationshipScore:50, Status:'Active', IsFavorite:false, Avatar:'', Notes:'',
  });

  const [org1Open, setOrg1Open] = useState(false);
  const [org2Open, setOrg2Open] = useState(false);
  const [org1Search, setOrg1Search] = useState('');
  const [org2Search, setOrg2Search] = useState('');
  const [org1List, setOrg1List] = useState<string[]>([...ORG1_PRESETS]);
  const [org2List, setOrg2List] = useState<string[]>([...ORG2_PRESETS]);

  const filteredOrg1 = org1List.filter(o => o.toLowerCase().includes(org1Search.toLowerCase()));
  const filteredOrg2 = org2List.filter(o => o.toLowerCase().includes(org2Search.toLowerCase()));

  const handleSave = async () => {
    if (!form.Name.trim()) { setError('Vui lòng nhập tên'); return; }
    setSaving(true); setError('');
    try {
      await contactService.create({
        Name:form.Name.trim(), Relationship:form.Relationship as any,
        Gender:form.Gender as any||undefined, Birthday:form.Birthday||undefined,
        Phone:form.Phone||undefined, Email:form.Email||undefined,
        Organization1:form.Organization1||undefined, Organization2:form.Organization2||undefined,
        RelationshipScore:form.RelationshipScore, Status:form.Status as any,
        IsFavorite:form.IsFavorite, Avatar:form.Avatar||undefined, Notes:form.Notes||undefined,
      });
      triggerRefresh();
      router.push('/contacts');
    } catch(e:any) { setError(e.message||'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleAvatar = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setForm((f)=>({...f, Avatar: ev.target?.result as string}));
    r.readAsDataURL(file);
  };

  const selectOrg1 = (name: string) => {
    setForm((f) => ({...f, Organization1: name}));
    setOrg1Open(false); setOrg1Search('');
  };

  const addOrg1 = () => {
    const t = org1Search.trim();
    if (t && !org1List.includes(t)) setOrg1List([...org1List, t]);
    setForm((f) => ({...f, Organization1: t}));
    setOrg1Open(false); setOrg1Search('');
  };

  const deleteOrg1 = (name: string) => {
    setOrg1List(org1List.filter(o => o !== name));
    if (form.Organization1 === name) setForm((f) => ({...f, Organization1: ''}));
  };

  const selectOrg2 = (name: string) => {
    setForm((f) => ({...f, Organization2: name}));
    setOrg2Open(false); setOrg2Search('');
  };

  const addOrg2 = () => {
    const t = org2Search.trim();
    if (t && !org2List.includes(t)) setOrg2List([...org2List, t]);
    setForm((f) => ({...f, Organization2: t}));
    setOrg2Open(false); setOrg2Search('');
  };

  const deleteOrg2 = (name: string) => {
    setOrg2List(org2List.filter(o => o !== name));
    if (form.Organization2 === name) setForm((f) => ({...f, Organization2: ''}));
  };

  const scoreLabel = getScoreLabel(form.RelationshipScore);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm quan hệ mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Nhập thông tin quan hệ mới</p>
        </div>
      </div>

      {error && <p className="mb-3 text-[11px] text-[#E6002D] bg-[rgba(230,0,45,0.04)] p-2 rounded-[8px]">{error}</p>}

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="text-center">
          <div className="relative inline-block cursor-pointer mb-3" onClick={()=>fileInputRef.current?.click()}>
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white font-bold text-[28px] mx-auto overflow-hidden"
              style={{backgroundColor: form.Avatar?'transparent':getAvatarColor(form.Name||'?')}}>
              {form.Avatar?<img src={form.Avatar} alt="" className="w-full h-full object-cover"/>:getInitials(form.Name||'?')}
            </div>
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white"/>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar}/>
          </div>
        </div>

        <FormSection title="Thông tin cơ bản">
          <FormField label="Họ và tên *">
            <input value={form.Name} onChange={(e)=>setForm((f)=>({...f,Name:e.target.value}))} className="input-glass text-[14px]" placeholder="Nhập họ và tên"/>
          </FormField>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Giới tính">
              <select value={form.Gender} onChange={(e)=>setForm((f)=>({...f,Gender:e.target.value}))} className="input-glass text-[13px]">
                <option value="">Chọn</option>
                {GENDERS.map((g)=><option key={g} value={g}>{g==='Male'?'Nam':g==='Female'?'Nữ':'Khác'}</option>)}
              </select>
            </FormField>
            <FormField label="Ngày sinh">
              <input type="date" value={form.Birthday} onChange={(e)=>setForm((f)=>({...f,Birthday:e.target.value}))} className="input-glass text-[13px]"/>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Liên hệ">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Số điện thoại">
              <input value={form.Phone} onChange={(e)=>setForm((f)=>({...f,Phone:e.target.value}))} className="input-glass text-[13px]" placeholder="090..."/>
            </FormField>
            <FormField label="Email">
              <input value={form.Email} onChange={(e)=>setForm((f)=>({...f,Email:e.target.value}))} className="input-glass text-[13px]" placeholder="email@domain.com"/>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Tổ chức 1">
          <OrgCombobox
            value={form.Organization1}
            list={org1List}
            search={org1Search}
            open={org1Open}
            onOpen={()=>{setOrg1Open(true);setOrg2Open(false);}}
            onClose={()=>setOrg1Open(false)}
            onSearch={setOrg1Search}
            onSelect={selectOrg1}
            onAdd={addOrg1}
            onDelete={deleteOrg1}
            filtered={filteredOrg1}
            placeholder="Chọn tổ chức..."
          />
        </FormSection>

        <FormSection title="Tổ chức 2">
          <OrgCombobox
            value={form.Organization2}
            list={org2List}
            search={org2Search}
            open={org2Open}
            onOpen={()=>{setOrg2Open(true);setOrg1Open(false);}}
            onClose={()=>setOrg2Open(false)}
            onSearch={setOrg2Search}
            onSelect={selectOrg2}
            onAdd={addOrg2}
            onDelete={deleteOrg2}
            filtered={filteredOrg2}
            placeholder="Chọn tổ chức..."
          />
        </FormSection>

        <FormSection title="Mối quan hệ">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Loại quan hệ">
              <select value={form.Relationship} onChange={(e)=>setForm((f)=>({...f,Relationship:e.target.value}))} className="input-glass text-[13px]">
                {RELATIONSHIPS.map((r)=><option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Trạng thái">
              <select value={form.Status} onChange={(e)=>setForm((f)=>({...f,Status:e.target.value}))} className="input-glass text-[13px]">
                {STATUSES.map((s)=><option key={s} value={s}>{s==='Active'?'Đang liên lạc':s==='Lost Contact'?'Mất liên lạc':s==='Deceased'?'Đã mất':'Chặn'}</option>)}
              </select>
            </FormField>
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1.5">Mức độ thân thiết: {form.RelationshipScore}</p>
            <input type="range" min={0} max={100} value={form.RelationshipScore}
              onChange={(e)=>setForm((f)=>({...f,RelationshipScore:Number(e.target.value)}))}
              className="w-full h-1.5 accent-[#E6002D]" />
            <div className="flex mt-2 gap-1">
              {SCORE_LABELS.map((s) => {
                const active = form.RelationshipScore >= s.min && form.RelationshipScore <= s.max;
                return (
                  <div key={s.label}
                    className={`flex-1 text-center text-[9px] font-semibold py-1.5 rounded-[4px] transition-colors ${
                      active ? 'bg-[#E6002D] text-white shadow-sm' : 'text-[#9CA3AF] bg-[rgba(0,0,0,0.02)]'
                    }`}>
                    {s.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2">
            <button type="button" onClick={()=>setForm((f)=>({...f,IsFavorite:!f.IsFavorite}))}
              className={`w-full h-[42px] rounded-[10px] flex items-center justify-center gap-2 text-[12px] font-semibold transition-all border ${
                form.IsFavorite?'bg-[rgba(230,0,45,0.06)] text-[#E6002D] border-[rgba(230,0,45,0.15)]':'bg-white text-[#6B7280] border-[rgba(0,0,0,0.06)]'
              }`}>
              <Heart size={15} className={form.IsFavorite?'fill-[#E6002D]':''}/>
              {form.IsFavorite?'Yêu thích':'Thêm vào yêu thích'}
            </button>
          </div>
        </FormSection>

        <FormSection title="Ghi chú">
          <textarea value={form.Notes} onChange={(e)=>setForm((f)=>({...f,Notes:e.target.value}))}
            className="input-glass text-[13px] min-h-[70px]" rows={3} placeholder="Ghi chú thêm..."/>
        </FormSection>
      </div>

      <div className="flex gap-2 pt-4 border-t border-[rgba(0,0,0,0.04)] mt-4">
        <button onClick={()=>router.back()} className="flex-1 h-[42px] rounded-[10px] text-[13px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)]">Huỷ</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold text-white bg-[#E6002D]">{saving?'Đang lưu...':'Lưu lại'}</button>
      </div>
    </div>
  );
}

function OrgCombobox({ value, list, search, open, onOpen, onClose, onSearch, onSelect, onAdd, onDelete, filtered, placeholder }:
{ value:string; list:string[]; search:string; open:boolean; onOpen:()=>void; onClose:()=>void;
  onSearch:(s:string)=>void; onSelect:(s:string)=>void; onAdd:()=>void; onDelete:(s:string)=>void;
  filtered:string[]; placeholder:string; }) {
  return (
    <div className="relative" onBlur={()=>setTimeout(()=>onClose(),150)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input value={value} onChange={(e)=>onSelect(e.target.value)} onFocus={onOpen}
            className="input-glass text-[13px] w-full pr-8" placeholder={placeholder} />
          <button type="button" onClick={()=>{if(open)onClose();else onOpen();}}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E8E93]"><ChevronDown size={14}/></button>
        </div>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-[10px] shadow-lg border border-[rgba(0,0,0,0.06)] z-50 max-h-[240px] flex flex-col overflow-hidden">
          <div className="p-2 border-b border-[rgba(0,0,0,0.04)]">
            <input value={search} onChange={(e)=>onSearch(e.target.value)}
              className="w-full text-[12px] px-2.5 py-1.5 rounded-[6px] bg-[rgba(0,0,0,0.04)] placeholder:text-[#B0B0B8] outline-none"
              placeholder="Tìm kiếm..."/>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((item) => (
              <div key={item} className="flex items-center justify-between px-3 py-2 hover:bg-[rgba(0,0,0,0.03)]">
                <button type="button" onClick={() => { onSelect(item); onClose(); }}
                  className="flex-1 text-left text-[12px] text-[#111]">{item}</button>
                <button type="button" onClick={() => onDelete(item)}
                  className="p-1 rounded hover:bg-[rgba(230,0,45,0.06)] text-[#E6002D]/50 hover:text-[#E6002D]"><X size={12}/></button>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-[rgba(0,0,0,0.04)]">
            <button type="button" onClick={()=>{onAdd();}} disabled={!search.trim()||list.includes(search.trim())}
              className="w-full text-[11px] font-medium text-[#E6002D] py-1 rounded-[6px] hover:bg-[rgba(230,0,45,0.04)] disabled:opacity-30">
              + Thêm &quot;{search.trim()}&quot;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({title,children}:{title:string;children:React.ReactNode}) {
  return <div className="p-3.5 rounded-[12px] bg-[rgba(0,0,0,0.02)] space-y-2.5">
    <p className="text-[9px] font-semibold text-[#8E8E93] uppercase tracking-[0.4px]">{title}</p>
    {children}
  </div>;
}
function FormField({label,children}:{label:string;children:React.ReactNode}) {
  return <div><p className="text-[10px] font-medium text-[#6B7280] mb-1">{label}</p>{children}</div>;
}
