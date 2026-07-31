'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';
import { DaughterNamesSection } from '@/components/documents/daughter-names-section';

export default function DaughterNames2Page() {
  const router = useRouter();

  return (
    <div className="page-content p-0">
      {/* Nút quay lại */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/80 backdrop-blur-md transition-all hover:bg-white/10 active:scale-95">
          <ArrowLeft size={14} /> Quay lại
        </button>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/60">
          <Heart size={12} className="text-[#FF4D6A]" fill="currentColor" /> v0 Bento Glass
        </span>
      </div>

      <DaughterNamesSection fullPage />
    </div>
  );
}
