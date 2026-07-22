'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BookHeart } from 'lucide-react';
import MemoryFormFields from '@/components/memories/memory-form-fields';

export default function AddMemoryPage() {
  const router = useRouter();

  const handleSaved = (memoryId: string) => {
    router.push('/memories');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#111]">Thêm ký ức mới</h1>
          <p className="text-[11px] text-[#8E8E93]">Lưu lại những khoảnh khắc đáng nhớ</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-1">
        <MemoryFormFields
          onSaved={handleSaved}
          onCancel={() => router.back()}
          showTitleField={true}
        />
      </div>
    </div>
  );
}
