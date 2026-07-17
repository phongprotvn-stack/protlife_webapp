'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Phone, Mail, Cake, Building2, StickyNote, Camera, X, Plus, Check, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/shared/modal';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import { cn, getInitials, getAvatarColor } from '@/lib/utils';
import type { Relationship, ContactStatus } from '@/types/database';

const RELATIONSHIPS: Relationship[] = ['Family', 'Relative', 'Friend', 'Colleague', 'Neighbor', 'Teacher', 'Partner', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'] as const;
const STATUSES: ContactStatus[] = ['Active', 'Lost Contact', 'Deceased', 'Blocked'];

// Preset organizations
const ORG1_PRESETS = ['9A', 'Bạn cao học', 'Bạn du lịch', 'Bạn đại học', 'Bạn kết nối', 'Bạn tìm hiểu', 'Bang hội', 'Gia đình', 'Họ hàng', 'Nghĩa Tân', 'PCRT', 'Quảng Trị', 'SBV', 'TN1', 'VCB'];
const ORG2_PRESETS = ['3 Musketeers', 'Bộ 3 Nguyên tử', 'Sư đoàn Mõm'];

const INITIAL_FORM = {
  Name: '', Relationship: 'Friend' as Relationship, Gender: '', Birthday: '', Phone: '', Email: '',
  Organization1: '', Organization2: '', RelationshipScore: 50, Status: 'Active' as ContactStatus, IsFavorite: false, Notes: '',
};

interface Props { open: boolean; onClose: () => void; }

// Score labels with ranges
const SCORE_LABELS = [
  { min: 90, max: 100, label: 'Ruột thịt', color: '#E6002D' },
  { min: 70, max: 89, label: 'Thâm tình', color: '#FF4D6A' },
  { min: 50, max: 69, label: 'Thân', color: '#FF9500' },
  { min: 30, max: 49, label: 'Bạn bè', color: '#007AFF' },
  { min: 1, max: 29, label: 'Quen biết', color: '#8E8E93' },
  { min: 0, max: 0, label: 'Chưa xác định', color: '#B0B0B8' },
];

function getActiveScoreLabel(score: number) {
  return SCORE_LABELS.find((l) => score >= l.min && score <= l.max) || SCORE_LABELS[SCORE_LABELS.length - 1];
}

// Combobox component for organization
function OrgCombobox({ value, onChange, presets, placeholder }: {
  value: string; onChange: (v: string) => void; presets: string[]; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customItems, setCustomItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = [...new Set([...presets, ...customItems])];
  const filtered = allItems.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (item: string) => {
    onChange(item);
    setOpen(false);
    setSearch('');
  };

  const handleAddCustom = () => {
    const trimmed = search.trim();
    if (trimmed && !allItems.includes(trimmed)) {
      setCustomItems((prev) => [...prev, trimmed]);
      onChange(trimmed);
      setOpen(false);
      setSearch('');
    }
  };

  const handleDelete = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    setCustomItems((prev) => prev.filter((i) => i !== item));
    if (value === item) onChange('');
  };

  const isCustom = (item: string) => customItems.includes(item);

  return (
    <div className="relative">
      {/* Display selected value or click to open */}
      <div
        onClick={() => setOpen(!open)}
        className="input-ios mt-1 flex items-center justify-between cursor-pointer min-h-[44px]"
      >
        <span className={value ? 'text-[#111]' : 'text-[#9CA3AF]'}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#8E8E93] transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {value && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#E6002D]/10 text-[#E6002D]">
            {value}
            <button onClick={() => onChange('')} className="hover:opacity-70"><X size={12} /></button>
          </span>
        </div>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-[12px] bg-white border border-[rgba(0,0,0,0.06)] shadow-lg max-h-[240px] overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-[rgba(0,0,0,0.04)]">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full h-[36px] px-3 rounded-[8px] bg-[rgba(0,0,0,0.04)] text-[13px] text-[#111] placeholder:text-[#9CA3AF] outline-none"
            />
          </div>
          {/* Items */}
          <div className="overflow-y-auto max-h-[160px] p-1">
            {filtered.map((item) => (
              <div
                key={item}
                onClick={() => handleSelect(item)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] cursor-pointer hover:bg-[rgba(0,0,0,0.04)]',
                  value === item && 'bg-[#E6002D]/5 text-[#E6002D] font-medium'
                )}
              >
                <span>{item}</span>
                <div className="flex items-center gap-1">
                  {value === item && <Check size={14} className="text-[#E6002D]" />}
                  {isCustom(item) && (
                    <button onClick={(e) => handleDelete(e, item)} className="p-0.5 hover:bg-[rgba(0,0,0,0.06)] rounded">
                      <X size={12} className="text-[#8E8E93]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {search.trim() && !filtered.includes(search.trim()) && (
              <button
                onClick={handleAddCustom}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] text-[#007AFF] hover:bg-[rgba(0,0,255,0.04)] cursor-pointer"
              >
                <Plus size={14} />
                Thêm "{search.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AddContactModal({ open, onClose }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));
  const resetForm = () => { setForm({ ...INITIAL_FORM }); setAvatarDataUrl(null); };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim()) { setError('Vui lòng nhập tên'); return; }
    setSaving(true); setError('');
    try {
      await contactService.create({
        Name: form.Name.trim(),
        Relationship: form.Relationship,
        Gender: (form.Gender || undefined) as 'Male' | 'Female' | 'Other' | undefined,
        Birthday: form.Birthday || undefined,
        Phone: form.Phone || undefined,
        Email: form.Email || undefined,
        Organization1: form.Organization1 || undefined,
        Organization2: form.Organization2 || undefined,
        RelationshipScore: form.RelationshipScore ?? 50,
        Status: form.Status ?? 'Active',
        IsFavorite: form.IsFavorite ?? false,
        Avatar: avatarDataUrl || undefined,
        Notes: form.Notes || undefined,
      });
      triggerRefresh(); onClose(); resetForm();
    } catch (e: any) { setError(e.message || 'Lỗi khi thêm'); }
    finally { setSaving(false); }
  };

  const activeLabel = getActiveScoreLabel(form.RelationshipScore ?? 0);

  return (
    <Modal open={open} onClose={onClose} title="Thêm quan hệ mới" maxWidth="500px">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Upload */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-[28px] cursor-pointer overflow-hidden"
              style={{ backgroundColor: avatarDataUrl ? 'transparent' : getAvatarColor(form.Name || '?') }}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(form.Name || '?')
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Họ tên *</label>
          <input value={form.Name} onChange={(e) => update('Name', e.target.value)} className="input-ios mt-1" placeholder="Nguyễn Văn A" />
        </div>

        {/* Relationship + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Mối quan hệ</label>
            <select value={form.Relationship} onChange={(e) => update('Relationship', e.target.value)} className="input-ios mt-1">
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Giới tính</label>
            <select value={form.Gender} onChange={(e) => update('Gender', e.target.value)} className="input-ios mt-1">
              <option value="">Chọn</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g === 'Male' ? 'Nam' : g === 'Female' ? 'Nữ' : 'Khác'}</option>)}
            </select>
          </div>
        </div>

        {/* Birthday + Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
              <Cake size={12} className="text-[#FF9500]" /> Ngày sinh
            </label>
            <input type="date" value={form.Birthday} onChange={(e) => update('Birthday', e.target.value)} className="input-ios mt-1" />
            {form.Birthday && (
              <p className="text-[11px] text-[#8E8E93] mt-0.5">
                {new Date(form.Birthday).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
              <Phone size={12} className="text-[#34C759]" /> Số điện thoại
            </label>
            <input value={form.Phone} onChange={(e) => update('Phone', e.target.value)} className="input-ios mt-1" placeholder="090..." />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
            <Mail size={12} className="text-[#007AFF]" /> Email
          </label>
          <input type="email" value={form.Email} onChange={(e) => update('Email', e.target.value)} className="input-ios mt-1" placeholder="email@example.com" />
        </div>

        {/* Organization 1 - Combobox */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
            <Building2 size={12} className="text-[#5856D6]" /> Tổ chức 1
          </label>
          <OrgCombobox value={form.Organization1 || ''} onChange={(v) => update('Organization1', v)} presets={ORG1_PRESETS} placeholder="Chọn tổ chức..." />
        </div>

        {/* Organization 2 - Combobox */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
            <Building2 size={12} className="text-[#5856D6]" /> Tổ chức 2
          </label>
          <OrgCombobox value={form.Organization2 || ''} onChange={(v) => update('Organization2', v)} presets={ORG2_PRESETS} placeholder="Chọn tổ chức..." />
        </div>

        {/* Relationship Score */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">
            Mức độ thân thiết: {form.RelationshipScore}
          </label>
          <input type="range" min={0} max={100} value={form.RelationshipScore}
            onChange={(e) => update('RelationshipScore', Number(e.target.value))}
            className="w-full mt-1 accent-[#E6002D]" />
          {/* Score labels as cards */}
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {SCORE_LABELS.slice(0, 3).map((l) => (
              <div key={l.label} className={cn(
                'rounded-[8px] px-2 py-1.5 text-center transition-all duration-200 border',
                activeLabel.label === l.label
                  ? 'border-transparent text-white'
                  : 'border-[rgba(0,0,0,0.04)] text-[#8E8E93] bg-[rgba(0,0,0,0.02)]'
              )}
                style={activeLabel.label === l.label ? { backgroundColor: l.color } : {}}
              >
                <p className="text-[11px] font-semibold">{l.label}</p>
                <p className="text-[9px] opacity-70">{l.min}-{l.max}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {SCORE_LABELS.slice(3, 6).map((l) => (
              <div key={l.label} className={cn(
                'rounded-[8px] px-2 py-1.5 text-center transition-all duration-200 border',
                activeLabel.label === l.label
                  ? 'border-transparent text-white'
                  : 'border-[rgba(0,0,0,0.04)] text-[#8E8E93] bg-[rgba(0,0,0,0.02)]'
              )}
                style={activeLabel.label === l.label ? { backgroundColor: l.color } : {}}
              >
                <p className="text-[11px] font-semibold">{l.label}</p>
                <p className="text-[9px] opacity-70">{l.min === l.max ? '0' : `${l.min}-${l.max}`}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status + Favorite */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Trạng thái</label>
            <select value={form.Status} onChange={(e) => update('Status', e.target.value)} className="input-ios mt-1">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'Active' ? 'Đang liên lạc' : s === 'Lost Contact' ? 'Mất liên lạc' : s === 'Deceased' ? 'Đã mất' : 'Chặn'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-[3px]">
            <button type="button" onClick={() => update('IsFavorite', !form.IsFavorite)}
              className={cn(
                'w-full h-[44px] rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-all duration-200',
                form.IsFavorite ? 'bg-[#E6002D]/10 text-[#E6002D]' : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280] hover:bg-[rgba(0,0,0,0.08)]'
              )}
            >
              <Heart size={16} className={form.IsFavorite ? 'fill-[#E6002D] text-[#E6002D]' : ''} />
              {form.IsFavorite ? 'Yêu thích' : 'Yêu thích?'}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px] flex items-center gap-1">
            <StickyNote size={12} className="text-[#8E8E93]" /> Ghi chú
          </label>
          <textarea value={form.Notes} onChange={(e) => update('Notes', e.target.value)}
            className="input-ios mt-1 min-h-[72px] resize-none" placeholder="Ghi chú về người này..." rows={3} />
        </div>

        {error && <p className="text-[13px] text-[#E6002D] text-center bg-[#E6002D]/5 rounded-[10px] py-2">{error}</p>}

        <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }}
          className="btn-ios-primary w-full h-[48px] text-[14px]">
          {saving ? 'Đang lưu...' : 'Thêm quan hệ'}
        </motion.button>
      </form>
    </Modal>
  );
}
