'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import { Heart, Camera, ChevronLeft, ArrowLeft } from 'lucide-react';
import {
  getAvatarColor, getInitials, getRelationshipLabel, getRelationshipColor
} from '@/lib/utils';

const RELATIONSHIPS = ['Family','Relative','Friend','Colleague','Neighbor','Teacher','Partner','Other'] as const;
const GENDERS = ['Male','Female','Other'] as const;
const STATUSES = ['Active','Lost Contact','Deceased','Blocked'] as const;

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
          <ArrowLeft size={18}/>
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm quan hệ mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Nhập thông tin quan hệ mới</p>
        </div>
      </div>

      {error && <p className="mb-3 text-[11px] text-[#E6002D] bg-[rgba(230,0,45,0.04)] p-2 rounded-[8px]">{error}</p>}

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Avatar section */}
        <div className="text-center">
          <div className="relative inline-block cursor-pointer mb-3" onClick={()=>fileInputRef.current?.click()}>
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white font-bold text-[28px] mx-auto overflow-hidden"
              style={{backgroundColor: form.Avatar ? 'transparent' : getAvatarColor(form.Name||'?')}}>
              {form.Avatar?<img src={form.Avatar} alt="" className="w-full h-full object-cover"/>
                : getInitials(form.Name||'?')}
            </div>
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white"/>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar}/>
          </div>
        </div>

        {/* Full Name */}
        <FormSection title="Thông tin cơ bản">
          <FormField label="Họ và tên *">
            <input value={form.Name} onChange={(e)=>setForm((f)=>({...f,Name:e.target.value}))}
              className="input-glass text-[14px]" placeholder="Nhập họ và tên"/>
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

        {/* Contact info */}
        <FormSection title="Liên hệ">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Số điện thoại">
              <input value={form.Phone} onChange={(e)=>setForm((f)=>({...f,Phone:e.target.value}))}
                className="input-glass text-[13px]" placeholder="090..."/>
            </FormField>
            <FormField label="Email">
              <input value={form.Email} onChange={(e)=>setForm((f)=>({...f,Email:e.target.value}))}
                className="input-glass text-[13px]" placeholder="email@domain.com"/>
            </FormField>
          </div>
        </FormSection>

        {/* Organization */}
        <FormSection title="Tổ chức">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Tổ chức 1">
              <input value={form.Organization1} onChange={(e)=>setForm((f)=>({...f,Organization1:e.target.value}))}
                className="input-glass text-[13px]" placeholder="Công ty / CLB"/>
            </FormField>
            <FormField label="Tổ chức 2">
              <input value={form.Organization2} onChange={(e)=>setForm((f)=>({...f,Organization2:e.target.value}))}
                className="input-glass text-[13px]" placeholder="Công ty / CLB"/>
            </FormField>
          </div>
        </FormSection>

        {/* Relationship */}
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
          <div className="mt-2">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase mb-1">Mức độ thân thiết: {form.RelationshipScore}</p>
            <input type="range" min={0} max={100} value={form.RelationshipScore}
              onChange={(e)=>setForm((f)=>({...f,RelationshipScore:Number(e.target.value)}))}
              className="w-full h-1.5 accent-[#E6002D]"/>
            <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-0.5">
              <span>Xa lạ</span><span>Thân thiết</span>
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

        {/* Notes */}
        <FormSection title="Ghi chú">
          <textarea value={form.Notes} onChange={(e)=>setForm((f)=>({...f,Notes:e.target.value}))}
            className="input-glass text-[13px] min-h-[70px]" rows={3} placeholder="Ghi chú thêm..."/>
        </FormSection>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-[rgba(0,0,0,0.04)] mt-4">
        <button onClick={()=>router.back()}
          className="flex-1 h-[42px] rounded-[10px] text-[13px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] transition-colors">
          Huỷ
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold text-white bg-[#E6002D] hover:bg-[#CC0028] transition-colors">
          {saving ? 'Đang lưu...' : 'Lưu lại'}
        </button>
      </div>
    </div>
  );
}

function FormSection({title, children}:{title:string;children:React.ReactNode}) {
  return <div className="p-3.5 rounded-[12px] bg-[rgba(0,0,0,0.02)] space-y-2.5">
    <p className="text-[9px] font-semibold text-[#8E8E93] uppercase tracking-[0.4px]">{title}</p>
    {children}
  </div>;
}
function FormField({label, children}:{label:string;children:React.ReactNode}) {
  return <div><p className="text-[10px] font-medium text-[#6B7280] mb-1">{label}</p>{children}</div>;
}
