'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { DaughterNamesSection } from '@/components/documents/daughter-names-section';

// Aurora background — đồng bộ toàn trang (header + main trên cùng 1 nền gradient)
const auroraBlobs = [
  { color: 'rgba(255,140,190,0.5)',  size: 420, x: '-5%',  y: '-10%', dur: 26 },
  { color: 'rgba(170,130,255,0.45)', size: 480, x: '60%',  y: '-5%',  dur: 32 },
  { color: 'rgba(100,220,205,0.38)', size: 400, x: '25%',  y: '55%',  dur: 28 },
  { color: 'rgba(255,190,110,0.35)', size: 360, x: '-8%',  y: '60%',  dur: 24 },
  { color: 'rgba(130,165,255,0.4)',  size: 380, x: '70%',  y: '65%',  dur: 30 },
];

export default function DaughterNames2Page() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: 'linear-gradient(160deg, #1a1030 0%, #2d1b4e 35%, #1e3a5f 70%, #0f2e2a 100%)' }}>
      {/* ─── Aurora background (tràn toàn trang, chung cho header + main) ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {auroraBlobs.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size, height: b.size, left: b.x, top: b.y,
              background: `radial-gradient(circle at center, ${b.color} 0%, transparent 70%)`,
              filter: 'blur(70px)', willChange: 'transform',
            }}
            animate={reduceMotion ? undefined : { x: [0, 60, -30, 0], y: [0, -50, 40, 0], scale: [1, 1.15, 0.95, 1] }}
            transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {/* Hạt sáng lấp lánh */}
        <div className="absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 45% 75%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 10% 85%, rgba(255,255,255,0.5), transparent)' }} />
      </div>

      {/* ─── Content ─── */}
      <div className="relative z-10 mx-auto max-w-[1100px] pt-6 pb-16">
        {/* Header — nằm chung nền gradient với main */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-start gap-4 px-4 sm:px-6 md:px-10">
          <button onClick={() => router.back()}
            className="mt-1 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 active:scale-90">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">Prot Life · Tài liệu</p>
            <h1 className="mt-1 text-[26px] font-medium leading-tight tracking-tight md:text-[30px]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif" }}>
              Người tình kiếp trước
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/55">
              <Heart size={11} className="text-pink-300" fill="currentColor" />
              24 cái tên dành cho con gái tương lai · Bento Glass
            </p>
          </div>
          <motion.div className="ml-auto hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white/70 backdrop-blur-md sm:flex"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <Sparkles size={11} className="text-pink-300" /> Bento × Aurora
          </motion.div>
        </motion.div>

        {/* Main — nền trong suốt, dùng chung gradient + aurora của trang */}
        <DaughterNamesSection fullPage />
      </div>
    </div>
  );
}
