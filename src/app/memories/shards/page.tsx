'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  animate,
  type MotionValue,
} from 'framer-motion';
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
const ITEM_HEIGHT = 100;
const VERTICAL_STEP = 100;
const VISIBLE_ITEMS = 7;
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

const WHEEL_RADIUS = 360;
const WHEEL_CENTER_X = -360;
const ANGLE_STEP = Math.PI / 10;

// ─── Slot state (pure data class returned by the per-frame function) ───
interface SlotState {
  x: number;
  yPos: number;
  tiltDeg: number;
  depthZ: number;
  scale: number;
  opacity: number;
  textOpacity: number;
  avatarSize: number;
  emojiSize: number;
  zIndex: number;
  distAbs: number;
  rel: number;
}

function computeSlot(v: number, index: number): SlotState {
  const centerVirtual = Math.floor(-v / ITEM_HEIGHT);
  const rel = index - centerVirtual;
  const distAbs = Math.abs(rel);

  // Y: snapOffset stretch
  const snapOffset = v - Math.round(v / ITEM_HEIGHT) * ITEM_HEIGHT;
  const stretch = rel * Math.abs(snapOffset) * 0.18;
  const yPos = (centerVirtual + rel) * ITEM_HEIGHT + v + stretch;

  // X: arc + right bias (non-active shift right)
  const angle = rel * ANGLE_STEP;
  const arcX = WHEEL_CENTER_X + WHEEL_RADIUS * Math.cos(angle);
  const rightBias = Math.pow(distAbs, 2) * 28;
  const x = arcX + rightBias;

  // Scale & opacity
  const scale = Math.max(0.75, 1 - distAbs * 0.05);
  const opacity = Math.max(0.08, 1 - distAbs * 0.20);
  const textOpacity = Math.max(0.08, 1 - distAbs * 0.24);

  // 3D tilt + depth (non-linear: edge items tilt & recede much more)
  const tiltDeg = -rel * 5 * (1 + distAbs * 0.3);
  const depthZ = -Math.pow(distAbs, 1.6) * 25;

  // Avatar & emoji size (center=72, edge=66)
  const avatarSize = Math.round(72 - distAbs * 2);
  const emojiSize = Math.round(avatarSize * 0.6);
  const zIndex = 100 - Math.round(distAbs * 10);

  return { x, yPos, tiltDeg, depthZ, scale, opacity, textOpacity, avatarSize, emojiSize, zIndex, distAbs, rel };
}

// ══════════════════════════════════════════════════════════════════════════════
// ShardCard — per-item card with GPU-composited transforms
// ══════════════════════════════════════════════════════════════════════════════

function ShardCard({
  index,
  scrollMV,
  memory,
  isMoving,
  onPlay,
}: {
  index: number;
  scrollMV: MotionValue<number>;
  memory: MemoryWithEvent;
  isMoving: boolean;
  onPlay: (e: React.MouseEvent, mem: MemoryWithEvent) => void;
}) {
  const color = useMemo(() => moodColor(memory.MoodEmoji), [memory.MoodEmoji]);

  // ─── GPU-composited motion values (never trigger React re-render) ───
  const raw = useTransform(scrollMV, (v: number) => computeSlot(v, index));

  const transform = useTransform(raw, (s: SlotState) =>
    `perspective(900px) translate3d(calc(-50% + ${s.x}px), calc(-50% + ${s.yPos}px), ${s.depthZ}px) rotateX(${s.tiltDeg}deg) scale(${s.scale})`
  );
  const opacity = useTransform(raw, (s: SlotState) => s.opacity);
  const zIndex = useTransform(raw, (s: SlotState) => s.zIndex);

  // ─── Values computed at render-time (cheap, triggered only by isMoving changes) ───
  const s = computeSlot(scrollMV.get(), index);
  const isActive = !isMoving && s.rel === 0;
  const showFull = isActive;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        width: `clamp(250px, ${92 - Math.abs(s.rel) * 2}%, 320px)`,
        maxWidth: s.rel === 0 ? 320 : 315,
        zIndex,
        transform,
        opacity,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Layer container — establishes positioning context */}
      <div style={{ position: 'relative', width: '100%', height: s.avatarSize }}>
        
        {/* BODY LAYER — background + borders, behind avatar */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${s.avatarSize}px * 0.81)`,
            right: 0,
            top: `calc(${s.avatarSize}px * 0.11)`,
            bottom: `calc(${s.avatarSize}px * 0.11)`,
            zIndex: 0,
            pointerEvents: 'none',
            borderRadius: `0 ${Math.round(s.avatarSize * 0.35)}px ${Math.round(s.avatarSize * 0.35)}px 0`,
            background: 'transparent',
            borderTop: showFull ? `1.5px solid ${color}55` : 'none',
            borderRight: showFull ? `1.5px solid ${color}55` : 'none',
            borderBottom: showFull ? `1.5px solid ${color}55` : 'none',
            borderLeft: 'none',
            transition: isMoving ? 'none' : 'border-color 0.3s ease',
          }}
        />

        {/* AVATAR LAYER — on top, clip-path so only the circle occludes */}
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{
            position: 'relative',
            zIndex: 2,
            width: s.avatarSize,
            height: s.avatarSize,
            background: `${color}CC`,
            clipPath: 'circle(50%)',
            transition: 'width 0.3s ease, height 0.3s ease',
          }}
        >
          <span
            className="leading-none select-none transition-[font-size] duration-300"
            style={{ fontSize: s.emojiSize }}
          >
            {memory.MoodEmoji || '🧠'}
          </span>
        </div>

        {/* CONTENT LAYER — text + play, above body, beside avatar */}
        <div
          className="flex items-center"
          style={{
            position: 'absolute',
            left: s.avatarSize,
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 1,
          }}
        >
          {/* Text */}
          <div className="flex-1 min-w-0 px-[10px] py-[4px]" style={{ opacity: s.textOpacity }}>
            <div className="text-[14px] font-bold text-white/90 leading-tight mb-[2px] line-clamp-1">
              {memory.Title}
            </div>
            <div className="text-[11px] text-white/40 font-medium whitespace-nowrap">
              {relativeTime(getDate(memory))}
            </div>
          </div>

          {/* Play button */}
          <button
            data-play-btn
            onClick={(e) => onPlay(e, memory)}
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
                ? '0 4px 12px rgba(0,0,0,0.3)'
                : 'none',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <Play size={14} fill={showFull ? '#fff' : 'transparent'} color={showFull ? '#fff' : 'transparent'} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function MemoryShardsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // ─── Motion value — zero re-render scroll ───
  const scrollMV = useMotionValue(0);
  const scrollRef = useRef(0);
  useEffect(() => {
    const unsub = scrollMV.on('change', (v: number) => {
      scrollRef.current = v;
    });
    return unsub;
  }, [scrollMV]);

  // ─── Data loading ───
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await memoryService.getAllWithEvent();
      data.sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
      setMemories(data);
      scrollMV.set(0);
    } catch (e: any) {
      setError(e.message || 'Không thể tải ký ức');
    } finally {
      setIsLoading(false);
    }
  }, [scrollMV]);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const total = memories.length;

  // ─── Drag state (tracked via refs for perf; React state mirrors for render) ───
  const dragStateRef = useRef({
    isDragging: false,
    startY: 0,
    startOffset: 0,
    velocity: 0,
    lastY: 0,
    lastTime: 0,
  });

  // ─── Snap — animate scrollMV to nearest center ───
  const snapToCenter = useCallback(() => {
    if (total === 0) return;
    const start = scrollRef.current;
    const target = Math.round(start / ITEM_HEIGHT) * ITEM_HEIGHT;
    const diff = target - start;
    if (Math.abs(diff) < 1) return;
    animate(scrollMV, target, {
      type: 'spring',
      stiffness: 300,
      damping: 35,
      mass: 0.5,
      onComplete: () => {
        setIsDragging(false);
        setIsScrolling(false);
      },
    });
  }, [scrollMV, total]);

  // ─── Inertia via Framer Motion decay ───
  const startInertia = useCallback((velocity: number) => {
    if (total === 0) return;
    const current = scrollRef.current;
    animate(scrollMV, current + velocity * 20, {
      type: 'decay',
      velocity,
      power: 0.85,
      timeConstant: 350,
      modifyTarget: (t: number) => Math.round(t / ITEM_HEIGHT) * ITEM_HEIGHT,
      onComplete: () => {
        setIsDragging(false);
        setIsScrolling(false);
      },
    });
  }, [scrollMV, total]);

  // ─── Jump to a virtual index (for dot clicks) ───
  const goToVirtual = useCallback((targetIdx: number) => {
    if (total === 0) return;
    scrollMV.stop();
    const target = -targetIdx * ITEM_HEIGHT;
    animate(scrollMV, target, {
      type: 'spring',
      stiffness: 300,
      damping: 35,
      mass: 0.5,
    });
  }, [scrollMV, total]);

  // ─── Manual drag via native pointer events ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || total === 0) return;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-play-btn]')) return;
      e.preventDefault();
      e.stopPropagation();
      scrollMV.stop(); // stop any running deceleration
      el.setPointerCapture(e.pointerId);

      const state = dragStateRef.current;
      state.isDragging = true;
      state.startY = e.clientY;
      state.startOffset = scrollRef.current;
      state.velocity = 0;
      state.lastY = e.clientY;
      state.lastTime = performance.now();
      setIsDragging(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.isDragging) return;
      e.preventDefault();
      const deltaY = e.clientY - state.startY;
      scrollMV.set(state.startOffset + deltaY);

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

      const vel = Math.abs(state.velocity) >= 0.5 ? state.velocity : 0;
      if (Math.abs(vel) >= 200) {
        startInertia(vel * 0.3);
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
  }, [total, scrollMV, snapToCenter, startInertia]);

  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Wheel scroll ───
  const wheelSnapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || total === 0) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollMV.stop();
      scrollMV.set(scrollRef.current + e.deltaY * 0.5);
      if (!isScrolling) setIsScrolling(true);
      if (wheelSnapRef.current) clearTimeout(wheelSnapRef.current);
      wheelSnapRef.current = setTimeout(() => {
        snapToCenter();
        setIsScrolling(false);
        wheelSnapRef.current = null;
      }, 150);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelSnapRef.current) clearTimeout(wheelSnapRef.current);
    };
  }, [total, scrollMV, snapToCenter, isScrolling]);

  // ─── Keyboard ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const target = scrollRef.current + (e.key === 'ArrowDown' ? ITEM_HEIGHT : -ITEM_HEIGHT);
        animate(scrollMV, target, {
          type: 'spring',
          stiffness: 300,
          damping: 35,
          mass: 0.5,
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [scrollMV]);

  // ─── Derived ───
  const isMoving = isDragging || isScrolling;

  const handlePlay = useCallback((e: React.MouseEvent, mem: MemoryWithEvent) => {
    e.stopPropagation();
    setDetailMemory(mem);
  }, []);

  // ─── Focused memory for dot navigation ───
  const centerVirtual = Math.floor(-scrollRef.current / ITEM_HEIGHT);
  const focusedMemory = useMemo(() => {
    if (total === 0) return null;
    const idx = ((-centerVirtual + total) % total + total) % total;
    return { virtualIdx: centerVirtual, memory: memories[idx] };
  }, [memories, total, centerVirtual]);

  const dotSlots = useMemo(() => {
    if (total === 0 || !focusedMemory) return [];
    const range = 3;
    const dots: { actualIdx: number; rel: number; memory: MemoryWithEvent }[] = [];
    for (let rel = -range; rel <= range; rel++) {
      const actualIdx = ((focusedMemory.virtualIdx + rel) % total + total) % total;
      dots.push({ actualIdx, rel, memory: memories[actualIdx] });
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
    <div className="page-content min-h-dvh flex flex-col overflow-hidden select-none bg-black">

      {/* Header — solid black */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2 bg-black">
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
        {/* Cards layer — all items pre-rendered, transforms computed on GPU */}
        <div className="absolute inset-0" style={{ willChange: 'transform' }}>
          {memories.map((mem, i) => (
            <ShardCard
              key={mem.MemoryID}
              index={i}
              scrollMV={scrollMV}
              memory={mem}
              isMoving={isMoving}
              onPlay={handlePlay}
            />
          ))}
        </div>
      </div>

      {/* Page dots */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 py-3 pb-4">
        {dotSlots.map((dot) => {
          const isActive = dot.rel === 0;
          const color = moodColor(dot.memory.MoodEmoji);
          return (
            <button key={`${dot.rel}-${dot.actualIdx}`} onClick={() => {
              if (focusedMemory) goToVirtual(focusedMemory.virtualIdx + dot.rel);
            }}
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? 24 : 5,
                height: isActive ? 6 : 5,
                background: isActive ? color : 'rgba(255,255,255,0.12)',
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
