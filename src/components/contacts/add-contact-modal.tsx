'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { contactService } from '@/lib/services/contact-service';
import { useAppStore } from '@/stores/app-store';
import type { Relationship } from '@/types/database';

const RELATIONSHIPS = ['Family', 'Relative', 'Friend', 'Colleague', 'Neighbor', 'Teacher', 'Partner', 'Other'] as const;
const GENDERS = ['Male', 'Female', 'Other'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddContactModal({ open, onClose }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [form, setForm] = useState({
    Name: '',
    Relationship: 'Friend',
    Gender: '' as string,
    Birthday: '',
    Phone: '',
    Email: '',
    Organization1: '',
    Organization2: '',
    RelationshipScore: 50,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.Name.trim()) { setError('Vui lòng nhập tên'); return; }
    setSaving(true);
    setError('');
    try {
      await contactService.create({
        Name: form.Name.trim(),
        Relationship: form.Relationship as Relationship,
        Gender: (form.Gender || undefined) as 'Male' | 'Female' | 'Other' | undefined,
        Birthday: form.Birthday || undefined,
        Phone: form.Phone || undefined,
        Email: form.Email || undefined,
        Organization1: form.Organization1 || undefined,
        Organization2: form.Organization2 || undefined,
        RelationshipScore: form.RelationshipScore,
      });
      triggerRefresh();
      onClose();
      setForm({ Name: '', Relationship: 'Friend', Gender: '', Birthday: '', Phone: '', Email: '', Organization1: '', Organization2: '', RelationshipScore: 50 });
    } catch (e: any) {
      setError(e.message || 'Lỗi khi thêm');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Modal open={open} onClose={onClose} title="Thêm quan hệ mới">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Họ tên *</label>
          <input value={form.Name} onChange={(e) => update('Name', e.target.value)} className="input-ios mt-1" placeholder="Nguyễn Văn A" />
        </div>

        {/* Relationship + Gender row */}
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
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Ngày sinh</label>
            <input type="date" value={form.Birthday} onChange={(e) => update('Birthday', e.target.value)} className="input-ios mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Số điện thoại</label>
            <input value={form.Phone} onChange={(e) => update('Phone', e.target.value)} className="input-ios mt-1" placeholder="090..." />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Email</label>
          <input type="email" value={form.Email} onChange={(e) => update('Email', e.target.value)} className="input-ios mt-1" placeholder="email@example.com" />
        </div>

        {/* Organizations */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Tổ chức 1</label>
            <input value={form.Organization1} onChange={(e) => update('Organization1', e.target.value)} className="input-ios mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Tổ chức 2</label>
            <input value={form.Organization2} onChange={(e) => update('Organization2', e.target.value)} className="input-ios mt-1" />
          </div>
        </div>

        {/* Score */}
        <div>
          <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.3px]">Mức độ thân thiết: {form.RelationshipScore}</label>
          <input type="range" min={0} max={100} value={form.RelationshipScore} onChange={(e) => update('RelationshipScore', Number(e.target.value))} className="w-full mt-1 accent-[#E6002D]" />
        </div>

        {error && <p className="text-[13px] text-[#E6002D] text-center bg-[#E6002D]/5 rounded-[10px] py-2">{error}</p>}

        <motion.button
          type="submit"
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          className="btn-ios-primary w-full h-[48px] text-[14px]"
        >
          {saving ? 'Đang lưu...' : 'Thêm quan hệ'}
        </motion.button>
      </form>
    </Modal>
  );
}
