'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventService } from '@/lib/services/event-service';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft } from 'lucide-react';

const EVENT_TYPES = ['Meeting','Birthday','Travel','Work','Sport','Hospital','Meal','Call','Shopping','Study','Party','Date','Entertainment','Other'] as const;
const MOODS = ['Happy','Normal','Sad','Excited','Tired','Angry','Thoughtful','Loved'] as const;
const IMPORTANCE = ['Lowest','Low','Medium','High','Highest'] as const;

export default function AddEventPage() {
  const router = useRouter();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    Title:'', EventType:'Meeting', StartDate:new Date().toISOString().split('T')[0], EndDate:'',
    Place:'', Mood:'', Importance:'Medium', Cost:0, Notes:'',
  });

  const handleSave = async () => {
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      await eventService.create({
        Title:form.Title.trim(), EventType:form.EventType as any,
        StartDate:form.StartDate, EndDate:form.EndDate||undefined,
        Place:form.Place||undefined, Mood:form.Mood as any||undefined,
        Importance:form.Importance as any, Cost:form.Cost, Notes:form.Notes||undefined,
      });
      triggerRefresh();
      router.push('/events');
    } catch(e:any) { setError(e.message||'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm sự kiện mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Nhập thông tin sự kiện mới</p>
        </div>
      </div>

      {error && <p className="mb-3 text-[11px] text-[#E6002D] bg-[rgba(230,0,45,0.04)] p-2 rounded-[8px]">{error}</p>}

      <div className="flex-1 overflow-y-auto space-y-4">
        <FormSection title="Thông tin cơ bản">
          <FormField label="Tiêu đề *">
            <input value={form.Title} onChange={(e)=>setForm((f)=>({...f,Title:e.target.value}))}
              className="input-glass text-[14px]" placeholder="Nhập tiêu đề sự kiện"/>
          </FormField>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Loại sự kiện">
              <select value={form.EventType} onChange={(e)=>setForm((f)=>({...f,EventType:e.target.value}))} className="input-glass text-[13px]">
                {EVENT_TYPES.map((t)=><option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Mức độ">
              <select value={form.Importance} onChange={(e)=>setForm((f)=>({...f,Importance:e.target.value}))} className="input-glass text-[13px]">
                {IMPORTANCE.map((i)=><option key={i} value={i}>{i}</option>)}
              </select>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Thời gian & Địa điểm">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Ngày bắt đầu">
              <input type="date" value={form.StartDate} onChange={(e)=>setForm((f)=>({...f,StartDate:e.target.value}))} className="input-glass text-[13px]"/>
            </FormField>
            <FormField label="Ngày kết thúc">
              <input type="date" value={form.EndDate} onChange={(e)=>setForm((f)=>({...f,EndDate:e.target.value}))} className="input-glass text-[13px]"/>
            </FormField>
          </div>
          <FormField label="Địa điểm">
            <input value={form.Place} onChange={(e)=>setForm((f)=>({...f,Place:e.target.value}))}
              className="input-glass text-[13px]" placeholder="VD: Hà Nội, quán cafe..."/>
          </FormField>
        </FormSection>

        <FormSection title="Cảm xúc & Chi phí">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Cảm xúc">
              <select value={form.Mood} onChange={(e)=>setForm((f)=>({...f,Mood:e.target.value}))} className="input-glass text-[13px]">
                <option value="">Không</option>
                {MOODS.map((m)=><option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>
            <FormField label="Chi phí (VNĐ)">
              <input type="number" value={form.Cost} onChange={(e)=>setForm((f)=>({...f,Cost:Number(e.target.value)}))}
                className="input-glass text-[13px]" placeholder="0"/>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Ghi chú">
          <textarea value={form.Notes} onChange={(e)=>setForm((f)=>({...f,Notes:e.target.value}))}
            className="input-glass text-[13px] min-h-[70px]" rows={3} placeholder="Ghi chú thêm..."/>
        </FormSection>
      </div>

      <div className="flex gap-2 pt-4 border-t border-[rgba(0,0,0,0.04)] mt-4">
        <button onClick={()=>router.back()}
          className="flex-1 h-[42px] rounded-[10px] text-[13px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)]">Huỷ</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold text-white bg-[#E6002D]">{saving?'Đang lưu...':'Lưu lại'}</button>
      </div>
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
