'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { contactService } from '@/lib/services/contact-service';
import type { Contact } from '@/types/database';
import {
  formatDate, getAvatarColor, getInitials, calculateAge,
  getRelationshipLabel, getRelationshipColor
} from '@/lib/utils';
import {
  Heart, Phone, Mail, Building2, Cake, Users, Award, Edit3, Trash2, Camera, X
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props {
  contactId: string | null;
  onClose: () => void;
  panelMode?: boolean;
}

const RELATIONSHIPS = ['Family', 'Relative', 'Friend', 'Colleague', 'Neighbor', 'Teacher', 'Partner', 'Other'] as const;
const GENDERS = ['Male', 'Female', 'Other'] as const;
const STATUSES = ['Active', 'Lost Contact', 'Deceased', 'Blocked'] as const;

export function ContactDetail({ contactId, onClose, panelMode }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    Name: '', Relationship: '', Gender: '', Birthday: '', Phone: '', Email: '',
    Organization1: '', Organization2: '', RelationshipScore: 50, Status: '', IsFavorite: false, Avatar: '', Notes: '',
  });

  useEffect(() => {
    if (!contactId) return;
    setLoading(true);
    contactService.getById(contactId).then((data) => {
      setContact(data);
      if (data) {
        setForm({
          Name: data.Name, Relationship: data.Relationship, Gender: data.Gender || '',
          Birthday: data.Birthday || '', Phone: data.Phone || '', Email: data.Email || '',
          Organization1: data.Organization1 || '', Organization2: data.Organization2 || '',
          RelationshipScore: data.RelationshipScore || 50, Status: data.Status || 'Active',
          IsFavorite: data.IsFavorite || false, Avatar: data.Avatar || '', Notes: data.Notes || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    setEditMode(false); setConfirmDelete(false); setError('');
  }, [contactId]);

  const handleSave = async () => {
    if (!contact || !contactId) return;
    if (!form.Name.trim()) { setError('Vui lòng nhập tên'); return; }
    setSaving(true); setError('');
    try {
      await contactService.update(contactId, {
        Name: form.Name.trim(), Relationship: form.Relationship as any,
        Gender: (form.Gender || undefined) as any, Birthday: form.Birthday || undefined,
        Phone: form.Phone || undefined, Email: form.Email || undefined,
        Organization1: form.Organization1 || undefined, Organization2: form.Organization2 || undefined,
        RelationshipScore: form.RelationshipScore, Status: form.Status as any,
        IsFavorite: form.IsFavorite, Avatar: form.Avatar || undefined, Notes: form.Notes || undefined,
      });
      triggerRefresh();
      setEditMode(false);
      const data = await contactService.getById(contactId);
      setContact(data);
    } catch (e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!contactId) return;
    try {
      await contactService.delete(contactId);
      triggerRefresh();
      onClose();
    } catch (e: any) { setError(e.message || 'Lỗi khi xoá'); }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, Avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const content = (
    <div className={panelMode ? '' : ''}>
      {/* Header buttons */}
      <div className="flex items-center justify-between mb-4">
        {panelMode && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
            <X size={16} />
          </button>
        )}
        <div className="flex gap-1 ml-auto">
          {!editMode ? (
            <>
              <button onClick={() => setEditMode(true)}
                className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                <Edit3 size={14} />
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#E6002D]">
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
        <div className="mb-4 p-3 rounded-[12px] bg-[#E6002D]/5 text-center">
          <p className="text-[13px] text-[#E6002D] font-medium mb-3">Bạn có chắc muốn xoá?</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setConfirmDelete(false)}
              className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-[#6B7280] bg-[rgba(0,0,0,0.04)]">Không</button>
            <button onClick={handleDelete}
              className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">Xoá</button>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-[11px] text-[#E6002D] text-center">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center py-8">
          <div className="w-6 h-6 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-2" />
          <p className="text-[12px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : contact ? (
        <>
          {/* Avatar + Name */}
          <div className="text-center mb-5">
            {editMode ? (
              <div className="relative inline-block">
                <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-white font-bold text-[24px] mx-auto cursor-pointer overflow-hidden"
                  style={{ backgroundColor: form.Avatar ? 'transparent' : getAvatarColor(form.Name || '?') }}
                  onClick={() => fileInputRef.current?.click()}>
                  {form.Avatar ? <img src={form.Avatar} alt="" className="w-full h-full object-cover" />
                    : getInitials(form.Name || '?')}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full">
                    <Camera size={18} className="text-white" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            ) : (
              <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-white font-bold text-[24px] mx-auto mb-2"
                style={{ backgroundColor: getAvatarColor(contact.Name) }}>
                {getInitials(contact.Name)}
              </div>
            )}

            {editMode ? (
              <div className="space-y-2">
                <input value={form.Name} onChange={(e) => setForm((f) => ({ ...f, Name: e.target.value }))}
                  className="input-glass text-center text-[18px] font-bold" />
                <div className="flex justify-center gap-2">
                  <select value={form.Relationship} onChange={(e) => setForm((f) => ({ ...f, Relationship: e.target.value }))}
                    className="input-glass text-[12px] w-auto">
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-[#111]">{contact.Name}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[12px] text-[#6B7280]">{contact.Relationship}</span>
                  <span className="w-[3px] h-[3px] rounded-full bg-[#D1D5DB]" />
                  <span className="text-[11px] font-medium" style={{ color: getRelationshipColor(contact.RelationshipScore) }}>
                    {getRelationshipLabel(contact.RelationshipScore)}
                  </span>
                  {contact.IsFavorite && <Heart size={12} className="text-[#E6002D] fill-[#E6002D]" />}
                </div>
              </>
            )}
          </div>

          {/* Info */}
          {!editMode ? (
            <div className="space-y-2">
              <InfoRow icon={<Cake size={14} className="text-[#FF9500]" />}
                label={contact.Birthday ? `${formatDate(contact.Birthday, 'ddmmyyyy')} (${calculateAge(contact.Birthday)} tuổi)` : ''} />
              <InfoRow icon={<Users size={14} className="text-[#5856D6]" />}
                label={contact.Gender ? (contact.Gender === 'Male' ? 'Nam' : contact.Gender === 'Female' ? 'Nữ' : 'Khác') : ''} />
              <InfoRow icon={<Phone size={14} className="text-[#34C759]" />} label={contact.Phone || ''} link={`tel:${contact.Phone}`} />
              <InfoRow icon={<Mail size={14} className="text-[#007AFF]" />} label={contact.Email || ''} link={`mailto:${contact.Email}`} />
              {(contact.Organization1 || contact.Organization2) && (
                <InfoRow icon={<Building2 size={14} className="text-[#5856D6]" />}
                  label={[contact.Organization1, contact.Organization2].filter(Boolean).join(' · ')} />
              )}
              {contact.Notes && (
                <div className="p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[11px] text-[#8E8E93] mb-1">Ghi chú</p>
                  <p className="text-[13px] text-[#111] whitespace-pre-wrap">{contact.Notes}</p>
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-1 justify-center">
                <span className={`w-1.5 h-1.5 rounded-full ${contact.Status === 'Active' ? 'bg-[#34C759]' : contact.Status === 'Lost Contact' ? 'bg-[#FF9500]' : 'bg-[#8E8E93]'}`} />
                <span className="text-[11px] text-[#8E8E93]">{contact.Status}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Giới tính</label>
                  <select value={form.Gender} onChange={(e) => setForm((f) => ({ ...f, Gender: e.target.value }))} className="input-glass text-[13px]">
                    <option value="">Chọn</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g === 'Male' ? 'Nam' : g === 'Female' ? 'Nữ' : 'Khác'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Ngày sinh</label>
                  <input type="date" value={form.Birthday} onChange={(e) => setForm((f) => ({ ...f, Birthday: e.target.value }))} className="input-glass text-[13px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">SĐT</label>
                  <input value={form.Phone} onChange={(e) => setForm((f) => ({ ...f, Phone: e.target.value }))} className="input-glass text-[13px]" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Email</label>
                  <input value={form.Email} onChange={(e) => setForm((f) => ({ ...f, Email: e.target.value }))} className="input-glass text-[13px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Tổ chức 1</label>
                  <input value={form.Organization1} onChange={(e) => setForm((f) => ({ ...f, Organization1: e.target.value }))} className="input-glass text-[13px]" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Tổ chức 2</label>
                  <input value={form.Organization2} onChange={(e) => setForm((f) => ({ ...f, Organization2: e.target.value }))} className="input-glass text-[13px]" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Mức độ: {form.RelationshipScore}</label>
                <input type="range" min={0} max={100} value={form.RelationshipScore}
                  onChange={(e) => setForm((f) => ({ ...f, RelationshipScore: Number(e.target.value) }))} className="w-full accent-[#E6002D]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Trạng thái</label>
                  <select value={form.Status} onChange={(e) => setForm((f) => ({ ...f, Status: e.target.value }))} className="input-glass text-[13px]">
                    {STATUSES.map((s) => <option key={s} value={s}>{s === 'Active' ? 'Đang liên lạc' : s === 'Lost Contact' ? 'Mất liên lạc' : s === 'Deceased' ? 'Đã mất' : 'Chặn'}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-[3px]">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, IsFavorite: !f.IsFavorite }))}
                    className={`w-full h-[42px] rounded-[10px] flex items-center justify-center gap-1.5 text-[12px] font-semibold transition-all ${form.IsFavorite ? 'bg-[#E6002D]/10 text-[#E6002D]' : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280]'}`}>
                    <Heart size={14} className={form.IsFavorite ? 'fill-[#E6002D]' : ''} />
                    {form.IsFavorite ? 'Yêu thích' : 'Yêu thích?'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Ghi chú</label>
                <textarea value={form.Notes} onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))}
                  className="input-glass text-[13px] min-h-[56px]" rows={2} />
              </div>
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
    <Modal open={!!contactId} onClose={onClose} title="" maxWidth="420px">
      {content}
    </Modal>
  );
}

function InfoRow({ icon, label, link }: { icon: React.ReactNode; label: string; link?: string }) {
  if (!label) return null;
  const inner = (
    <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
      {icon}
      <span className="text-[13px] text-[#111]">{label}</span>
    </div>
  );
  if (link) return <a href={link} className="block no-underline">{inner}</a>;
  return inner;
}
