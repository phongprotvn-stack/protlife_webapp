'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target } from 'lucide-react';
import { goalService } from '@/lib/services/goal-service';

const STATUSES = ['Not Started', 'In Progress', 'Completed'] as const;
const PRIORITIES = ['Low', 'Medium', 'High'] as const;

export default function AddGoalPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Title: '',
    Status: 'Not Started',
    Deadline: '',
    Priority: 'Medium',
    Progress: 0,
    Notes: '',
  });

  const handleSave = async () => {
    if (!form.Title.trim()) { setError('Vui lòng nhập tên mục tiêu'); return; }
    setSaving(true); setError('');
    try {
      await goalService.create({
        Title: form.Title.trim(),
        Status: form.Status,
        Deadline: form.Deadline || undefined,
        Priority: form.Priority,
        Progress: form.Progress,
        Notes: form.Notes || undefined,
      });
      router.push('/goals');
    } catch (e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm mục tiêu mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Đặt mục tiêu mới cho bản thân</p>
        </div>
      </div>

      {error && <p className="mb-3 text-[11px] text-[#E6002D] bg-[rgba(230,0,45,0.04)] p-2 rounded-[8px]">{error}</p>}

      <div className="flex-1 overflow-y-auto space-y-4">
        <FormSection title="Thông tin cơ bản">
          <FormField label="Tên mục tiêu *">
            <input value={form.Title} onChange={(e) => setForm(f => ({...f, Title: e.target.value}))}
              className="input-glass text-[14px]" placeholder="Ví dụ: Học tiếng Nhật N3" />
          </FormField>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Trạng thái">
              <select value={form.Status} onChange={(e) => setForm(f => ({...f, Status: e.target.value}))}
                className="input-glass text-[13px]">
                {STATUSES.map(s => <option key={s} value={s}>{s === 'Not Started' ? 'Chưa bắt đầu' : s === 'In Progress' ? 'Đang làm' : 'Hoàn thành'}</option>)}
              </select>
            </FormField>
            <FormField label="Mức ưu tiên">
              <select value={form.Priority} onChange={(e) => setForm(f => ({...f, Priority: e.target.value}))}
                className="input-glass text-[13px]">
                {PRIORITIES.map(p => <option key={p} value={p}>{p === 'Low' ? 'Thấp' : p === 'Medium' ? 'Trung bình' : 'Cao'}</option>)}
              </select>
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Thời hạn">
          <FormField label="Hạn chót">
            <input type="date" value={form.Deadline} onChange={(e) => setForm(f => ({...f, Deadline: e.target.value}))}
              className="input-glass text-[13px]" />
          </FormField>
        </FormSection>

        <FormSection title="Tiến độ">
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={100} value={form.Progress}
              onChange={(e) => setForm(f => ({...f, Progress: Number(e.target.value)}))}
              className="flex-1 h-1.5 accent-[#E6002D]" />
            <span className="text-[13px] font-semibold text-[#111] min-w-[40px] text-right">{form.Progress}%</span>
          </div>
          <div className="flex mt-1 gap-1">
            {[0, 25, 50, 75, 100].map(p => (
              <button key={p} type="button" onClick={() => setForm(f => ({...f, Progress: p}))}
                className={`flex-1 text-center text-[9px] font-semibold py-1.5 rounded-[4px] transition-colors ${
                  form.Progress >= p && form.Progress < p + 25 ? 'bg-[#E6002D] text-white shadow-sm' : 'text-[#9CA3AF] bg-[rgba(0,0,0,0.02)]'
                }`}>{p}%</button>
            ))}
          </div>
        </FormSection>

        <FormSection title="Ghi chú">
          <textarea value={form.Notes} onChange={(e) => setForm(f => ({...f, Notes: e.target.value}))}
            className="input-glass text-[13px] min-h-[70px]" rows={3} placeholder="Ghi chú thêm về mục tiêu này..." />
        </FormSection>
      </div>

      <div className="flex gap-2 pt-4 border-t border-[rgba(0,0,0,0.04)] mt-4">
        <button onClick={() => router.back()}
          className="flex-1 h-[42px] rounded-[10px] text-[13px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)]">Huỷ</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold text-white bg-[#E6002D]">{saving ? 'Đang lưu...' : 'Lưu lại'}</button>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="p-3.5 rounded-[12px] bg-[rgba(0,0,0,0.02)] space-y-2.5">
    <p className="text-[9px] font-semibold text-[#8E8E93] uppercase tracking-[0.4px]">{title}</p>
    {children}
  </div>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-[10px] font-medium text-[#6B7280] mb-1">{label}</p>{children}</div>;
}
