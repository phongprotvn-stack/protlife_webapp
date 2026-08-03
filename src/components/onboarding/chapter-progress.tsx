'use client';

import { motion } from 'framer-motion';

const CHAPTERS = ['Quá khứ', 'Hiện tại', 'Tương lai'];
const CHAPTER_POS = [0, 50, 100]; // vị trí % của 3 mốc chương trên thanh

export function ChapterProgress({ step, total = 8 }: { step: number; total?: number }) {
  // step: 0-based index của màn hiện tại.
  // Chương I (Quá khứ): 0-3 · Chương II (Hiện tại): 4-5 · Chương III (Tương lai): 6-7.
  const chapter = step < 4 ? 0 : step < 6 ? 1 : 2;
  // Thanh fill trượt theo màu, nhịp đều theo màn: 0/8 → 8/8 (Welcome = 12.5%).
  const fillPos = Math.round(((step + 1) / total) * 100);

  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* Chapter labels — label đầu căn trái, giữa căn giữa, cuối căn phải
          (tránh bị cắt chữ Quá khứ / Tương lai ở mép màn hình mobile) */}
      <div className="relative h-4 mb-2">
        {CHAPTERS.map((c, i) => (
          <span
            key={c}
            className={`absolute text-[10px] font-semibold tracking-[.4px] uppercase whitespace-nowrap transition-colors ${
              i === 0 ? 'left-0' : i === 1 ? 'left-1/2 -translate-x-1/2' : 'right-0'
            }`}
            style={{ color: i <= chapter ? '#fff' : 'rgba(255,255,255,.4)' }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Line + mốc chương */}
      <div className="relative h-3">
        {/* line nền */}
        <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 rounded-full bg-white/10" />
        {/* line fill — trượt theo màu */}
        <motion.div
          className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#E6002D] via-[#FF4B3A] to-[#FF7A59]"
          animate={{ width: `${fillPos}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />

        {/* Mốc chương — đèn sáng khi chapter đạt tới (Chương II → Hiện tại, Chương III → Tương lai) */}
        {CHAPTER_POS.map((pos, i) => {
          const on = i <= chapter;
          return (
            <motion.span
              key={`c-${i}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full border-2"
              style={{
                left: `${pos}%`,
                background: on ? '#E6002D' : '#0A0A0F',
                borderColor: on ? '#E6002D' : 'rgba(255,255,255,.25)',
                boxShadow: on ? '0 0 0 3px rgba(230,0,45,.25)' : 'none',
              }}
              animate={{ scale: on && i === chapter ? 1.25 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            />
          );
        })}
      </div>
    </div>
  );
}
