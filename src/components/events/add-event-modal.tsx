'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Link as LinkIcon, Users, DollarSign, X, Plus, Search } from 'lucide-react';
import { Modal } from '@/components/shared/modal';
import { eventService } from '@/lib/services/event-service';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import { cn, formatDate, getInitials, getAvatarColor } from '@/lib/utils';
import type { Contact } from '@/types/database';

const EVENT_TYPES = ['Meeting', 'Birthday', 'Travel', 'Work', 'Sport', 'Hospital', 'Meal', 'Call', 'Shopping', 'Study', 'Party', 'Date', 'Entertainment', 'Other'] as const;
const MOODS = ['Happy', 'Normal', 'Sad', 'Excited', 'Tired', 'Angry', 'Thoughtful', 'Loved'] as const;
const IMPORTANCE = ['Lowest', 'Low', 'Medium', 'High', 'Highest'] as const;
const LIFE_STAGES = ['Infancy', 'Childhood', 'Secondary School', 'High School', 'University', 'Early Career', 'Mid Career', 'Mature Career', 'Retirement'] as const;

interface Place { place: string; maplink: string; }

function formatVNCurrency(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseVNCurrency(str: string): number {
  return Number(str.replace(/\./g, ''));
}

interface Props { open: boolean; onClose: () => void; }

export function AddEventModal({ open, onClose }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [form, setForm] = useState({
    Title: '', EventType: 'Meeting' as string, StartDate: new Date().toISOString().split('T')[0], EndDate: '',
    Mood: '', Importance: 'Medium' as string, LifeStage: '' as string, Cost: 0, Notes: '',
    places: [{ place: '', maplink: '' }] as Place[],
    participants: [] as string[], // contact IDs
  });
  const [costDisplay, setCostDisplay] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const participantRef = useRef<HTMLDivElement>(null);

  // Load contacts for participant picker
  useEffect(() => {
    if (open) contactService.getAll().then(setContacts).catch(() => {});
  }, [open]);

  // Close participant dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (participantRef.current && !participantRef.current.contains(e.target as Node))
        setShowParticipantDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const updatePlace = (idx: number, field: 'place' | 'maplink', val: string) => {
    const places = [...form.places];
    places[idx] = { ...places[idx], [field]: val };
    // Auto-generate maplink from place
    if (field === 'place' && val.trim()) {
      places[idx].maplink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val.trim())}`;
    }
    update('places', places);
  };

  const addPlace = () => {
    update('places', [...form.places, { place: '', maplink: '' }]);
  };

  const removePlace = (idx: number) => {
    if (form.places.length <= 1) return;
    update('places', form.places.filter((_, i) => i !== idx));
  };

  const toggleParticipant = (contactId: string) => {
    const p = form.participants.includes(contactId)
      ? form.participants.filter((id) => id !== contactId)
      : [...form.participants, contactId];
    update('participants', p);
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw || '0', 10);
    setCostDisplay(raw ? formatVNCurrency(num) : '');
    update('Cost', num);
  };

  const getContactName = (id: string) => contacts.find((c) => c.ContactID === id)?.Name || id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    if (!form.StartDate) { setError('Vui lòng chọn ngày'); return; }
    setSaving(true); setError('');

    // Build places string
    const validPlaces = form.places.filter((p) => p.place.trim());
    const placesStr = validPlaces.map((p) => p.place.trim()).join(' · ');
    const maplinkStr = validPlaces.length > 0 ? validPlaces[0].maplink : undefined;
    const participantNames = form.participants.map((id) => getContactName(id)).join(', ');

    // Build notes: original notes + participant info
    let notesStr = form.Notes || '';
    if (participantNames) notesStr += (notesStr ? '\n\n' : '') + `Người tham gia: ${participantNames}`;

    try {
      await eventService.create({
        Title: form.Title.trim(),
        EventType: form.EventType as any,
        StartDate: form.StartDate,
        EndDate: form.EndDate || undefined,
        Place: placesStr || undefined,
        Maplink: maplinkStr,
        Mood: form.Mood ? (form.Mood as any) : undefined,
        Importance: form.Importance as any,
        LifeStage: form.LifeStage ? (form.LifeStage as any) : undefined,
        Cost: form.Cost,
        Notes: notesStr || undefined,
      });
      triggerRefresh(); onClose();
      setForm({ Title: '', EventType: 'Meeting', StartDate: new Date().toISOString().split('T')[0], EndDate: '', Mood: '', Importance: 'Medium', LifeStage: '', Cost: 0, Notes: '', places: [{ place: '', maplink: '' }], participants: [] });
      setCostDisplay('');
    } catch (e: any) { setError(e.message || 'Lỗi khi thêm'); }
    finally { setSaving(false); }
  };

  const selectedContacts = form.participants.map((id) => contacts.find((c) => c.ContactID === id)).filter(Boolean) as Contact[];
  const filteredContacts = contacts.filter((c) =>
    c.Name.toLowerCase().includes(participantSearch.toLowerCase()) && !form.participants.includes(c.ContactID)
  );

  return (
    <Modal open={open} onClose={onClose} title="Thêm sự kiện mới" maxWidth="500px">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Tiêu đề *</label>
          <input value={form.Title} onChange={(e) => update('Title', e.target.value)} className="input-ios mt-1" placeholder="Hôm nay đã..." />
        </div>

        {/* Event Type + Life Stage */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Loại sự kiện</label>
            <select value={form.EventType} onChange={(e) => update('EventType', e.target.value)} className="input-ios mt-1">
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Giai đoạn</label>
            <select value={form.LifeStage} onChange={(e) => update('LifeStage', e.target.value)} className="input-ios mt-1">
              <option value="">Chọn</option>
              {LIFE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Ngày bắt đầu *</label>
            <input type="date" value={form.StartDate} onChange={(e) => update('StartDate', e.target.value)} className="input-ios mt-1" />
            {form.StartDate && <p className="text-[11px] text-[#8E8E93] mt-0.5">{formatDate(form.StartDate, 'ddmmyyyy')}</p>}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Ngày kết thúc</label>
            <input type="date" value={form.EndDate} onChange={(e) => update('EndDate', e.target.value)} className="input-ios mt-1" />
            {form.EndDate && <p className="text-[11px] text-[#8E8E93] mt-0.5">{formatDate(form.EndDate, 'ddmmyyyy')}</p>}
          </div>
        </div>

        {/* Places - multiple */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
            <MapPin size={12} className="text-[#FF9500]" /> Địa điểm
          </label>
          {form.places.map((p, idx) => (
            <div key={idx} className="mt-1">
              <div className="flex items-center gap-2">
                <input value={p.place} onChange={(e) => updatePlace(idx, 'place', e.target.value)}
                  className="input-ios flex-1" placeholder={`Địa điểm ${idx + 1}...`} />
                {form.places.length > 1 && (
                  <button type="button" onClick={() => removePlace(idx)}
                    className="p-2 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                    <X size={16} />
                  </button>
                )}
              </div>
              {p.maplink && (
                <a href={p.maplink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#007AFF] mt-1 hover:underline">
                  <LinkIcon size={11} /> Xem trên Google Maps
                </a>
              )}
            </div>
          ))}
          <button type="button" onClick={addPlace}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#007AFF] hover:underline">
            <Plus size={14} /> Thêm địa điểm
          </button>
        </div>

        {/* Participant picker */}
        <div ref={participantRef}>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
            <Users size={12} className="text-[#34C759]" /> Người tham gia
          </label>
          {/* Selected participants */}
          {selectedContacts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5">
              {selectedContacts.map((c) => (
                <span key={c.ContactID} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#34C759]/10 text-[#34C759]">
                  {getInitials(c.Name)} {c.Name}
                  <button onClick={() => toggleParticipant(c.ContactID)}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={participantSearch}
              onChange={(e) => { setParticipantSearch(e.target.value); setShowParticipantDropdown(true); }}
              onFocus={() => setShowParticipantDropdown(true)}
              className="input-ios mt-1 pl-[34px]" placeholder="Tìm kiếm tên người tham gia..."
            />
          </div>
          {/* Dropdown */}
          {showParticipantDropdown && (
            <div className="mt-1 rounded-[12px] bg-white border border-[rgba(0,0,0,0.06)] shadow-lg max-h-[180px] overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <p className="px-3 py-2 text-[12px] text-[#8E8E93]">Không tìm thấy</p>
              ) : (
                filteredContacts.map((c) => (
                  <button key={c.ContactID} type="button" onClick={() => toggleParticipant(c.ContactID)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#111] hover:bg-[rgba(0,0,0,0.04)] text-left">
                    <div className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                      style={{ backgroundColor: getAvatarColor(c.Name) }}>
                      {getInitials(c.Name)}
                    </div>
                    <span className="flex-1">{c.Name}</span>
                    <span className="text-[11px] text-[#8E8E93]">{c.Relationship}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Mood + Importance */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Cảm xúc</label>
            <select value={form.Mood} onChange={(e) => update('Mood', e.target.value)} className="input-ios mt-1">
              <option value="">Không</option>
              {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Mức độ</label>
            <select value={form.Importance} onChange={(e) => update('Importance', e.target.value)} className="input-ios mt-1">
              {IMPORTANCE.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        {/* Cost */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
            <DollarSign size={12} className="text-[#FF4D6A]" /> Chi phí
          </label>
          <div className="relative mt-1">
            <input type="text" value={costDisplay} onChange={handleCostChange}
              className="input-ios w-full pr-12" placeholder="1.000.000" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#8E8E93] font-medium">VNĐ</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Ghi chú</label>
          <textarea value={form.Notes} onChange={(e) => update('Notes', e.target.value)}
            className="input-ios mt-1 min-h-[80px] resize-none" placeholder="Ghi chú..." />
        </div>

        {error && <p className="text-[13px] text-[#E6002D] text-center bg-[#E6002D]/5 rounded-[10px] py-2">{error}</p>}

        <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }}
          className="btn-ios-primary w-full h-[48px] text-[14px]">
          {saving ? 'Đang lưu...' : 'Thêm sự kiện'}
        </motion.button>
      </form>
    </Modal>
  );
}
