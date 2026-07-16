'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, RotateCcw, Sparkles } from 'lucide-react';

// Sample memory data
const memories = [
  { angle: 0, emoji: '🎂', label: 'Sinh nhật 2025', date: '15/03/2025', type: 'past' },
  { angle: 45, emoji: '✈️', label: 'Du lịch Đà Nẵng', date: '20/01/2025', type: 'past' },
  { angle: 90, emoji: '❤️', label: 'Kỷ niệm 3 năm', date: '14/02/2025', type: 'past' },
  { angle: 135, emoji: '💼', label: 'Dự án mới', date: '01/06/2025', type: 'past' },
  { angle: 180, emoji: '🎓', label: 'Tốt nghiệp', date: '10/08/2008', type: 'past' },
  { angle: 225, emoji: '🏠', label: 'Xây nhà mới', date: '01/03/2026', type: 'future' },
  { angle: 270, emoji: '👶', label: 'Kế hoạch gia đình', date: '2027', type: 'future' },
  { angle: 315, emoji: '🎯', label: 'Mục tiêu 10 tỷ', date: '2030', type: 'future' },
];

export default function TimelinePage() {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const lastRotation = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    lastRotation.current = rotation;
    if (wheelRef.current) {
      wheelRef.current.style.cursor = 'grabbing';
    }
  }, [rotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    // Drag left = negative delta = go to past (rotate clockwise)
    // Drag right = positive delta = go to future (rotate counter-clockwise)
    const sensitivity = 0.3;
    const newRotation = lastRotation.current + deltaX * sensitivity;
    setRotation(newRotation);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (wheelRef.current) {
      wheelRef.current.style.cursor = 'grab';
    }
    // Snap to nearest memory
    const snapAngle = 45;
    const nearest = Math.round(rotation / snapAngle) * snapAngle;
    setRotation(nearest);
  }, [rotation]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  const resetToToday = useCallback(() => {
    setRotation(0);
  }, []);

  // Find the memory at the pointer position (top = 270deg relative, or 0deg absolute at top)
  const getSelectedMemory = () => {
    // The pointer is at top (rotation 0 effectively points to what's at the top)
    // With rotation 0, memory at angle 270 (because circle layout offset) is at top
    // Actually, the pointer is at top = 12 o'clock position
    // The memory angle positions are absolute. When wheel rotates `rotation` degrees clockwise,
    // memory at position (angle - rotation) is under the pointer
    // Pointer is fixed at top = -90 degrees (or 270 in 0-360)
    // So memory index = Math.round((270 - rotation % 360) / 45) % 8
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const pointerAngle = 270; // top of circle
    const idx = Math.round(((pointerAngle - normalizedRotation) % 360 + 360) % 360 / 45) % 8;
    return memories[idx];
  };

  const selectedMemory = getSelectedMemory();

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

      {/* Wheel of Memories */}
      <div className="card-ios text-center py-8 mb-4">
        <div
          className="relative w-[280px] h-[280px] mx-auto mb-6 select-none"
          ref={wheelRef}
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Circular Time Wheel */}
          <div
            className="w-full h-full rounded-full border-2 border-[rgba(0,0,0,0.06)] relative transition-transform duration-75 ease-linear"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Center button - "Today" */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full gradient-primary flex flex-col items-center justify-center text-white shadow-lg z-10 select-none"
              style={{ boxShadow: '0 4px 20px rgba(230,0,45,0.35)' }}
            >
              <span className="text-[9px] font-medium opacity-80">HÔM NAY</span>
              <span className="text-[16px] font-bold leading-none mt-0.5">
                {new Date().getDate()}
              </span>
            </div>

            {/* Memory nodes around the circle */}
            {memories.map((mem, i) => (
              <div
                key={i}
                className="absolute w-[36px] h-[36px] rounded-full bg-white shadow-md border border-[rgba(0,0,0,0.08)] flex items-center justify-center text-[16px] cursor-pointer hover:scale-125 hover:shadow-lg transition-all duration-200 select-none"
                style={{
                  top: `calc(50% - ${Math.sin((mem.angle * Math.PI) / 180) * 110 + 18}px)`,
                  left: `calc(50% + ${Math.cos((mem.angle * Math.PI) / 180) * 110 - 18}px)`,
                  boxShadow: mem.type === 'future'
                    ? '0 2px 8px rgba(175,82,222,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {mem.emoji}
              </div>
            ))}
          </div>

          {/* Pointer arrow at top - fixed */}
          <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#111] z-20" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-[11px] text-[#8E8E93] font-medium">← Kéo sang trái: Quá khứ</span>
          <button
            onClick={resetToToday}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,0,0,0.04)] text-[13px] font-medium text-[#6B7280] hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <RotateCcw size={14} />
            Hôm nay
          </button>
          <span className="text-[11px] text-[#8E8E93] font-medium">Kéo sang phải: Tương lai →</span>
        </div>

        <p className="text-[12px] text-[#8E8E93]">
          Nhấn giữ chuột và kéo để xoay bánh xe thời gian
        </p>
      </div>

      {/* Selected memory card */}
      <div className="card-ios">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-[20px] ${
            selectedMemory.type === 'future'
              ? 'bg-[#AF52DE]/10'
              : 'bg-[#FF9500]/10'
          }`}>
            <span>{selectedMemory.emoji}</span>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#111]">{selectedMemory.label}</h3>
            <p className="text-[12px] text-[#8E8E93]">{selectedMemory.date}</p>
          </div>
          <span className={`ml-auto text-[11px] px-2.5 py-1 rounded-full font-medium ${
            selectedMemory.type === 'future'
              ? 'bg-[#AF52DE]/10 text-[#AF52DE]'
              : 'bg-[#FF9500]/10 text-[#FF9500]'
          }`}>
            {selectedMemory.type === 'future' ? '✨ Tương lai' : '🕰️ Quá khứ'}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-2.5 rounded-[10px] bg-[#E6002D] text-white text-[13px] font-semibold hover:opacity-90 transition-all">
            {selectedMemory.type === 'future' ? 'Lên kế hoạch' : 'Xem lại'}
          </button>
          <button className="px-4 py-2.5 rounded-[10px] bg-[rgba(0,0,0,0.04)] text-[#6B7280] text-[13px] font-medium hover:bg-[rgba(0,0,0,0.08)] transition-all">
            <Sparkles size={15} />
          </button>
        </div>
      </div>

      {/* Add future dream button */}
      <button className="mt-3 w-full py-3 rounded-[14px] border-2 border-dashed border-[rgba(0,0,0,0.08)] text-[#6B7280] text-[14px] font-medium hover:border-[#AF52DE]/30 hover:text-[#AF52DE] transition-all flex items-center justify-center gap-2">
        <Plus size={16} />
        Thêm một ước mơ tương lai
      </button>
    </div>
  );
}
