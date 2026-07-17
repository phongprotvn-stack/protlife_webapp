'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { eventService } from '@/lib/services/event-service';
import type { EventItem } from '@/types/database';

interface MemoryItem {
  icon: string;
  title: string;
  when: string;
  desc: string;
  isPresent?: boolean;
}

function getEventIcon(type?: string): string {
  const map: Record<string, string> = {
    Meeting: '🤝',
    Birthday: '🎂',
    Travel: '✈️',
    Work: '💼',
    Sport: '⚽',
    Meal: '🍽️',
    Entertainment: '🎮',
    Other: '📌',
  };
  return map[type || ''] || '📌';
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const days = daysBetween(d, now);

  if (days === 0) return 'Hôm nay';
  if (days > 0) {
    // Past
    if (days === 1) return 'Hôm qua';
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    const years = Math.floor(days / 365);
    return `${years} năm trước`;
  } else {
    // Future
    const abs = Math.abs(days);
    if (abs === 1) return 'Ngày mai';
    if (abs < 30) return `${abs} ngày tới`;
    const months = Math.floor(abs / 30);
    if (months < 12) return `${months} tháng tới`;
    const years = Math.floor(abs / 365);
    return `${years} năm tới`;
  }
}

function buildDesc(event: EventItem): string {
  const parts: string[] = [];
  if (event.Place) parts.push(`📍 ${event.Place}`);
  if (event.Notes) parts.push(event.Notes);
  if (event.ParticipantCount && event.ParticipantCount > 0) parts.push(`👥 ${event.ParticipantCount} người tham gia`);
  if (event.Mood) {
    const moodEmoji: Record<string, string> = { Happy: '😊', Sad: '😢', Excited: '🤩', Calm: '😌', Angry: '😤', Tired: '😴' };
    if (moodEmoji[event.Mood]) parts.unshift(moodEmoji[event.Mood]);
  }
  return parts.join(' · ') || 'Không có mô tả';
}

export default function TimelinePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getAll()
      .then(data => { setEvents(data); setDbLoaded(true); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const list = useMemo<MemoryItem[]>(() => {
    if (!dbLoaded) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const pastEvents: EventItem[] = [];
    const futureEvents: EventItem[] = [];
    let todayEvent: MemoryItem | null = null;

    events.forEach(e => {
      const d = new Date(e.StartDate);
      d.setHours(0, 0, 0, 0);
      if (d < now) pastEvents.push(e);
      else if (d > now) futureEvents.push(e);
      else {
        todayEvent = {
          icon: getEventIcon(e.EventType),
          title: e.Title,
          when: 'Hôm nay',
          desc: buildDesc(e),
        };
      }
    });

    // Past: newest first (closest to present)
    pastEvents.sort((a, b) => new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime());
    // Future: soonest first (closest to present)
    futureEvents.sort((a, b) => new Date(a.StartDate).getTime() - new Date(b.StartDate).getTime());

    const past: MemoryItem[] = pastEvents.map(e => ({
      icon: getEventIcon(e.EventType),
      title: e.Title,
      when: relativeTime(e.StartDate),
      desc: buildDesc(e),
    }));

    const future: MemoryItem[] = futureEvents.map(e => ({
      icon: getEventIcon(e.EventType),
      title: e.Title,
      when: relativeTime(e.StartDate),
      desc: buildDesc(e),
    }));

    const present: MemoryItem = todayEvent || {
      icon: '❤️',
      title: 'Hôm nay',
      when: 'Hiện tại',
      desc: 'Tận hưởng khoảnh khắc này — mọi ký ức đều bắt đầu từ đây.',
      isPresent: true,
    };

    return [...past, { ...present, isPresent: true }, ...future];
  }, [events, dbLoaded]);

  const presentIndex = useMemo(() => list.findIndex(i => i.isPresent), [list]);
  const ITEM_COUNT = list.length;
  const RADIUS = 128;
  const SNAP_THRESHOLD = 12;

  // Use a ref for rotation (avoids stale-closure issues during drag)
  const rotationRef = useRef(0);
  const [renderTick, setRenderTick] = useState(0);
  const rerender = useCallback(() => setRenderTick(t => t + 1), []);

  const wheelRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number | null>(null);

  // Drag state refs
  const dragActive = useRef(false);
  const dragLastAngle = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragTotalDist = useRef(0);
  const CLICK_THRESHOLD = 8;

  // ── Geometry helpers ──
  const angleOfItem = useCallback((i: number) => {
    return ITEM_COUNT > 0 ? (i - presentIndex) * (360 / ITEM_COUNT) : 0;
  }, [presentIndex, ITEM_COUNT]);

  const norm180 = useCallback((deg: number) => {
    let d = ((deg % 360) + 360) % 360;
    return d > 180 ? d - 360 : d;
  }, []);

  const angleAt = useCallback((clientX: number, clientY: number) => {
    const { x, y } = centerRef.current;
    return Math.atan2(clientX - x, -(clientY - y)) * 180 / Math.PI;
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

  // ── Active index ──
  const activeIdx = useMemo(() => {
    if (ITEM_COUNT === 0) return -1;
    const rot = rotationRef.current;
    let best = presentIndex;
    let bestDist = Infinity;
    list.forEach((item, i) => {
      if (item.isPresent) return;
      const d = Math.abs(norm180(angleOfItem(i) + rot));
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return bestDist < SNAP_THRESHOLD ? best : presentIndex;
  }, [list, presentIndex, angleOfItem, norm180, renderTick, ITEM_COUNT]);

  const activeItem = list[activeIdx];

  // ── Snap animation ──
  const snapTo = useCallback((i: number) => {
    if (ITEM_COUNT === 0) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const target = -angleOfItem(i);
    const start = rotationRef.current;
    let diff = norm180(target - start);
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
  }, [angleOfItem, norm180, rerender, ITEM_COUNT]);

  // ── Drag handlers ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragActive.current = true;
    const ang = angleAt(e.clientX, e.clientY);
    dragLastAngle.current = ang;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragTotalDist.current = 0;
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, [angleAt]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragActive.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    dragTotalDist.current = Math.sqrt(dx * dx + dy * dy);

    const currentAngle = angleAt(e.clientX, e.clientY);
    let delta = currentAngle - dragLastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    rotationRef.current += delta;
    dragLastAngle.current = currentAngle;
    rerender();
  }, [angleAt, rerender]);

  const onPointerUp = useCallback(() => {
    if (!dragActive.current) return;
    dragActive.current = false;
    if (dragTotalDist.current > CLICK_THRESHOLD) {
      snapTo(activeIdx);
    }
  }, [activeIdx, snapTo]);

  // ── Hub (today) click ──
  const snapToToday = useCallback(() => {
    snapTo(presentIndex);
  }, [presentIndex, snapTo]);

  // ── UI labels ──
  const activeType = activeItem?.isPresent ? 'present'
    : (activeIdx < presentIndex) ? 'past' : 'future';

  const timeLabel = activeItem
    ? (activeType === 'present' ? 'Hiện tại'
      : activeType === 'past' ? `Quá khứ · ${activeItem.when}`
      : `Tương lai · ${activeItem.when}`)
    : '';

  const btnLabel = activeType === 'past' ? '📖 Xem lại'
    : activeType === 'future' ? '🗓️ Lên kế hoạch'
    : '💭 Ghi lại';

  // On first render, snap to center (rotation = 0 = presentIndex)
  const hasSnapped = useRef(false);
  useEffect(() => {
    if (!hasSnapped.current && wheelRef.current && ITEM_COUNT > 0) {
      hasSnapped.current = true;
      rotationRef.current = -angleOfItem(presentIndex);
      rerender();
    }
  }, [angleOfItem, presentIndex, rerender, ITEM_COUNT]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-[#5856D6]/10 flex items-center justify-center">
              <Sparkles size={20} className="text-[#5856D6]" />
            </div>
            Dòng thời gian
          </h1>
        </div>
        <div className="card-ios text-center py-16">
          <div className="w-8 h-8 border-2 border-[#5856D6]/20 border-t-[#5856D6] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-[#8E8E93]">Đang tải sự kiện...</p>
        </div>
      </div>
    );
  }

  if (ITEM_COUNT === 0) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[26px] font-bold text-[#111] tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-[#5856D6]/10 flex items-center justify-center">
              <Sparkles size={20} className="text-[#5856D6]" />
            </div>
            Dòng thời gian
          </h1>
        </div>
        <div className="card-ios text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#5856D6]/5 mx-auto mb-4 flex items-center justify-center">
            <Sparkles size={28} className="text-[#5856D6]/30" />
          </div>
          <p className="text-[15px] font-semibold text-[#6B7280] mb-1">Chưa có sự kiện nào</p>
          <p className="text-[12px] text-[#8E8E93]">Thêm sự kiện để xem trên dòng thời gian</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-bold text-[#111] tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 rounded-[12px] bg-[#5856D6]/10 flex items-center justify-center">
            <Sparkles size={20} className="text-[#5856D6]" />
          </div>
          Dòng thời gian
        </h1>
      </div>

      {/* Wheel */}
      <div className="card-ios text-center py-8 mb-4">
        <div
          ref={wheelRef}
          className="relative w-[340px] h-[340px] mx-auto mb-6 select-none touch-none"
          style={{ cursor: 'grab' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Track conic gradient */}
          <div
            className="absolute inset-[16px] rounded-full"
            style={{
              background: `conic-gradient(from 0deg,
                rgba(139,92,246,0.08) 0deg, rgba(139,92,246,0.08) 178deg,
                rgba(230,0,45,0.08) 178deg, rgba(230,0,45,0.08) 182deg,
                rgba(245,158,11,0.08) 182deg, rgba(245,158,11,0.08) 360deg)`,
              border: '1px solid rgba(0,0,0,0.04)',
            }}
          />
          <div className="absolute rounded-full" style={{ inset: '36px', border: '1px dashed rgba(0,0,0,0.06)' }} />

          {/* Pointer arrow at top */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}
          >
            <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-[#111]" />
          </div>

          {/* Hub — center Today button */}
          <div
            onClick={snapToToday}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-white cursor-pointer z-10 select-none active:scale-95 transition-transform"
            style={{
              width: 100, height: 100,
              background: 'linear-gradient(135deg, #D60032 0%, #FF4B3A 55%, #FF6A3D 100%)',
              boxShadow: '0 14px 30px rgba(230,0,45,0.35), 0 4px 12px rgba(230,0,45,0.2)',
            }}
          >
            <span className="text-[9px] font-bold tracking-[1.5px] uppercase opacity-85">HÔM NAY</span>
            <span className="text-[15px] font-extrabold mt-0.5 leading-tight">
              {new Date().toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
            </span>
          </div>

          {/* Memory nodes */}
          {list.map((item, i) => {
            if (item.isPresent) return null;
            const rot = rotationRef.current;
            const ang = angleOfItem(i) + rot;
            const rad = ang * Math.PI / 180;
            const x = RADIUS * Math.sin(rad);
            const y = -RADIUS * Math.cos(rad);
            const dist = Math.abs(norm180(ang));
            const isActive = dist < SNAP_THRESHOLD;
            const scale = 0.72 + 0.34 * (1 - Math.min(dist, 130) / 130);
            const opacity = 0.55 + 0.45 * (1 - Math.min(dist, 150) / 150);
            const nodeType = i < presentIndex ? 'past' : 'future';

            return (
              <div
                key={i}
                onClick={() => snapTo(i)}
                className="absolute rounded-full flex items-center justify-center cursor-pointer select-none transition-shadow duration-200"
                style={{
                  top: '50%', left: '50%',
                  width: 48, height: 48,
                  marginLeft: -24, marginTop: -24,
                  background: nodeType === 'past'
                    ? 'linear-gradient(135deg, #D97706 0%, #F59E0B 55%, #FBBF24 100%)'
                    : 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A78BFA 100%)',
                  border: isActive ? '3px solid #111' : '2px solid rgba(255,255,255,0.8)',
                  boxShadow: isActive
                    ? '0 10px 24px rgba(0,0,0,0.18)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: isActive ? 5 : Math.round(100 - dist),
                  fontSize: 20,
                  transform: `translate(${x}px, ${y}px) scale(${scale.toFixed(2)})`,
                  opacity: opacity.toFixed(2),
                }}
              >
                {item.icon}
              </div>
            );
          })}
        </div>

        <p className="text-[12px] text-[#8E8E93] font-semibold">
          ← Kéo để lùi về quá khứ · &nbsp;kéo phải để tiến tới tương lai →
        </p>
      </div>

      {/* Detail Card */}
      {activeItem && (
        <div
          className="rounded-[26px] p-5 min-h-[150px] transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-[44px] h-[44px] rounded-[16px] flex items-center justify-center text-[21px] flex-shrink-0 text-white"
              style={{
                background: activeType === 'past'
                  ? 'linear-gradient(135deg, #D97706 0%, #F59E0B 55%, #FBBF24 100%)'
                  : activeType === 'future'
                    ? 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A78BFA 100%)'
                    : 'linear-gradient(135deg, #D60032 0%, #FF4B3A 55%, #FF6A3D 100%)',
              }}
            >
              {activeItem.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-[10px] font-bold tracking-[1px] uppercase ${
                  activeType === 'past' ? 'text-[#F59E0B]'
                  : activeType === 'future' ? 'text-[#8B5CF6]'
                  : 'text-[#E6002D]'
                }`}
              >
                {timeLabel}
              </div>
              <div className="text-[17px] font-extrabold text-[#101010] mt-0.5 tracking-[-0.2px]">
                {activeItem.title}
              </div>
            </div>
          </div>
          <div className="text-[13px] text-[#6B7280] leading-relaxed mb-[16px]">
            {activeItem.desc}
          </div>
          <button
            className="w-full py-[13px] border-none rounded-[18px] text-[14px] font-bold text-white cursor-pointer active:scale-[0.97] transition-transform"
            style={{
              background: activeType === 'past'
                ? 'linear-gradient(135deg, #D97706 0%, #F59E0B 55%, #FBBF24 100%)'
                : activeType === 'future'
                  ? 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #A78BFA 100%)'
                  : 'linear-gradient(135deg, #D60032 0%, #FF4B3A 55%, #FF6A3D 100%)',
              boxShadow: activeType === 'past'
                ? '0 10px 22px rgba(217,119,6,0.28)'
                : activeType === 'future'
                  ? '0 10px 22px rgba(124,58,237,0.28)'
                  : '0 10px 22px rgba(214,0,50,0.28)',
            }}
          >
            {btnLabel}
          </button>
        </div>
      )}

      {/* Add future dream button */}
      <div className="flex justify-center mt-4">
        <button className="flex items-center gap-2 px-5 py-3 rounded-[20px] bg-[#F1F1F4] text-[#101010] text-[13px] font-bold active:scale-[0.96] transition-transform cursor-pointer border-none">
          <Plus size={16} />
          Thêm một ước mơ tương lai
        </button>
      </div>
    </div>
  );
}
