'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { NAMES } from './names-data';
import { Header } from './header';
import { NameCard } from './name-card';

// Nền dark + radial pastel (giống hệt body style trong file gốc)
const BG_STYLE: React.CSSProperties = {
  background:
    'radial-gradient(1200px 800px at 12% -8%, rgba(255, 196, 224, 0.10), transparent 60%),' +
    'radial-gradient(1000px 700px at 92% 4%, rgba(180, 205, 255, 0.10), transparent 60%),' +
    'radial-gradient(900px 700px at 50% 108%, rgba(200, 255, 230, 0.08), transparent 60%),' +
    '#0b0a12',
};

export default function DaughterNames4Page() {
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

      <Header />

      <main className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        {/* Bento grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 auto-rows-[200px] md:auto-rows-[210px] gap-4 md:gap-5">
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
