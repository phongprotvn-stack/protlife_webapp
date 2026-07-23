'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { organizationService } from '@/lib/services/organization-service';
import { useAppStore } from '@/stores/app-store';
import { ArrowLeft, MapPin, Globe, Navigation } from 'lucide-react';

async function geocodeAddress(address: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'ProtLife/1.0 (personal life app)' } }
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export default function AddOrganizationPage() {
  const router = useRouter();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState<'idle' | 'loading' | 'done' | 'fail'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const lastGeocodeTime = useRef(0);

  const [form, setForm] = useState({
    Name: '',
    Contact: '',
    Email: '',
    Phone: '',
    Address: '',
  });

  const handleGeocode = async () => {
    if (!form.Address.trim()) return;
    const now = Date.now();
    const elapsed = now - lastGeocodeTime.current;
    if (elapsed < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - elapsed));
    }
    setGeocoding('loading');
    lastGeocodeTime.current = Date.now();
    try {
      const result = await geocodeAddress(form.Address.trim());
      if (result) {
        setCoords(result);
        setGeocoding('done');
      } else {
        setGeocoding('fail');
      }
    } catch {
      setGeocoding('fail');
    }
  };

  const handleSave = async () => {
    if (!form.Name.trim()) { setError('Vui lòng nhập tên tổ chức'); return; }
    setSaving(true); setError('');
    try {
      await organizationService.create({
        Name: form.Name.trim(),
        Contact: form.Contact.trim() || undefined,
        Email: form.Email.trim() || undefined,
        Phone: form.Phone.trim() || undefined,
        Address: form.Address.trim() || undefined,
        Lat: coords?.lat || null,
        Lng: coords?.lng || null,
      });
      triggerRefresh();
      router.push('/organizations');
    } catch(e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm tổ chức mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Nhập thông tin tổ chức mới</p>
        </div>
      </div>

      {error && <p className="mb-3 text-[11px] text-[#E6002D] bg-[rgba(230,0,45,0.04)] p-2 rounded-[8px]">{error}</p>}

      <div className="flex-1 overflow-y-auto space-y-4">
        <FormSection title="Thông tin cơ bản">
          <FormField label="Tên tổ chức *">
            <input value={form.Name} onChange={(e)=>setForm((f)=>({...f,Name:e.target.value}))}
              className="input-glass text-[14px] w-full" placeholder="VD: Vietcombank"/>
          </FormField>
          <FormField label="Người liên hệ">
            <input value={form.Contact} onChange={(e)=>setForm((f)=>({...f,Contact:e.target.value}))}
              className="input-glass text-[13px] w-full" placeholder="Tên người liên hệ"/>
          </FormField>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Email">
              <input type="email" value={form.Email} onChange={(e)=>setForm((f)=>({...f,Email:e.target.value}))}
                className="input-glass text-[13px] w-full" placeholder="email@example.com"/>
            </FormField>
            <FormField label="Số điện thoại">
              <input type="tel" value={form.Phone} onChange={(e)=>setForm((f)=>({...f,Phone:e.target.value}))}
                className="input-glass text-[13px] w-full" placeholder="090..."/>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Địa chỉ">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#FF9500] shrink-0"/>
            <input value={form.Address} onChange={(e)=>setForm((f)=>({...f,Address:e.target.value}))}
              className="flex-1 input-glass text-[13px]" placeholder="Địa chỉ tổ chức..."/>
            <button type="button" onClick={handleGeocode}
              disabled={geocoding === 'loading'}
              className="shrink-0 px-2.5 h-[30px] rounded-[8px] text-[11px] font-medium flex items-center gap-1 border border-[rgba(0,0,0,0.06)] bg-white hover:bg-[rgba(0,0,0,0.03)] disabled:opacity-50 transition-all">
              {geocoding === 'loading' ? (
                <span className="w-3.5 h-3.5 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" />
              ) : geocoding === 'done' ? (
                <span className="text-[#34C759]">✅</span>
              ) : geocoding === 'fail' ? (
                <span className="text-[#E6002D]">⚠️</span>
              ) : (
                <Navigation size={13} />
              )}
              <span>
                {geocoding === 'loading' ? 'Đang xác định...'
                : geocoding === 'done' ? 'Đã có toạ độ'
                : geocoding === 'fail' ? 'Không tìm thấy'
                : '📍 Lấy toạ độ'}
              </span>
            </button>
          </div>
          {coords && (
            <div className="text-[10px] text-[#34C759] font-medium mt-1">✅ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</div>
          )}
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
