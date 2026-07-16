'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, RotateCcw, Sparkles } from 'lucide-react';

const SNAP_ANGLE = 45;
const RADIUS = 110;
const NODE_SIZE = 18;

// Compute today's date string for matching
const todayStr = new Date().toLocaleDateString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric'
});

// Sample memory data — one marked as today
const baseMemories = [
  { angle: 0, emoji: '🎂', label: 'Sinh nhật 2025', date: '15/03/2025', type: 'past' },
  { angle: 45, emoji: '✈️', label: 'Du lịch Đà Nẵng', date: '20/01/2025', type: 'past' },
  { angle: 90, emoji: '❤️', label: 'Kỷ niệm 3 năm', date: '14/02/2025', type: 'past' },
  { angle: 135, emoji: '💼', label: 'Dự án mới', date: '01/06/2025', type: 'past' },
  { angle: 180, emoji: '🎓', label: 'Tốt nghiệp', date: '10/08/2008', type: 'past' },
  { angle: 225, emoji: '🏠', label: 'Xây nhà mới', date: '01/03/2026', type: 'future' },
  { angle: 270, emoji: '👶', label: 'Kế hoạch gia đình', date: '2027', type: 'future' },
  { angle: 315, emoji: '🎯', label: 'Mục tiêu 10 tỷ', date: '2030', type: 'future' },
];

// Compute today's memory node
function computeTodayMemory() {
  const now = new Date();
  return {
    angle: 315,
    emoji: '📅',
    label: 'Hôm nay',
    date: now.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }),
    type: 'today' as const,
  };
}

// Which memory index matches today? Default to index 0 if none
function findTodayIndex(memories: typeof baseMemories): number {
  const today = todayStr;
  for (let i = 0; i < memories.length; i++) {
    if (memories[i].date === today) return i;
  }
  return -1;
}

// Get selected memory index based on rotation
function getSelectedIndex(rotation: number): number {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const pointerAngle = 270; // arrow at top of circle
  return Math.round(((pointerAngle - normalizedRotation) % 360 + 360) % 360 / SNAP_ANGLE) % 8;
}

// Calculate rotation to bring memory at `targetAngle` under the arrow
function rotationToSnapTo(targetAngle: number): number {
  // Arrow is at angle 270 in wheel coordinates
  // When rotation = R, memory at angle A is under arrow when (270 - R) % 360 = A
  // So R = (270 - A + 360) % 360
  return ((270 - targetAngle) % 360 + 360) % 360;
}

export default function TimelinePage() {
  const todayMemory = useMemo(() => computeTodayMemory(), []);
  const memories = useMemo(() => [...baseMemories, todayMemory], [todayMemory]);

  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const lastRotation = useRef(0);
  const animFrame = useRef<number | null>(null);

  const selectedIdx = getSelectedIndex(rotation);
  const selectedMemory = memories[selectedIdx];

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
    e.preventDefault();
    const deltaX = e.clientX - startX.current;
    // Higher sensitivity for smooth multi-rotation
    // Drag left = negative = go past, rotate CW
    // Drag right = positive = go future, rotate CCW
    const sensitivity = 0.5;
    const newRotation = lastRotation.current + deltaX * sensitivity;
    // No clamping — allow unlimited rotation
    setRotation(newRotation);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (wheelRef.current) {
      wheelRef.current.style.cursor = 'grab';
    }
    // Snap to nearest node
    const normalized = ((rotation % 360) + 360) % 360;
    const nearestAngle = Math.round(normalized / SNAP_ANGLE) * SNAP_ANGLE;
    // Find which memory that corresponds to
    const nearestRot = rotation - (normalized - nearestAngle);
    setRotation(nearestRot);
  }, [rotation]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  // Click center "Hôm nay" → snap to today node
  const snapToToday = useCallback(() => {
    const todayIdx = memories.findIndex(m => m.type === 'today');
    if (todayIdx >= 0) {
      const targetAngle = memories[todayIdx].angle;
      const targetRot = rotationToSnapTo(targetAngle);
      // Find nearest full snap to that
      setRotation(targetRot);
    }
  }, [memories]);

  // Click on a memory node → snap arrow to it
  const snapToNode = useCallback((idx: number) => {
    const targetAngle = memories[idx].angle;
    setRotation(rotationToSnapTo(targetAngle));
  }, [memories]);

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
          className="relative w-[300px] h-[300px] mx-auto mb-6 select-none"
          ref={wheelRef}
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Pointer arrow at top — fixed, points to selected memory */}
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#111]" />
            </div>
          </div>

          {/* Circular Time Wheel */}
          <div
            className="w-full h-full rounded-full border-2 border-[rgba(0,0,0,0.06)] relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Center button — "Hôm nay" */}
            <div
              onClick={snapToToday}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full gradient-primary flex flex-col items-center justify-center text-white shadow-lg z-10 select-none cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              style={{ boxShadow: '0 4px 20px rgba(230,0,45,0.35)' }}
            >
              <span className="text-[9px] font-medium opacity-80">HÔM NAY</span>
              <span className="text-[16px] font-bold leading-none mt-0.5">
                {new Date().getDate()}
              </span>
            </div>

            {/* Tick marks around the circle */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <div
                key={`tick-${angle}`}
                className="absolute w-[6px] h-[6px] rounded-full bg-[rgba(0,0,0,0.06)]"
                style={{
                  top: `calc(50% - ${Math.sin((angle * Math.PI) / 180) * 140 + 3}px)`,
                  left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 140 - 3}px)`,
                }}
              />
            ))}

            {/* Memory nodes around the circle */}
            {memories.map((mem, i) => {
              const isSelected = i === selectedIdx;
              const isTodayNode = mem.type === 'today';
              return (
                <div
                  key={i}
                  onClick={() => snapToNode(i)}
                  className="absolute flex items-center justify-center rounded-full cursor-pointer select-none transition-all duration-300"
                  style={{
                    width: isSelected ? '44px' : '36px',
                    height: isSelected ? '44px' : '36px',
                    top: `calc(50% - ${Math.sin((mem.angle * Math.PI) / 180) * RADIUS + (isSelected ? 22 : NODE_SIZE)}px)`,
                    left: `calc(50% + ${Math.cos((mem.angle * Math.PI) / 180) * RADIUS - (isSelected ? 22 : NODE_SIZE)}px)`,
                    backgroundColor: isTodayNode ? '#E6002D' : '#fff',
                    boxShadow: isSelected
                      ? `0 0 0 3px #E6002D, 0 4px 16px rgba(230,0,45,0.3)`
                      : mem.type === 'future'
                        ? '0 2px 8px rgba(175,82,222,0.25)'
                        : '0 2px 8px rgba(0,0,0,0.1)',
                    border: isSelected
                      ? '2px solid #E6002D'
                      : isTodayNode
                        ? '2px solid rgba(255,255,255,0.5)'
                        : '1px solid rgba(0,0,0,0.08)',
                    zIndex: isSelected ? 5 : 1,
                  }}
                >
                  <span className={isSelected ? 'text-[18px]' : 'text-[15px]'}>
                    {mem.emoji}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-[11px] text-[#8E8E93] font-medium">← Quá khứ</span>
          <button
            onClick={snapToToday}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,0,0,0.04)] text-[13px] font-medium text-[#6B7280] hover:bg-[rgba(0,0,0,0.08)] transition-all"
          >
            <RotateCcw size={14} />
            Hôm nay
          </button>
          <span className="text-[11px] text-[#8E8E93] font-medium">Tương lai →</span>
        </div>
        <p className="text-[12px] text-[#8E8E93]">
          Nhấn giữ và kéo để xoay bánh xe — thả chuột sẽ tự động vào node gần nhất
        </p>
      </div>

      {/* Selected memory card */}
      <div className="card-ios">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-[20px] ${
            selectedMemory.type === 'future'
              ? 'bg-[#AF52DE]/10'
              : selectedMemory.type === 'today'
                ? 'bg-[#E6002D]/10'
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
              : selectedMemory.type === 'today'
                ? 'bg-[#E6002D]/10 text-[#E6002D]'
                : 'bg-[#FF9500]/10 text-[#FF9500]'
          }`}>
            {selectedMemory.type === 'future' ? '✨ Tương lai' :
             selectedMemory.type === 'today' ? '📅 Hôm nay' : '🕰️ Quá khứ'}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-2.5 rounded-[10px] bg-[#E6002D] text-white text-[13px] font-semibold hover:opacity-90 transition-all">
            {selectedMemory.type === 'future' ? 'Lên kế hoạch' :
             selectedMemory.type === 'today' ? 'Xem hôm nay' : 'Xem lại'}
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
