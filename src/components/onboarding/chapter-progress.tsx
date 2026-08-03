'use client';

import { motion } from 'framer-motion';

const CHAPTERS = ['Quá khứ', 'Hiện tại', 'Tương lai'];

export function ChapterProgress({ step, total }: { step: number; total: number }) {
  // step: 0-based index của màn hiện tại. Mỗi chương = 3 màn (0-2, 3-5, 6-7#).
  const chapter = step < 3 ? 0 : step < 6 ? 1 : 2;
  const percent = Math.round(((step + 1) / total) * 100);

  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* Chapter labels */}
      <div className="flex items-center justify-between mb-2">
        {CHAPTERS.map((c, i) => (
          <div key={c} className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                i < chapter
                  ? 'bg-[#E6002D]'
                  : i === chapter
                    ? 'bg-[#E6002D] ring-2 ring-[#E6002D]/30'
                    : 'bg-white/15'
              }`}
            />
            <span
              className={`text-[10px] font-semibold tracking-[.4px] uppercase ${
                i === chapter ? 'text-white' : 'text-white/40'
              }`}
            >
              {c}
            </span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#E6002D] via-[#FF4B3A] to-[#FF7A59]"
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}