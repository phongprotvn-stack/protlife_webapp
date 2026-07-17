'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared/modal';
import { FileText, Edit3, Trash2, X } from 'lucide-react';

interface Props { documentId: string | null; onClose: () => void; panelMode?: boolean; }

export function DocumentDetail({ documentId, onClose, panelMode }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!documentId) return null;

  const content = (
    <div>
      <div className="flex items-center justify-between mb-4">
        {panelMode && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><X size={15}/></button>}
        <div className="flex gap-1 ml-auto">
          <button className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#5F6368] bg-[rgba(0,0,0,0.04)] flex items-center gap-1"><Edit3 size={12}/> Sửa</button>
          <button onClick={()=>setConfirmDelete(true)} className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#E6002D] bg-[rgba(230,0,45,0.06)] flex items-center gap-1"><Trash2 size={12}/> Xoá</button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mb-4 p-4 rounded-[14px] bg-[rgba(230,0,45,0.06)] border border-[rgba(230,0,45,0.12)] text-center">
          <div className="w-10 h-10 rounded-full bg-[rgba(230,0,45,0.1)] mx-auto mb-2 flex items-center justify-center"><Trash2 size={18} className="text-[#E6002D]"/></div>
          <p className="text-[14px] font-semibold text-[#E6002D] mb-1">Xoá tài liệu này?</p>
          <p className="text-[12px] text-[#8E8E93] mb-3">Hành động này không thể hoàn tác.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={()=>setConfirmDelete(false)} className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-[#5F6368] bg-white border border-[rgba(0,0,0,0.06)]">Không</button>
            <button className="px-5 py-2 rounded-[10px] text-[12px] font-medium text-white bg-[#E6002D]">Xoá</button>
          </div>
        </div>
      )}

      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[rgba(255,149,0,0.08)] mx-auto mb-3 flex items-center justify-center"><FileText size={28} className="text-[#FF9500]/40"/></div>
        <p className="text-[14px] font-medium text-[#6B7280]">Tài liệu chưa có dữ liệu</p>
        <p className="text-[12px] text-[#9CA3AF] mt-1">Tính năng đang phát triển</p>
      </div>
    </div>
  );

  if (panelMode) return <div className="panel-detail">{content}</div>;
  return <Modal open={!!documentId} onClose={onClose} title="" maxWidth="420px">{content}</Modal>;
}
