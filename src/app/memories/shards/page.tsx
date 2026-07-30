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

function getDate(m: MemoryWithEvent): string {
  return m.EventDate || m.MemoryDate || m.CreatedDate;
}

// ─── Vertical & Arc constants ───
const ITEM_HEIGHT = 100;         // scroll distance per slot (= Y spacing)
const VERTICAL_STEP = 100;       // linear Y gap between items (matches ITEM_HEIGHT for smooth cycling)
const VISIBLE_ITEMS = 7;
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

const WHEEL_RADIUS = 360;        // arc radius for X curvature
const WHEEL_CENTER_X = -360;     // rel=0 → x=0 → active card centered
const ANGLE_STEP = Math.PI / 10; // 18° per item

export default function MemoryShardsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);

  // ─── Scroll state: offset (unbounded, accumulates total drag/wheel delta) ───
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollOffsetRef = useRef(0);
  const syncOffset = useCallback(() => {
    setScrollOffset(scrollOffsetRef.current);
  }, []);

  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);

  // ─── Data loading ───
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await memoryService.getAllWithEvent();
      data.sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
      setMemories(data);
      scrollOffsetRef.current = 0;
      setScrollOffset(0);
    } catch (e: any) {
      setError(e.message || 'Không thể tải ký ức');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const total = memories.length;

  // ─── Snap scrollOffset → nearest ITEM_HEIGHT multiple (immediate, CSS animates per-card) ───
  const snapToCenter = useCallback(() => {
    if (total === 0) return;
    const start = scrollOffsetRef.current;
    const target = Math.round(start / ITEM_HEIGHT) * ITEM_HEIGHT;
    const diff = target - start;
    if (Math.abs(diff) < 1) return;
    scrollOffsetRef.current = target;
    syncOffset();
  }, [total, syncOffset]);

  // ─── Jump to a virtual index (for dot clicks) ───
  const goToVirtual = useCallback((targetIdx: number) => {
    if (total === 0) return;
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    scrollOffsetRef.current = -targetIdx * ITEM_HEIGHT;
    syncOffset();
  }, [total, syncOffset]);

  // ─── Inertia ───
  const startInertia = useCallback((velocity: number) => {
    if (total === 0) return;
    animRef.current = requestAnimationFrame(function inertiaStep() {
      velocity *= 0.965;
      if (Math.abs(velocity) < 0.3) {
        animRef.current = null;
        snapToCenter();
        return;
      }
      scrollOffsetRef.current += velocity;
      syncOffset();
      animRef.current = requestAnimationFrame(inertiaStep);
    });
  }, [total, snapToCenter, syncOffset]);

  // ─── Drag state + scroll state ───
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false); // true during active wheel scroll

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
      state.startOffset = scrollOffsetRef.current;
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
      scrollOffsetRef.current = state.startOffset + deltaY;
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

      if (Math.abs(velocity) >= 200) {
        startInertia(velocity * 0.3);
        return;
      }

      snapToCenter();
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
      scrollOffsetRef.current += e.deltaY * 0.5;
      syncOffset();
      if (!isScrollingRef.current) { isScrollingRef.current = true; setIsScrolling(true); }
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => {
        snapToCenter();
        isScrollingRef.current = false;
        setIsScrolling(false);
      }, 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, [total, snapToCenter, syncOffset, setIsScrolling]);

  // ─── Arc position (left-centered wheel) ───
  const getSlotStyle = useCallback((rel: number) => {
    const distAbs = Math.abs(rel);
    const scale = Math.max(0.40, 1 - distAbs * 0.14);
    const opacity = Math.max(0.08, 1 - distAbs * 0.20);
    const textOpacity = Math.max(0.08, 1 - distAbs * 0.24);

    // X: arc wheel + rightward bias — non-active cards shift progressively right
    const angle = rel * ANGLE_STEP;
    const arcX = WHEEL_CENTER_X + WHEEL_RADIUS * Math.cos(angle);
    const rightBias = Math.pow(distAbs, 2) * 28;
    const x = arcX + rightBias;
    const zIndex = 100 - Math.round(distAbs * 10);

    // Glow radius (for gooey circles behind cards)
    const glowR = 120 - Math.round(distAbs * 22);

    // 3D Cylindrical — non-linear: edge items tilt & recede much more
    const tiltDeg = -rel * 5 * (1 + distAbs * 0.3);
    const depthZ = -Math.pow(distAbs, 1.6) * 25;

    // Dynamic avatar size: center=72px, edges=66px (gần như bằng nhau)
    const avatarSize = Math.round(72 - distAbs * 2);

    // Emoji size: fill the avatar circle proportionally
    const emojiSize = Math.round(avatarSize * 0.6);

    return { x, scale, opacity, zIndex, isActive: rel === 0, glowR, tiltDeg, depthZ, avatarSize, emojiSize, textOpacity };
  }, []);

  const handlePlay = useCallback((e: React.MouseEvent, mem: MemoryWithEvent) => {
    e.stopPropagation();
    setDetailMemory(mem);
  }, []);

  // ─── Build visible slots — yPos from virtualIdx ensures smooth no-jump scroll ───
  const visibleSlots = useMemo(() => {
    if (total === 0) return [];
    const centerVirtual = Math.floor(-scrollOffset / ITEM_HEIGHT);
    const slots: { rel: number; memory: MemoryWithEvent; virtualIdx: number; yPos: number }[] = [];
    for (let rel = -HALF_VISIBLE; rel <= HALF_VISIBLE; rel++) {
      const virtualIdx = centerVirtual + rel;
      const yPos = virtualIdx * ITEM_HEIGHT + scrollOffset;
      const actualIdx = ((virtualIdx % total) + total) % total;
      slots.push({ rel, memory: memories[actualIdx], virtualIdx, yPos });
    }
    return slots;
  }, [memories, total, scrollOffset]);

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
      {/* CSS gooey filter removed during drag/scroll — GPU-friendly blur+contrast on glow container */}

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
        style={{ minHeight: 300, overscrollBehavior: 'none', perspective: '1000px' }}
      >
        {/* Gooey glow layer — CSS blur+contrast (GPU), disabled during drag/scroll */}
        <div className="absolute inset-0 pointer-events-none" style={{
          filter: isDragging || isScrolling ? 'none' : 'blur(14px) contrast(1.8) brightness(1.15)',
          transition: isDragging || isScrolling ? 'none' : 'filter 0.3s ease',
        }}>
          {visibleSlots.map((slot) => {
            const mem = slot.memory;
            const style = getSlotStyle(slot.rel);
            const color = moodColor(mem.MoodEmoji);
            return (
              <div
                key={`glow-${mem.MemoryID}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: style.glowR * 2.0,
                  height: style.glowR * 2.0,
                  transform: `translate(calc(-50% + ${style.x}px), calc(-50% + ${slot.yPos}px))`,
                  opacity: Math.max(0.12, 0.8 - Math.abs(slot.rel) * 0.14),
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${color}22 0%, ${color} 50%, transparent 75%)`,
                  willChange: 'transform, opacity',
                  transition: isDragging || isScrolling
                    ? 'none'
                    : `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.abs(slot.rel) * 35}ms, opacity 0.4s ease 0ms`,
                }}
              />
            );
          })}
        </div>

        {/* Cards layer — uniform scroll */}
        <div className="absolute inset-0">
          {visibleSlots.map((slot) => {
            const style = getSlotStyle(slot.rel);
            const mem = slot.memory;
            const color = moodColor(mem.MoodEmoji);
            const showFull = !isDragging && style.isActive; // full styling only at rest + center
            return (
              <div
                key={mem.MemoryID}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: `clamp(250px, ${92 - Math.abs(slot.rel) * 2}%, 320px)`,
                  maxWidth: style.isActive ? 320 : 315,
                  zIndex: style.zIndex,
                  transform: `perspective(900px) translate3d(calc(-50% + ${style.x}px), calc(-50% + ${slot.yPos}px), ${style.depthZ}px) rotateX(${style.tiltDeg}deg) scale(${style.scale})`,
                  opacity: style.opacity,
                  transition: isDragging || isScrolling
                    ? 'none'
                    : `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.abs(slot.rel) * 35}ms, opacity 0.4s ease 0ms`,
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden' as const,
                }}
              >
                {/* Layer container — establishes positioning context */}
                <div style={{ position: 'relative', width: '100%', height: style.avatarSize }}>
                  
                  {/* BODY LAYER — background + borders, behind avatar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${style.avatarSize}px * 0.81)`,
                      right: 0,
                      top: `calc(${style.avatarSize}px * 0.11)`,
                      bottom: `calc(${style.avatarSize}px * 0.11)`,
                      zIndex: 0,
                      pointerEvents: 'none',
                      borderRadius: `0 ${Math.round(style.avatarSize * 0.35)}px ${Math.round(style.avatarSize * 0.35)}px 0`,
                      background: showFull
                        ? `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)`
                        : 'transparent',
                      backdropFilter: showFull && !isDragging && !isScrolling ? 'blur(8px)' : 'none',
                      WebkitBackdropFilter: showFull && !isDragging && !isScrolling ? 'blur(8px)' : 'none',
                      borderTop: showFull ? `1.5px solid ${color}55` : 'none',
                      borderRight: showFull ? `1.5px solid ${color}55` : 'none',
                      borderBottom: showFull ? `1.5px solid ${color}55` : 'none',
                      borderLeft: 'none',
                      boxShadow: showFull
                        ? `0 0 60px ${color}33, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)`
                        : '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
                      transition: isDragging || isScrolling
                        ? 'none'
                        : 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                    }}
                  />

                  {/* AVATAR LAYER — on top, clip-path so only the circle occludes */}
                  <div
                    className="rounded-full flex items-center justify-center shrink-0"
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: style.avatarSize,
                      height: style.avatarSize,
                      background: `${color}CC`,
                      clipPath: 'circle(50%)',
                      transition: 'width 0.3s ease, height 0.3s ease',
                    }}
                  >
                    <span
                      className="leading-none select-none transition-[font-size] duration-300"
                      style={{ fontSize: style.emojiSize }}
                    >
                      {mem.MoodEmoji || '🧠'}
                    </span>
                  </div>

                  {/* CONTENT LAYER — text + play, above body, beside avatar */}
                  <div
                    className="flex items-center"
                    style={{
                      position: 'absolute',
                      left: style.avatarSize,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      zIndex: 1,
                    }}
                  >
                    {/* Text */}
                    <div className="flex-1 min-w-0 px-[10px] py-[4px]" style={{ opacity: style.textOpacity }}>
                      <div className="text-[14px] font-bold text-white/90 leading-tight mb-[2px] line-clamp-1">
                        {mem.Title}
                      </div>
                      <div className="text-[11px] text-white/40 font-medium whitespace-nowrap">
                        {relativeTime(getDate(mem))}
                      </div>
                    </div>

                    {/* Play button */}
                    <button
                      data-play-btn
                      onClick={(e) => handlePlay(e, mem)}
                      className="shrink-0 flex items-center justify-center mr-[6px] transition-all duration-300"
                      style={{
                        width: showFull ? 28 : 0,
                        height: showFull ? 28 : 0,
                        borderRadius: '50%',
                        background: showFull
                          ? `linear-gradient(135deg, ${color}, ${color}bb)`
                          : 'transparent',
                        opacity: showFull ? 1 : 0,
                        transform: showFull ? 'scale(1)' : 'scale(0)',
                        boxShadow: showFull
                          ? `0 0 20px ${color}44, 0 4px 12px rgba(0,0,0,0.2)`
                          : 'none',
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      <Play size={14} fill={showFull ? '#fff' : 'transparent'} color={showFull ? '#fff' : 'transparent'} />
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
              if (focusedMemory) goToVirtual(focusedMemory.virtualIdx + dot.rel);
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
