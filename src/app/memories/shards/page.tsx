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

function getMoodBg(emoji?: string | null): string {
  const c = moodColor(emoji);
  return `${c}15`;
}

function getDate(m: MemoryWithEvent): string {
  return m.EventDate || m.MemoryDate || m.CreatedDate;
}

// ─── Constants ───
const ITEM_HEIGHT = 90;
const ARC_RADIUS_X = 28;
const ARC_RADIUS_Y = 16;
const VISIBLE_ITEMS = 7;
const HALF_VISIBLE = Math.floor(VISIBLE_ITEMS / 2);

export default function MemoryShardsPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailMemory, setDetailMemory] = useState<MemoryWithEvent | null>(null);

  // ─── Infinite carousel offset ───
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
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Data loading ───
  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await memoryService.getAllWithEvent();
      data.sort((a, b) => {
        const aDate = getDate(a);
        const bDate = getDate(b);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      setMemories(data);
      offsetRef.current = 0;
      rerender();
    } catch (e: any) {
      setError(e.message || 'Không thể tải ký ức');
    } finally {
      setIsLoading(false);
    }
  }, [rerender]);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const total = memories.length;

  // ─── Infinite virtual index helpers ───
  // virtualIndex = -(offset / ITEM_HEIGHT), continuous float
  // We wrap virtualIndex modulo total to get the actual memory index

  const getCenterVirtual = useCallback(() => {
    if (total === 0) return 0;
    return -offsetRef.current / ITEM_HEIGHT;
  }, [total]);

  const virtualToActual = useCallback((virtualIdx: number): number => {
    if (total === 0) return 0;
    return ((Math.round(virtualIdx) % total) + total) % total;
  }, [total]);

  const getCenterActual = useCallback(() => {
    if (total === 0) return 0;
    return virtualToActual(getCenterVirtual());
  }, [getCenterVirtual, virtualToActual, total]);

  // Snap: set offset so centerVirtual = index (wrap-aware)
  const snapTo = useCallback((virtualTarget: number) => {
    if (total === 0) return;
    const targetOffset = -virtualTarget * ITEM_HEIGHT;
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
      }
      rerender();
    };
    animRef.current = requestAnimationFrame(step);
  }, [total, rerender]);

  // Inertia — infinite
  const startInertia = useCallback((velocity: number) => {
    if (total === 0) return;
    animRef.current = requestAnimationFrame(function inertiaStep() {
      velocity *= 0.96;
      if (Math.abs(velocity) < 0.3) {
        animRef.current = null;
        const center = getCenterVirtual();
        snapTo(Math.round(center));
        return;
      }
      offsetRef.current += velocity;
      rerender();
      animRef.current = requestAnimationFrame(inertiaStep);
    });
  }, [total, getCenterVirtual, snapTo, rerender]);

  // ─── Pointer events ───
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore pointer events from within the detail overlay
    if ((e.target as HTMLElement).closest('[data-detail-overlay]')) return;
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    dragActive.current = true;
    dragStartY.current = e.clientY;
    dragOffsetStart.current = offsetRef.current;
    velocityRef.current = 0;
    lastMoveTime.current = performance.now();
  }, []);

  useEffect(() => {
    if (total === 0) return;
    const onMove = (e: PointerEvent) => {
      if (!dragActive.current) return;
      const dy = e.clientY - dragStartY.current;
      offsetRef.current = dragOffsetStart.current + dy;

      const now = performance.now();
      const dt = Math.max(1, now - lastMoveTime.current);
      const instantV = -dy * (16.67 / dt);
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
        const center = getCenterVirtual();
        snapTo(Math.round(center));
      }
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [total, getCenterVirtual, snapTo, startInertia, rerender]);

  // ─── Wheel scroll support ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el || total === 0) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      offsetRef.current -= e.deltaY * 0.5;
      rerender();
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => {
        const center = getCenterVirtual();
        snapTo(Math.round(center));
      }, 150);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, [total, getCenterVirtual, snapTo, rerender]);

  // ─── Arc position for a relative slot ───
  // rel = 0 is center, positive = below, negative = above
  const getSlotStyle = useCallback((rel: number) => {
    const distAbs = Math.abs(rel);
    const scale = Math.max(0.48, 1 - distAbs * 0.13);
    const opacity = Math.max(0.25, 1 - distAbs * 0.15);
    const angle = rel * (Math.PI / 4.5);
    const x = Math.sin(angle) * ARC_RADIUS_X;
    const y = rel * ITEM_HEIGHT - (1 - Math.cos(angle)) * ARC_RADIUS_Y;
    const zIndex = 100 - Math.round(distAbs * 10);
    return { x, y, scale, opacity, zIndex, isActive: rel === 0 };
  }, []);

  // ─── Build visible slots ───
  const visibleSlots = useMemo(() => {
    if (total === 0) return [];
    const centerVirtual = getCenterVirtual();
    const centerRounded = Math.round(centerVirtual);
    const slots: { rel: number; memory: MemoryWithEvent; virtualIdx: number; actualIdx: number }[] = [];

    for (let rel = -HALF_VISIBLE; rel <= HALF_VISIBLE; rel++) {
      const virtualIdx = centerRounded + rel;
      const actualIdx = ((virtualIdx % total) + total) % total;
      slots.push({
        rel,
        memory: memories[actualIdx],
        virtualIdx,
        actualIdx,
      });
    }
    return slots;
  }, [memories, total, getCenterVirtual]);

  // ─── Current focused memory ───
  const focusedMemory = useMemo(() => {
    if (total === 0 || visibleSlots.length === 0) return null;
    return visibleSlots.find(s => s.rel === 0) || visibleSlots[Math.floor(visibleSlots.length / 2)];
  }, [visibleSlots, total]);

  // ─── Page dots from visible slots ───
  const dotSlots = useMemo(() => {
    if (total === 0 || !focusedMemory) return [];
    const range = 3;
    const dots = [];
    for (let rel = -range; rel <= range; rel++) {
      const virtualIdx = focusedMemory.virtualIdx + rel;
      const actualIdx = ((virtualIdx % total) + total) % total;
      dots.push({ rel, actualIdx, memory: memories[actualIdx] });
    }
    return dots;
  }, [focusedMemory, memories, total]);

  // ─── Render ───
  if (isLoading) {
    return (
      <div className="page-content min-h-dvh flex flex-col">
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

  if (error) {
    return (
      <div className="page-content min-h-dvh flex flex-col">
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

  if (total === 0) {
    return (
      <div className="page-content min-h-dvh flex flex-col">
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
    <div className="page-content min-h-dvh flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()}
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.3px]">Mảnh Ký ức</h1>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">Vòng lặp vô tận · {total} ký ức</p>
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
        style={{ minHeight: 300 }}
        onPointerDown={onPointerDown}
        onPointerCancel={() => { dragActive.current = false; }}
      >
        {/* Soft center glow */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)',
          }}
        />

        {/* Cards — absolutely positioned */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
          {visibleSlots.map((slot) => {
            const style = getSlotStyle(slot.rel);
            const mem = slot.memory;
            return (
              <motion.div
                key={`${slot.virtualIdx}-${mem.MemoryID}`}
                className="absolute left-1/2"
                style={{
                  width: '85%',
                  maxWidth: 320,
                  zIndex: style.zIndex,
                  pointerEvents: 'auto',
                }}
                animate={{
                  x: `calc(-50% + ${style.x}px)`,
                  y: `calc(50% + ${style.y}px)`,
                  scale: style.scale,
                  opacity: style.opacity,
                }}
                transition={{ duration: 0.06, ease: 'linear' }}
              >
                <div
                  className="w-full rounded-[20px] overflow-hidden transition-shadow duration-200"
                  style={{
                    background: style.isActive
                      ? 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)'
                      : '#ffffff',
                    boxShadow: style.isActive
                      ? '0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)'
                      : '0 4px 16px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.02)',
                  }}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    {/* Mood badge */}
                    <div
                      className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
                      style={{
                        background: style.isActive
                          ? getGradient(mem.MoodEmoji)
                          : getMoodBg(mem.MoodEmoji),
                      }}
                    >
                      {mem.MoodEmoji || '🧠'}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {style.isActive && (
                          <span className="w-[6px] h-[6px] rounded-full shrink-0"
                            style={{ background: moodColor(mem.MoodEmoji) }} />
                        )}
                        <span className="text-[12px] font-semibold text-[#111] truncate">
                          {mem.Title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#8E8E93] font-medium">
                          {relativeTime(getDate(mem))}
                        </span>
                        {mem.EventTitle && (
                          <>
                            <span className="text-[#8E8E93] text-[8px]">·</span>
                            <span className="text-[9px] text-[#5856D6] font-medium truncate max-w-[100px]">
                              {mem.EventTitle}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailMemory(mem);
                      }}
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
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Page dots — wrap indicator */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {dotSlots.map((dot) => {
          const isActive = dot.rel === 0;
          return (
            <button
              key={dot.rel}
              onClick={() => {
                if (focusedMemory) {
                  snapTo(focusedMemory.virtualIdx + dot.rel);
                }
              }}
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? 22 : 6,
                height: 6,
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
            data-detail-overlay
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
              <div className="w-[36px] h-[4px] bg-[rgba(0,0,0,0.1)] rounded-full mx-auto mt-3 mb-2" />
              <div className="flex items-center justify-between px-4">
                <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-[1px]">CHI TIẾT KÝ ỨC</span>
                <button onClick={() => setDetailMemory(null)}
                  className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 pt-2 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
                {/* Mood + title */}
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
                {detailMemory.Content && (
                  <div className="text-[13px] text-[#5F6368] leading-relaxed mb-4 whitespace-pre-wrap
                    bg-[rgba(0,0,0,0.02)] rounded-[14px] p-3.5">
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

// ─── Header ───
function Header({ onBack, total, onRefresh }: {
  onBack: () => void;
  total: number;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <button onClick={onBack}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-[20px] font-bold text-[#111] tracking-[-0.3px]">Mảnh Ký ức</h1>
          {total > 0 && <p className="text-[11px] text-[#8E8E93] mt-0.5">Vòng lặp vô tận · {total} ký ức</p>}
        </div>
      </div>
      <button onClick={onRefresh}
        className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93] transition-colors">
        <Sparkles size={15} />
      </button>
    </div>
  );
}
