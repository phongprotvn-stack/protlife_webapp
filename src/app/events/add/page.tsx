'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { eventService } from '@/lib/services/event-service';
import { organizationService } from '@/lib/services/organization-service';
import { participantService } from '@/lib/services/participant-service';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import type { Contact } from '@/types/database';
import { ArrowLeft, MapPin, X, Search, Plus, Globe, Navigation } from 'lucide-react';
import { formatVND, parseVND } from '@/lib/utils';

const EVENT_TYPES = ['Meeting','Birthday','Travel','Work','Sport','Hospital','Meal','Call','Shopping','Study','Party','Date','Entertainment','Other'] as const;
const MOODS = ['Happy','Normal','Sad','Excited','Tired','Angry','Thoughtful','Loved'] as const;
const IMPORTANCE = ['Lowest','Low','Medium','High','Highest'] as const;
const MAX_GEOCODE_RATE = 1000; // min 1s between Nominatim calls

interface LocationItem {
  id: string;
  place: string;
  maplink: string;
  lat?: number | null;
  lng?: number | null;
}

async function geocodeAddress(address: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'ProtLife/1.0 (personal life app)' } }
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export default function AddEventPage() {
  const router = useRouter();
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState<Record<string, 'idle' | 'loading' | 'done' | 'fail'>>({});
  const lastGeocodeTime = useRef(0);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactSearch, setShowContactSearch] = useState(false);
  const contactSearchRef = useRef<HTMLDivElement>(null);

  const [locations, setLocations] = useState<LocationItem[]>([
    { id: '1', place: '', maplink: '' },
  ]);

  const [form, setForm] = useState({
    Title:'', EventType:'Meeting', StartDate:new Date().toISOString().split('T')[0], EndDate:'',
    Mood:'', Importance:'Medium', Cost:0, Notes:'',
  });

  const [placeText, setPlaceText] = useState('');

  // Load contacts for participant selection
  useEffect(() => {
    contactService.getAll().then(setContacts).catch(() => {});
  }, []);

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

  // Close contact search on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contactSearchRef.current && !contactSearchRef.current.contains(e.target as Node)) {
        setShowContactSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredContacts = contacts.filter(
    (c) => c.Name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedContacts.find((sc) => sc.ContactID === c.ContactID)
  );

  const toggleContact = (contact: Contact) => {
    const exists = selectedContacts.find((c) => c.ContactID === contact.ContactID);
    if (exists) {
      setSelectedContacts(selectedContacts.filter((c) => c.ContactID !== contact.ContactID));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
    setSearchTerm('');
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
      // Auto-generate maplink when place changes
      if (field === 'place' && value.trim()) {
        updated.maplink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value.trim())}`;
      }
      return updated;
    }));
  };

  const handleGeocode = async (locId: string) => {
    const loc = locations.find((l) => l.id === locId);
    if (!loc || !loc.place.trim()) return;

    // Rate limit: 1 req/s
    const now = Date.now();
    const elapsed = now - lastGeocodeTime.current;
    if (elapsed < MAX_GEOCODE_RATE) {
      await new Promise((r) => setTimeout(r, MAX_GEOCODE_RATE - elapsed));
    }

    setGeocoding((prev) => ({ ...prev, [locId]: 'loading' }));
    lastGeocodeTime.current = Date.now();
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
      const newEvent = await eventService.create({
        Title:form.Title.trim(), EventType:form.EventType as any,
        StartDate:form.StartDate, EndDate:form.EndDate||undefined,
        Place: activeLocs.map(l => l.place.trim()).join('; '),
        Maplink: activeLocs.map(l => l.maplink.trim()).join('; '),
        Lat: activeLocs[0]?.lat || undefined,
        Lng: activeLocs[0]?.lng || undefined,
        Mood:form.Mood as any||undefined, Importance:form.Importance as any,
        Cost:form.Cost, Notes:form.Notes||undefined,
      });

      // Add participants
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
          <h1 className="text-[18px] font-bold text-[#111]\">Thêm sự kiện mới</h1>
          <p className="text-[11px] text-[#8E8E93]\">Nhập thông tin sự kiện mới</p>
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

        <FormSection title="Thời gian">
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Ngày bắt đầu">
              <input type="date" value={form.StartDate} onChange={(e)=>setForm((f)=>({...f,StartDate:e.target.value}))} className="input-glass text-[13px]"/>
            </FormField>
            <FormField label="Ngày kết thúc">
              <input type="date" value={form.EndDate} onChange={(e)=>setForm((f)=>({...f,EndDate:e.target.value}))} className="input-glass text-[13px]"/>
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
                  className="flex-1 input-glass text-[13px]" placeholder="VD: Hà Nội, quán cafe..."/>
                {/* Geocode button */}
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
                  className="flex-1 input-glass text-[13px] text-[#007AFF]" placeholder="https://maps.google.com/..."/>
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
          <div className="relative" ref={contactSearchRef}>
            <div className="flex items-center gap-2 p-2 rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)] cursor-text"
              onClick={() => setShowContactSearch(true)}>
              <Search size={14} className="text-[#8E8E93] shrink-0"/>
              <div className="flex-1 flex flex-wrap gap-1">
                {selectedContacts.map((c) => (
                  <span key={c.ContactID}
                    className="inline-flex items-center gap-1 px-[8px] py-[3px] rounded-full bg-[rgba(52,199,89,0.1)] text-[11px] font-medium text-[#2C8E4A]">
                    {c.Name}
                    <button type="button" onClick={() => toggleContact(c)} className="hover:text-[#E6002D]"><X size={10}/></button>
                  </span>
                ))}
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowContactSearch(true)}
                  className="flex-1 min-w-[80px] text-[12px] outline-none bg-transparent"
                  placeholder={selectedContacts.length > 0 ? '' : 'Tìm kiếm người tham gia...'}/>
              </div>
            </div>

            {showContactSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-[10px] shadow-lg border border-[rgba(0,0,0,0.06)] z-50 max-h-[200px] overflow-y-auto">
                {searchTerm.trim() ? (
                  filteredContacts.length > 0 ? (
                    filteredContacts.map((c) => (
                      <button key={c.ContactID} type="button" onClick={() => toggleContact(c)}
                        className="w-full text-left px-3 py-2 text-[12px] text-[#111] hover:bg-[rgba(0,0,0,0.03)] flex items-center gap-2">
                        <div className="w-[22px] h-[22px] rounded-full bg-[rgba(0,0,0,0.06)] flex items-center justify-center text-[9px] font-bold">{c.Name[0]}</div>
                        {c.Name}
                      </button>
                    ))
                  ) : (
                    <p className="text-[12px] text-[#8E8E93] text-center py-3">Không tìm thấy</p>
                  )
                ) : (
                  <p className="text-[11px] text-[#8E8E93] text-center py-3">Gõ tên để tìm kiếm người tham gia</p>
                )}
              </div>
            )}
          </div>
          {selectedContacts.length > 0 && (
            <p className="text-[10px] text-[#8E8E93]">{selectedContacts.length} người tham gia</p>
          )}
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
              <div className="relative">
                <input type="text" value={form.Cost ? formatVND(form.Cost) : ''}
                  onChange={(e)=>{
                    const raw = e.target.value.replace(/[^0-9.,]/g, '');
                    setForm((f)=>({...f,Cost: parseVND(raw)}));
                  }}
                  className="input-glass text-[13px] w-full" placeholder="0"/>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8E8E93] font-medium">VND</span>
              </div>
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
