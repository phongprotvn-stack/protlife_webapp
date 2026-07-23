'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { documentService } from '@/lib/services/document-service';

const TYPES = ['Hợp đồng', 'Hoá đơn', 'Chứng từ', 'Báo cáo', 'Cá nhân', 'Khác'] as const;

export default function AddDocumentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Title: '',
    Type: 'Hợp đồng',
    Date: new Date().toISOString().split('T')[0],
    Size: '',
    Notes: '',
  });

  const handleSave = async () => {
    if (!form.Title.trim()) { setError('Vui lòng nhập tên tài liệu'); return; }
    setSaving(true); setError('');
    try {
      await documentService.create({
        Title: form.Title.trim(),
        Type: form.Type,
        Date: form.Date,
        Size: form.Size || undefined,
        Notes: form.Notes || undefined,
      });
      router.push('/documents');
    } catch (e: any) { setError(e.message || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm tài liệu mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Lưu trữ giấy tờ, hồ sơ quan trọng</p>
        </div>
      </div>

      {error && <p className="mb-3 text-[11px] text-[#E6002D] bg-[rgba(230,0,45,0.04)] p-2 rounded-[8px]">{error}</p>}

      <div className="flex-1 overflow-y-auto space-y-4">
        <FormSection title="Thông tin cơ bản">
          <FormField label="Tên tài liệu *">
            <input value={form.Title} onChange={(e) => setForm(f => ({...f, Title: e.target.value}))}
              className="input-glass text-[14px]" placeholder="Ví dụ: Hợp đồng thuê nhà" />
          </FormField>
          <div className="grid grid-cols-2 gap-2.5">
            <FormField label="Loại tài liệu">
              <select value={form.Type} onChange={(e) => setForm(f => ({...f, Type: e.target.value}))}
                className="input-glass text-[13px]">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Ngày">
              <input type="date" value={form.Date} onChange={(e) => setForm(f => ({...f, Date: e.target.value}))}
                className="input-glass text-[13px]" />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Kích cỡ">
          <FormField label="Dung lượng (tuỳ chọn)">
            <input value={form.Size} onChange={(e) => setForm(f => ({...f, Size: e.target.value}))}
              className="input-glass text-[13px]" placeholder="Ví dụ: 2.5 MB" />
          </FormField>
        </FormSection>

        <FormSection title="Ghi chú">
          <textarea value={form.Notes} onChange={(e) => setForm(f => ({...f, Notes: e.target.value}))}
            className="input-glass text-[13px] min-h-[70px]" rows={3} placeholder="Ghi chú thêm về tài liệu này..." />
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
