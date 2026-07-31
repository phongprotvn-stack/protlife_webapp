'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { DaughterName } from './daughter-names-data';

interface NameCardProps {
  data: DaughterName;
  index: number;
  featured: boolean;
  pinned: boolean;
  onTogglePin: () => void;
  reduceMotion: boolean;
}

/**
 * NameCard — Bento Glass card (v0 style)
 * - Apple Wallet hover: trồi lên translateY + phóng to nhẹ
 * - Shimmer border: viền sáng conic-gradient chạy quanh card khi hover
 * - Nút tim Ghim: bật/tắt yêu thích (GPU-friendly, chỉ animate transform/opacity)
 */
export function NameCard({ data, index, featured, pinned, onTogglePin, reduceMotion }: NameCardProps) {
  const [active, setActive] = useState(false); // hover (desktop) hoặc tap (mobile)
  const shimmerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = data.icon;

  const clearShimmerTimer = () => {
    if (shimmerTimer.current) { clearTimeout(shimmerTimer.current); shimmerTimer.current = null; }
  };

  return (
    <motion.div
      onHoverStart={() => setActive(true)}
      onHoverEnd={() => { clearShimmerTimer(); setActive(false); }}
      onTapStart={() => { clearShimmerTimer(); setActive(true); }}
      onTapCancel={() => { clearShimmerTimer(); setActive(false); }}
      onTap={() => {
        // Giữ shimmer nháy thêm 0.7s sau khi nhả tay (mobile feedback)
        clearShimmerTimer();
        shimmerTimer.current = setTimeout(() => setActive(false), 700);
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 140, damping: 18, delay: (index % 8) * 0.04 }}
      whileHover={reduceMotion ? undefined : { y: -10, scale: 1.03 }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      className="group relative overflow-hidden rounded-[22px] border border-white/20 bg-white/25 backdrop-blur-xl will-change-transform"
      style={{
        gridColumn: featured ? 'span 2' : undefined,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
      }}>
      {/* ─── Shimmer border (hover hoặc tap đều chạy) ─── */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[22px]"
        style={{
          padding: 1.5,
          background: 'conic-gradient(from 0deg, transparent 5%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.25) 55%, transparent 95%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: active && !reduceMotion ? 1 : 0,
        }}
        animate={reduceMotion ? undefined : { rotate: active ? 360 : 0 }}
        transition={active ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 0.35 }}
      />

      {/* ─── Nội dung ─── */}
      <div className={`relative flex flex-col ${featured ? 'p-5 md:p-6 min-h-[128px]' : 'p-4 md:p-5 min-h-[112px]'}`}>
        {/* Hàng trên: icon chip + nút ghim */}
        <div className="mb-3 flex items-start justify-between">
          <div
            className={`flex items-center justify-center rounded-[12px] ${featured ? 'h-[40px] w-[40px]' : 'h-[34px] w-[34px]'}`}
            style={{ backgroundColor: `${data.color}2E`, color: data.color, boxShadow: `inset 0 0 0 1px ${data.color}40` }}>
            <Icon size={featured ? 18 : 15} strokeWidth={2} />
          </div>
          {/* Nút Ghim (Trái tim) */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            whileTap={reduceMotion ? undefined : { scale: 0.7 }}
            animate={pinned ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            aria-label={pinned ? 'Bỏ ghim' : 'Ghim'}
            className={`rounded-full p-1.5 transition-colors ${pinned ? 'text-[#FF4D6A]' : 'text-white/45 hover:text-white/80'}`}
            style={{ textShadow: pinned ? '0 0 12px rgba(255,77,106,0.7)' : undefined }}>
            <Heart size={15} fill={pinned ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {/* Tên chính — font Serif */}
        <h3
          className={`font-semibold leading-tight tracking-tight ${featured ? 'text-[22px] md:text-[26px]' : 'text-[17px] md:text-[19px]'}`}
          style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", color: '#FFFFFF' }}>
          {data.given}
        </h3>

        {/* Ý nghĩa + tag họ — font Sans */}
        <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-snug text-white/60">
          <span
            className="inline-block rounded-full px-1.5 py-[1px] text-[9px] font-medium"
            style={{ backgroundColor: `${data.color}2E`, color: data.color }}>
            {data.family}
          </span>
          <span className="truncate">{data.meaning}</span>
        </p>
      </div>
    </motion.div>
  );
}
