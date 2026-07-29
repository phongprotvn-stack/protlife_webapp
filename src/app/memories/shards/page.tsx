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
  '😤': 'linear-gradient(135deg, #B30024 0%, #E6002D 55%, #FF3355 100%)',
  '😴': 'linear-gradient(135deg, #5C5E63 0%, #8E8E93 55%, #AEAEB2 100%)',
};

function getGradient(emoji?: string | null): string {
  return MOOD_GRADIENTS[emoji || ''] || 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 55%, #C7C7CC 100%)';
}

function getDate(m: MemoryWithEvent): string {
  return m.EventDate || m.MemoryDate || m.CreatedDate;
}

const ITEM_HEIGHT = 100;
const VISIBLE_ITEMS = 7;
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

// ─── Left-centered wheel arc constants ───
const WHEEL_RADIUS = 260;        // arc radius
const WHEEL_CENTER_X = -260;     // so rel=0 maps to x=0 → centered on container
const ANGLE_STEP = Math.PI / 12; // 15° per item → gentle visible arc

export default function MemoryShardsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);

  // offset is the single source of truth for scroll position
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const syncOffset = useCallback(() => setOffset(offsetRef.current), []);

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
      offsetRef.current = 0;
      setOffset(0);
    } catch (e: any) {
      setError(e.message || 'Không thể tải ký ức');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const total = memories.length;

  const getCenterVirtual = useCallback(() => {
    if (total === 0) return 0;
    return -offsetRef.current / ITEM_HEIGHT;
  }, [total]);

  // ─── Snap animation ───
  const snapTo = useCallback((virtualTarget: number) => {
    if (total === 0) return;
    const targetOffset = -virtualTarget * ITEM_HEIGHT;
    const start = offsetRef.current;
    const diff = targetOffset - start;
    if (Math.abs(diff) < 1) return;
    const dur = 400;
    const t0 = performance.now();
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      offsetRef.current = start + diff * ease;
      syncOffset();
      if (p < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        offsetRef.current = targetOffset;
        syncOffset();
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, [total, syncOffset]);

  // ─── Inertia ───
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

  // ─── Drag state ───
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef({
    isDragging: false,
    startY: 0,
    startOffset: 0,
    velocity: 0,
    lastY: 0,
    lastTime: 0,
  });

  // ─── Manual drag via native pointer events ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || total === 0) return;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-play-btn]')) return;
      e.preventDefault();
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);

      const state = dragStateRef.current;
      state.isDragging = true;
      state.startY = e.clientY;
      state.startOffset = offsetRef.current;
      state.velocity = 0;
      state.lastY = e.clientY;
      state.lastTime = performance.now();

      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      setIsDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.isDragging) return;
      e.preventDefault();
      const deltaY = e.clientY - state.startY;
      offsetRef.current = state.startOffset + deltaY;
      syncOffset();

      const now = performance.now();
      const dt = now - state.lastTime;
      if (dt > 0) {
        state.velocity = ((e.clientY - state.lastY) / dt) * 16.67;
      }
      state.lastY = e.clientY;
      state.lastTime = now;
    };

    const onPointerUp = (_e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.isDragging) return;
      state.isDragging = false;
      setIsDragging(false);

      const velocity = Math.abs(state.velocity) >= 0.5 ? state.velocity : 0;
      const currentOffset = offsetRef.current;

      if (Math.abs(velocity) >= 200) {
        startInertia(velocity * 0.3);
        return;
      }

      const centerVirtual = -currentOffset / ITEM_HEIGHT;
      const targetVirtual = Math.round(centerVirtual);
      snapTo(targetVirtual);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [total, syncOffset, startInertia]);

  // ─── Wheel scroll ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || total === 0) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      offsetRef.current -= e.deltaY * 0.5;
      syncOffset();
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => {
        snapTo(Math.round(getCenterVirtual()));
      }, 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, [total, getCenterVirtual, snapTo, syncOffset]);

  // ─── Arc position (left-centered wheel) ───
  const getSlotStyle = useCallback((rel: number) => {
    const distAbs = Math.abs(rel);
    const scale = Math.max(0.50, 1 - distAbs * 0.12);
    const opacity = Math.max(0.18, 1 - distAbs * 0.14);

    // Position along a wheel with center on the LEFT
    const angle = rel * ANGLE_STEP;
    const x = WHEEL_CENTER_X + WHEEL_RADIUS * Math.cos(angle);
    const y = WHEEL_RADIUS * Math.sin(angle);
    const zIndex = 100 - Math.round(distAbs * 10);

    // Glow radius (for gooey circles behind cards)
    const glowR = 80 - Math.round(distAbs * 14);

    return { x, y, scale, opacity, zIndex, isActive: rel === 0, glowR };
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
  }, [memories, total, getCenterVirtual, offset]);

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

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="page-content min-h-dvh flex flex-col bg-[#0A0A0F]">
        <Header onBack={() => router.back()} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[13px] text-white/40 font-medium">Đang tải ký ức...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="page-content min-h-dvh flex flex-col bg-[#0A0A0F]">
        <Header onBack={() => router.back()} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[13px] text-[#FF453A] font-medium mb-3">{error}</p>
            <button onClick={loadMemories}
              className="px-5 py-2 rounded-[10px] text-[12px] font-semibold text-white bg-[#FF453A]">Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty ───
  if (total === 0) {
    return (
      <div className="page-content min-h-dvh flex flex-col bg-[#0A0A0F]">
        <Header onBack={() => router.back()} onRefresh={loadMemories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-[240px]">
            <div className="w-[72px] h-[72px] rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <Disc3 size={32} className="text-white/15" />
            </div>
            <p className="text-[15px] font-semibold text-white/50 mb-1">Chưa có mảnh ký ức</p>
            <p className="text-[12px] text-white/30 leading-relaxed">Ký ức sẽ xuất hiện tại đây dưới dạng những mảnh ghép</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN RENDER ───
  return (
    <div className="page-content min-h-dvh flex flex-col overflow-hidden select-none bg-[#0A0A0F]">
      {/* Gooey SVG filter */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-2 px-4 pt-3 pb-2"
        style={{ background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 50%, transparent)' }}>
        <div className="flex items-center gap-2.5">
          <button onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-white/5 text-white/50 transition-colors">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-white tracking-[-0.3px]">Mảnh Ký ức</h1>
            <p className="text-[11px] text-white/30 mt-0.5">Vòng lặp vô tận · {total} ký ức</p>
          </div>
        </div>
        <button onClick={loadMemories}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-white/5 text-white/50 transition-colors">
          <Sparkles size={15} />
        </button>
      </div>

      {/* Drag Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden touch-none select-none"
        style={{ minHeight: 300, overscrollBehavior: 'none' }}
      >
        {/* Gooey glow layer — center glow fixed, others scroll */}
        <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#goo)' }}>
          {visibleSlots.map((slot) => {
            const mem = slot.memory;
            const style = getSlotStyle(slot.rel);
            const color = moodColor(mem.MoodEmoji);
            const isCenter = slot.rel === 0;
            return (
              <div
                key={`glow-${slot.virtualIdx}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: style.glowR * 2,
                  height: style.glowR * 2,
                  // Center glow ALWAYS fixed at arc position, others scroll with offset
                  transform: isCenter
                    ? `translate(calc(-50% + ${style.x}px), calc(-50% + ${style.y}px))`
                    : `translate(calc(-50% + ${style.x}px), calc(-50% + ${offset + style.y}px))`,
                  opacity: isCenter ? 0.45 : Math.max(0.1, 0.45 - Math.abs(slot.rel) * 0.08),
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${color} 0%, ${color}88 40%, transparent 70%)`,
                  willChange: 'transform, opacity',
                }}
              />
            );
          })}
        </div>

        {/* Cards layer — center card ALWAYS fixed at center */}
        <div className="absolute inset-0">
          {visibleSlots.map((slot) => {
            const style = getSlotStyle(slot.rel);
            const mem = slot.memory;
            const color = moodColor(mem.MoodEmoji);
            const isCenter = slot.rel === 0;
            return (
              <div
                key={slot.virtualIdx}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: `clamp(200px, ${78 - Math.abs(slot.rel) * 4}%, 280px)`,
                  maxWidth: style.isActive ? 300 : 260,
                  zIndex: style.zIndex,
                  // Center card ALWAYS at fixed arc center, others scroll past
                  transform: isCenter
                    ? `translate(calc(-50% + ${style.x}px), calc(-50% + ${style.y}px)) scale(${style.scale})`
                    : `translate(calc(-50% + ${style.x}px), calc(-50% + ${offset + style.y}px)) scale(${style.scale})`,
                  opacity: style.opacity,
                  transition: isDragging
                    ? 'none'
                    : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                  willChange: 'transform, opacity',
                }}
              >
                {/* Card body */}
                <div
                  className="w-full rounded-[22px] overflow-hidden backdrop-blur-[8px]"
                  style={{
                    background: style.isActive
                      ? `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)`
                      : 'rgba(255,255,255,0.04)',
                    border: style.isActive
                      ? `1px solid ${color}44`
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: style.isActive
                      ? `0 0 40px ${color}22, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`
                      : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Mood circle */}
                    <div
                      className="w-[40px] h-[40px] rounded-[14px] flex items-center justify-center text-[20px] shrink-0"
                      style={{
                        background: style.isActive
                          ? getGradient(mem.MoodEmoji)
                          : `${color}18`,
                        boxShadow: style.isActive
                          ? `0 0 20px ${color}44`
                          : 'none',
                      }}
                    >
                      {mem.MoodEmoji || '🧠'}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {style.isActive && (
                          <span className="w-[6px] h-[6px] rounded-full shrink-0"
                            style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                        )}
                        <span className="text-[12px] font-semibold text-white/90 truncate tracking-[-0.2px]">
                          {mem.Title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-white/40 font-medium">
                          {relativeTime(getDate(mem))}
                        </span>
                        {mem.EventTitle && (
                          <>
                            <span className="text-white/20 text-[8px]">·</span>
                            <span className="text-[9px] font-medium truncate max-w-[100px]"
                              style={{ color: `${color}aa` }}>{mem.EventTitle}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Play button */}
                    <button
                      data-play-btn
                      onClick={(e) => handlePlay(e, mem)}
                      className="shrink-0 w-[36px] h-[36px] rounded-[12px] flex items-center justify-center transition-all duration-300"
                      style={{
                        background: style.isActive
                          ? `linear-gradient(135deg, ${color}, ${color}bb)`
                          : 'rgba(255,255,255,0.04)',
                        opacity: style.isActive ? 1 : 0,
                        transform: style.isActive ? 'scale(1)' : 'scale(0.7)',
                        boxShadow: style.isActive
                          ? `0 0 20px ${color}44, 0 4px 12px rgba(0,0,0,0.2)`
                          : 'none',
                      }}
                    >
                      <Play size={15} className={style.isActive ? 'text-white' : 'text-white/30'}
                        fill={style.isActive ? 'white' : 'transparent'} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Page dots */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 py-3 pb-4">
        {dotSlots.map((dot) => {
          const isActive = dot.rel === 0;
          const color = moodColor(dot.memory.MoodEmoji);
          return (
            <button key={dot.rel} onClick={() => {
              if (focusedMemory) snapTo(focusedMemory.virtualIdx + dot.rel);
            }}
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? 24 : 5,
                height: isActive ? 6 : 5,
                background: isActive ? color : 'rgba(255,255,255,0.12)',
                boxShadow: isActive ? `0 0 8px ${color}66` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {detailMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-[8px]"
            onClick={() => setDetailMemory(null)}
          >
            <motion.div
              initial={{ translateY: '100%' }}
              animate={{ translateY: '0%' }}
              exit={{ translateY: '100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[480px] bg-[#1C1C1E] rounded-t-[28px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.4), 0 -2px 8px rgba(0,0,0,0.2)', maxHeight: '85vh' }}
            >
              <div className="w-[36px] h-[4px] bg-white/10 rounded-full mx-auto mt-3 mb-2" />
              <div className="flex items-center justify-between px-4">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[1.2px]">CHI TIẾT KÝ ỨC</span>
                <button onClick={() => setDetailMemory(null)}
                  className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center hover:bg-white/5 text-white/40">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 pt-2 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[24px] shrink-0"
                    style={{
                      background: `${moodColor(detailMemory.MoodEmoji)}18`,
                      border: `1px solid ${moodColor(detailMemory.MoodEmoji)}35`,
                    }}
                  >
                    {detailMemory.MoodEmoji || '🧠'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold tracking-[1.2px] uppercase text-white/40"
                      style={{ color: moodColor(detailMemory.MoodEmoji) }}>
                      {relativeTime(getDate(detailMemory))}
                    </div>
                    <h2 className="text-[20px] font-extrabold text-white mt-0.5 tracking-[-0.3px] leading-tight">
                      {detailMemory.Title}
                    </h2>
                  </div>
                </div>
                {detailMemory.Content && (
                  <div className="text-[13px] text-white/60 leading-relaxed mb-4 whitespace-pre-wrap bg-white/5 rounded-[14px] p-3.5"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    {detailMemory.Content}
                  </div>
                )}
                {detailMemory.Image && (
                  <div className="mb-4 rounded-[14px] overflow-hidden bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    <img src={detailMemory.Image} alt="" className="w-full h-[180px] object-cover" style={{ borderRadius: 14 }} />
                  </div>
                )}
                {detailMemory.EventTitle && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-[12px]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                    <LinkIcon size={13} className="text-white/40 shrink-0" />
                    <span className="text-[12px] text-white/50 font-medium line-clamp-1">🔗 {detailMemory.EventTitle}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 pt-3 border-t border-white/5">
                  <Calendar size={13} className="text-white/30 shrink-0" />
                  <span className="text-[11px] text-white/40 font-medium">
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
    <div className="flex items-center justify-between mb-3 px-4 pt-3">
      <div className="flex items-center gap-2.5">
        <button onClick={onBack}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-white/5 text-white/50 transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-white tracking-[-0.3px]">Mảnh Ký ức</h1>
        </div>
      </div>
      <button onClick={onRefresh}
        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-white/5 text-white/50 transition-colors">
        <Sparkles size={15} />
      </button>
    </div>
  );
}
