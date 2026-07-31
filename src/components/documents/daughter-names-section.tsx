'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { DAUGHTER_NAMES } from './daughter-names-data';
import { NameCard } from './name-card';

const STORAGE_KEY = 'protlife-ntkt-pinned';

interface DaughterNamesSectionProps {
  /** fullPage: hiển thị toàn trang (không bo viền container, căn giữa tối đa) */
  fullPage?: boolean;
}

/**
 * DaughterNamesSection — mục "Người tình kiếp trước" (v0 style)
 * Nhúng vào trang Tài liệu hoặc render full-page tại /documents/daughter-names2.
 */
export function DaughterNamesSection({ fullPage = false }: DaughterNamesSectionProps) {
  const reduceMotion = useReducedMotion();

  // Ghim (tim) — persist vào localStorage
  const [pinned, setPinned] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned)); } catch { /* ignore */ }
  }, [pinned]);

  const togglePin = (given: string) =>
    setPinned((p) => (p.includes(given) ? p.filter((x) => x !== given) : [...p, given]));

  // Featured: cứ mỗi 5 tên, 1 card rộng đôi (nhịp điệu Bento ổn định, không random)
  const items = useMemo(() => DAUGHTER_NAMES.map((d, i) => ({ ...d, featured: i % 5 === 0 })), []);

  const auroraBlobs = [
    { color: 'rgba(255,140,190,0.5)',  size: 380, x: '-8%',  y: '-12%', dur: 24 },
    { color: 'rgba(170,130,255,0.45)', size: 440, x: '62%',  y: '-8%',  dur: 30 },
    { color: 'rgba(100,220,205,0.38)', size: 360, x: '22%',  y: '58%',  dur: 26 },
    { color: 'rgba(255,190,110,0.35)', size: 320, x: '-6%',  y: '64%',  dur: 22 },
    { color: 'rgba(130,165,255,0.4)',  size: 350, x: '72%',  y: '66%',  dur: 28 },
  ];

  return (
    <section
      className={
        fullPage
          ? 'relative px-4 pb-4 text-white sm:px-6 md:px-10'
          : 'relative mt-6 overflow-hidden rounded-[28px] px-4 py-7 text-white sm:px-6 md:px-8'
      }
      style={fullPage ? { background: 'transparent' } : { background: 'linear-gradient(160deg, #1a1030 0%, #2d1b4e 38%, #1e3a5f 72%, #0f2e2a 100%)' }}>
      {/* Cormorant Garamond (Serif) + Be Vietnam Pro (Sans) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Be+Vietnam+Pro:wght@400;500;600&display=swap"
        rel="stylesheet" />
      {/* ─── Aurora background (chỉ khi embedded — trang fullPage tự lo) ─── */}
      {!fullPage && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {auroraBlobs.map((b, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: b.size, height: b.size, left: b.x, top: b.y,
                background: `radial-gradient(circle at center, ${b.color} 0%, transparent 70%)`,
                filter: 'blur(64px)', willChange: 'transform',
              }}
              animate={reduceMotion ? undefined : { x: [0, 50, -25, 0], y: [0, -40, 35, 0], scale: [1, 1.12, 0.96, 1] }}
              transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* ─── IntroHeader (fullPage: ẩn text vì trang đã có header, chỉ giữ chip ghim) ─── */}
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
        {!fullPage && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/45">Prot Life · Tài liệu</p>
            <h2
              className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight md:text-[32px]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif" }}>
              Người tình kiếp trước
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/55">
              <Sparkles size={12} className="text-pink-300" />
              24 cái tên dành cho con gái tương lai — chạm tim để ghim
            </p>
          </div>
        )}
        {fullPage && <div />}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur-md">
          <Heart size={12} className="text-[#FF4D6A]" fill="currentColor" />
          {pinned.length} đã ghim
        </motion.div>
      </div>

      {/* ─── Bento Grid ─── */}
      <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {items.map((item, i) => (
          <NameCard
            key={item.given}
            data={item}
            index={i}
            featured={item.featured}
            pinned={pinned.includes(item.given)}
            onTogglePin={() => togglePin(item.given)}
            reduceMotion={!!reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}
