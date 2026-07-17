'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { eventService } from '@/lib/services/event-service';
import { participantService } from '@/lib/services/participant-service';
import type { EventItem } from '@/types/database';
import type { EventParticipant } from '@/lib/services/participant-service';
import { formatDate, getMoodEmoji, getImportanceColor } from '@/lib/utils';
import { Calendar, MapPin, DollarSign, Users, FileText, Clock, Tag, Heart, Edit3, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props { eventId: string | null; onClose: () => void; panelMode?: boolean; }

const EVENT_TYPES = ['Meeting', 'Birthday', 'Travel', 'Work', 'Sport', 'Hospital', 'Meal', 'Call', 'Shopping', 'Study', 'Party', 'Date', 'Entertainment', 'Other'] as const;
const MOODS = ['Happy', 'Normal', 'Sad', 'Excited', 'Tired', 'Angry', 'Thoughtful', 'Loved'] as const;
const IMPORTANCE = ['Lowest', 'Low', 'Medium', 'High', 'Highest'] as const;
const LIFE_STAGES = ['Infancy', 'Childhood', 'Secondary School', 'High School', 'University', 'Early Career', 'Mid Career', 'Mature Career', 'Retirement'] as const;

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
    Title: '', EventType: '', LifeStage: '', StartDate: '', EndDate: '', Place: '',
    Mood: '', Importance: '', Cost: 0, Notes: '',
  });

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);

    const load = async () => {
      try {
        const [eventData, participantData] = await Promise.all([
          eventService.getById(eventId),
          participantService.getByEventWithNames(eventId),
        ]);
        setEvent(eventData);
        setParticipants(participantData);
        if (eventData) {
          setForm({
            Title: eventData.Title, EventType: eventData.EventType, LifeStage: eventData.LifeStage || '',
            StartDate: eventData.StartDate, EndDate: eventData.EndDate || '', Place: eventData.Place || '',
            Mood: eventData.Mood || '', Importance: eventData.Importance || 'Medium', Cost: eventData.Cost || 0, Notes: eventData.Notes || '',
          });
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();

    setEditMode(false); setConfirmDelete(false); setError(''); setParticipants([]);
  }, [eventId]);

  const handleSave = async () => {
    if (!event || !eventId) return;
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      await eventService.update(eventId, {
        Title: form.Title.trim(), EventType: form.EventType as any,
        LifeStage: form.LifeStage ? (form.LifeStage as any) : undefined,
        StartDate: form.StartDate, EndDate: form.EndDate || undefined,
        Place: form.Place || undefined, Mood: form.Mood ? (form.Mood as any) : undefined,
        Importance: form.Importance as any, Cost: form.Cost, Notes: form.Notes || undefined,
      });
      triggerRefresh();
      setEditMode(false);
      const data = await eventService.getById(eventId);
      setEvent(data);
    } catch (e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    try {
      await eventService.delete(eventId);
      triggerRefresh();
      onClose();
    } catch (e: any) { setError(e.message || 'Lỗi khi xoá'); }
  };

  const content = (
    <div>
      {/* Header buttons */}
      <div className="flex items-center justify-between mb-3">
        {panelMode && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
            <X size={16} />
          </button>
        )}
        <div className="flex gap-1 ml-auto">
          {!editMode ? (
            <>
              <button onClick={() => setEditMode(true)} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                <Edit3 size={14} />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#E6002D]">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditMode(false); setError(''); }}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#6B7280] bg-[rgba(0,0,0,0.04)]">Huỷ</button>
              <button onClick={handleSave} disabled={saving}
                className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">
                {saving ? '...' : 'Lưu'}
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="mb-3 p-3 rounded-[12px] bg-[#E6002D]/5 text-center">
          <p className="text-[13px] text-[#E6002D] font-medium mb-3">Bạn có chắc muốn xoá?</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setConfirmDelete(false)}
              className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-[#6B7280] bg-[rgba(0,0,0,0.04)]">Không</button>
            <button onClick={handleDelete}
              className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">Xoá</button>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-[12px] text-[#E6002D] text-center">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center py-8">
          <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-2" />
          <p className="text-[12px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : event ? (
        <>
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-[52px] h-[60px] rounded-[14px] bg-[#E6002D]/10 mx-auto mb-3 flex flex-col items-center justify-center">
              <span className="text-[20px] font-bold text-[#E6002D] leading-none">
                {new Date(event.StartDate).getDate()}
              </span>
              <span className="text-[9px] font-medium text-[#E6002D]/70 mt-0.5">
                {new Date(event.StartDate).toLocaleDateString('vi-VN', { month: 'short' })}
              </span>
            </div>

            {editMode ? (
              <div className="space-y-2">
                <input value={form.Title} onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))}
                  className="input-glass text-center text-[17px] font-bold" />
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <select value={form.EventType} onChange={(e) => setForm((f) => ({ ...f, EventType: e.target.value }))}
                    className="input-glass text-[11px] w-auto">
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={form.Mood} onChange={(e) => setForm((f) => ({ ...f, Mood: e.target.value }))}
                    className="input-glass text-[11px] w-auto">
                    <option value="">Mood</option>
                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={form.Importance} onChange={(e) => setForm((f) => ({ ...f, Importance: e.target.value }))}
                    className="input-glass text-[11px] w-auto">
                    {IMPORTANCE.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-[#111]">{event.Title}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[11px] px-[10px] py-[3px] rounded-full bg-[rgba(0,0,0,0.04)] text-[#6B7280] font-medium">
                    {event.EventType}
                  </span>
                  {event.Mood && <span className="text-[16px]">{getMoodEmoji(event.Mood)}</span>}
                  {event.Importance && (
                    <span className="text-[10px] font-semibold" style={{ color: getImportanceColor(event.Importance) }}>
                      ● {event.Importance}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          {!editMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                <Calendar size={14} className="text-[#007AFF]" />
                <span className="text-[13px] text-[#111]">{formatDate(event.StartDate, 'ddmmyyyy')}</span>
                {event.EndDate && <span className="text-[12px] text-[#8E8E93]">→ {formatDate(event.EndDate, 'ddmmyyyy')}</span>}
              </div>
              {event.Place && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <MapPin size={14} className="text-[#FF9500]" />
                  <span className="text-[13px] text-[#111]">{event.Place}</span>
                </div>
              )}
              {event.LifeStage && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <Tag size={14} className="text-[#5856D6]" />
                  <span className="text-[13px] text-[#111]">{event.LifeStage}</span>
                </div>
              )}
              {event.Cost > 0 && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <DollarSign size={14} className="text-[#FF4D6A]" />
                  <span className="text-[13px] text-[#111]">{event.Cost.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              {participants.length > 0 && (
                <div className="p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[11px] font-medium text-[#8E8E93] mb-1.5 flex items-center gap-1">
                    <Users size={12} className="text-[#34C759]" /> Người tham gia
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {participants.map((p) => (
                      <span key={p.ContactID}
                        className="inline-flex items-center gap-1 px-[8px] py-[3px] rounded-full bg-[rgba(52,199,89,0.1)] text-[11px] font-medium text-[#2C8E4A]">
                        {p.ContactName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {event.Notes && (
                <div className="p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[11px] font-medium text-[#8E8E93] mb-1 flex items-center gap-1">
                    <FileText size={12} /> Ghi chú
                  </p>
                  <p className="text-[13px] text-[#111] whitespace-pre-wrap">{event.Notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Loại</label>
                  <select value={form.EventType} onChange={(e) => setForm((f) => ({ ...f, EventType: e.target.value }))} className="input-glass text-[12px]">
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Giai đoạn</label>
                  <select value={form.LifeStage} onChange={(e) => setForm((f) => ({ ...f, LifeStage: e.target.value }))} className="input-glass text-[12px]">
                    <option value="">Chọn</option>
                    {LIFE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Bắt đầu</label>
                  <input type="date" value={form.StartDate} onChange={(e) => setForm((f) => ({ ...f, StartDate: e.target.value }))} className="input-glass text-[12px]" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Kết thúc</label>
                  <input type="date" value={form.EndDate} onChange={(e) => setForm((f) => ({ ...f, EndDate: e.target.value }))} className="input-glass text-[12px]" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Địa điểm</label>
                <input value={form.Place} onChange={(e) => setForm((f) => ({ ...f, Place: e.target.value }))} className="input-glass text-[12px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Cảm xúc</label>
                  <select value={form.Mood} onChange={(e) => setForm((f) => ({ ...f, Mood: e.target.value }))} className="input-glass text-[12px]">
                    <option value="">Không</option>
                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Mức độ</label>
                  <select value={form.Importance} onChange={(e) => setForm((f) => ({ ...f, Importance: e.target.value }))} className="input-glass text-[12px]">
                    {IMPORTANCE.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Chi phí</label>
                <input type="number" value={form.Cost} onChange={(e) => setForm((f) => ({ ...f, Cost: Number(e.target.value) }))} className="input-glass text-[12px]" />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Ghi chú</label>
                <textarea value={form.Notes} onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))}
                  className="input-glass text-[12px] min-h-[50px]" rows={2} />
              </div>
            </div>
          )}

          {!editMode && event.Source && (
            <div className="mt-4 text-center">
              <span className="text-[10px] text-[#B0B0B8] font-medium">Nguồn: {event.Source}</span>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-[#8E8E93] py-6 text-[13px]">Không tìm thấy</p>
      )}
    </div>
  );

  if (panelMode) {
    return <div className="panel-detail">{content}</div>;
  }

  return (
    <Modal open={!!eventId} onClose={onClose} title="" maxWidth="420px">
      {content}
    </Modal>
  );
}
