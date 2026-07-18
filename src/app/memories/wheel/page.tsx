'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, BookHeart, Calendar, RefreshCw, Link } from 'lucide-react';
import { memoryService } from '@/lib/services/memory-service';
import type { MemoryWithEvent } from '@/types/database';

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

const GRADIENT_MAP: Record<string, string> = {
  '😊': 'linear-gradient(135deg, #F59E0B 0%, #FF9500 55%, #FFB340 100%)',
  '🤩': 'linear-gradient(135deg, #D60032 0%, #FF2D55 55%, #FF5E7A 100%)',
  '😌': 'linear-gradient(135deg, #1EA84B 0%, #34C759 55%, #5DDC7F 100%)',
  '😢': 'linear-gradient(135deg, #3B3BB5 0%, #5856D6 55%, #7A78E0 100%)',
  '😤': 'linear-gradient(135deg, #B30024 0%, #E6002D 55%, #FF3355 100%)',
  '😴': 'linear-gradient(135deg, #5C5E63 0%, #8E8E93 55%, #AEAEB2 100%)',
};

function getGradient(emoji?: string | null): string {
  return GRADIENT_MAP[emoji || ''] || 'linear-gradient(135deg, #8E8E93 0%, #AEAEB2 55%, #C7C7CC 100%)';
}

export default function MemoryWheelPage() {
  const router = useRouter();
  const [memories, setMemories] = useState<MemoryWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load memories
  const loadMemories = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const data = await memoryService.getAllWithEvent();
      setMemories(data.sort((a, b) => {
        const aDate = a.EventDate || a.CreatedDate;
        const bDate = b.EventDate || b.CreatedDate;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      }));
    } catch (e: any) {
      setError(e.message || 'Không thể tải ký ức');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  // ── Wheel state ──
  const ITEM_COUNT = memories.length;
  const radius = 148;
  const SNAP_THRESHOLD = 12;
  const NODE_SIZE = 52;
  const HALF_NODE = NODE_SIZE / 2;
  const WHEEL_PX = 360; // wheel container width in px (kept for reference)
  // Angular tracking: pointer angle around center → cumulative rotation

  const rotationRef = useRef(0);
  const [renderTick, setRenderTick] = useState(0);
  const rerender = useCallback(() => setRenderTick(t => t + 1), []);

  const wheelRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number | null>(null);

  // Drag state — simple atan2 tracking (matching demo spec)
  const dragActive = useRef(false);
  const lastAngle = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragTotalDist = useRef(0);
  const CLICK_THRESHOLD = 8;

  // Velocity for inertia
  const velocityRef = useRef(0);
  const lastMoveTime = useRef(0);

  // Geometry helpers
  const angleOfItem = useCallback((i: number) => {
    return ITEM_COUNT > 0 ? i * (360 / ITEM_COUNT) : 0;
  }, [ITEM_COUNT]);

  const norm180 = useCallback((deg: number) => {
    let d = ((deg % 360) + 360) % 360;
    return d > 180 ? d - 360 : d;
  }, []);

  // Update center on resize
  useEffect(() => {
    const update = () => {
      if (wheelRef.current) {
        const r = wheelRef.current.getBoundingClientRect();
        centerRef.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Active index
  const activeIdx = useMemo(() => {
    if (ITEM_COUNT === 0) return -1;
    const rot = rotationRef.current;
    let best = 0;
    let bestDist = Infinity;
    memories.forEach((_, i) => {
      const d = Math.abs(norm180(angleOfItem(i) + rot));
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return bestDist < SNAP_THRESHOLD ? best : -1;
  }, [memories, angleOfItem, norm180, renderTick, ITEM_COUNT]);

  const activeMemory = activeIdx >= 0 ? memories[activeIdx] : null;

  // Snap to target index (animation)
  const snapTo = useCallback((i: number, extraRotations = 0) => {
    if (ITEM_COUNT === 0) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const target = -angleOfItem(i) + extraRotations * 360;
    const start = rotationRef.current;
    let diff = target - start;
    const dur = 380;
    const t0 = performance.now();
    function step(t: number) {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      rotationRef.current = start + diff * ease;
      rerender();
      if (p < 1) animRef.current = requestAnimationFrame(step);
      else animRef.current = null;
    }
    animRef.current = requestAnimationFrame(step);
  }, [angleOfItem, rerender, ITEM_COUNT]);

  // Inertia deceleration (momentum spin after release)
  const startInertia = useCallback((velocity: number) => {
    if (ITEM_COUNT === 0) return;
    animRef.current = requestAnimationFrame(function inertiaStep() {
      // Decay velocity — smooth friction
      velocity *= 0.97;
      if (Math.abs(velocity) < 0.15) {
        // Stop inertia, snap to nearest
        animRef.current = null;
        const rot = rotationRef.current;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < ITEM_COUNT; i++) {
          const d = Math.abs(norm180(angleOfItem(i) + rot));
          if (d < bestDist) { bestDist = d; best = i; }
        }
        snapTo(best);
        return;
      }
      rotationRef.current += velocity;
      rerender();
      animRef.current = requestAnimationFrame(inertiaStep);
    });
  }, [angleOfItem, norm180, snapTo, rerender, ITEM_COUNT]);

  // Drag handlers — exact demo mechanism: atan2 + delta unwrap
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragActive.current = true;
    velocityRef.current = 0;

    // Save initial angle (like demo's lastAngle = angleAt(p))
    const { x: cx, y: cy } = centerRef.current;
    lastAngle.current = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * (180 / Math.PI);

    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragTotalDist.current = 0;
    lastMoveTime.current = performance.now();
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragActive.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    dragTotalDist.current = Math.sqrt(dx * dx + dy * dy);

    // Compute angle delta using atan2 (exactly like the demo)
    const { x: cx, y: cy } = centerRef.current;
    const ang = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * (180 / Math.PI);
    let delta = ang - lastAngle.current;
    // Unwrap ±180° boundary (crossing 6 o'clock)
    if (delta > 180) delta -= 360;
    else if (delta < -180) delta += 360;
    rotationRef.current += delta;
    lastAngle.current = ang;

    // Track velocity (demo: velocity = delta / dt * 16)
    const now = performance.now();
    const dt = Math.max(1, now - lastMoveTime.current);
    const instantV = delta * (16.67 / dt);
    velocityRef.current = velocityRef.current * 0.6 + instantV * 0.4;
    lastMoveTime.current = now;

    rerender();
  }, [rerender]);

  const onPointerUp = useCallback(() => {
    if (!dragActive.current) return;
    dragActive.current = false;
    if (dragTotalDist.current > CLICK_THRESHOLD) {
      const v = velocityRef.current;
      if (Math.abs(v) >= 0.5) {
        // Start inertia spin — momentum + multi-rotation
        startInertia(v);
      } else {
        snapTo(activeIdx);
      }
    }
  }, [activeIdx, snapTo, startInertia]);

  // Initial snap to newest (first render)
  const hasSnapped = useRef(false);
  useEffect(() => {
    if (!hasSnapped.current && wheelRef.current && ITEM_COUNT > 0) {
      hasSnapped.current = true;
      snapTo(ITEM_COUNT - 1);
    }
  }, [snapTo, ITEM_COUNT]);

  // ── Render ──

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
          <h1 className="text-[18px] font-bold text-[#111]">Bánh xe ký ức</h1>
        </div>
        <div className="card-ios text-center py-16">
          <div className="w-8 h-8 border-2 border-[#FF2D55]/20 border-t-[#FF2D55] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-[#8E8E93]">Đang tải ký ức...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
          <h1 className="text-[18px] font-bold text-[#111]">Bánh xe ký ức</h1>
        </div>
        <div className="card-ios text-center py-10">
          <p className="text-[13px] text-[#E6002D] font-medium">{error}</p>
          <button onClick={loadMemories} className="mt-3 px-4 py-1.5 rounded-[8px] text-[11px] font-medium text-white bg-[#FF2D55]">Thử lại</button>
        </div>
      </div>
    );
  }

  if (ITEM_COUNT === 0) {
    return (
      <div className="page-content">
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
          <h1 className="text-[18px] font-bold text-[#111]">Bánh xe ký ức</h1>
        </div>
        <div className="card-ios text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#FF4D6A]/5 mx-auto mb-4 flex items-center justify-center">
            <BookHeart size={28} className="text-[#FF4D6A]/30" />
          </div>
          <p className="text-[15px] font-semibold text-[#6B7280] mb-1">Chưa có ký ức nào</p>
          <p className="text-[12px] text-[#8E8E93]">Lưu ký ức từ sự kiện hoặc thêm mới để xem trên bánh xe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]"><ArrowLeft size={18}/></button>
          <div>
            <h1 className="text-[18px] font-bold text-[#111]">Bánh xe ký ức</h1>
            <p className="text-[11px] text-[#8E8E93]">{ITEM_COUNT} ký ức · Sắp xếp theo thời gian</p>
          </div>
        </div>
        <button onClick={loadMemories} className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)] text-[#8E8E93]">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Wheel */}
      <div className="card-ios text-center py-8 mb-4">
        <div
          ref={wheelRef}
          className="relative w-[360px] h-[360px] mx-auto mb-6 select-none touch-none"
          style={{ cursor: 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Track — warm gradient ring */}
          <div
            className="absolute inset-[16px] rounded-full"
            style={{
              background: `conic-gradient(from 0deg,
                rgba(255,45,85,0.06) 0deg, rgba(255,45,85,0.06) 179deg,
                rgba(255,149,0,0.06) 179deg, rgba(255,149,0,0.06) 360deg)`,
              border: '1px solid rgba(0,0,0,0.04)',
            }}
          />
          <div className="absolute rounded-full" style={{ inset: '44px', border: '1px dashed rgba(0,0,0,0.04)' }} />

          {/* Pointer arrow at top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}
          >
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#FF2D55]" />
          </div>

          {/* Hub — Center: memory count */}
          <div
            onClick={() => snapTo(ITEM_COUNT - 1)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-white cursor-pointer z-10 select-none active:scale-95 transition-transform"
            style={{
              width: 88, height: 88,
              background: 'linear-gradient(135deg, #FF2D55 0%, #FF5E7A 55%, #FF8A9E 100%)',
              boxShadow: '0 14px 30px rgba(255,45,85,0.35), 0 4px 12px rgba(255,45,85,0.2)',
            }}
          >
            <span className="text-[9px] font-bold tracking-[1.5px] uppercase opacity-85">MỚI NHẤT</span>
            <span className="text-[22px] font-extrabold mt-0.5 leading-tight">{ITEM_COUNT}</span>
          </div>

          {/* Time-direction labels */}
          <div className="absolute top-1/2 left-[10px] -translate-y-1/2 pointer-events-none z-10 select-none">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-bold text-[#8E8E93] tracking-[1.5px] uppercase opacity-60">CŨ</span>
              <span className="text-[9px] opacity-30">←</span>
            </div>
          </div>
          <div className="absolute top-1/2 right-[10px] -translate-y-1/2 pointer-events-none z-10 select-none">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-bold text-[#8E8E93] tracking-[1.5px] uppercase opacity-60">MỚI</span>
              <span className="text-[9px] opacity-30">→</span>
            </div>
          </div>

          {/* Memory nodes */}
          {memories.map((m, i) => {
            const rot = rotationRef.current;
            const ang = angleOfItem(i) + rot;
            const rad = ang * Math.PI / 180;
            const x = radius * Math.sin(rad);
            const y = -radius * Math.cos(rad);
            const dist = Math.abs(norm180(ang));
            const isActive = dist < SNAP_THRESHOLD;
            const scale = 0.7 + 0.35 * (1 - Math.min(dist, 130) / 130);
            const opacity = 0.5 + 0.5 * (1 - Math.min(dist, 150) / 150);

            return (
              <div
                key={m.MemoryID}
                onClick={() => snapTo(i)}
                className="absolute rounded-full flex items-center justify-center cursor-pointer select-none transition-shadow duration-200"
                style={{
                  top: '50%', left: '50%',
                  width: NODE_SIZE, height: NODE_SIZE,
                  marginLeft: -HALF_NODE, marginTop: -HALF_NODE,
                  background: getGradient(m.MoodEmoji),
                  border: isActive ? '3px solid #111' : '2px solid rgba(255,255,255,0.8)',
                  boxShadow: isActive
                    ? '0 10px 24px rgba(0,0,0,0.18)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: isActive ? 5 : Math.round(100 - dist),
                  fontSize: 20,
                  transform: `translate(${x}px, ${y}px) scale(${scale.toFixed(2)})`,
                  opacity: opacity.toFixed(2),
                }}
                title={m.Title}
              >
                {m.MoodEmoji || '🧠'}
              </div>
            );
          })}
        </div>

        <p className="text-[12px] text-[#8E8E93] font-medium">
          ← CŨ &nbsp;·&nbsp; Kéo lùi về quá khứ &nbsp;·&nbsp; Kéo tiến tới gần đây &nbsp;·&nbsp; MỚI →
        </p>
      </div>

      {/* Detail Card — Active Memory */}
      {activeMemory && (
        <div
          className="rounded-[26px] p-5 min-h-[120px] transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          {/* Header: mood + title */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-[48px] h-[48px] rounded-[16px] flex items-center justify-center text-[22px] flex-shrink-0"
              style={{
                background: `${moodColor(activeMemory.MoodEmoji)}12`,
                border: `1px solid ${moodColor(activeMemory.MoodEmoji)}20`,
              }}
            >
              {activeMemory.MoodEmoji || '🧠'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold tracking-[1px] uppercase"
                style={{ color: moodColor(activeMemory.MoodEmoji) }}>
                {relativeTime(activeMemory.EventDate || activeMemory.CreatedDate)}
              </div>
              <div className="text-[17px] font-extrabold text-[#101010] mt-0.5 tracking-[-0.2px] leading-tight">
                {activeMemory.Title}
              </div>
            </div>
          </div>

          {/* Content */}
          {activeMemory.Content && (
            <div className="text-[13px] text-[#6B7280] leading-relaxed mb-3 whitespace-pre-wrap line-clamp-4">
              {activeMemory.Content}
            </div>
          )}

          {/* Image */}
          {activeMemory.Image && (
            <div className="mb-3 rounded-[14px] overflow-hidden">
              <img src={activeMemory.Image} alt="" className="w-full h-[160px] object-cover" />
            </div>
          )}

          {/* Event link */}
          {activeMemory.EventID && !activeMemory.EventTitle && (
            <div className="flex items-center gap-1.5 mb-3">
              <Link size={12} className="text-[#5856D6]" />
              <span className="text-[11px] text-[#5856D6] font-medium">Có liên kết sự kiện</span>
            </div>
          )}
          {activeMemory.EventTitle && (
            <div className="flex items-center gap-1.5 mb-3 p-2.5 rounded-[10px] bg-[rgba(88,86,214,0.06)]">
              <Link size={12} className="text-[#5856D6]" />
              <span className="text-[12px] text-[#5856D6] font-medium line-clamp-1">🔗 {activeMemory.EventTitle}</span>
            </div>
          )}

          {/* Date footer — chỉ hiển thị ngày, không hiển thị giờ */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[#8E8E93]" />
              <span className="text-[11px] text-[#8E8E93]">
                {new Date(activeMemory.EventDate || activeMemory.CreatedDate).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </span>
            </div>
            <button onClick={() => router.push('/memories')}
              className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium text-[#FF2D55] hover:bg-[rgba(255,45,85,0.06)] transition-all">
              Xem tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
