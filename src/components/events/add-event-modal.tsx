'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { eventService } from '@/lib/services/event-service';
import { useAppStore } from '@/stores/app-store';

const EVENT_TYPES = ['Meeting', 'Birthday', 'Travel', 'Work', 'Sport', 'Hospital', 'Meal', 'Call', 'Shopping', 'Study', 'Party', 'Date', 'Entertainment', 'Other'] as const;
const MOODS = ['Happy', 'Normal', 'Sad', 'Excited', 'Tired', 'Angry', 'Thoughtful', 'Loved'] as const;
const IMPORTANCE = ['Lowest', 'Low', 'Medium', 'High', 'Highest'] as const;
const LIFE_STAGES = ['Infancy', 'Childhood', 'Secondary School', 'High School', 'University', 'Early Career', 'Mid Career', 'Mature Career', 'Retirement'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddEventModal({ open, onClose }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [form, setForm] = useState({
    Title: '',
    EventType: 'Meeting',
    StartDate: new Date().toISOString().split('T')[0],
    EndDate: '',
    Place: '',
    Mood: '',
    Importance: 'Medium' as string,
    LifeStage: '' as string,
    ParticipantCount: 0,
    Cost: 0,
    Notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    if (!form.StartDate) { setError('Vui lòng chọn ngày'); return; }
    setSaving(true);
    setError('');
    try {
      await eventService.create({
        Title: form.Title.trim(),
        EventType: form.EventType as any,
        StartDate: form.StartDate,
        EndDate: form.EndDate || undefined,
        Place: form.Place || undefined,
        Mood: form.Mood ? (form.Mood as any) : undefined,
        Importance: form.Importance as any,
        LifeStage: form.LifeStage ? (form.LifeStage as any) : undefined,
        ParticipantCount: form.ParticipantCount,
        Cost: form.Cost,
        Notes: form.Notes || undefined,
      });
      triggerRefresh();
      onClose();
      setForm({ Title: '', EventType: 'Meeting', StartDate: new Date().toISOString().split('T')[0], EndDate: '', Place: '', Mood: '', Importance: 'Medium', LifeStage: '', ParticipantCount: 0, Cost: 0, Notes: '' });
    } catch (e: any) {
      setError(e.message || 'Lỗi khi thêm');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Modal open={open} onClose={onClose} title="Thêm sự kiện mới">
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
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Ngày kết thúc</label>
            <input type="date" value={form.EndDate} onChange={(e) => update('EndDate', e.target.value)} className="input-ios mt-1" />
          </div>
        </div>

        {/* Place */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Địa điểm</label>
          <input value={form.Place} onChange={(e) => update('Place', e.target.value)} className="input-ios mt-1" placeholder="Địa điểm..." />
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

        {/* Cost + Participants */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Chi phí (VNĐ)</label>
            <input type="number" value={form.Cost} onChange={(e) => update('Cost', Number(e.target.value))} className="input-ios mt-1" placeholder="0" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Số người tham gia</label>
            <input type="number" value={form.ParticipantCount} onChange={(e) => update('ParticipantCount', Number(e.target.value))} className="input-ios mt-1" placeholder="0" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Ghi chú</label>
          <textarea value={form.Notes} onChange={(e) => update('Notes', e.target.value)} className="input-ios mt-1 min-h-[80px] resize-none" placeholder="Ghi chú..." />
        </div>

        {error && <p className="text-[13px] text-[#E6002D] text-center bg-[#E6002D]/5 rounded-[10px] py-2">{error}</p>}

        <motion.button
          type="submit"
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          className="btn-ios-primary w-full h-[48px] text-[14px]"
        >
          {saving ? 'Đang lưu...' : 'Thêm sự kiện'}
        </motion.button>
      </form>
    </Modal>
  );
}
