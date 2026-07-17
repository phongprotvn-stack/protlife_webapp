'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/modal';
import { goalService } from '@/lib/services/goal-service';
import type { Goal } from '@/lib/services/goal-service';
import { formatDate } from '@/lib/utils';
import { Target, Clock, AlertTriangle, Flag, FileText, Edit3, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';

interface Props {
  goalId: string | null;
  onClose: () => void;
  panelMode?: boolean;
}

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Cancelled'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'Not Started': '#8E8E93',
    'In Progress': '#007AFF',
    'Completed': '#34C759',
    'Cancelled': '#E6002D',
  };
  return map[status] || '#8E8E93';
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    'Not Started': 'Chưa bắt đầu',
    'In Progress': 'Đang thực hiện',
    'Completed': 'Hoàn thành',
    'Cancelled': 'Đã huỷ',
  };
  return map[status] || status;
}

function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    Low: '#8E8E93',
    Medium: '#FF9500',
    High: '#FF4D6A',
    Critical: '#E6002D',
  };
  return map[priority] || '#8E8E93';
}

export function GoalDetail({ goalId, onClose, panelMode }: Props) {
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    Title: '', Status: '', Deadline: '', Priority: '', Progress: 0, Notes: '',
  });

  useEffect(() => {
    if (!goalId) return;
    setLoading(true);
    goalService.getById(goalId).then((data) => {
      setGoal(data);
      if (data) {
        setForm({
          Title: data.Title, Status: data.Status, Deadline: data.Deadline || '',
          Priority: data.Priority, Progress: data.Progress, Notes: data.Notes || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    setEditMode(false); setConfirmDelete(false); setError('');
  }, [goalId]);

  const handleSave = async () => {
    if (!goal || !goalId) return;
    if (!form.Title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    setSaving(true); setError('');
    try {
      await goalService.update(goalId, {
        Title: form.Title.trim(), Status: form.Status, Deadline: form.Deadline || undefined,
        Priority: form.Priority, Progress: form.Progress, Notes: form.Notes || undefined,
      });
      triggerRefresh();
      setEditMode(false);
      const data = await goalService.getById(goalId);
      setGoal(data);
    } catch (e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!goalId) return;
    try {
      await goalService.delete(goalId);
      triggerRefresh();
      onClose();
    } catch (e: any) { setError(e.message || 'Lỗi khi xoá'); }
  };

  const progressPercent = Math.min(100, Math.max(0, form.Progress));

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
      ) : goal ? (
        <>
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-[52px] h-[60px] rounded-[14px] bg-[#34C759]/10 mx-auto mb-3 flex flex-col items-center justify-center">
              <Target size={22} className="text-[#34C759]" />
            </div>

            {editMode ? (
              <div className="space-y-2">
                <input value={form.Title} onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))}
                  className="input-glass text-center text-[17px] font-bold" />
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <select value={form.Status} onChange={(e) => setForm((f) => ({ ...f, Status: e.target.value }))}
                    className="input-glass text-[11px] w-auto">
                    {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                  </select>
                  <select value={form.Priority} onChange={(e) => setForm((f) => ({ ...f, Priority: e.target.value }))}
                    className="input-glass text-[11px] w-auto">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[18px] font-bold text-[#111]">{goal.Title}</h2>
                <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[11px] px-[10px] py-[3px] rounded-full text-white font-medium"
                    style={{ backgroundColor: getStatusColor(goal.Status) }}>
                    {getStatusLabel(goal.Status)}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: getPriorityColor(goal.Priority) }}>
                    <AlertTriangle size={10} className="inline mr-0.5" />{goal.Priority}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Progress bar (visible in both modes) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold text-[#6B7280] uppercase">Tiến độ</span>
              <span className="text-[11px] font-bold" style={{ color: getStatusColor(goal.Status) }}>{goal.Progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, goal.Progress))}%`, backgroundColor: getStatusColor(goal.Status) }} />
            </div>
          </div>

          {/* Details */}
          {!editMode ? (
            <div className="space-y-2">
              {goal.Deadline && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <Clock size={14} className="text-[#FF9500]" />
                  <span className="text-[13px] text-[#111]">Hạn: {formatDate(goal.Deadline, 'ddmmyyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                <Flag size={14} className="text-[#5856D6]" />
                <span className="text-[13px] text-[#111]">Ưu tiên: {goal.Priority}</span>
              </div>
              {goal.Notes && (
                <div className="p-2.5 rounded-[10px] bg-[rgba(0,0,0,0.02)]">
                  <p className="text-[11px] font-medium text-[#8E8E93] mb-1 flex items-center gap-1">
                    <FileText size={12} /> Ghi chú
                  </p>
                  <p className="text-[13px] text-[#111] whitespace-pre-wrap">{goal.Notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div>
                <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Tiêu đề</label>
                <input value={form.Title} onChange={(e) => setForm((f) => ({ ...f, Title: e.target.value }))} className="input-glass text-[12px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Trạng thái</label>
                  <select value={form.Status} onChange={(e) => setForm((f) => ({ ...f, Status: e.target.value }))} className="input-glass text-[12px]">
                    {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Ưu tiên</label>
                  <select value={form.Priority} onChange={(e) => setForm((f) => ({ ...f, Priority: e.target.value }))} className="input-glass text-[12px]">
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Hạn chót</label>
                  <input type="date" value={form.Deadline} onChange={(e) => setForm((f) => ({ ...f, Deadline: e.target.value }))} className="input-glass text-[12px]" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6B7280] uppercase">Tiến độ: {progressPercent}%</label>
                  <input type="range" min={0} max={100} value={progressPercent}
                    onChange={(e) => setForm((f) => ({ ...f, Progress: Number(e.target.value) }))} className="w-full accent-[#34C759]" />
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
    <Modal open={!!goalId} onClose={onClose} title="" maxWidth="420px">
      {content}
    </Modal>
  );
}
