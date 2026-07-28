'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Calendar, Link as LinkIcon, X, Sparkles, Disc3 } from 'lucide-react';
import { memoryService } from '@/lib/services/memory-service';
import type { MemoryWithEvent } from '@/types/database';

// ─── Helpers ───
function relativeTime(dateStr: string): string {
  const d = new Date(dateStr); const now = new Date();
  now.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0);
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
  '😤': 'linear-gradient(135deg, #B30024 0%, #E6002D 55%, #FF3355 100%)',
  '😴': 'linear-gradient(135deg, #5C5E63 0%, #8E8E93 55%, #AEAEB2 100%)',
};

function getGradient(emoji?: string | null): string {
  return MOOD_GRADIENTS[emoji || ''] || 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 55%, #C7C7CC 100%)';
}

function getDate(m: MemoryWithEvent): string {
  return m.EventDate || m.MemoryDate || m.CreatedDate;
}

// ─── Arc carousel constants ───
const ITEM_WIDTH = 85;       // % of container width each card takes
const ITEM_SPACING = 130;    // px per virtual item (how far to swipe per item)
const ARC_RADIUS = 220;      // radius of the circular arc
const ARC_DEG = Math.PI / 9; // 20° arc angle between items
const VISIBLE_ITEMS = 7;
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

export default function MemoryShardsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);

  // offset drives circular arc positions. During drag it stays frozen.
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const syncOffset = useCallback(() => setOffset(offsetRef.current), []);

  // framer-motion dragX — handles ALL drag movement natively
  const dragX = useMotionValue(0);
  const dragBlockedRef = useRef(false);
  const dragStartOffsetRef = useRef(0);
  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Data loading ───
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await memoryService.getAllWithEvent();
      data.sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
      setMemories(data);
      offsetRef.current = 0; setOffset(0); dragX.set(0);
    } catch (e: any) {
      setError(e.message || 'Không thể tải ký ức');
    } finally {
      setIsLoading(false);
    }
  }, [dragX]);
  useEffect(() => { loadMemories(); }, [loadMemories]);

  const total = memories.length;

  const getCenterVirtual = useCallback(() => {
    if (total === 0) return 0;
    return -offsetRef.current / ITEM_SPACING;
  }, [total]);

  // ─── Snap / Inertia ───
  const snapTo = useCallback((virtualTarget: number) => {
    if (total === 0) return;
    const targetOffset = -virtualTarget * ITEM_SPACING;
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
      syncOffset();
      if (p < 1) animRef.current = requestAnimationFrame(step);
      else { offsetRef.current = targetOffset; syncOffset(); animRef.current = null; }
    };
    animRef.current = requestAnimationFrame(step);
  }, [total, syncOffset]);

  const startInertia = useCallback((velocity: number) => {
    if (total === 0) return;
    animRef.current = requestAnimationFrame(function inertiaStep() {
      velocity *= 0.96;
      if (Math.abs(velocity) < 0.3) {
        animRef.current = null;
        snapTo(Math.round(getCenterVirtual()));
        return;
      }
      offsetRef.current += velocity;
      syncOffset();
      animRef.current = requestAnimationFrame(inertiaStep);
    });
  }, [total, getCenterVirtual, snapTo, syncOffset]);

  // ─── Framer-motion drag callbacks ───
  const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    if ((event.target as HTMLElement).closest('[data-play-btn]')) {
      dragBlockedRef.current = true;
      return;
    }
    dragBlockedRef.current = false;
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    dragStartOffsetRef.current = offsetRef.current;
  }, []);

  const handleDrag = useCallback((_: any, info: { offset: { x: number } }) => {
    if (dragBlockedRef.current) return;
    offsetRef.current = dragStartOffsetRef.current + info.offset.x;
  }, []);

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (dragBlockedRef.current) { dragBlockedRef.current = false; return; }

    const velocity = info.velocity.x; // positive = swipe right
    const finalDragX = info.offset.x;

    if (Math.abs(velocity) >= 200) {
      dragX.set(0);
      offsetRef.current = dragStartOffsetRef.current + finalDragX;
      syncOffset();
      startInertia(velocity * 0.3);
      return;
    }

    // Slow drag → animate dragX→0 and offset→target simultaneously
    const startOffset = dragStartOffsetRef.current;
    const totalMove = finalDragX;
    const dur = 300;
    const t0 = performance.now();
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      dragX.set(finalDragX * (1 - ease));
      offsetRef.current = startOffset + totalMove * ease;
      syncOffset();
      if (p < 1) animRef.current = requestAnimationFrame(step);
      else { dragX.set(0); offsetRef.current = startOffset + totalMove; syncOffset(); animRef.current = null; }
    };
    animRef.current = requestAnimationFrame(step);
  }, [dragX, syncOffset, startInertia]);

  // ─── Wheel scroll ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || total === 0) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      offsetRef.current -= e.deltaX || e.deltaY;
      syncOffset();
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => snapTo(Math.round(getCenterVirtual())), 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { el.removeEventListener('wheel', onWheel); if (snapTimerRef.current) clearTimeout(snapTimerRef.current); };
  }, [total, getCenterVirtual, snapTo, syncOffset]);

  // ─── Arc position (circular carousel layout) ───
  const getSlotStyle = useCallback((rel: number) => {
    const angle = rel * ARC_DEG;
    const x = Math.sin(angle) * ARC_RADIUS;         // horizontal spread
    const y = (1 - Math.cos(angle)) * ARC_RADIUS * 0.55; // items go up as they go around
    const scale = Math.max(0.40, Math.cos(angle) * 0.6 + 0.4);
    const opacity = Math.max(0.12, scale * 0.9);
    const zIndex = 100 - Math.abs(rel) * 10;
    return { x, y, scale, opacity, zIndex, isActive: rel === 0 };
  }, []);

  // ─── Build visible slots ───
  const visibleSlots = useMemo(() => {
    if (total === 0) return [];
    const centerVirtual = getCenterVirtual();
    const centerRounded = Math.round(centerVirtual);
    const slots: { rel: number; memory: MemoryWithEvent; virtualIdx: number }[] = [];
    for (let rel = -HALF_VISIBLE; rel <= HALF_VISIBLE; rel++) {
      const virtualIdx = centerRounded + rel;
      const actualIdx = ((virtualIdx % total) + total) % total;
      slots.push({ rel, memory: memories[actualIdx], virtualIdx });
    }
    return slots;
  }, [memories, total, getCenterVirtual]);

  const focusedMemory = useMemo(() => {
    if (total === 0 || visibleSlots.length === 0) return null;
    return visibleSlots.find(s => s.rel === 0) || visibleSlots[Math.floor(visibleSlots.length / 2)];
  }, [visibleSlots, total]);

  const dotSlots = useMemo(() => {
    if (total === 0 || !focusedMemory) return [];
    const range = 3;
    const dots = [];
    for (let rel = -range; rel <= range; rel++) {
      const actualIdx = ((focusedMemory.virtualIdx + rel) % total + total) % total;
      dots.push({ rel, actualIdx, memory: memories[actualIdx] });
    }
    return dots;
  }, [focusedMemory, memories, total]);

  const handlePlay = useCallback((e: React.MouseEvent, mem: MemoryWithEvent) => {
    e.stopPropagation();
    setDetailMemory(mem);
  }, []);

  // ─── Loading / Error / Empty states ───
  if (isLoading) {
    return (
      <div className="page-content min-h-dvh flex flex-col">
        <Header onBack={() => router.back()} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#8E8E93]/20 border-t-[#8E8E93] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-[#8E8E93] font-medium">Đang tải ký ức...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content min-h-dvh flex flex-col">
        <Header onBack={() => router.back()} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[13px] text-[#E6002D] font-medium mb-3">{error}</p>
            <button onClick={loadMemories}
              className="px-5 py-2 rounded-[10px] text-[12px] font-semibold text-white bg-[#E6002D]">Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="page-content min-h-dvh flex flex-col">
        <Header onBack={() => router.back()} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-[240px]">
            <div className="w-[72px] h-[72px] rounded-full bg-[rgba(0,0,0,0.03)] mx-auto mb-4 flex items-center justify-center">
              <Disc3 size={32} className="text-[rgba(0,0,0,0.15)]" />
            </div>
            <p className="text-[15px] font-semibold text-[#6B7280] mb-1">Chưa có mảnh ký ức</p>
            <p className="text-[12px] text-[#8E8E93] leading-relaxed">Ký ức sẽ xuất hiện tại đây dưới dạng những mảnh ghép</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ───
  // dragX handles ALL horizontal movement during drag via framer-motion.
  // offset drives circular arc positions; frozen during drag.
  // On drag end: dragX→0, offset→newValue, simultaneous → no visual jump.
  return (
    <div className="page-content min-h-dvh flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.3px]">Mảnh Ký ức</h1>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">Carousel vòng tròn · {total} ký ức</p>
          </div>
        </div>
        <button onClick={loadMemories}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
          <Sparkles size={15} />
        </button>
      </div>

      {/* Circular Carousel — framer-motion drag="x" handles ALL pointer/touch events */}
      <motion.div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        style={{
          minHeight: 260,
          x: dragX,
          touchAction: 'none',
          userSelect: 'none',
        }}
        drag="x"
        dragConstraints={false}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {/* Centre glow */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 280, height: 280, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)',
          }}
        />

        {/* Cards — arranged on a circular arc via CSS transform */}
        <div className="absolute inset-0 flex items-center justify-center">
          {visibleSlots.map((slot) => {
            const style = getSlotStyle(slot.rel);
            const mem = slot.memory;
            return (
              <div
                key={`${slot.virtualIdx}-${mem.MemoryID}`}
                className="absolute"
                style={{
                  zIndex: style.zIndex,
                  // arc position: x=horizontal spread, y=vertical arc curve
                  transform: `translate(calc(-50% + ${offset + style.x}px), calc(-50% + ${-style.y}px)) scale(${style.scale})`,
                  opacity: style.opacity,
                  transition: 'transform 0.12s ease, opacity 0.12s ease',
                }}
              >
                {/* Card */}
                <div
                  className="rounded-[20px] overflow-hidden"
                  style={{
                    width: 260,
                    background: style.isActive
                      ? 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                      : '#ffffff',
                    boxShadow: style.isActive
                      ? '0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)'
                      : '0 4px 16px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.02)',
                  }}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <div
                      className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
                      style={{
                        background: style.isActive
                          ? getGradient(mem.MoodEmoji)
                          : `${moodColor(mem.MoodEmoji)}15`,
                      }}
                    >
                      {mem.MoodEmoji || '🧠'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {style.isActive && (
                          <span className="w-[6px] h-[6px] rounded-full shrink-0"
                            style={{ background: moodColor(mem.MoodEmoji) }} />
                        )}
                        <span className="text-[12px] font-semibold text-[#111] truncate">{mem.Title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#8E8E93] font-medium">{relativeTime(getDate(mem))}</span>
                        {mem.EventTitle && (
                          <>
                            <span className="text-[#8E8E93] text-[8px]">·</span>
                            <span className="text-[9px] text-[#5856D6] font-medium truncate max-w-[100px]">{mem.EventTitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      data-play-btn
                      onClick={(e) => handlePlay(e, mem)}
                      className="shrink-0 w-[34px] h-[34px] rounded-[12px] flex items-center justify-center transition-all duration-200"
                      style={{
                        background: style.isActive
                          ? `linear-gradient(135deg, ${moodColor(mem.MoodEmoji)}, ${moodColor(mem.MoodEmoji)}cc)`
                          : 'rgba(0,0,0,0.04)',
                        opacity: style.isActive ? 1 : 0,
                        transform: style.isActive ? 'scale(1)' : 'scale(0.8)',
                        boxShadow: style.isActive ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
                      }}
                    >
                      <Play size={14} className={style.isActive ? 'text-white' : 'text-[#8E8E93]'}
                        fill={style.isActive ? 'white' : 'transparent'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Page dots */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {dotSlots.map((dot) => {
          const isActive = dot.rel === 0;
          return (
            <button key={dot.rel} onClick={() => {
              if (focusedMemory) snapTo(focusedMemory.virtualIdx + dot.rel);
            }}
              className="rounded-full transition-all duration-200"
              style={{
                width: isActive ? 22 : 6, height: 6,
                background: isActive ? moodColor(dot.memory.MoodEmoji) : 'rgba(0,0,0,0.1)',
              }}
            />
          );
        })}
      </div>

      {/* ─── Detail Panel ─── */}
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
              style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.08), 0 -2px 8px rgba(0,0,0,0.04)', maxHeight: '85vh' }}
            >
              <div className="w-[36px] h-[4px] bg-[rgba(0,0,0,0.1)] rounded-full mx-auto mt-3 mb-2" />
              <div className="flex items-center justify-between px-4">
                <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-[1px]">CHI TIẾT KÝ ỨC</span>
                <button onClick={() => setDetailMemory(null)}
                  className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 pt-2 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[24px] shrink-0"
                    style={{ background: `${moodColor(detailMemory.MoodEmoji)}15`, border: `1px solid ${moodColor(detailMemory.MoodEmoji)}25` }}>
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
                {detailMemory.Content && (
                  <div className="text-[13px] text-[#5F6368] leading-relaxed mb-4 whitespace-pre-wrap bg-[rgba(0,0,0,0.02)] rounded-[14px] p-3.5">
                    {detailMemory.Content}
                  </div>
                )}
                {detailMemory.Image && (
                  <div className="mb-4 rounded-[14px] overflow-hidden bg-[rgba(0,0,0,0.02)]">
                    <img src={detailMemory.Image} alt="" className="w-full h-[180px] object-cover" style={{ borderRadius: 14 }} />
                  </div>
                )}
                {detailMemory.EventTitle && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-[12px] bg-[rgba(88,86,214,0.06)]"
                    style={{ border: '1px solid rgba(88,86,214,0.08)' }}>
                    <LinkIcon size={13} className="text-[#5856D6] shrink-0" />
                    <span className="text-[12px] text-[#5856D6] font-medium line-clamp-1">🔗 {detailMemory.EventTitle}</span>
                  </div>
                )}
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

function Header({ onBack, onRefresh }: { onBack: () => void; onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <button onClick={onBack}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.3px]">Mảnh Ký ức</h1>
        </div>
      </div>
      <button onClick={onRefresh}
        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
        <Sparkles size={15} />
      </button>
    </div>
  );
}
