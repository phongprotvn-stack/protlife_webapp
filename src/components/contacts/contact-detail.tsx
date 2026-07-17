'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/shared/modal';
import { contactService } from '@/lib/services/contact-service';
import type { Contact } from '@/types/database';
import { formatDate, getAvatarColor, getInitials, calculateAge, getRelationshipLabel, getRelationshipColor } from '@/lib/utils';
import { Heart, Phone, Mail, Building2, Cake, Users, MapPin, Calendar, Award, Edit3, Trash2, Camera, X, Check } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props { contactId: string | null; onClose: () => void; }

const RELATIONSHIPS = ['Family', 'Relative', 'Friend', 'Colleague', 'Neighbor', 'Teacher', 'Partner', 'Other'] as const;
const GENDERS = ['Male', 'Female', 'Other'] as const;
const STATUSES = ['Active', 'Lost Contact', 'Deceased', 'Blocked'] as const;

export function ContactDetail({ contactId, onClose }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
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
        Name: form.Name.trim(),
        Relationship: form.Relationship as any,
        Gender: (form.Gender || undefined) as any,
        Birthday: form.Birthday || undefined,
        Phone: form.Phone || undefined,
        Email: form.Email || undefined,
        Organization1: form.Organization1 || undefined,
        Organization2: form.Organization2 || undefined,
        RelationshipScore: form.RelationshipScore,
        Status: form.Status as any,
        IsFavorite: form.IsFavorite,
        Avatar: form.Avatar || undefined,
        Notes: form.Notes || undefined,
      });
      triggerRefresh();
      setEditMode(false);
      // Reload
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

  if (!contactId) return null;

  return (
    <Modal open={!!contactId} onClose={onClose} title="" maxWidth="420px">
      {loading ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-8 h-8 border-2 border-[#E6002D]/20 border-t-[#E6002D] rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-[#8E8E93]">Đang tải...</p>
        </div>
      ) : contact ? (
        <div>
          {/* Header with edit/delete buttons */}
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

          {/* Avatar + Name */}
          <div className="text-center mb-6">
            {editMode ? (
              <div className="relative inline-block">
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-[28px] mx-auto cursor-pointer overflow-hidden"
                  style={{ backgroundColor: form.Avatar ? 'transparent' : getAvatarColor(form.Name || '?') }}
                  onClick={() => fileInputRef.current?.click()}>
                  {form.Avatar ? <img src={form.Avatar} alt="" className="w-full h-full object-cover" />
                    : getInitials(form.Name || '?')}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            ) : (
              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-white font-bold text-[28px] mx-auto mb-3"
                style={{ backgroundColor: getAvatarColor(contact.Name) }}>
                {getInitials(contact.Name)}
              </div>
            )}

            {editMode ? (
              <div className="space-y-2">
                <input value={form.Name} onChange={(e) => setForm((f) => ({ ...f, Name: e.target.value }))}
                  className="input-ios text-center text-[20px] font-bold" />
                <div className="flex items-center justify-center gap-2">
                  <select value={form.Relationship} onChange={(e) => setForm((f) => ({ ...f, Relationship: e.target.value }))}
                    className="input-ios text-[13px]">
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[20px] font-bold text-[#111]">{contact.Name}</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[13px] text-[#6B7280]">{contact.Relationship}</span>
                  <span className="w-[4px] h-[4px] rounded-full bg-[#D1D5DB]" />
                  <span className="text-[12px] font-medium" style={{ color: getRelationshipColor(contact.RelationshipScore) }}>
                    {getRelationshipLabel(contact.RelationshipScore)}
                  </span>
                  {contact.IsFavorite && <Heart size={14} className="text-[#E6002D] fill-[#E6002D]" />}
                </div>
              </>
            )}
          </div>

          {/* Info rows - always visible even in edit mode (editable fields below) */}
          {!editMode ? (
            <div className="space-y-3">
              {contact.Birthday && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <Cake size={16} className="text-[#FF9500]" />
                  <span className="text-[14px] text-[#111]">{formatDate(contact.Birthday, 'ddmmyyyy')}</span>
                  <span className="text-[12px] text-[#8E8E93]">({calculateAge(contact.Birthday)} tuổi)</span>
                </div>
              )}
              {contact.Gender && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <Users size={16} className="text-[#5856D6]" />
                  <span className="text-[14px] text-[#111]">{contact.Gender === 'Male' ? 'Nam' : contact.Gender === 'Female' ? 'Nữ' : 'Khác'}</span>
                </div>
              )}
              {contact.Phone && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <Phone size={16} className="text-[#34C759]" />
                  <span className="text-[14px] text-[#111]">{contact.Phone}</span>
                </div>
              )}
              {contact.Email && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <Mail size={16} className="text-[#007AFF]" />
                  <span className="text-[14px] text-[#111]">{contact.Email}</span>
                </div>
              )}
              {(contact.Organization1 || contact.Organization2) && (
                <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <Building2 size={16} className="text-[#5856D6]" />
                  <span className="text-[14px] text-[#111]">{contact.Organization1}{contact.Organization2 ? ` · ${contact.Organization2}` : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                <Award size={16} className="text-[#E6002D]" />
                <span className="text-[14px] text-[#111]">Mức độ thân thiết: <strong>{contact.RelationshipScore}/100</strong></span>
              </div>
              {contact.Notes && (
                <div className="p-3 rounded-[12px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[12px] font-medium text-[#8E8E93] mb-1">Ghi chú</p>
                  <p className="text-[14px] text-[#111] whitespace-pre-wrap">{contact.Notes}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className={`w-2 h-2 rounded-full ${contact.Status === 'Active' ? 'bg-[#34C759]' : contact.Status === 'Lost Contact' ? 'bg-[#FF9500]' : 'bg-[#8E8E93]'}`} />
                <span className="text-[12px] text-[#8E8E93] font-medium">{contact.Status}</span>
              </div>
            </div>
          ) : (
            /* Edit mode fields */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Giới tính</label>
                  <select value={form.Gender} onChange={(e) => setForm((f) => ({ ...f, Gender: e.target.value }))} className="input-ios mt-1">
                    <option value="">Chọn</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g === 'Male' ? 'Nam' : g === 'Female' ? 'Nữ' : 'Khác'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Ngày sinh</label>
                  <input type="date" value={form.Birthday} onChange={(e) => setForm((f) => ({ ...f, Birthday: e.target.value }))} className="input-ios mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">SĐT</label>
                  <input value={form.Phone} onChange={(e) => setForm((f) => ({ ...f, Phone: e.target.value }))} className="input-ios mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Email</label>
                  <input value={form.Email} onChange={(e) => setForm((f) => ({ ...f, Email: e.target.value }))} className="input-ios mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Tổ chức 1</label>
                  <input value={form.Organization1} onChange={(e) => setForm((f) => ({ ...f, Organization1: e.target.value }))} className="input-ios mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Tổ chức 2</label>
                  <input value={form.Organization2} onChange={(e) => setForm((f) => ({ ...f, Organization2: e.target.value }))} className="input-ios mt-1" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Mức độ: {form.RelationshipScore}</label>
                <input type="range" min={0} max={100} value={form.RelationshipScore}
                  onChange={(e) => setForm((f) => ({ ...f, RelationshipScore: Number(e.target.value) }))} className="w-full accent-[#E6002D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Trạng thái</label>
                  <select value={form.Status} onChange={(e) => setForm((f) => ({ ...f, Status: e.target.value }))} className="input-ios mt-1">
                    {STATUSES.map((s) => <option key={s} value={s}>{s === 'Active' ? 'Đang liên lạc' : s === 'Lost Contact' ? 'Mất liên lạc' : s === 'Deceased' ? 'Đã mất' : 'Chặn'}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-[3px]">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, IsFavorite: !f.IsFavorite }))}
                    className={`w-full h-[44px] rounded-[12px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-all ${form.IsFavorite ? 'bg-[#E6002D]/10 text-[#E6002D]' : 'bg-[rgba(0,0,0,0.04)] text-[#6B7280]'}`}>
                    <Heart size={16} className={form.IsFavorite ? 'fill-[#E6002D]' : ''} />
                    {form.IsFavorite ? 'Yêu thích' : 'Yêu thích?'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Ghi chú</label>
                <textarea value={form.Notes} onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))}
                  className="input-ios mt-1 min-h-[60px] resize-none text-[13px]" rows={2} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-[#8E8E93] py-8">Không tìm thấy</p>
      )}
    </Modal>
  );
}
