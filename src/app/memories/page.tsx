'use client';

import { motion } from 'framer-motion';
import { Heart, Search, Plus } from 'lucide-react';

const mockMemories = [];

export default function MemoriesPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight">Ký ức</h1>
          <p className="text-[13px] text-[#8E8E93] mt-0.5">{mockMemories.length} ký ức</p>
        </div>
        <button className="w-[44px] h-[44px] rounded-[14px] bg-[#E6002D] text-white flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200"
          style={{ boxShadow: '0 4px 12px rgba(230,0,45,0.3)' }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-ios py-16 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#FF4D6A]/5 mx-auto mb-5 flex items-center justify-center">
          <Heart size={36} className="text-[#FF4D6A]/30" />
        </div>
        <h2 className="text-[20px] font-semibold text-[#111] mb-2">Chưa có ký ức nào</h2>
        <p className="text-[14px] text-[#8E8E93] max-w-[280px] mx-auto leading-relaxed">
          Ký ức được sinh ra từ những sự kiện. Hãy thêm sự kiện và gắn ký ức vào đó.
        </p>
        <button className="mt-6 btn-ios-primary">
          <Plus size={18} className="mr-2" />
          Thêm ký ức đầu tiên
        </button>
      </motion.div>
    </div>
  );
}
