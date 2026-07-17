'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/modal';
import { memoryService } from '@/lib/services/memory-service';
import type { Memory } from '@/lib/services/memory-service';
import { formatDate } from '@/lib/utils';
import { BookHeart, Calendar, Tag, FileText, Edit3, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props {
  memoryId: string | null;
  onClose: () => void;
  panelMode?: boolean;
}

const MEMORY_TYPES = ['Personal', 'Family', 'Travel', 'Work', 'School', 'Friend', 'Milestone', 'Other'] as const;

export function MemoryDetail({ memoryId, onClose, panelMode }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    Title: '', Date: '', Type: '', Notes: '',
  });

  useEffect(() => {
    if (!memoryId) return;
    setLoading(true);
    memoryService.getById(memoryId).then((data) => {
      setMemory(data);
      if (data) {
        setForm({
          Title: data.Title, Date: data.Date, Type: data.Type, Notes: data.Notes || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    setEditMode(false); setConfirmDelete(false); setError('');
  }, [memoryId]);

  const handleSave = async () => {
    if (!memory || !memoryId) return;
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      await memoryService.update(memoryId, {
        Title: form.Title.trim(), Date: form.Date, Type: form.Type, Notes: form.Notes || undefined,
      });
      triggerRefresh();
      setEditMode(false);
      const data = await memoryService.getById(memoryId);
      setMemory(data);
    } catch (e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!memoryId) return;
    try {
      await memoryService.delete(memoryId);
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
      ) : memory ? (
        <>
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-[52px] h-[60px] rounded-[14px] bg-[#FF9500]/10 mx-auto mb-3 flex flex-col items-center justify-center">
              <BookHeart size={22} className="text-[#FF9500]" />
            </div>

            {editMode ? (
              <div className="space-y-2">
                <input value={form.Title} onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))}
                  className="input-glass text-center text-[17px] font-bold" />
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <select value={form.Type} onChange={(e) => setForm((f) => ({ ...f, Type: e.target.value }))}
                    className="input-glass text-[11px] w-auto">
                    {MEMORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-[#111]">{memory.Title}</h2>
                <span className="text-[11px] px-[10px] py-[3px] rounded-full bg-[rgba(0,0,0,0.04)] text-[#6B7280] font-medium inline-block mt-1">
                  {memory.Type}
                </span>
              </>
            )}
          </div>

          {/* Details */}
          {!editMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                <Calendar size={14} className="text-[#FF9500]" />
                <span className="text-[13px] text-[#111]">{formatDate(memory.Date, 'ddmmyyyy')}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                <Tag size={14} className="text-[#5856D6]" />
                <span className="text-[13px] text-[#111]">{memory.Type}</span>
              </div>
              {memory.Notes && (
                <div className="p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[11px] font-medium text-[#8E8E93] mb-1 flex items-center gap-1">
                    <FileText size={12} /> Ghi chú
                  </p>
                  <p className="text-[13px] text-[#111] whitespace-pre-wrap">{memory.Notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Ngày</label>
                  <input type="date" value={form.Date} onChange={(e) => setForm((f) => ({ ...f, Date: e.target.value }))} className="input-glass text-[12px]" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Loại</label>
                  <select value={form.Type} onChange={(e) => setForm((f) => ({ ...f, Type: e.target.value }))} className="input-glass text-[12px]">
                    {MEMORY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Ghi chú</label>
                <textarea value={form.Notes} onChange={(e) => setForm((f) => ({ ...f, Notes: e.target.value }))}
                  className="input-glass text-[12px] min-h-[50px]" rows={2} />
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
    <Modal open={!!memoryId} onClose={onClose} title="" maxWidth="420px">
      {content}
    </Modal>
  );
}
