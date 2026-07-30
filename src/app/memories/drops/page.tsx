'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Play, X, Droplets, Disc3, Sparkles, Calendar } from 'lucide-react';
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
    '😊': '#FF9500',
    '😢': '#5856D6',
    '🤩': '#FF2D55',
    '😌': '#34C759',
    '😤': '#E6002D',
    '😴': '#8E8E93',
  };
  return colors[emoji || ''] || '#8E8E93';
}

function getDate(m: MemoryWithEvent): string {
  return m.EventDate || m.MemoryDate || m.CreatedDate;
}

// ─── Constants ───
const ITEM_HEIGHT = 120;
const WHEEL_RADIUS = 320;
const WHEEL_CENTER_X = -320;
const ANGLE_STEP = Math.PI / 10;
const AVATAR_BASE = 80;
const PILL_HEIGHT = 52;
const PILL_WIDTH = 140;

// ─── Per-slot computation (pure function, called from useTransform) ───
interface SlotState {
  x: number;
  yPos: number;
  tiltDeg: number;
  depthZ: number;
  scale: number;
  opacity: number;
  textOpacity: number;
  avatarSize: number;
  zIndex: number;
  distAbs: number;
  rel: number;
}

function computeSlot(v: number, index: number): SlotState {
  const centerVirtual = Math.floor(-v / ITEM_HEIGHT);
  const rel = index - centerVirtual;
  const distAbs = Math.abs(rel);

  // Y: stretch L3.1
  const snapOffset = v - Math.round(v / ITEM_HEIGHT) * ITEM_HEIGHT;
  const stretch = rel * Math.abs(snapOffset) * 0.18;
  const yPos = (centerVirtual + rel) * ITEM_HEIGHT + v + stretch;

  // X: arc + right bias
  const angle = rel * ANGLE_STEP;
  const arcX = WHEEL_CENTER_X + WHEEL_RADIUS * Math.cos(angle);
  const rightBias = Math.pow(distAbs, 2) * 25;
  const x = arcX + rightBias;

  // 3D tilt + depth
  const tiltDeg = -rel * 5;
  const depthZ = -Math.pow(distAbs, 1.6) * 20;

  // Scale & opacity
  const scale = Math.max(0.75, 1 - distAbs * 0.05);
  const opacity = Math.max(0.15, 1 - distAbs * 0.18);
  const textOpacity = Math.max(0.2, 1 - distAbs * 0.2);
  const avatarSize = Math.round(AVATAR_BASE - distAbs * 3);
  const zIndex = 100 - Math.round(distAbs * 10);

  return { x, yPos, tiltDeg, depthZ, scale, opacity, textOpacity, avatarSize, zIndex, distAbs, rel };
}

// ══════════════════════════════════════════════════════════════════════════════
// DropCard — per-item card with GPU-composited transforms
// ══════════════════════════════════════════════════════════════════════════════

function DropCard({
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

  // ─── Values read at render-time (no per-frame cost) ───
  const s = computeSlot(scrollMV.get(), index);
  const avatarSize = s.avatarSize;
  const textOpacity = s.textOpacity;
  const showBorder = !isMoving;
  const isCenter = !isMoving && s.distAbs < 0.35;
  const showPlay = isCenter;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        zIndex,
        transform,
        opacity,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width: PILL_WIDTH + avatarSize / 2, height: avatarSize }}>
        {/* Pill body */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: Math.max(0, (avatarSize - PILL_HEIGHT) / 2),
            width: PILL_WIDTH,
            height: PILL_HEIGHT,
            zIndex: 0,
            pointerEvents: 'none',
            borderRadius: PILL_HEIGHT / 2,
            background: showBorder ? 'rgba(255,255,255,0.05)' : 'transparent',
            backdropFilter: isCenter ? 'blur(10px)' : 'none',
            WebkitBackdropFilter: isCenter ? 'blur(10px)' : 'none',
            border: showBorder ? `1.5px solid ${color}55` : 'none',
            boxShadow: showBorder
              ? `0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`
              : 'none',
            transition: isMoving ? 'none' : 'border-color 0.3s ease, background 0.3s ease',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: Math.max(0, (avatarSize - PILL_HEIGHT) / 2) + 6,
            width: PILL_WIDTH - 16,
            height: PILL_HEIGHT - 12,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: `rgba(255,255,255,${0.6 + textOpacity * 0.3})`,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {memory.Title}
          </p>
          <p
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: `rgba(255,255,255,${0.2 + textOpacity * 0.2})`,
              marginTop: 2,
            }}
          >
            {relativeTime(getDate(memory))}
          </p>
        </div>

        {/* Play button */}
        {showPlay && (
          <button
            onClick={(e) => onPlay(e, memory)}
            style={{
              position: 'absolute',
              right: -6,
              top: (avatarSize - 24) / 2,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}, ${color}bb)`,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            <Play size={10} fill="white" color="white" />
          </button>
        )}

        {/* Avatar */}
        <div
          style={{
            position: 'absolute',
            left: -Math.round(avatarSize * 0.4),
            top: 0,
            width: avatarSize,
            height: avatarSize,
            zIndex: 2,
            borderRadius: '50%',
            background: `${color}CC`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: showPlay
              ? `0 0 16px ${color}44, 0 4px 8px rgba(0,0,0,0.3)`
              : 'none',
            transition: isMoving ? 'none' : 'box-shadow 0.3s ease',
          }}
        >
          <span
            style={{
              fontSize: Math.round(avatarSize * 0.5),
              lineHeight: 1,
              filter: 'grayscale(0.2) brightness(1.1)',
            }}
          >
            {memory.MoodEmoji || '🧠'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GlowDot — gooey blob behind each avatar (GPU-composited)
// ══════════════════════════════════════════════════════════════════════════════

function moodForIdx(i: number): string {
  const moods = ['😊', '🤩', '😌', '😢', '😤', '😴'];
  return moods[i % moods.length];
}

function GlowDot({ index, scrollMV }: { index: number; scrollMV: MotionValue<number> }) {
  const color = useMemo(() => moodColor(moodForIdx(index)), [index]);

  const raw = useTransform(scrollMV, (v: number) => computeSlot(v, index));

  const transform = useTransform(raw, (s: SlotState) =>
    `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.yPos}px))`
  );
  const opacity = useTransform(raw, (s: SlotState) => s.opacity);
  const avatarSize = useTransform(raw, (s: SlotState) => s.avatarSize);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: '50%',
        background: `radial-gradient(circle at 50% 50%, ${color}55, ${color}22 50%, transparent 65%)`,
        transform,
        opacity,
        willChange: 'transform, opacity',
      }}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function MemoryDropsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // ─── Motion value — ONLY source of truth for scroll (no re-render!) ───
  const scrollMV = useMotionValue(0);
  const scrollRef = useRef(0);
  useEffect(() => {
    const unsub = scrollMV.on('change', (v: number) => {
      scrollRef.current = v;
    });
    return unsub;
  }, [scrollMV]);

  // ─── Drag/interaction refs ───
  const isDraggingRef = useRef(false);
  const isScrollingRef = useRef(false);
  const dragStateRef = useRef({ startY: 0, startOffset: 0, lastY: 0, lastTime: 0, velocity: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Data loading ───
  useEffect(() => {
    loadMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMemories = async () => {
    const tryLoad = async (retries = 3): Promise<void> => {
      try {
        const data = await memoryService.getAllWithEvent();
        data.sort((a, b) => {
          const aDate = a.EventDate || a.MemoryDate || a.CreatedDate;
          const bDate = b.EventDate || b.MemoryDate || b.CreatedDate;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        });
        setMemories(data);
      } catch (e: any) {
        const msg = e.message || '';
        if (msg.includes('connection pool') && retries > 0) {
          await new Promise((r) => setTimeout(r, 1500));
          return tryLoad(retries - 1);
        }
        throw e;
      }
    };
    setIsLoading(true);
    setError('');
    try {
      await tryLoad();
    } catch (e: any) {
      setError(e.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Snap helper — animate scrollMV smoothly to nearest center ───
  const snapToCenter = useCallback(() => {
    const target = Math.round(scrollRef.current / ITEM_HEIGHT) * ITEM_HEIGHT;
    animate(scrollMV, target, {
      type: 'spring',
      stiffness: 300,
      damping: 35,
      mass: 0.5,
    });
    // Clear interaction flags after snap
    isDraggingRef.current = false;
    setIsDragging(false);
    isScrollingRef.current = false;
    setIsScrolling(false);
  }, [scrollMV]);

  // ─── Inertia via Framer Motion decay animation ───
  const runInertia = useCallback(() => {
    const vel = dragStateRef.current.velocity;
    if (Math.abs(vel) < 2) {
      snapToCenter();
      return;
    }
    const current = scrollRef.current;
    animate(scrollMV, current + vel * 8, {
      type: 'decay',
      velocity: vel,
      power: 0.85,
      timeConstant: 350,
      modifyTarget: (t: number) => Math.round(t / ITEM_HEIGHT) * ITEM_HEIGHT,
      onComplete: () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        isScrollingRef.current = false;
        setIsScrolling(false);
      },
    });
  }, [scrollMV, snapToCenter]);

  // ─── Wheel snap timer ───
  const wheelSnapRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelWheelSnap = useCallback(() => {
    if (wheelSnapRef.current !== null) {
      clearTimeout(wheelSnapRef.current);
      wheelSnapRef.current = null;
    }
  }, []);

  // Cleanup wheel snap timer
  useEffect(() => cancelWheelSnap, [cancelWheelSnap]);

  // ─── Pointer handlers ───
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      scrollMV.stop(); // stop any running spring/decay
      cancelWheelSnap();
      dragStateRef.current = {
        startY: e.clientY,
        startOffset: scrollRef.current,
        lastY: e.clientY,
        lastTime: Date.now(),
        velocity: 0,
      };
      isDraggingRef.current = true;
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [scrollMV, cancelWheelSnap]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const state = dragStateRef.current;
      const deltaY = e.clientY - state.startY;
      scrollMV.set(state.startOffset + deltaY);
      const now = Date.now();
      const dt = now - state.lastTime;
      if (dt > 0) {
        state.velocity = ((e.clientY - state.lastY) / dt) * 16;
      }
      state.lastY = e.clientY;
      state.lastTime = now;
    },
    [scrollMV]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      const vel = Math.abs(dragStateRef.current.velocity);
      if (vel > 2) {
        runInertia();
      } else {
        snapToCenter();
      }
    },
    [runInertia, snapToCenter]
  );

  // ─── Wheel handler ───
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      cancelWheelSnap();
      scrollMV.stop();
      isScrollingRef.current = true;
      setIsScrolling(true);
      scrollMV.set(scrollRef.current + e.deltaY * 0.4);
      wheelSnapRef.current = setTimeout(() => {
        snapToCenter();
        wheelSnapRef.current = null;
      }, 180);
    },
    [scrollMV, snapToCenter, cancelWheelSnap]
  );

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

  // ─── Derived states for child components ───
  const isMoving = isDragging || isScrolling;

  // ─── Detail panel handler ───
  const handlePlay = useCallback((e: React.MouseEvent, mem: MemoryWithEvent) => {
    e.stopPropagation();
    setDetailMemory(mem);
  }, []);

  // ─── Dot pagination (re-renders only when memories/centerIdx changes) ───
  // We keep centerIdx in state OR compute it from scrollRef on render.
  // Since isMoving triggers re-render, this updates correctly.
  const centerIdx = Math.round(scrollRef.current / ITEM_HEIGHT);
  const dotSlots = useMemo(() => {
    if (memories.length === 0) return [];
    const range = 3;
    const dots: { actualIdx: number; memory: MemoryWithEvent }[] = [];
    for (let rel = -range; rel <= range; rel++) {
      const actualIdx = ((centerIdx + rel) % memories.length + memories.length) % memories.length;
      dots.push({ actualIdx, memory: memories[actualIdx] });
    }
    return dots;
  }, [memories, centerIdx]);

  // ─── Loading state ───
  if (isLoading) {
    return (
      <div className="page-content min-h-dvh flex flex-col bg-black">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px]" />
            <h1 className="text-[17px] font-semibold text-white/40 tracking-tight">Giọt Ký ức</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ─── Main render ───
  return (
    <div className="page-content min-h-dvh flex flex-col overflow-hidden select-none bg-black">
      {/* SVG Gooey filter — ancestor of all glow circles, never duplicated */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-black z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-white/5 text-white/50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <Droplets size={16} className="text-[#34C759]" />
            <h1 className="text-[17px] font-semibold text-white/80 tracking-tight">Giọt Ký ức</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => router.push('/memories/shards')}
            className="h-[30px] px-2.5 rounded-[8px] text-[11px] font-medium text-[#5856D6] bg-white/5 flex items-center gap-1 hover:bg-white/10 transition-colors"
          >
            <Sparkles size={12} /> Mảnh
          </button>
          <button
            onClick={() => router.push('/memories/wheel')}
            className="h-[30px] px-2.5 rounded-[8px] text-[11px] font-medium text-[#FF2D55] bg-white/5 flex items-center gap-1 hover:bg-white/10 transition-colors"
          >
            <Disc3 size={12} /> Bánh xe
          </button>
        </div>
      </div>

      {/* Error / Empty */}
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-[13px] font-medium text-[#E6002D] mb-3">{error}</p>
          <button
            onClick={loadMemories}
            className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]"
          >
            Thử lại
          </button>
        </div>
      ) : memories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
            <Droplets size={36} className="text-white/20" />
          </div>
          <h2 className="text-[18px] font-semibold text-white/60 mb-1">Chưa có ký ức nào</h2>
          <p className="text-[13px] text-white/30">Thêm ký ức để bắt đầu.</p>
        </div>
      ) : (
        /* ─── Drag container ─── */
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden touch-none select-none"
          style={{ minHeight: 300, overscrollBehavior: 'none', perspective: '1000px' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        >
          {/* Gooey glow layer — SVG filter wraps all circles via CSS `filter: url(#goo)` */}
          <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#goo)', willChange: 'filter' }}>
            {memories.map((mem, i) => (
              <GlowDot key={mem.MemoryID} index={i} scrollMV={scrollMV} />
            ))}
          </div>

          {/* Cards layer — all items pre-rendered, transforms computed on GPU */}
          <div className="absolute inset-0" style={{ willChange: 'transform' }}>
            {memories.map((mem, i) => (
              <DropCard
                key={mem.MemoryID}
                index={i}
                scrollMV={scrollMV}
                memory={mem}
                isMoving={isMoving}
                onPlay={handlePlay}
              />
            ))}
          </div>

          {/* Dot pagination */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {dotSlots.map((dot) => {
              const color = moodColor(dot.memory.MoodEmoji);
              const isActive = dot.actualIdx === centerIdx;
              return (
                <div
                  key={dot.actualIdx}
                  style={{
                    width: isActive ? 24 : 5,
                    height: 5,
                    borderRadius: isActive ? 3 : 9999,
                    background: isActive ? color : 'rgba(255,255,255,0.12)',
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Detail Panel ─── */}
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
              style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.4)', maxHeight: '85vh' }}
            >
              <div className="w-[36px] h-[4px] bg-white/10 rounded-full mx-auto mt-3 mb-2" />
              <div className="flex items-center justify-between px-4">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[1.2px]">
                  CHI TIẾT KÝ ỨC
                </span>
                <button
                  onClick={() => setDetailMemory(null)}
                  className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center hover:bg-white/5 text-white/40"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 pt-2 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                <div className="flex items-start gap-3.5 mb-4">
                  <div
                    className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center text-[24px] shrink-0"
                    style={{
                      background: `${moodColor(detailMemory.MoodEmoji)}18`,
                      border: `1px solid ${moodColor(detailMemory.MoodEmoji)}35`,
                    }}
                  >
                    {detailMemory.MoodEmoji || '🧠'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-[10px] font-bold tracking-[1.2px] uppercase text-white/40"
                      style={{ color: moodColor(detailMemory.MoodEmoji) }}
                    >
                      {relativeTime(getDate(detailMemory))}
                    </div>
                    <h2 className="text-[20px] font-extrabold text-white mt-0.5 tracking-[-0.3px] leading-tight">
                      {detailMemory.Title}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={12} className="text-white/30" />
                  <span className="text-[10px] text-white/40 font-medium">
                    {new Date(getDate(detailMemory)).toLocaleDateString('vi-VN')}
                  </span>
                  {detailMemory.EventTitle && (
                    <span
                      className="text-[10px] font-medium truncate"
                      style={{ color: moodColor(detailMemory.MoodEmoji) }}
                    >
                      🔗 {detailMemory.EventTitle}
                    </span>
                  )}
                </div>
                {detailMemory.Content && (
                  <div
                    className="text-[13px] text-white/60 leading-relaxed mb-4 whitespace-pre-wrap bg-white/5 rounded-[14px] p-3.5"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    {detailMemory.Content}
                  </div>
                )}
                {detailMemory.Image && (
                  <div className="rounded-[14px] overflow-hidden mb-4">
                    <img src={detailMemory.Image} alt="" className="w-full object-cover" style={{ maxHeight: 300 }} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
