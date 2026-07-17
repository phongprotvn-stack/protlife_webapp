'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AddMemoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={()=>router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm ký ức mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Lưu lại những khoảnh khắc đáng nhớ</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,77,106,0.08)] mx-auto mb-3 flex items-center justify-center">
            <span className="text-[28px]">💭</span>
          </div>
          <p className="text-[14px] font-medium text-[#6B7280]">Tính năng đang phát triển</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Sẽ sớm được cập nhật</p>
        </div>
      </div>
    </div>
  );
}
