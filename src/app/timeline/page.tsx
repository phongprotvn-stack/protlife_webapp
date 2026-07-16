'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Plus, Sparkles } from 'lucide-react';

// ── Data ──
const pastMemories = [
  { icon:'💼', title:'Ngày đầu đi làm', when:'3 năm trước', desc:'Cột mốc khởi đầu sự nghiệp — hồi hộp và đầy háo hức.' },
  { icon:'🎂', title:'Sinh nhật tuổi 25', when:'1 năm trước', desc:'Bạn bè cũ tụ họp đông đủ, một trong những đêm vui nhất.' },
  { icon:'💍', title:'Đám cưới Linh', when:'6 tháng trước', desc:'Ngồi bàn cùng nhóm bạn đại học, ai cũng khóc lúc trao nhẫn.' },
  { icon:'🏔️', title:'Chuyến đi Đà Lạt', when:'2 tháng trước', desc:'3 ngày trốn phố cùng gia đình, chụp hơn 200 tấm ảnh.' },
  { icon:'☕', title:'Cà phê với Minh', when:'2 tuần trước', desc:'Hàn huyên chuyện cũ sau nhiều năm mất liên lạc.' },
];

const futureMemories = [
  { icon:'🎁', title:'Sinh nhật Mẹ', when:'2 tuần tới', desc:'Đã lên lịch nhắc mua quà — đừng để quên như mọi năm.' },
  { icon:'🚗', title:'Học lái xe', when:'3 tháng tới', desc:'Mục tiêu nhỏ để tự chủ hơn trong công việc và cuộc sống.' },
  { icon:'🏃', title:'Marathon đầu tiên', when:'6 tháng tới', desc:'Đăng ký giải 21km — bắt đầu tập từ tuần sau.' },
  { icon:'🗾', title:'Du lịch Nhật Bản', when:'1 năm tới', desc:'Một trong những nơi bạn khao khát đặt chân đến nhất.' },
  { icon:'🏡', title:'Mua nhà cho bố mẹ', when:'Ước mơ dài hạn', desc:'Mục tiêu lớn, cần kế hoạch tài chính rõ ràng theo từng năm.' },
];

const presentMemory = {
  icon:'❤️', title:'Hôm nay', when:'Hiện tại',
  desc:'Tận hưởng khoảnh khắc này — mọi ký ức đều bắt đầu từ đây.',
};

interface MemoryItem { icon: string; title: string; when: string; desc: string; isPresent?: boolean; }

export default function TimelinePage() {
  const list = useMemo<MemoryItem[]>(() => [
    ...pastMemories, { ...presentMemory, isPresent: true }, ...futureMemories,
  ], []);
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

  // Drag state refs (not state to avoid rerenders during drag)
  const dragActive = useRef(false);
  const dragLastAngle = useRef(0);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragTotalDist = useRef(0);
  const CLICK_THRESHOLD = 8; // px — if total movement < this, treat as click

  // ── Geometry helpers ──
  const angleOfItem = useCallback((i: number) => {
    // Returns the absolute angle of item i on the wheel when rotation=0
    // Angle 0 = top of circle
    return (i - presentIndex) * (360 / ITEM_COUNT);
  }, [presentIndex, ITEM_COUNT]);

  const norm180 = useCallback((deg: number) => {
    let d = ((deg % 360) + 360) % 360;
    return d > 180 ? d - 360 : d;
  }, []);

  // Mouse angle relative to wheel center
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
    const rot = rotationRef.current;
    let best = presentIndex;
    let bestDist = Infinity;
    list.forEach((item, i) => {
      if (item.isPresent) return;
      const d = Math.abs(norm180(angleOfItem(i) + rot));
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return bestDist < SNAP_THRESHOLD ? best : presentIndex;
  }, [list, presentIndex, angleOfItem, norm180, renderTick]);

  const activeItem = list[activeIdx];
  const activeType = activeItem?.isPresent ? 'present'
    : (activeIdx < presentIndex) ? 'past' : 'future';

  // ── Snap animation ──
  const snapTo = useCallback((i: number) => {
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
  }, [angleOfItem, norm180, rerender]);

  // ── Drag handlers ──
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragActive.current = true;
    const ang = angleAt(e.clientX, e.clientY);
    dragLastAngle.current = ang;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragTotalDist.current = 0;
    // Don't setPointerCapture — let pointer events bubble naturally
    // so onClick on child elements (nodes, hub) still fire.
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, [angleAt]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragActive.current) return;
    // Track total distance to distinguish click vs drag
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    dragTotalDist.current = Math.sqrt(dx * dx + dy * dy);

    const currentAngle = angleAt(e.clientX, e.clientY);
    let delta = currentAngle - dragLastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    // Wheel rotates same direction as drag
    rotationRef.current += delta;
    dragLastAngle.current = currentAngle;
    rerender();
  }, [angleAt, rerender]);

  const onPointerUp = useCallback(() => {
    if (!dragActive.current) return;
    dragActive.current = false;

    if (dragTotalDist.current > CLICK_THRESHOLD) {
      // It was a drag → snap to nearest node
      snapTo(activeIdx);
    }
    // If it was a click (no significant movement),
    // don't snap here — let onClick on the node/hub handle it
  }, [activeIdx, snapTo]);

  // ── Hub (today) click ──
  const snapToToday = useCallback(() => {
    // Snap to presentIndex which is at the MIDDLE (angle=0 = top = no-node zone)
    snapTo(presentIndex);
  }, [presentIndex, snapTo]);

  // ── UI labels ──
  const timeLabel = activeType === 'present' ? 'Hiện tại'
    : activeType === 'past' ? `Quá khứ · ${activeItem?.when || ''}`
    : `Tương lai · ${activeItem?.when || ''}`;
  const btnLabel = activeType === 'past' ? '📖 Xem lại'
    : activeType === 'future' ? '🗓️ Lên kế hoạch'
    : '💭 Ghi lại';

  // On first render, snap to center (rotation = 0 = presentIndex)
  const hasSnapped = useRef(false);
  useEffect(() => {
    if (!hasSnapped.current && wheelRef.current) {
      hasSnapped.current = true;
      rotationRef.current = -angleOfItem(presentIndex);
      rerender();
    }
  }, [angleOfItem, presentIndex, rerender]);

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
          {/* Track conic gradient — past (right/amber) + divider (red) + future (left/purple) */}
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
          {/* Dashed inner ring */}
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
            {activeItem?.icon}
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
              {activeItem?.title}
            </div>
          </div>
        </div>
        <div className="text-[13px] text-[#6B7280] leading-relaxed mb-[16px]">
          {activeItem?.desc}
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
