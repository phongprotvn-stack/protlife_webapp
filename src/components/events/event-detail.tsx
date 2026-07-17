'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { eventService } from '@/lib/services/event-service';
import type { EventItem } from '@/types/database';
import { formatDate, getMoodEmoji, getImportanceColor } from '@/lib/utils';
import { Calendar, MapPin, DollarSign, Users, FileText, Clock, Tag, Heart, Edit3, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props { eventId: string | null; onClose: () => void; }

const EVENT_TYPES = ['Meeting', 'Birthday', 'Travel', 'Work', 'Sport', 'Hospital', 'Meal', 'Call', 'Shopping', 'Study', 'Party', 'Date', 'Entertainment', 'Other'] as const;
const MOODS = ['Happy', 'Normal', 'Sad', 'Excited', 'Tired', 'Angry', 'Thoughtful', 'Loved'] as const;
const IMPORTANCE = ['Lowest', 'Low', 'Medium', 'High', 'Highest'] as const;
const LIFE_STAGES = ['Infancy', 'Childhood', 'Secondary School', 'High School', 'University', 'Early Career', 'Mid Career', 'Mature Career', 'Retirement'] as const;

export function EventDetail({ eventId, onClose }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Edit form
  const [form, setForm] = useState({
    Title: '', EventType: '', LifeStage: '', StartDate: '', EndDate: '', Place: '',
    Mood: '', Importance: '', Cost: 0, Notes: '',
  });

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    eventService.getById(eventId).then((data) => {
      setEvent(data);
      if (data) {
        setForm({
          Title: data.Title, EventType: data.EventType, LifeStage: data.LifeStage || '',
          StartDate: data.StartDate, EndDate: data.EndDate || '', Place: data.Place || '',
          Mood: data.Mood || '', Importance: data.Importance || 'Medium', Cost: data.Cost || 0, Notes: data.Notes || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    setEditMode(false); setConfirmDelete(false); setError('');
  }, [eventId]);

  const handleSave = async () => {
    if (!event || !eventId) return;
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      await eventService.update(eventId, {
        Title: form.Title.trim(),
        EventType: form.EventType as any,
        LifeStage: form.LifeStage ? (form.LifeStage as any) : undefined,
        StartDate: form.StartDate,
        EndDate: form.EndDate || undefined,
        Place: form.Place || undefined,
        Mood: form.Mood ? (form.Mood as any) : undefined,
        Importance: form.Importance as any,
        Cost: form.Cost,
        Notes: form.Notes || undefined,
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

  if (!eventId) return null;

  return (
    <Modal open={!!eventId} onClose={onClose} title="" maxWidth="420px">
      {loading ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : event ? (
        <div>
          {/* Header buttons */}
          <div className="flex justify-end gap-2 mb-2">
            {!editMode ? (
              <>
                <button onClick={() => setEditMode(true)} className="p-2 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#E6002D]">
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setEditMode(false); setError(''); }}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6B7280] bg-[rgba(0,0,0,0.04)]">Huỷ</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-white bg-[#E6002D]">
                  {saving ? '...' : 'Lưu'}
                </button>
              </div>
            )}
          </div>

          {/* Confirm delete */}
          {confirmDelete && (
            <div className="mb-4 p-3 rounded-[12px] bg-[#E6002D]/5 text-center">
              <p className="text-[13px] text-[#E6002D] font-medium mb-3">Bạn có chắc muốn xoá?</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setConfirmDelete(false)}
                  className="px-4 py-1.5 rounded-[8px] text-[12px] font-medium text-[#6B7280] bg-[rgba(0,0,0,0.04)]">Không</button>
                <button onClick={handleDelete}
                  className="px-4 py-1.5 rounded-[8px] text-[12px] font-medium text-white bg-[#E6002D]">Xoá</button>
              </div>
            </div>
          )}

          {error && <p className="mb-3 text-[12px] text-[#E6002D] text-center">{error}</p>}

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-[60px] h-[68px] rounded-[16px] bg-[#E6002D]/10 mx-auto mb-3 flex flex-col items-center justify-center">
              <span className="text-[24px] font-bold text-[#E6002D] leading-none">
                {new Date(event.StartDate).getDate()}
              </span>
              <span className="text-[10px] font-medium text-[#E6002D]/70 mt-0.5">
                {new Date(event.StartDate).toLocaleDateString('vi-VN', { month: 'short' })}
              </span>
            </div>

            {editMode ? (
              <div className="space-y-2">
                <input value={form.Title} onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))}
                  className="input-ios text-center text-[18px] font-bold" />
                <div className="flex items-center justify-center gap-2">
                  <select value={form.EventType} onChange={(e) => setForm((f) => ({ ...f, EventType: e.target.value }))}
                    className="input-ios text-[12px]">
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={form.Mood} onChange={(e) => setForm((f) => ({ ...f, Mood: e.target.value }))}
                    className="input-ios text-[12px]">
                    <option value="">Mood</option>
                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={form.Importance} onChange={(e) => setForm((f) => ({ ...f, Importance: e.target.value }))}
                    className="input-ios text-[12px]">
                    {IMPORTANCE.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[20px] font-bold text-[#111]">{event.Title}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[12px] px-[10px] py-[3px] rounded-full bg-[rgba(0,0,0,0.04)] text-[#6B7280] font-medium">
                    {event.EventType}
                  </span>
                  {event.Mood && <span className="text-[18px]">{getMoodEmoji(event.Mood)}</span>}
                  {event.Importance && (
                    <span className="text-[11px] font-semibold" style={{ color: getImportanceColor(event.Importance) }}>
                      ● {event.Importance}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          {!editMode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Calendar size={16} className="text-[#007AFF]" />
                <span className="text-[14px] text-[#111]">{formatDate(event.StartDate, 'ddmmyyyy')}</span>
                {event.EndDate && <span className="text-[13px] text-[#8E8E93] ml-1">→ {formatDate(event.EndDate, 'ddmmyyyy')}</span>}
              </div>
              {event.Place && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <MapPin size={16} className="text-[#FF9500]" />
                  <span className="text-[14px] text-[#111]">{event.Place}</span>
                </div>
              )}
              {event.LifeStage && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <Tag size={16} className="text-[#5856D6]" />
                  <span className="text-[14px] text-[#111]">{event.LifeStage}</span>
                </div>
              )}
              {event.Cost > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <DollarSign size={16} className="text-[#FF4D6A]" />
                  <span className="text-[14px] text-[#111]">{event.Cost.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              {event.ParticipantCount > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <Users size={16} className="text-[#34C759]" />
                  <span className="text-[14px] text-[#111]">{event.ParticipantCount} người tham gia</span>
                </div>
              )}
              {event.Notes && (
                <div className="p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[12px] font-medium text-[#8E8E93] mb-1 flex items-center gap-1">
                    <FileText size={13} /> Ghi chú
                  </p>
                  <p className="text-[14px] text-[#111] whitespace-pre-wrap">{event.Notes}</p>
                </div>
              )}
            </div>
          ) : (
            /* Edit form */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Loại</label>
                  <select value={form.EventType} onChange={(e) => setForm((f) => ({ ...f, EventType: e.target.value }))} className="input-ios mt-1">
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Giai đoạn</label>
                  <select value={form.LifeStage} onChange={(e) => setForm((f) => ({ ...f, LifeStage: e.target.value }))} className="input-ios mt-1">
                    <option value="">Chọn</option>
                    {LIFE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Ngày bắt đầu</label>
                  <input type="date" value={form.StartDate} onChange={(e) => setForm((f) => ({ ...f, StartDate: e.target.value }))} className="input-ios mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Ngày kết thúc</label>
                  <input type="date" value={form.EndDate} onChange={(e) => setForm((f) => ({ ...f, EndDate: e.target.value }))} className="input-ios mt-1" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Địa điểm</label>
                <input value={form.Place} onChange={(e) => setForm((f) => ({ ...f, Place: e.target.value }))} className="input-ios mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Cảm xúc</label>
                  <select value={form.Mood} onChange={(e) => setForm((f) => ({ ...f, Mood: e.target.value }))} className="input-ios mt-1">
                    <option value="">Không</option>
                    {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Mức độ</label>
                  <select value={form.Importance} onChange={(e) => setForm((f) => ({ ...f, Importance: e.target.value }))} className="input-ios mt-1">
                    {IMPORTANCE.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Chi phí</label>
                <input type="number" value={form.Cost} onChange={(e) => setForm((f) => ({ ...f, Cost: Number(e.target.value) }))} className="input-ios mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Ghi chú</label>
                <textarea value={form.Notes} onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))}
                  className="input-ios mt-1 min-h-[60px] resize-none" rows={2} />
              </div>
            </div>
          )}

          {/* Source */}
          {!editMode && event.Source && (
            <div className="mt-5 text-center">
              <span className="text-[11px] text-[#B0B0B8] font-medium">Nguồn: {event.Source}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-[#8E8E93] py-8">Không tìm thấy</p>
      )}
    </Modal>
  );
}
