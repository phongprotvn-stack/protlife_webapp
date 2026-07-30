'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Droplets, Disc3, Sparkles } from 'lucide-react';
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

// ─── Arc & Layout constants ───
const ITEM_HEIGHT = 120;            // scroll distance per slot
const VISIBLE_ITEMS = 7;
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

const WHEEL_RADIUS = 320;           // arc radius (tighter curve → more pronounced)
const WHEEL_CENTER_X = -320;        // arc center on the left
const ANGLE_STEP = Math.PI / 10;    // 18° per item

const AVATAR_BASE = 80;             // base avatar diameter (bigger than pill height)
const PILL_HEIGHT = 52;             // card body height (pill thickness)
const PILL_WIDTH = 140;             // card body width (expands right from avatar center)

// ─── Main Component ───
export default function MemoryDropsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);

  // ─── Scroll state ───
  const [scrollOffset, setScrollOffset] = useState(0);
  const scrollOffsetRef = useRef(0);
  const syncOffset = useCallback(() => {
    setScrollOffset(scrollOffsetRef.current);
  }, []);

  // ─── Interaction states ───
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const isDraggingRef = useRef(false);
  const isScrollingRef = useRef(false);
  const isMovingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Drag state ───
  const dragStateRef = useRef({ startY: 0, startOffset: 0, lastY: 0, lastTime: 0, velocity: 0 });

  // ─── Inertia animation ───
  const animRef = useRef<number | null>(null);
  const stopAnim = useCallback(() => {
    if (animRef.current !== null) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    isMovingRef.current = false;
  }, []);

  // ─── Data loading ───
  useEffect(() => { loadMemories(); }, []);

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
          await new Promise(r => setTimeout(r, 1500));
          return tryLoad(retries - 1);
        }
        throw e;
      }
    };
    setIsLoading(true); setError('');
    try { await tryLoad(); }
    catch (e: any) { setError(e.message || 'Không thể tải dữ liệu'); }
    finally { setIsLoading(false); }
  };

  // ─── Snap scrollOffset → nearest ITEM_HEIGHT multiple ───
  const snapToCenter = useCallback(() => {
    const start = scrollOffsetRef.current;
    const target = Math.round(start / ITEM_HEIGHT) * ITEM_HEIGHT;
    scrollOffsetRef.current = target;
    syncOffset();
    setIsScrolling(false);
    isScrollingRef.current = false;
    // Đánh dấu moving đã dừng sau snap
    setTimeout(() => { isMovingRef.current = false; }, 50);
  }, [syncOffset]);

  // ─── Inertia runner ───
  const runInertia = useCallback(() => {
    stopAnim();
    const friction = 0.965;
    let vel = dragStateRef.current.velocity;

    function step() {
      vel *= friction;
      if (Math.abs(vel) < 0.5) {
        snapToCenter();
        return;
      }
      scrollOffsetRef.current += vel;
      setScrollOffset(scrollOffsetRef.current);
      animRef.current = requestAnimationFrame(step);
    }
    isMovingRef.current = true;
    animRef.current = requestAnimationFrame(step);
  }, [stopAnim, snapToCenter]);

  // ─── Pointer / Drag handlers ───
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    stopAnim();
    dragStateRef.current = {
      startY: e.clientY, startOffset: scrollOffsetRef.current,
      lastY: e.clientY, lastTime: Date.now(), velocity: 0,
    };
    isDraggingRef.current = true;
    isMovingRef.current = true;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [stopAnim]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const state = dragStateRef.current;
    const deltaY = e.clientY - state.startY;
    scrollOffsetRef.current = state.startOffset + deltaY;
    syncOffset();
    // Track velocity
    const now = Date.now();
    const dt = now - state.lastTime;
    if (dt > 0) {
      state.velocity = (e.clientY - state.lastY) / dt * 16;
    }
    state.lastY = e.clientY;
    state.lastTime = now;
  }, [syncOffset]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const vel = Math.abs(dragStateRef.current.velocity);
    if (vel > 2) {
      runInertia();
    } else {
      snapToCenter();
    }
  }, [runInertia, snapToCenter]);

  // ─── Wheel handler ───
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (isDraggingRef.current) return;
    stopAnim();

    isScrollingRef.current = true;
    isMovingRef.current = true;
    setIsScrolling(true);

    scrollOffsetRef.current += e.deltaY * 0.4;
    syncOffset();

    // Debounced snap after scroll
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    animRef.current = window.setTimeout(() => {
      snapToCenter();
      animRef.current = null;
    }, 180) as unknown as number;
  }, [stopAnim, snapToCenter, syncOffset]);

  // ─── Keyboard up/down ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        stopAnim();
        scrollOffsetRef.current += e.key === 'ArrowDown' ? ITEM_HEIGHT : -ITEM_HEIGHT;
        syncOffset();
        snapToCenter();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stopAnim, syncOffset, snapToCenter]);

  // ─── Compute isMoving for render (true during drag, scroll, inertia) ───
  // isMoving = isDragging || isScrolling or animRef is active
  const isMoving = isDragging || isScrolling || animRef.current !== null;

  // ─── Build visible slots — yPos with snapOffset stretch ───
  const visibleSlots = useMemo(() => {
    if (memories.length === 0) return [];
    const total = memories.length;
    const centerVirtual = Math.floor(-scrollOffset / ITEM_HEIGHT);
    const snapOffset = scrollOffset - Math.round(scrollOffset / ITEM_HEIGHT) * ITEM_HEIGHT;
    const slots: { rel: number; memory: MemoryWithEvent; virtualIdx: number; yPos: number }[] = [];
    for (let rel = -HALF_VISIBLE; rel <= HALF_VISIBLE; rel++) {
      const virtualIdx = centerVirtual + rel;
      const stretch = rel * Math.abs(snapOffset) * 0.18;
      const yPos = virtualIdx * ITEM_HEIGHT + scrollOffset + stretch;
      const actualIdx = ((virtualIdx % total) + total) % total;
      slots.push({ rel, memory: memories[actualIdx], virtualIdx, yPos });
    }
    return slots;
  }, [memories, scrollOffset]);

  // ─── Slot style computation (per-item position, scale, etc.) ───
  const getSlotStyle = useCallback((rel: number, avatarSize: number) => {
    const distAbs = Math.abs(rel);
    const scale = Math.max(0.75, 1 - distAbs * 0.05);
    const opacity = Math.max(0.15, 1 - distAbs * 0.18);
    const textOpacity = Math.max(0.2, 1 - distAbs * 0.2);

    // X: arc wheel + rightward bias — items shift right progressively
    const angle = rel * ANGLE_STEP;
    const arcX = WHEEL_CENTER_X + WHEEL_RADIUS * Math.cos(angle);
    const rightBias = Math.pow(distAbs, 2) * 25;
    const x = arcX + rightBias;
    const zIndex = 100 - Math.round(distAbs * 10);

    // 3D Cylindrical — tilt & depth
    const tiltDeg = -rel * 5;
    const depthZ = -Math.pow(distAbs, 1.6) * 20;

    return { x, scale, opacity, zIndex, textOpacity, tiltDeg, depthZ };
  }, []);

  // ─── Detail panel ───
  const handlePlay = useCallback((e: React.MouseEvent, mem: MemoryWithEvent) => {
    e.stopPropagation();
    setDetailMemory(mem);
  }, []);

  const focusedMemory = useMemo(() => {
    if (memories.length === 0 || visibleSlots.length === 0) return null;
    return visibleSlots.find(s => s.rel === 0) || visibleSlots[Math.floor(visibleSlots.length / 2)];
  }, [visibleSlots, memories]);

  const dotSlots = useMemo(() => {
    if (memories.length === 0 || !focusedMemory) return [];
    const total = memories.length;
    const range = 3;
    const dots = [];
    for (let rel = -range; rel <= range; rel++) {
      const actualIdx = ((focusedMemory.virtualIdx + rel) % total + total) % total;
      dots.push({ rel, actualIdx, memory: memories[actualIdx] });
    }
    return dots;
  }, [focusedMemory, memories]);

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

  // ─── Main Render ───
  return (
    <div className="page-content min-h-dvh flex flex-col overflow-hidden select-none bg-black">

      {/* Gooey SVG filter — liquid merging for circles */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-black z-10">
        <div className="flex items-center gap-2.5">
          <button onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-white/5 text-white/50 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-1.5">
            <Droplets size={16} className="text-[#34C759]" />
            <h1 className="text-[17px] font-semibold text-white/80 tracking-tight">Giọt Ký ức</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => router.push('/memories/shards')}
            className="h-[30px] px-2.5 rounded-[8px] text-[11px] font-medium text-[#5856D6] bg-white/5 flex items-center gap-1 hover:bg-white/10 transition-colors">
            <Sparkles size={12} /> Mảnh
          </button>
          <button onClick={() => router.push('/memories/wheel')}
            className="h-[30px] px-2.5 rounded-[8px] text-[11px] font-medium text-[#FF2D55] bg-white/5 flex items-center gap-1 hover:bg-white/10 transition-colors">
            <Disc3 size={12} /> Bánh xe
          </button>
        </div>
      </div>

      {/* Error state */}
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-[13px] font-medium text-[#E6002D] mb-3">{error}</p>
          <button onClick={loadMemories}
            className="px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#E6002D]">Thử lại</button>
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
        /* ─── Drag Container ─── */
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden touch-none select-none"
          style={{ minHeight: 300, overscrollBehavior: 'none', perspective: '1000px' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        >
          {/* Gooey glow layer — liquid circles */}
          <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#goo)' }}>
            {visibleSlots.map((slot) => {
              const mem = slot.memory;
              const color = moodColor(mem.MoodEmoji);
              const distAbs = Math.abs(slot.rel);
              const avatarSize = Math.round(AVATAR_BASE - distAbs * 3);
              const style = getSlotStyle(slot.rel, avatarSize);
              return (
                <div
                  key={`glow-${mem.MemoryID}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    transform: `translate(calc(-50% + ${style.x}px), calc(-50% + ${slot.yPos}px))`,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 50% 50%, ${color}55, ${color}22 50%, transparent 65%)`,
                    willChange: 'transform, opacity',
                    transition: isDragging || isScrolling
                      ? 'none'
                      : `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.abs(slot.rel) * 35}ms, opacity 0.4s ease`,
                    opacity: style.opacity,
                  }}
                />
              );
            })}
          </div>

          {/* Cards layer */}
          <div className="absolute inset-0">
            {visibleSlots.map((slot) => {
              const mem = slot.memory;
              const color = moodColor(mem.MoodEmoji);
              const distAbs = Math.abs(slot.rel);
              const avatarSize = Math.round(AVATAR_BASE - distAbs * 3);
              const style = getSlotStyle(slot.rel, avatarSize);

              // showFull: only when settled AND at active (rel=0)
              const isSettledAndCenter = !isMoving && slot.rel === 0;
              // showBorder: on ALL cards when settled (not moving)
              const showBorder = !isMoving;
              // showPlay: only settled + center
              const showPlay = !isMoving && slot.rel === 0;

              return (
                <div
                  key={slot.virtualIdx}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    zIndex: style.zIndex,
                    transform: `perspective(900px) translate3d(calc(-50% + ${style.x}px), calc(-50% + ${slot.yPos}px), ${style.depthZ}px) rotateX(${style.tiltDeg}deg) scale(${style.scale})`,
                    transition: isDragging || isScrolling
                      ? 'none'
                      : `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${Math.abs(slot.rel) * 35}ms, opacity 0.4s ease`,
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden' as const,
                  }}
                >
                  <div style={{ position: 'relative', width: PILL_WIDTH + avatarSize / 2, height: avatarSize }}>
                    {/* Pill body — background + border (border only when settled) */}
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
                        backdropFilter: isSettledAndCenter ? 'blur(10px)' : 'none',
                        WebkitBackdropFilter: isSettledAndCenter ? 'blur(10px)' : 'none',
                        border: showBorder ? `1.5px solid ${color}55` : 'none',
                        boxShadow: showBorder
                          ? `0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`
                          : 'none',
                        transition: isDragging || isScrolling
                          ? 'none'
                          : 'border-color 0.3s ease, background 0.3s ease',
                      }}
                    />

                    {/* Content layer — title + date (always visible) */}
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
                      <p style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: `rgba(255,255,255,${0.6 + style.textOpacity * 0.3})`,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>{mem.Title}</p>
                      <p style={{
                        fontSize: 9,
                        fontWeight: 500,
                        color: `rgba(255,255,255,${0.2 + style.textOpacity * 0.2})`,
                        marginTop: 2,
                      }}>{relativeTime(getDate(mem))}</p>
                    </div>

                    {/* Play button — only when settled + active */}
                    {showPlay && (
                      <button
                        onClick={(e) => handlePlay(e, mem)}
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
                          opacity: showPlay ? 1 : 0,
                          transform: showPlay ? 'scale(1)' : 'scale(0)',
                          transition: 'opacity 0.3s ease, transform 0.3s ease',
                          boxShadow: `0 2px 6px rgba(0,0,0,0.3)`,
                        }}
                      >
                        <Play size={10} fill="white" color="white" />
                      </button>
                    )}

                    {/* Avatar circle — always on top */}
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
                        transition: isDragging || isScrolling
                          ? 'none'
                          : 'box-shadow 0.3s ease',
                      }}
                    >
                      <span style={{
                        fontSize: Math.round(avatarSize * 0.5),
                        lineHeight: 1,
                        filter: 'grayscale(0.2) brightness(1.1)',
                      }}>
                        {mem.MoodEmoji || '🧠'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dot pagination */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {dotSlots.map((dot) => {
              const color = moodColor(dot.memory.MoodEmoji);
              const isActive = dot.rel === 0;
              return (
                <div
                  key={dot.actualIdx}
                  style={{
                    width: isActive ? 24 : 5,
                    height: isActive ? 5 : 5,
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
      {/* (similar to shards — click play to show) */}
    </div>
  );
}
