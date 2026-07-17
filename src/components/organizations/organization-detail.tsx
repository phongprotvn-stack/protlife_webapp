'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/modal';
import { organizationService } from '@/lib/services/organization-service';
import type { Organization } from '@/lib/services/organization-service';
import { Building2, User, Mail, Phone, MapPin, Edit3, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props {
  orgId: string | null;
  onClose: () => void;
  panelMode?: boolean;
}

export function OrganizationDetail({ orgId, onClose, panelMode }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    Name: '', Contact: '', Email: '', Phone: '', Address: '',
  });

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    organizationService.getById(orgId).then((data) => {
      setOrg(data);
      if (data) {
        setForm({
          Name: data.Name, Contact: data.Contact || '', Email: data.Email || '',
          Phone: data.Phone || '', Address: data.Address || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    setEditMode(false); setConfirmDelete(false); setError('');
  }, [orgId]);

  const handleSave = async () => {
    if (!org || !orgId) return;
    if (!form.Name.trim()) { setError('Vui lòng nhập tên'); return; }
    setSaving(true); setError('');
    try {
      await organizationService.update(orgId, {
        Name: form.Name.trim(), Contact: form.Contact || undefined,
        Email: form.Email || undefined, Phone: form.Phone || undefined,
        Address: form.Address || undefined,
      });
      triggerRefresh();
      setEditMode(false);
      const data = await organizationService.getById(orgId);
      setOrg(data);
    } catch (e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!orgId) return;
    try {
      await organizationService.delete(orgId);
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
      ) : org ? (
        <>
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-[52px] h-[60px] rounded-[14px] bg-[#5856D6]/10 mx-auto mb-3 flex flex-col items-center justify-center">
              <Building2 size={22} className="text-[#5856D6]" />
            </div>

            {editMode ? (
              <div className="space-y-2">
                <input value={form.Name} onChange={(e) => setForm((f) => ({ ...f, Name: e.target.value }))}
                  className="input-glass text-center text-[17px] font-bold" />
              </div>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-[#111]">{org.Name}</h2>
                {org.Contact && (
                  <span className="text-[11px] px-[10px] py-[3px] rounded-full bg-[rgba(0,0,0,0.04)] text-[#6B7280] font-medium inline-block mt-1">
                    <User size={11} className="inline mr-1" />{org.Contact}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Details */}
          {!editMode ? (
            <div className="space-y-2">
              {org.Contact && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <User size={14} className="text-[#007AFF]" />
                  <span className="text-[13px] text-[#111]">{org.Contact}</span>
                </div>
              )}
              {org.Email && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <Mail size={14} className="text-[#007AFF]" />
                  <a href={`mailto:${org.Email}`} className="text-[13px] text-[#111] no-underline">{org.Email}</a>
                </div>
              )}
              {org.Phone && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <Phone size={14} className="text-[#34C759]" />
                  <a href={`tel:${org.Phone}`} className="text-[13px] text-[#111] no-underline">{org.Phone}</a>
                </div>
              )}
              {org.Address && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <MapPin size={14} className="text-[#FF9500]" />
                  <span className="text-[13px] text-[#111]">{org.Address}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Tên tổ chức</label>
                <input value={form.Name} onChange={(e) => setForm((f) => ({ ...f, Name: e.target.value }))} className="input-glass text-[12px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Liên hệ</label>
                  <input value={form.Contact} onChange={(e) => setForm((f) => ({ ...f, Contact: e.target.value }))} className="input-glass text-[12px]" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Email</label>
                  <input value={form.Email} onChange={(e) => setForm((f) => ({ ...f, Email: e.target.value }))} className="input-glass text-[12px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">SĐT</label>
                  <input value={form.Phone} onChange={(e) => setForm((f) => ({ ...f, Phone: e.target.value }))} className="input-glass text-[12px]" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Địa chỉ</label>
                  <input value={form.Address} onChange={(e) => setForm((f) => ({ ...f, Address: e.target.value }))} className="input-glass text-[12px]" />
                </div>
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
    <Modal open={!!orgId} onClose={onClose} title="" maxWidth="420px">
      {content}
    </Modal>
  );
}
