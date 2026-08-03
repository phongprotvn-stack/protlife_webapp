'use client';

import { motion } from 'framer-motion';

const CHAPTERS = ['Quá khứ', 'Hiện tại', 'Tương lai'];
const CHAPTER_POS = [0, 50, 100]; // vị trí % của 3 mốc chương trên thanh

// Vị trí % của từng step trên thanh (màn 1-7; màn 0 = Welcome chưa có step).
// Chương I (Quá khứ → Hiện tại): 3 step đều nhau trong (0, 50).
// Chương II + III (Hiện tại → Tương lai): 4 step đều nhau trong (50, 100).
const STEP_POS: Record<number, number> = {
  1: 12.5, // Màn "Mỗi mối quan hệ kể một câu chuyện"
  2: 25,   // Màn "CHƯƠNG I · QUÁ KHỨ"
  3: 37.5, // Màn "Cuốn tự truyện cần trang đầu tiên"
  4: 60,   // Màn "CHƯƠNG II · HIỆN TẠI" (thêm người)
  5: 70,   // Màn "CHƯƠNG II · HIỆN TẠI" (thêm sự kiện)
  6: 80,   // Màn "CHƯƠNG III · TƯƠNG LAI" (đánh dấu ký ức)
  7: 90,   // Màn Chúc mừng
};

export function ChapterProgress({ step }: { step: number; total?: number }) {
  // step: 0-based index của màn hiện tại.
  // Chương I (Quá khứ): 0-3 · Chương II (Hiện tại): 4-5 · Chương III (Tương lai): 6-7.
  const chapter = step < 4 ? 0 : step < 6 ? 1 : 2;
  // Thanh fill chạy tới vị trí step hiện tại (Welcome → 0, chưa fill).
  const fillPos = step === 0 ? 0 : STEP_POS[step] ?? 100;

  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* Chapter labels — khớp vị trí mốc 0% / 50% / 100% */}
      <div className="relative h-4 mb-2">
        {CHAPTERS.map((c, i) => (
          <span
            key={c}
            className="absolute -translate-x-1/2 text-[10px] font-semibold tracking-[.4px] uppercase whitespace-nowrap transition-colors"
            style={{ left: `${CHAPTER_POS[i]}%`, color: i <= chapter ? '#fff' : 'rgba(255,255,255,.4)' }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Line + mốc chương + step */}
      <div className="relative h-3">
        {/* line nền */}
        <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 rounded-full bg-white/10" />
        {/* line fill */}
        <motion.div
          className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#E6002D] via-[#FF4B3A] to-[#FF7A59]"
          animate={{ width: `${fillPos}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />

        {/* Steps — chấm nhỏ, sáng khi đã đạt tới */}
        {Object.entries(STEP_POS).map(([s, pos]) => {
          const idx = +s;
          const on = idx <= step;
          return (
            <motion.span
              key={`s-${s}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full"
              style={{ left: `${pos}%`, background: on ? '#E6002D' : 'rgba(255,255,255,.15)' }}
              animate={{ scale: on && idx === step ? 1.4 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            />
          );
        })}

        {/* Mốc chương — đèn lớn, sáng khi chapter đã đạt tới */}
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
