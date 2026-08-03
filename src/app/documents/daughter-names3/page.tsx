'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { NAMES } from '@/components/daughter-names3/names-data';
import { Header } from '@/components/daughter-names3/intro-header';
import { NameCard } from '@/components/daughter-names3/name-card';

// Nền dark liquid + radial pastel (giống hệt body style trong file v0 gốc)
const BG_STYLE: React.CSSProperties = {
  background:
    'radial-gradient(1200px 800px at 12% -8%, rgba(255, 196, 224, 0.10), transparent 60%),' +
    'radial-gradient(1000px 700px at 92% 4%, rgba(180, 205, 255, 0.10), transparent 60%),' +
    'radial-gradient(900px 700px at 50% 108%, rgba(200, 255, 230, 0.08), transparent 60%),' +
    '#0b0a12',
};

export default function DaughterNames3Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={BG_STYLE}>
      {/* Fonts: Cormorant Garamond (display) + Be Vietnam Pro (viet) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap"
        rel="stylesheet" />

      {/* Nút quay lại */}
      <div className="mx-auto max-w-6xl px-5 pt-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 rounded-full glass ring-1 ring-white/15 px-3 py-1.5 text-[12px] font-medium text-white/80 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={14} /> Quay lại
        </button>
      </div>

      {/* Aurora Banner — ~300px, phía trên cùng trước IntroHeader */}
      <section className="aurora-banner relative mx-auto mt-6 h-[300px] w-full overflow-hidden rounded-[28px] px-6 md:h-[320px]">
        {/* lớp kính mờ tạo chiều sâu */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_20%_20%,rgba(255,255,255,0.5),transparent_60%),radial-gradient(500px_260px_at_85%_30%,rgba(255,255,255,0.35),transparent_55%)]" />
        {/* nội dung */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <div className="aurora-float flex items-center gap-2 text-white/80 drop-shadow-[0_1px_2px_rgba(120,60,140,0.25)]">
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.4em]">
              The lover from a previous life
            </span>
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] text-[#3a1a35] md:text-7xl text-balance">
            Người tình kiếp trước 3
          </h1>
          <p className="mt-3 font-viet text-sm font-medium text-[#6a3a5a]/90">
            Aurora gradient · 24 names, kept in glass, for the ones still on their way
          </p>
        </div>
      </section>

      <Header />

      <main className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        {/* Bento grid — mobile: row auto (nội dung trọn vẹn); desktop: 210px cố định */}
        <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-auto md:grid-cols-6 md:auto-rows-[210px] gap-4 md:gap-5">
          {NAMES.map((entry, i) => (
            <NameCard key={entry.id} entry={entry} index={i} />
          ))}
        </div>

        {/* footer note */}
        <p className="mt-16 text-center font-viet text-xs tracking-wide text-white/35">
          24 names · kept in glass · for the ones still on their way
        </p>
      </main>
    </div>
  );
}