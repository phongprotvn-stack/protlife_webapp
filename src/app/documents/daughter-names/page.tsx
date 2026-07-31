'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart } from 'lucide-react';

// ─── 24 cái tên (họ Nghiêm) ───
interface NameItem {
  family: string;
  given: string;
  vibe: string;
  icon: string;
  color: string;
}

const NAMES: NameItem[] = [
  { family: 'Nghiêm', given: 'Thu Sang',   vibe: 'Trong trẻo như sương sớm',      icon: '🌸',  color: '#FFB3C7' },
  { family: 'Nghiêm', given: 'Như Ngọc',   vibe: 'Tinh khôi như viên ngọc quý',    icon: '💎',  color: '#A5D8FF' },
  { family: 'Nghiêm', given: 'Như Sương',  vibe: 'Mềm mại như giọt sương mai',     icon: '✨',  color: '#C9F2E7' },
  { family: 'Nghiêm', given: 'Như Nguyệt', vibe: 'Dịu dàng như ánh trăng rằm',     icon: '🌙',  color: '#E6D5FF' },
  { family: 'Nghiêm', given: 'Như Quyên',  vibe: 'Thanh thoát tiếng chim quyên',   icon: '🕊️', color: '#BFE3FF' },
  { family: 'Nghiêm', given: 'Ngọc Ẩn',    vibe: 'Viên ngọc ẩn mình sâu lắng',     icon: '💠',  color: '#B8E6FF' },
  { family: 'Nghiêm', given: 'Phương Châm',vibe: 'Phương hướng cùng kim chỉ nam',  icon: '🧭',  color: '#FFD6A5' },
  { family: 'Nghiêm', given: 'Ngọc Thảo',  vibe: 'Ngọc ngà giữa thảo nguyên xanh', icon: '🌿',  color: '#C8F0C0' },
  { family: 'Nghiêm', given: 'Hà An',      vibe: 'Dòng sông bình yên lặng lẽ',     icon: '🏞️', color: '#A5D8FF' },
  { family: 'Nghiêm', given: 'Bảo Trâm',   vibe: 'Báu vật trân quý nhất đời',      icon: '💝',  color: '#FFC2D1' },
  { family: 'Nghiêm', given: 'Kim Tuyến',  vibe: 'Sợi chỉ vàng óng ánh',           icon: '🪡',  color: '#FFE0A3' },
  { family: 'Nghiêm', given: 'Thanh Quyên',vibe: 'Trong veo tiếng hót chim quyên', icon: '🎶',  color: '#BFE3FF' },
  { family: 'Nghiêm', given: 'Hà Thu',     vibe: 'Dòng sông mùa thu lá đổ',        icon: '🍂',  color: '#FFC9A3' },
  { family: 'Nghiêm', given: 'Thanh Mai',  vibe: 'Mai trắng nở giữa xuân thì',     icon: '🌼',  color: '#FFF0B3' },
  { family: 'Nghiêm', given: 'Châu Loan',  vibe: 'Viên châu lung linh tỏa sáng',   icon: '🐚',  color: '#FFD6E7' },
  { family: 'Nghiêm', given: 'Anh Thư',    vibe: 'Tài hoa cùng trang sách mở',     icon: '📖',  color: '#D6C9FF' },
  { family: 'Nghiêm', given: 'Thị Nguyệt', vibe: 'Ánh trăng thanh giữa trời đêm',  icon: '🌙',  color: '#D6C9FF' },
  { family: 'Nghiêm', given: 'Thu Hoài',   vibe: 'Nỗi nhớ dịu dàng của mùa thu',   icon: '🍁',  color: '#FFC9A3' },
  { family: 'Nghiêm', given: 'Thảo Nguyên',vibe: 'Thảo nguyên mênh mông gió lộng', icon: '🌾',  color: '#C8F0C0' },
  { family: 'Nghiêm', given: 'Thảo Chi',   vibe: 'Cỏ cây xanh tươi tràn nhựa sống',icon: '🌱',  color: '#C8F0C0' },
  { family: 'Nghiêm', given: 'Mai Thương', vibe: 'Hoa mai gợi nhớ một người',      icon: '🌸',  color: '#FFD6E7' },
  { family: 'Nghiêm', given: 'Nhật Linh',  vibe: 'Ánh mặt trời ban mai rực rỡ',    icon: '☀️', color: '#FFE0A3' },
  { family: 'Nghiêm', given: 'Bích Ngọc',  vibe: 'Ngọc bích xanh biếc hiếm có',    icon: '💚',  color: '#B8E6D8' },
  { family: 'Nghiêm', given: 'Thu Uyên',   vibe: 'Uyên ương bên dòng thu nước',    icon: '🕊️', color: '#BFE3FF' },
];

// Bento pattern — kích thước ổn định (không random) để không giật layout
// c: colSpan (2 = rộng đôi), r: rowSpan (2 = cao đôi)
const BENTO: { c: number; r: number }[] = [
  { c: 2, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 2 }, { c: 1, r: 1 },
  { c: 1, r: 1 }, { c: 1, r: 1 }, { c: 2, r: 1 }, { c: 1, r: 1 },
  { c: 1, r: 1 }, { c: 1, r: 2 }, { c: 1, r: 1 }, { c: 2, r: 1 },
  { c: 1, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 2 },
  { c: 2, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 1 },
  { c: 2, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 1 }, { c: 1, r: 2 },
];

// Mỗi card: nhẹ hơn khi render (chỉ transform/opacity)
const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  show: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 120, damping: 16, delay: i * 0.045 },
  }),
};

export default function DaughterNamesPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  // Trộn danh sách ổn định (theo index, không đổi mỗi lần render)
  const items = useMemo(() => {
    // xáo nhẹ bằng seed cố định để card to/đẹp nằm rải đều
    const seed = [0, 6, 13, 21, 3, 9, 17, 1, 11, 19, 4, 15, 22, 7, 2, 12, 20, 8, 5, 16, 23, 10, 14, 18];
    return seed.map((idx) => ({ ...NAMES[idx], bento: BENTO[idx] }));
  }, []);

  const auroraBlobs = [
    { color: 'rgba(255,120,180,0.55)', size: 420, x: '-5%', y: '-10%', dur: 26 },
    { color: 'rgba(160,120,255,0.5)',  size: 480, x: '60%', y: '-5%',  dur: 32 },
    { color: 'rgba(90,220,200,0.42)',  size: 400, x: '25%', y: '55%',  dur: 28 },
    { color: 'rgba(255,180,90,0.4)',   size: 360, x: '-8%', y: '60%',  dur: 24 },
    { color: 'rgba(120,160,255,0.42)', size: 380, x: '70%', y: '65%',  dur: 30 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: 'linear-gradient(160deg, #1a1030 0%, #2d1b4e 35%, #1e3a5f 70%, #0f2e2a 100%)' }}>
      {/* ─── Aurora background ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {auroraBlobs.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size, height: b.size,
              left: b.x, top: b.y,
              background: `radial-gradient(circle at center, ${b.color} 0%, transparent 70%)`,
              filter: 'blur(70px)',
              willChange: 'transform',
            }}
            animate={reduceMotion ? undefined : {
              x: [0, 60, -30, 0],
              y: [0, -50, 40, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {/* Hạt sáng lấp lánh */}
        <div className="absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.7), transparent), radial-gradient(1.5px 1.5px at 45% 75%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 10% 85%, rgba(255,255,255,0.5), transparent)' }} />
      </div>

      {/* ─── Content ─── */}
      <div className="relative z-10 mx-auto max-w-[1100px] px-4 pt-6 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-start gap-4">
          <button onClick={() => router.back()}
            className="mt-1 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md transition-all hover:bg-white/20 active:scale-90">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/50">Prot Life · Tài liệu</p>
            <h1 className="mt-1 text-[26px] font-medium leading-tight tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" }}>
              Người tình kiếp trước
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/55">
              <Heart size={11} className="text-pink-300" fill="currentColor" />
              24 cái tên dành cho con gái tương lai
            </p>
          </div>
          <motion.div className="ml-auto hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white/70 backdrop-blur-md sm:flex"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <Sparkles size={11} className="text-pink-300" /> Bento × Aurora
          </motion.div>
        </motion.div>

        {/* ─── Bento Grid ─── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          style={{ gridAutoFlow: 'dense', perspective: 1200 }}>
          {items.map((item, i) => (
            <motion.div
              key={item.given}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="show"
              whileHover={reduceMotion ? undefined : { scale: 1.04, rotateX: 4, rotateY: 6, z: 20 }}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-white/30 bg-white/15 p-5 shadow-xl backdrop-blur-lg will-change-transform md:p-6"
              style={{
                gridColumn: `span ${item.bento.c}`,
                gridRow: `span ${item.bento.r}`,
                transformStyle: 'preserve-3d',
                boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 1px rgba(255,255,255,0.06)',
              }}>
              {/* Biểu tượng mờ phía sau */}
              <div className="pointer-events-none absolute -right-3 -top-3 select-none text-[64px] opacity-[0.14] transition-all duration-500 group-hover:opacity-[0.3] group-hover:scale-110 md:text-[84px]" style={{ transform: 'translateZ(-18px)' }} aria-hidden>
                {item.icon}
              </div>
              {/* Glow khi hover/tap */}
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(120% 90% at 50% 0%, ${item.color}33 0%, transparent 60%)` }} aria-hidden />

              <div className="relative flex h-full flex-col" style={{ transform: 'translateZ(12px)' }}>
                {/* Số thứ tự — font mono */}
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.2em] text-white/40"
                    style={{ fontFamily: "'SF Mono', ui-monospace, 'Cascadia Mono', Menlo, monospace" }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] text-white/60 backdrop-blur-sm">{item.family}</span>
                </div>

                {/* Tên chính — font Serif */}
                <h3 className="mt-auto text-[20px] font-semibold leading-tight tracking-tight md:text-[24px]"
                  style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", color: item.color }}>
                  {item.given}
                </h3>

                {/* Vibe — font Sans */}
                <p className="mt-1.5 flex items-center gap-1 text-[11px] leading-snug text-white/55">
                  <span className="text-[10px]">{item.icon}</span>{item.vibe}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.footer
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="mt-10 text-center text-[11px] text-white/35">
          <Sparkles size={12} className="mx-auto mb-1.5 text-pink-300/60" />
          Đồng hành cùng hành trình cuộc đời bạn · Prot Life
        </motion.footer>
      </div>
    </div>
  );
}
