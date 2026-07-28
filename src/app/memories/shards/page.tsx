'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Calendar, Link as LinkIcon, X, Sparkles, Disc3 } from 'lucide-react';
import { memoryService } from '@/lib/services/memory-service';
import type { MemoryWithEvent } from '@/types/database';

// ─── Helpers ───

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  const years = Math.floor(days / 365);
  return `${years} năm trước`;
}

function moodColor(emoji?: string | null): string {
  const colors: Record<string, string> = {
    '😊': '#FF9500', '😢': '#5856D6', '🤩': '#FF2D55',
    '😌': '#34C759', '😤': '#E6002D', '😴': '#8E8E93',
  };
  return colors[emoji || ''] || '#8E8E93';
}

const MOOD_GRADIENTS: Record<string, string> = {
  '😊': 'linear-gradient(135deg, #F59E0B 0%, #FF9500 55%, #FFB340 100%)',
  '🤩': 'linear-gradient(135deg, #D60032 0%, #FF2D55 55%, #FF5E7A 100%)',
  '😌': 'linear-gradient(135deg, #1EA84B 0%, #34C759 55%, #5DDC7F 100%)',
  '😢': 'linear-gradient(135deg, #3B3BB5 0%, #5856D6 55%, #7A78E0 100%)',
  '😤': 'linear-gradient(135deg, #B30024 0%, #E6002D 55%, #FF3355 100%)',
  '😴': 'linear-gradient(135deg, #5C5E63 0%, #8E8E93 55%, #AEAEB2 100%)',
};

function getGradient(emoji?: string | null): string {
  return MOOD_GRADIENTS[emoji || ''] || 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 55%, #C7C7CC 100%)';
}

function getMoodBg(emoji?: string | null): string {
  const c = moodColor(emoji);
  return `${c}12`;
}

function getDate(m: MemoryWithEvent): string {
  return m.EventDate || m.MemoryDate || m.CreatedDate;
}

// ─── Constants ───
const ITEM_HEIGHT = 90;
const ARC_RADIUS_X = 28;
const ARC_RADIUS_Y = 18;
const VISIBLE_ITEMS = 7; // how many items we render
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);
const SNAP_THRESHOLD = 0.35;

export default function MemoryShardsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0); // index into memories[]
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);

  // Animation offset — drives the carousel
  const offsetRef = useRef(0);
  const [renderTick, setRenderTick] = useState(0);
  const rerender = useCallback(() => setRenderTick(t => t + 1), []);

  // Drag state
  const dragActive = useRef(false);
  const dragStartY = useRef(0);
  const dragOffsetStart = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveTime = useRef(0);
  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Data loading ───
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await memoryService.getAllWithEvent();
      data.sort((a, b) => {
        const aDate = getDate(a);
        const bDate = getDate(b);
        return new Date(bDate).getTime() - new Date(aDate).getTime(); // newest first
      });
      setMemories(data);
      setActiveIndex(0);
      offsetRef.current = 0;
    } catch (e: any) {
      setError(e.message || 'Không thể tải ký ức');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  // ─── Compute active index from offset ───
  const total = memories.length;
  const computeActive = useCallback((offset: number) => {
    if (total === 0) return 0;
    const idx = Math.round(-offset / ITEM_HEIGHT);
    return Math.max(0, Math.min(total - 1, idx));
  }, [total]);

  // Snap to index
  const snapTo = useCallback((index: number) => {
    if (total === 0) return;
    const targetOffset = -index * ITEM_HEIGHT;
    const start = offsetRef.current;
    const diff = targetOffset - start;
    if (Math.abs(diff) < 1) return;
    const dur = 350;
    const t0 = performance.now();
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      offsetRef.current = start + diff * ease;
      if (p < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        offsetRef.current = targetOffset;
        animRef.current = null;
        setActiveIndex(index);
      }
      rerender();
    };
    animRef.current = requestAnimationFrame(step);
  }, [total, rerender]);

  // Inertia deceleration
  const startInertia = useCallback((velocity: number) => {
    if (total === 0) return;
    animRef.current = requestAnimationFrame(function inertiaStep() {
      velocity *= 0.96;
      if (Math.abs(velocity) < 0.3) {
        animRef.current = null;
        const idx = computeActive(offsetRef.current);
        setActiveIndex(idx);
        snapTo(idx);
        return;
      }
      offsetRef.current += velocity;
      rerender();
      animRef.current = requestAnimationFrame(inertiaStep);
    });
  }, [total, snapTo, computeActive, rerender]);

  // ─── Pointer events ───
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    dragActive.current = true;
    dragStartY.current = e.clientY;
    dragOffsetStart.current = offsetRef.current;
    velocityRef.current = 0;
    lastMoveTime.current = performance.now();
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragActive.current) return;
      const dy = e.clientY - dragStartY.current;
      const newOffset = dragOffsetStart.current + dy;
      // Clamp
      const maxOffset = 0;
      const minOffset = -(total - 1) * ITEM_HEIGHT;
      offsetRef.current = Math.max(minOffset, Math.min(maxOffset, newOffset));

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime.current);
      const instantV = -dy * (16.67 / dt); // dy inverted for direction
      velocityRef.current = velocityRef.current * 0.5 + instantV * 0.5;
      lastMoveTime.current = now;
      rerender();
    };
    const onUp = () => {
      if (!dragActive.current) return;
      dragActive.current = false;
      const v = velocityRef.current;
      if (Math.abs(v) >= 0.8) {
        startInertia(v);
      } else {
        const idx = computeActive(offsetRef.current);
        setActiveIndex(idx);
        snapTo(idx);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [total, computeActive, snapTo, startInertia, rerender]);

  // ─── Wheel scroll support ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      offsetRef.current -= e.deltaY * 0.5;
      const maxOffset = 0;
      const minOffset = -(total - 1) * ITEM_HEIGHT;
      offsetRef.current = Math.max(minOffset, Math.min(maxOffset, offsetRef.current));
      rerender();
      clearTimeout((el as any).__scrollTimer);
      (el as any).__scrollTimer = setTimeout(() => {
        const idx = computeActive(offsetRef.current);
        setActiveIndex(idx);
        snapTo(idx);
      }, 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [total, computeActive, snapTo, rerender]);

  // ─── Item arc positioning ───
  const getItemStyle = useCallback((memoryIndex: number, totalMemories: number) => {
    // Where this item would be if at center
    const idealOffset = -memoryIndex * ITEM_HEIGHT;
    const currentOffset = offsetRef.current;
    const dist = (idealOffset - currentOffset) / ITEM_HEIGHT; // distance in items from center

    // Clamp display range
    const maxShow = HALF_VISIBLE;
    if (Math.abs(dist) > maxShow + 0.5) return null; // don't render

    // Arc position: items curve away from center
    const normalizedDist = dist / maxShow; // -1 to 1
    const angle = normalizedDist * (Math.PI / 3); // max ±60 degrees
    const arcX = Math.sin(angle) * ARC_RADIUS_X;
    const arcY = dist * ITEM_HEIGHT - (1 - Math.cos(angle)) * ARC_RADIUS_Y;

    // Scale and opacity based on distance from center
    const distAbs = Math.abs(dist);
    const scale = Math.max(0.5, 1 - distAbs * 0.12);
    const opacity = Math.max(0.3, 1 - distAbs * 0.14);

    // Is this the center-most item?
    const nearest = Math.round(-currentOffset / ITEM_HEIGHT);
    const isActive = memoryIndex === Math.max(0, Math.min(totalMemories - 1, nearest));

    // Z-index: items nearer to center on top
    const zIndex = 100 - Math.round(distAbs * 10);

    return {
      x: arcX,
      y: arcY,
      scale,
      opacity,
      isActive,
      zIndex,
      distAbs,
    };
  }, []);

  // ─── Current memory (nearest to center) ───
  const focusedMemory = useMemo(() => {
    if (total === 0) return null;
    const nearest = Math.round(-offsetRef.current / ITEM_HEIGHT);
    const idx = Math.max(0, Math.min(total - 1, nearest));
    return { memory: memories[idx], index: idx };
  }, [memories, total]);

  // ─── Render ───

  // Loading state
  if (isLoading) {
    return (
      <div className="page-content min-h-screen flex flex-col">
        <Header onBack={() => router.back()} total={0} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#8E8E93]/20 border-t-[#8E8E93] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#8E8E93] font-medium">Đang tải ký ức...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-content min-h-screen flex flex-col">
        <Header onBack={() => router.back()} total={0} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[13px] text-[#E6002D] font-medium mb-3">{error}</p>
            <button onClick={loadMemories}
              className="px-5 py-2 rounded-[10px] text-[12px] font-semibold text-white bg-[#E6002D]">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (total === 0) {
    return (
      <div className="page-content min-h-screen flex flex-col">
        <Header onBack={() => router.back()} total={0} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-[240px]">
            <div className="w-[72px] h-[72px] rounded-full bg-[rgba(0,0,0,0.03)] mx-auto mb-4 flex items-center justify-center">
              <Disc3 size={32} className="text-[rgba(0,0,0,0.15)]" />
            </div>
            <p className="text-[15px] font-semibold text-[#6B7280] mb-1">Chưa có mảnh ký ức</p>
            <p className="text-[12px] text-[#8E8E93] leading-relaxed">
              Ký ức sẽ xuất hiện tại đây dưới dạng những mảnh ghép đầy màu sắc
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content min-h-screen min-h-dvh flex flex-col overflow-hidden select-none touch-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.3px]">Mảnh Ký ức</h1>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">{total} ký ức</p>
          </div>
        </div>
        <button onClick={loadMemories}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
          <Sparkles size={15} />
        </button>
      </div>

      {/* Arc Carousel */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ minHeight: 320 }}
        onPointerDown={onPointerDown}
        onPointerCancel={() => { dragActive.current = false; }}
      >
        {/* Background subtle glow at center */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)',
          }}
        />

        {/* Items */}
        <div className="absolute inset-0 flex items-center justify-center">
          {memories.map((m, i) => {
            const pos = getItemStyle(i, total);
            if (!pos) return null;

            return (
              <motion.div
                key={m.MemoryID}
                className="absolute left-1/2"
                style={{
                  width: '85%',
                  maxWidth: 320,
                  zIndex: pos.zIndex,
                }}
                animate={{
                  x: `calc(-50% + ${pos.x}px)`,
                  y: `calc(50% + ${pos.y}px)`,
                  scale: pos.scale,
                  opacity: pos.opacity,
                }}
                transition={{ duration: 0.08, ease: 'linear' }}
              >
                {/* Card */}
                <div
                  className="w-full rounded-[20px] overflow-hidden transition-shadow duration-300"
                  style={{
                    background: pos.isActive
                      ? 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                      : '#ffffff',
                    boxShadow: pos.isActive
                      ? '0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)'
                      : '0 4px 16px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.02)',
                    cursor: 'grab',
                  }}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    {/* Mood badge */}
                    <div
                      className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
                      style={{
                        background: pos.isActive
                          ? getGradient(m.MoodEmoji)
                          : getMoodBg(m.MoodEmoji),
                      }}
                    >
                      {m.MoodEmoji || '🧠'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {pos.isActive && (
                          <span className="w-[6px] h-[6px] rounded-full shrink-0"
                            style={{ background: moodColor(m.MoodEmoji) }} />
                        )}
                        <span className="text-[12px] font-semibold text-[#111] truncate">
                          {m.Title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#8E8E93] font-medium">
                          {relativeTime(getDate(m))}
                        </span>
                        {m.EventTitle && (
                          <>
                            <span className="text-[#8E8E93] text-[8px]">·</span>
                            <span className="text-[9px] text-[#5856D6] font-medium truncate max-w-[100px]">
                              {m.EventTitle}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Play button — only visible on center items */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailMemory(m);
                      }}
                      className="shrink-0 w-[34px] h-[34px] rounded-[12px] flex items-center justify-center transition-all duration-200"
                      style={{
                        background: pos.isActive
                          ? `linear-gradient(135deg, ${moodColor(m.MoodEmoji)}, ${moodColor(m.MoodEmoji)}cc)`
                          : 'rgba(0,0,0,0.04)',
                        opacity: pos.isActive ? 1 : 0,
                        transform: pos.isActive ? 'scale(1)' : 'scale(0.8)',
                        boxShadow: pos.isActive ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
                      }}
                    >
                      <Play size={14} className={pos.isActive ? 'text-white' : 'text-[#8E8E93]'}
                        fill={pos.isActive ? 'white' : 'transparent'} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom indicator: page dots */}
      <div className="flex items-center justify-center gap-1 py-3">
        {memories.slice(
          Math.max(0, focusedMemory ? focusedMemory.index - 2 : 0),
          Math.min(total, focusedMemory ? focusedMemory.index + 3 : 5)
        ).map((m, i) => {
          const globalIdx = Math.max(0, (focusedMemory?.index || 0) - 2) + i;
          const isActive = globalIdx === (focusedMemory?.index ?? 0);
          return (
            <button
              key={m.MemoryID}
              onClick={() => snapTo(globalIdx)}
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? 20 : 6,
                height: 6,
                background: isActive ? moodColor(m.MoodEmoji) : 'rgba(0,0,0,0.1)',
              }}
            />
          );
        })}
      </div>

      {/* ─── Detail Panel Overlay ─── */}
      <AnimatePresence>
        {detailMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/20 backdrop-blur-[2px]"
            onClick={() => setDetailMemory(null)}
          >
            <motion.div
              initial={{ translateY: '100%' }}
              animate={{ translateY: '0%' }}
              exit={{ translateY: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[480px] bg-white rounded-t-[28px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: '0 -8px 40px rgba(0,0,0,0.08), 0 -2px 8px rgba(0,0,0,0.04)',
                maxHeight: '85vh',
              }}
            >
              {/* Handle */}
              <div className="w-[36px] h-[4px] bg-[rgba(0,0,0,0.1)] rounded-full mx-auto mt-3 mb-2" />

              {/* Close button */}
              <div className="flex items-center justify-between px-4">
                <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-[1px]">
                  CHI TIẾT KÝ ỨC
                </span>
                <button
                  onClick={() => setDetailMemory(null)}
                  className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 pt-2 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                {/* Header: mood + title */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div
                    className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[24px] shrink-0"
                    style={{
                      background: `${moodColor(detailMemory.MoodEmoji)}15`,
                      border: `1px solid ${moodColor(detailMemory.MoodEmoji)}25`,
                    }}
                  >
                    {detailMemory.MoodEmoji || '🧠'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold tracking-[1.2px] uppercase"
                      style={{ color: moodColor(detailMemory.MoodEmoji) }}>
                      {relativeTime(getDate(detailMemory))}
                    </div>
                    <h2 className="text-[20px] font-extrabold text-[#111] mt-0.5 tracking-[-0.3px] leading-tight">
                      {detailMemory.Title}
                    </h2>
                  </div>
                </div>

                {/* Content */}
                {detailMemory.Content && (
                  <div className="text-[13px] text-[#5F6368] leading-relaxed mb-4 whitespace-pre-wrap
                    bg-[rgba(0,0,0,0.02)] rounded-[14px] p-3.5">
                    {detailMemory.Content}
                  </div>
                )}

                {/* Image */}
                {detailMemory.Image && (
                  <div className="mb-4 rounded-[14px] overflow-hidden bg-[rgba(0,0,0,0.02)]">
                    <img
                      src={detailMemory.Image}
                      alt=""
                      className="w-full h-[180px] object-cover"
                      style={{ borderRadius: 14 }}
                    />
                  </div>
                )}

                {/* Event link */}
                {detailMemory.EventTitle && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-[12px] bg-[rgba(88,86,214,0.06)]"
                    style={{ border: '1px solid rgba(88,86,214,0.08)' }}
                  >
                    <LinkIcon size={13} className="text-[#5856D6] shrink-0" />
                    <span className="text-[12px] text-[#5856D6] font-medium line-clamp-1">
                      🔗 {detailMemory.EventTitle}
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-[rgba(0,0,0,0.04)]">
                  <Calendar size={13} className="text-[#8E8E93] shrink-0" />
                  <span className="text-[11px] text-[#8E8E93] font-medium">
                    {new Date(getDate(detailMemory)).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Header component ───
function Header({ onBack, total, onRefresh }: {
  onBack: () => void;
  total: number;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button onClick={onBack}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.3px]">Mảnh Ký ức</h1>
          {total > 0 && <p className="text-[11px] text-[#8E8E93] mt-0.5">{total} ký ức</p>}
        </div>
      </div>
      <button onClick={onRefresh}
        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
        <Sparkles size={15} />
      </button>
    </div>
  );
}
