'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { eventService } from '@/lib/services/event-service';
import { organizationService } from '@/lib/services/organization-service';
import { participantService } from '@/lib/services/participant-service';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import type { Contact } from '@/types/database';
import { ArrowLeft, MapPin, X, Search, Plus, Globe, Navigation } from 'lucide-react';
import { formatVND, parseVND } from '@/lib/utils';
import { DateInput } from '@/components/ui/date-input';
import { geocodeAddress } from '@/lib/geocode';
import { useSettingsStore } from '@/stores/settings-store';
import { calculateLifeStage } from '@/lib/utils';

const EVENT_TYPES = ['Meeting','Birthday','Travel','Work','Sport','Hospital','Meal','Call','Shopping','Study','Party','Date','Entertainment','Other'] as const;
const MOODS = ['Happy','Normal','Sad','Excited','Tired','Angry','Thoughtful','Loved'] as const;
const IMPORTANCE = ['Lowest','Low','Medium','High','Highest'] as const;
const LIFE_STAGES = ['Infancy', 'Childhood', 'Secondary School', 'High School', 'University', 'Early Career', 'Mid Career', 'Mature Career', 'Retirement'] as const;

interface LocationItem {
  id: string;
  place: string;
  maplink: string;
  lat?: number | null;
  lng?: number | null;
}

export default function AddEventPage() {
  const router = useRouter();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const dob = useSettingsStore((s) => s.dob);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState<Record<string, 'idle' | 'loading' | 'done' | 'fail'>>({});

  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<NodeJS.Timeout | null>(null);

  const [locations, setLocations] = useState<LocationItem[]>([
    { id: '1', place: '', maplink: '' },
  ]);

  const [form, setForm] = useState({
    Title:'', EventType:'Meeting', StartDate:new Date().toISOString().split('T')[0], EndDate:'',
    Mood:'', Importance:'Medium', LifeStage:'', Cost:0, Notes:'',
  });

  const [placeText, setPlaceText] = useState('');

  // Auto-calculate LifeStage based on user's DOB + event StartDate
  useEffect(() => {
    const stage = calculateLifeStage(dob, form.StartDate);
    setForm((f) => ({ ...f, LifeStage: stage }));
  }, [dob, form.StartDate]);

  // Load contacts for participant selection using TanStack Query (cached, retried, refetched on focus)
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactService.getAll(),
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: 1500,
    refetchOnWindowFocus: true,
  });

  // Auto-generate maplink when place changes
  useEffect(() => {
    if (placeText.trim()) {
      const encoded = encodeURIComponent(placeText.trim());
      const link = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      setLocations((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], place: placeText, maplink: link };
        }
        return updated;
      });
    }
  }, [placeText]);

  const filteredContacts = contacts.filter(
    (c) => c.Name && c.Name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedContacts.find((sc) => sc.ContactID === c.ContactID)
  );

  const toggleContact = (contact: Contact) => {
    setSelectedContacts((prev) => {
      const exists = prev.find((c) => c.ContactID === contact.ContactID);
      if (exists) return prev.filter((c) => c.ContactID !== contact.ContactID);
      return [...prev, contact];
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !searchTerm && selectedContacts.length > 0) {
      setSelectedContacts((prev) => prev.slice(0, -1));
    }
  };

  const handleFocus = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setSearchFocused(true);
  };

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => {
      setSearchFocused(false);
    }, 200);
  };

  const addLocation = () => {
    setLocations([...locations, { id: String(Date.now()), place: '', maplink: '' }]);
  };

  const removeLocation = (id: string) => {
    if (locations.length <= 1) return;
    setLocations(locations.filter((l) => l.id !== id));
  };

  const updateLocation = (id: string, field: 'place' | 'maplink', value: string) => {
    setLocations(locations.map((l) => {
      if (l.id !== id) return l;
      const updated = { ...l, [field]: value };
      if (field === 'place' && value.trim()) {
        updated.maplink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value.trim())}`;
      }
      return updated;
    }));
  };

  const handleGeocode = async (locId: string) => {
    const loc = locations.find((l) => l.id === locId);
    if (!loc || !loc.place.trim()) return;

    setGeocoding((prev) => ({ ...prev, [locId]: 'loading' }));
    try {
      const result = await geocodeAddress(loc.place.trim());
      if (result) {
        setLocations((prev) => prev.map((l) =>
          l.id === locId ? { ...l, lat: result.lat, lng: result.lng } : l
        ));
        setGeocoding((prev) => ({ ...prev, [locId]: 'done' }));
      } else {
        setGeocoding((prev) => ({ ...prev, [locId]: 'fail' }));
      }
    } catch {
      setGeocoding((prev) => ({ ...prev, [locId]: 'fail' }));
    }
  };

  const handleSave = async () => {
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      const activeLocs = locations.filter(l => l.place.trim());

      // Auto-geocode any location that has a place but no coordinates yet
      const pending = activeLocs.filter(l => !l.lat || !l.lng);
      for (const loc of pending) {
        try {
          setGeocoding((prev) => ({ ...prev, [loc.id]: 'loading' }));
          const result = await geocodeAddress(loc.place.trim());
          if (result) {
            loc.lat = result.lat;
            loc.lng = result.lng;
            setGeocoding((prev) => ({ ...prev, [loc.id]: 'done' }));
          } else {
            setGeocoding((prev) => ({ ...prev, [loc.id]: 'fail' }));
          }
        } catch {
          setGeocoding((prev) => ({ ...prev, [loc.id]: 'fail' }));
        }
      }

      const newEvent = await eventService.create({
        Title:form.Title.trim(), EventType:form.EventType as any,
        StartDate:form.StartDate, EndDate:form.EndDate||undefined,
        Place: activeLocs.map(l => l.place.trim()).join('; '),
        Maplink: activeLocs.map(l => l.maplink.trim()).join('; '),
        Lat: activeLocs[0]?.lat || undefined,
        Lng: activeLocs[0]?.lng || undefined,
        Mood:form.Mood as any||undefined, Importance:form.Importance as any,
        LifeStage: form.LifeStage ? (form.LifeStage as any) : undefined,
        Cost:form.Cost, Notes:form.Notes||undefined,
      });

      if (selectedContacts.length > 0 && newEvent?.EventID) {
        await participantService.addParticipants(
          newEvent.EventID,
          selectedContacts.map((c) => c.ContactID)
        );
      }

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
              className="input-glass text-[16px]" placeholder="Nhập tiêu đề sự kiện"/>
          </FormField>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Loại sự kiện">
              <select value={form.EventType} onChange={(e)=>setForm((f)=>({...f,EventType:e.target.value}))} className="input-glass text-[16px]">
                {EVENT_TYPES.map((t)=><option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Mức độ">
              <select value={form.Importance} onChange={(e)=>setForm((f)=>({...f,Importance:e.target.value}))} className="input-glass text-[16px]">
                {IMPORTANCE.map((i)=><option key={i} value={i}>{i}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Giai đoạn (tự động)">
            <select value={form.LifeStage} onChange={()=>{}} disabled
              className="input-glass text-[16px] disabled:opacity-60 disabled:cursor-not-allowed">
              <option value="">Chưa xác định</option>
              {LIFE_STAGES.map((s)=><option key={s} value={s}>{s}</option>)}
            </select>
            {!dob && (
              <p className="text-[11px] text-[#FF9500] mt-1">
                ⚠️ Chưa có ngày sinh trong Cài đặt — vào Cài đặt → Hồ sơ để nhập, hoặc bỏ trống.
              </p>
            )}
          </FormField>
        </FormSection>

        <FormSection title="Thời gian">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Ngày bắt đầu">
              <DateInput value={form.StartDate} onChange={(v)=>setForm((f)=>({...f,StartDate:v}))} className="input-glass text-[16px]"/>
            </FormField>
            <FormField label="Ngày kết thúc">
              <DateInput value={form.EndDate} onChange={(v)=>setForm((f)=>({...f,EndDate:v}))} className="input-glass text-[16px]"/>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Địa điểm & Google Maps">
          {locations.map((loc, idx) => (
            <div key={loc.id} className="space-y-2 p-2.5 rounded-[8px] bg-white border border-[rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold text-[#6B7280] uppercase">Địa điểm {idx + 1}</span>
                {locations.length > 1 && (
                  <button type="button" onClick={() => removeLocation(loc.id)}
                    className="text-[#E6002D]/50 hover:text-[#E6002D]"><X size={12}/></button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#FF9500] shrink-0"/>
                <input value={loc.place} onChange={(e) => updateLocation(loc.id, 'place', e.target.value)}
                  className="flex-1 input-glass text-[16px]" placeholder="VD: Hà Nội, quán cafe..."/>
                <button type="button" onClick={() => handleGeocode(loc.id)}
                  disabled={geocoding[loc.id] === 'loading'}
                  className="shrink-0 px-2.5 h-[30px] rounded-[8px] text-[11px] font-medium flex items-center gap-1 border border-[rgba(0,0,0,0.06)] bg-white hover:bg-[rgba(0,0,0,0.03)] disabled:opacity-50 transition-all">
                  {geocoding[loc.id] === 'loading' ? (
                    <span className="w-3.5 h-3.5 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin" />
                  ) : geocoding[loc.id] === 'done' ? (
                    <span className="text-[#34C759]">✅</span>
                  ) : geocoding[loc.id] === 'fail' ? (
                    <span className="text-[#E6002D]">⚠️</span>
                  ) : (
                    <Navigation size={13} />
                  )}
                  <span>
                    {geocoding[loc.id] === 'loading' ? 'Đang xác định...'
                    : geocoding[loc.id] === 'done' ? 'Đã có toạ độ'
                    : geocoding[loc.id] === 'fail' ? 'Không tìm thấy'
                    : '📍 Lấy toạ độ'}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-[#007AFF] shrink-0"/>
                <input value={loc.maplink} onChange={(e) => updateLocation(loc.id, 'maplink', e.target.value)}
                  className="flex-1 input-glass text-[16px] text-[#007AFF]" placeholder="https://maps.google.com/..."/>
                {loc.maplink && (
                  <a href={loc.maplink} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-medium text-[#007AFF] hover:underline shrink-0">Map</a>
                )}
              </div>
              {loc.lat && loc.lng && (
                <div className="text-[10px] text-[#34C759] font-medium">✅ {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</div>
              )}
            </div>
          ))}
          <button type="button" onClick={addLocation}
            className="w-full h-[36px] rounded-[8px] border border-dashed border-[rgba(0,0,0,0.12)] text-[11px] font-medium text-[#8E8E93] flex items-center justify-center gap-1 hover:bg-[rgba(0,0,0,0.02)]">
            <Plus size={12}/> Thêm địa điểm
          </button>
        </FormSection>

        <FormSection title="Người tham gia">
          <div className="flex items-center gap-2 p-2 rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)]">
            <Search size={14} className="text-[#8E8E93] shrink-0"/>
            <div className="flex-1 flex flex-wrap gap-1">
              {selectedContacts.map((c) => (
                <span key={c.ContactID}
                  className="inline-flex items-center gap-1 px-[8px] py-[3px] rounded-full bg-[rgba(52,199,89,0.1)] text-[11px] font-medium text-[#2C8E4A]">
                  {c.Name}
                  <button type="button" onClick={() => { toggleContact(c); inputRef.current?.focus(); }} className="hover:text-[#E6002D]"><X size={10}/></button>
                </span>
              ))}
              <input ref={inputRef} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown}
                className="flex-1 min-w-[80px] text-[16px] outline-none bg-transparent"
                placeholder={selectedContacts.length > 0 ? '' : 'Tìm kiếm người tham gia...'}/>
            </div>
          </div>
          {selectedContacts.length > 0 && (
            <p className="text-[10px] text-[#8E8E93]">{selectedContacts.length} người tham gia</p>
          )}

          {/* Contact dropdown — always below the search box, no portal, no floating */}
          <div className="relative">
            {searchFocused && (
              <div className="bg-white rounded-[10px] shadow-lg border border-[rgba(0,0,0,0.06)] max-h-[200px] overflow-y-auto mt-1">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((c) => (
                    <button key={c.ContactID} type="button"
                      onMouseDown={(e) => { e.preventDefault(); toggleContact(c); setSearchTerm(''); inputRef.current?.focus(); }}
                      className="w-full text-left px-3 py-2 text-[12px] text-[#111] hover:bg-[rgba(0,0,0,0.03)] flex items-center gap-2">
                      <div className="w-[22px] h-[22px] rounded-full bg-[rgba(0,0,0,0.06)] flex items-center justify-center text-[9px] font-bold">{c.Name[0]}</div>
                      {c.Name}
                    </button>
                  ))
                ) : (
                  <p className="text-[12px] text-[#8E8E93] text-center py-3">
                    {searchTerm.trim() ? 'Không tìm thấy' : 'Chưa có liên hệ nào'}
                  </p>
                )}
              </div>
            )}
          </div>
        </FormSection>

        <FormSection title="Cảm xúc & Chi phí">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Cảm xúc">
              <select value={form.Mood} onChange={(e)=>setForm((f)=>({...f,Mood:e.target.value}))} className="input-glass text-[16px]">
                <option value="">Không</option>
                {MOODS.map((m)=><option key={m} value={m}>{m}</option>)}
              </select>
            </FormField>
            <FormField label="Chi phí (VNĐ)">
              <div className="relative">
                <input type="text" value={form.Cost ? formatVND(form.Cost) : ''}
                  onChange={(e)=>{
                    const raw = e.target.value.replace(/[^0-9.,]/g, '');
                    setForm((f)=>({...f,Cost: parseVND(raw)}));
                  }}
                  className="input-glass text-[16px] w-full" placeholder="0"/>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8E8E93] font-medium">VND</span>
              </div>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Ghi chú">
          <textarea value={form.Notes} onChange={(e)=>setForm((f)=>({...f,Notes:e.target.value}))}
            className="input-glass text-[16px] min-h-[70px]" rows={3} placeholder="Ghi chú thêm..."/>
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
