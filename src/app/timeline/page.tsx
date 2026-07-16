'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';

export default function TimelinePage() {
  const [rotation, setRotation] = useState(0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-bold text-[#111] tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-[#5856D6]/10 flex items-center justify-center">
            <Clock size={20} className="text-[#5856D6]" />
          </div>
          Dòng thời gian
        </h1>
      </div>

      {/* Wheel of Memories Placeholder */}
      <div className="card-ios text-center py-8 mb-4">
        <div className="relative w-[280px] h-[280px] mx-auto mb-6">
          {/* Circular Time Wheel */}
          <div
            className="w-full h-full rounded-full border-2 border-[rgba(0,0,0,0.06)] relative transition-transform duration-500 ease-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Center button - "Today" */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full gradient-primary flex flex-col items-center justify-center text-white shadow-lg z-10"
              style={{ boxShadow: '0 4px 20px rgba(230,0,45,0.35)' }}
            >
              <span className="text-[9px] font-medium opacity-80">HÔM NAY</span>
              <span className="text-[16px] font-bold leading-none mt-0.5">
                {new Date().getDate()}
              </span>
            </div>

            {/* Memory nodes around the circle */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <div
                key={i}
                className="absolute w-[32px] h-[32px] rounded-full bg-white shadow-soft border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[14px] cursor-pointer hover:scale-110 transition-transform duration-200"
                style={{
                  top: `calc(50% - ${Math.sin((angle * Math.PI) / 180) * 110 + 16}px)`,
                  left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 110 - 16}px)`,
                }}
              >
                {['🎂', '✈️', '❤️', '💼', '🎓', '🏠', '👶', '🎯'][i]}
              </div>
            ))}
          </div>

          {/* Pointer arrow at top */}
          <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#111]" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={() => setRotation((r) => r - 45)}
            className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <ArrowLeft size={18} className="text-[#6B7280]" />
          </button>
          <button
            onClick={() => setRotation(0)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,0,0,0.04)] text-[13px] font-medium text-[#6B7280] hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <RotateCcw size={14} />
            Hôm nay
          </button>
          <button
            onClick={() => setRotation((r) => r + 45)}
            className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <ArrowRight size={18} className="text-[#6B7280]" />
          </button>
        </div>

        <p className="text-[13px] text-[#8E8E93]">
          Kéo để quay bánh xe thời gian, xem lại những ký ức đã qua
        </p>
      </div>

      {/* Selected memory card */}
      <div className="card-ios">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-[10px] bg-[#FF9500]/10 flex items-center justify-center">
            <span className="text-[16px]">🎯</span>
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#111]">Chưa có ký ức nào</h3>
            <p className="text-[11px] text-[#8E8E93]">Xoay bánh xe để khám phá</p>
          </div>
        </div>
        <p className="text-[13px] text-[#6B7280] leading-relaxed">
          Thêm sự kiện và ký ức để bắt đầu xây dựng bánh xe thời gian của bạn.
        </p>
        <button className="mt-3 btn-ios-ghost text-[13px] py-[10px] px-[16px]">
          <Plus size={14} className="mr-1.5" />
          Thêm một ước mơ tương lai
        </button>
      </div>
    </div>
  );
}
