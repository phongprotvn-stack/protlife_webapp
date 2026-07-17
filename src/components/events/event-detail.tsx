'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/modal';
import { eventService } from '@/lib/services/event-service';
import { participantService } from '@/lib/services/participant-service';
import { contactService } from '@/lib/services/contact-service';
import type { EventItem } from '@/types/database';
import type { Contact } from '@/types/database';
import type { EventParticipant } from '@/lib/services/participant-service';
import { formatDate, getMoodEmoji, getImportanceColor } from '@/lib/utils';
import { formatVND, parseVND } from '@/lib/utils';
import { Calendar, MapPin, DollarSign, Users, FileText, Tag, Edit3, Trash2, X, HeartIcon, Globe, Search, Plus } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props { eventId: string | null; onClose: () => void; panelMode?: boolean; }

const EVENT_TYPES = ['Meeting','Birthday','Travel','Work','Sport','Hospital','Meal','Call','Shopping','Study','Party','Date','Entertainment','Other'] as const;
const MOODS = ['Happy','Normal','Sad','Excited','Tired','Angry','Thoughtful','Loved'] as const;
const IMPORTANCE = ['Lowest','Low','Medium','High','Highest'] as const;
const LIFE_STAGES = ['Infancy','Childhood','Secondary School','High School','University','Early Career','Mid Career','Mature Career','Retirement'] as const;

export function EventDetail({ eventId, onClose, panelMode }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState<EventParticipant[]>([]);

  const [form, setForm] = useState({
    Title:'', EventType:'', LifeStage:'', StartDate:'', EndDate:'', Place:'', Maplink:'',
    Mood:'', Importance:'', Cost:0, Notes:'',
  });

  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<{ContactID:string;ContactName:string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactSearch, setShowContactSearch] = useState(false);

  useEffect(() => {
    contactService.getAll().then(setAllContacts).catch(() => {});
  }, []);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    Promise.all([
      eventService.getById(eventId),
      participantService.getByEventWithNames(eventId),
    ]).then(([data, pData]) => {
      setEvent(data); setParticipants(pData); setSelectedParticipants(pData.map(p => ({ContactID: p.ContactID, ContactName: p.ContactName || ''})));
      if (data) {
        setForm({
          Title:data.Title, EventType:data.EventType, LifeStage:data.LifeStage||'',
          StartDate:data.StartDate, EndDate:data.EndDate||'', Place:data.Place||'', Maplink:data.Maplink||'',
          Mood:data.Mood||'', Importance:data.Importance||'Medium', Cost:data.Cost||0, Notes:data.Notes||'',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    setEditMode(false); setConfirmDelete(false); setError(''); setParticipants([]);
  }, [eventId]);

  const handleSave = async () => {
    if (!event?.EventID) return;
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      await eventService.update(event.EventID, {
        Title:form.Title.trim(), EventType:form.EventType as any,
        LifeStage:form.LifeStage?form.LifeStage as any:undefined,
        StartDate:form.StartDate, EndDate:form.EndDate||undefined, Place:form.Place||undefined,
        Maplink:form.Maplink||undefined, Mood:form.Mood?form.Mood as any:undefined,
        Importance:form.Importance as any, Cost:form.Cost, Notes:form.Notes||undefined,
      });
      await participantService.setParticipants(event.EventID, selectedParticipants.map(p => p.ContactID));
      triggerRefresh(); setEditMode(false);
      const d = await eventService.getById(event.EventID);
      setEvent(d);
      const pData = await participantService.getByEventWithNames(event.EventID);
      setParticipants(pData); setSelectedParticipants(pData.map(p => ({ContactID: p.ContactID, ContactName: p.ContactName || ''})));
    } catch(e:any) { setError(e.message||'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const toggleParticipant = (contact: Contact) => {
    const exists = selectedParticipants.find((p) => p.ContactID === contact.ContactID);
    if (exists) {
      setSelectedParticipants(selectedParticipants.filter((p) => p.ContactID !== contact.ContactID));
    } else {
      setSelectedParticipants([...selectedParticipants, { ContactID: contact.ContactID, ContactName: contact.Name }]);
    }
    setSearchTerm(''); setShowContactSearch(false);
  };

  const filteredContacts = allContacts.filter(
    (c) => c.Name.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedParticipants.find((p) => p.ContactID === c.ContactID)
  );

  const handleDelete = async () => {
    if (!eventId) return;
    try { await eventService.delete(eventId); triggerRefresh(); onClose(); }
    catch(e:any) { setError(e.message||'Lỗi khi xoá'); }
  };

  const content = (
    <div>
      <div className="flex items-center justify-between mb-4">
        {panelMode && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><X size={15}/></button>}
        <div className="flex gap-1 ml-auto">
          {!editMode ? (
            <>
              <button onClick={()=>setEditMode(true)} className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)] flex items-center gap-1">
                <Edit3 size={12}/> Sửa
              </button>
              <button onClick={()=>setConfirmDelete(true)} className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#E6002D] bg-[rgba(230,0,45,0.06)] flex items-center gap-1">
                <Trash2 size={12}/> Xoá
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={()=>{setEditMode(false);setError('');}}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)]">Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">{saving?'...':'Lưu'}</button>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="mb-4 p-4 rounded-[14px] bg-[rgba(230,0,45,0.06)] border border-[rgba(230,0,45,0.12)] text-center">
          <div className="w-10 h-10 rounded-full bg-[rgba(230,0,45,0.1)] mx-auto mb-2 flex items-center justify-center"><Trash2 size={18} className="text-[#E6002D]"/></div>
          <p className="text-[14px] font-semibold text-[#E6002D] mb-1">Xoá sự kiện này?</p>
          <p className="text-[12px] text-[#8E8E93] mb-3">Hành động này không thể hoàn tác.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={()=>setConfirmDelete(false)} className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-[#5F6368] bg-white border border-[rgba(0,0,0,0.06)]">Không</button>
            <button onClick={handleDelete} className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-white bg-[#E6002D]">Xoá</button>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-[12px] text-[#E6002D] text-center">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-2"/>
          <p className="text-[12px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : event ? (
        <>
          <div className="text-center mb-5">
            <div className="w-[52px] h-[60px] rounded-[14px] bg-[#E6002D]/10 mx-auto mb-3 flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold text-[#E6002D] leading-none">{new Date(event.StartDate).getDate()}</span>
              <span className="text-[9px] font-medium text-[#E6002D]/70 mt-0.5">{new Date(event.StartDate).toLocaleDateString('vi-VN',{month:'short'})}</span>
            </div>
            {editMode ? (
              <div className="space-y-2">
                <input value={form.Title} onChange={(e)=>setForm((f)=>({...f,Title:e.target.value}))}
                  className="input-glass text-center text-[17px] font-bold" placeholder="Tiêu đề"/>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <select value={form.EventType} onChange={(e)=>setForm((f)=>({...f,EventType:e.target.value}))}
                    className="input-glass text-[11px] w-auto">{EVENT_TYPES.map((t)=><option key={t} value={t}>{t}</option>)}</select>
                  <select value={form.Mood} onChange={(e)=>setForm((f)=>({...f,Mood:e.target.value}))}
                    className="input-glass text-[11px] w-auto"><option value="">Mood</option>{MOODS.map((m)=><option key={m} value={m}>{m}</option>)}</select>
                  <select value={form.Importance} onChange={(e)=>setForm((f)=>({...f,Importance:e.target.value}))}
                    className="input-glass text-[11px] w-auto">{IMPORTANCE.map((i)=><option key={i} value={i}>{i}</option>)}</select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-[#111]">{event.Title}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[11px] px-[10px] py-[3px] rounded-full bg-[rgba(0,0,0,0.04)] text-[#6B7280] font-medium">{event.EventType}</span>
                  {event.Mood && <span className="text-[16px]">{getMoodEmoji(event.Mood)}</span>}
                  {event.Importance && <span className="text-[10px] font-semibold" style={{color:getImportanceColor(event.Importance)}}>● {event.Importance}</span>}
                </div>
              </>
            )}
          </div>

          {!editMode ? (
            <div className="space-y-2">
              <Field icon={<Calendar size={14} className="text-[#007AFF]"/>} label={formatDate(event.StartDate,'ddmmyyyy') + (event.EndDate ? ` → ${formatDate(event.EndDate,'ddmmyyyy')}` : '')}/>
              {event.Place && <Field icon={<MapPin size={14} className="text-[#FF9500]"/>} label={event.Place}/>}
              {event.Maplink && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <Globe size={14} className="text-[#007AFF]"/>
                  <a href={event.Maplink} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#007AFF] hover:underline">Xem trên Google Maps</a>
                </div>
              )}
              {event.LifeStage && <Field icon={<Tag size={14} className="text-[#5856D6]"/>} label={event.LifeStage}/>}
              {event.Cost>0 && <Field icon={<DollarSign size={14} className="text-[#FF4D6A]"/>} label={`${formatVND(event.Cost)} VND`}/>}
              {participants.length>0 && (
                <div className="p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] mb-1.5 flex items-center gap-1"><Users size={12} className="text-[#34C759]"/> Người tham gia</p>
                  <div className="flex flex-wrap gap-1.5">
                    {participants.map((p)=>(
                      <span key={p.ContactID} className="inline-flex items-center px-[8px] py-[3px] rounded-full bg-[rgba(52,199,89,0.1)] text-[11px] font-medium text-[#2C8E4A]">{p.ContactName}</span>
                    ))}
                  </div>
                </div>
              )}
              {event.Notes && (
                <div className="p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[10px] font-semibold text-[#8E8E93] uppercase tracking-[0.3px] mb-1">Ghi chú</p>
                  <p className="text-[13px] text-[#111] whitespace-pre-wrap">{event.Notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FieldEdit label="Loại">
                  <select value={form.EventType} onChange={(e)=>setForm((f)=>({...f,EventType:e.target.value}))} className="input-glass text-[13px]">
                    {EVENT_TYPES.map((t)=><option key={t} value={t}>{t}</option>)}</select>
                </FieldEdit>
                <FieldEdit label="Giai đoạn">
                  <select value={form.LifeStage} onChange={(e)=>setForm((f)=>({...f,LifeStage:e.target.value}))} className="input-glass text-[13px]">
                    <option value="">Chọn</option>{LIFE_STAGES.map((s)=><option key={s} value={s}>{s}</option>)}</select>
                </FieldEdit>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldEdit label="Ngày bắt đầu">
                  <input type="date" value={form.StartDate} onChange={(e)=>setForm((f)=>({...f,StartDate:e.target.value}))} className="input-glass text-[13px]"/>
                </FieldEdit>
                <FieldEdit label="Ngày kết thúc">
                  <input type="date" value={form.EndDate} onChange={(e)=>setForm((f)=>({...f,EndDate:e.target.value}))} className="input-glass text-[13px]"/>
                </FieldEdit>
              </div>
              <FieldEdit label="Địa điểm">
                <input value={form.Place} onChange={(e)=>setForm((f)=>({...f,Place:e.target.value}))} className="input-glass text-[13px]" placeholder="VD: 123 Đường..."/>
              </FieldEdit>
              <FieldEdit label="Google Maps Link">
                <input value={form.Maplink} onChange={(e)=>setForm((f)=>({...f,Maplink:e.target.value}))} className="input-glass text-[13px]" placeholder="https://maps.google.com/..."/>
              </FieldEdit>
              <div className="grid grid-cols-2 gap-2">
                <FieldEdit label="Cảm xúc">
                  <select value={form.Mood} onChange={(e)=>setForm((f)=>({...f,Mood:e.target.value}))} className="input-glass text-[13px]">
                    <option value="">Không</option>{MOODS.map((m)=><option key={m} value={m}>{m}</option>)}</select>
                </FieldEdit>
                <FieldEdit label="Mức độ">
                  <select value={form.Importance} onChange={(e)=>setForm((f)=>({...f,Importance:e.target.value}))} className="input-glass text-[13px]">
                    {IMPORTANCE.map((i)=><option key={i} value={i}>{i}</option>)}</select>
                </FieldEdit>
              </div>
              <FieldEdit label="Chi phí (VNĐ)">
                <div className="relative">
                  <input type="text" value={form.Cost ? formatVND(form.Cost) : ''}
                    onChange={(e)=>{
                      const raw = e.target.value.replace(/[^0-9.,]/g, '');
                      setForm((f)=>({...f,Cost: parseVND(raw)}));
                    }}
                    className="input-glass text-[13px] w-full" placeholder="0"/>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#8E8E93] font-medium">VND</span>
                </div>
              </FieldEdit>
              <div>
                <p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1">Người tham gia</p>
                <div className="p-2 rounded-[8px] bg-white border border-[rgba(0,0,0,0.06)]">
                  {selectedParticipants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selectedParticipants.map((p) => (
                        <span key={p.ContactID}
                          className="inline-flex items-center gap-1 px-[8px] py-[3px] rounded-full bg-[rgba(52,199,89,0.1)] text-[11px] font-medium text-[#2C8E4A]">
                          {p.ContactName}
                          <button type="button" onClick={() => toggleParticipant({ContactID:p.ContactID,Name:p.ContactName} as Contact)}
                            className="hover:text-[#E6002D]"><X size={10}/></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Search size={13} className="text-[#8E8E93] shrink-0"/>
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setShowContactSearch(true)}
                      className="flex-1 text-[12px] outline-none bg-transparent"
                      placeholder="Tìm kiếm người tham gia..."/>
                  </div>
                  {showContactSearch && searchTerm.trim() && (
                    <div className="mt-1 border-t border-[rgba(0,0,0,0.04)] pt-1">
                      {filteredContacts.length > 0 ? (
                        filteredContacts.slice(0, 5).map((c) => (
                          <button key={c.ContactID} type="button" onClick={() => toggleParticipant(c)}
                            className="w-full text-left px-2 py-1.5 text-[12px] text-[#111] hover:bg-[rgba(0,0,0,0.03)] rounded-[6px]">
                            {c.Name}
                          </button>
                        ))
                      ) : (
                        <p className="text-[11px] text-[#8E8E93] text-center py-1">Không tìm thấy</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <FieldEdit label="Ghi chú">
                <textarea value={form.Notes} onChange={(e)=>setForm((f)=>({...f,Notes:e.target.value}))}
                  className="input-glass text-[13px] min-h-[60px]" rows={2} placeholder="Ghi chú thêm..."/>
              </FieldEdit>
            </div>
          )}

          {!editMode && event.Source && (
            <div className="mt-4 text-center"><span className="text-[10px] text-[#B0B0B8] font-medium">Nguồn: {event.Source}</span></div>
          )}
        </>
      ) : (
        <p className="text-center text-[#8E8E93] py-6 text-[13px]">Không tìm thấy</p>
      )}
    </div>
  );

  if (panelMode) return <div className="panel-detail">{content}</div>;
  return <Modal open={!!eventId} onClose={onClose} title="" maxWidth="420px">{content}</Modal>;
}

function Field({icon, label}:{icon:React.ReactNode;label:string}) {
  return <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">{icon}<span className="text-[13px] text-[#111]">{label}</span></div>;
}
function FieldEdit({label, children}:{label:string;children:React.ReactNode}) {
  return <div><p className="text-[9px] font-semibold text-[#6B7280] uppercase mb-1">{label}</p>{children}</div>;
}
