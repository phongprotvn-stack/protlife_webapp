'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Sparkles, Heart,
  ArrowRight, ArrowLeft, Check,
  Globe, User, Target, Brain, Sprout, MessageSquare,
  Baby, Backpack, GraduationCap, Briefcase, Rocket,
  Camera, PartyPopper, Star, Balloon,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { calculateLifeStage, calculateAge } from '@/lib/utils';

/* ────────────────────────────────────────────────────────────────
   Shared bits
   ──────────────────────────────────────────────────────────────── */

function PrimaryButton({ children, onClick, disabled, icon = true }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; icon?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-[15px] md:py-[17px] rounded-[15px] border-none text-[15px] md:text-[16px] font-extrabold text-white cursor-pointer
        active:scale-[.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed
        flex items-center justify-center gap-2 md:max-w-[420px]"
      style={{
        background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 100%)',
        boxShadow: '0 14px 34px rgba(230,0,45,.35)',
      }}
    >
      {children}
      {icon && <ArrowRight size={17} strokeWidth={2.4} />}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-[420px] mx-auto py-[13px] rounded-[13px] border bg-transparent cursor-pointer transition-colors
        text-[13px] font-semibold active:scale-[.98]"
      style={{ borderColor: 'rgba(255,255,255,.14)', color: 'rgba(255,255,255,.55)' }}
    >
      {children}
    </button>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};
const fadeT = (d: number) => ({ ...fadeUp, transition: { duration: .45, delay: d } });

interface ScreenProps {
  onNext: (data?: any) => void;
  onSkip?: () => void;
  initial?: any;
}

/* ────────────────────────────────────────────────────────────────
   Màn 1 — 🌍 Chào mừng
   ──────────────────────────────────────────────────────────────── */
export function WelcomeScreen({ onNext, onSkip }: ScreenProps) {
  return (
    <div className="flex flex-col items-center text-center md:py-6">
      <motion.div {...fadeUp} className="relative mb-9 md:mb-10">
        {/* Emitting glow disk with Lucide Globe */}
        <div className="w-[130px] h-[130px] md:w-[150px] md:h-[150px] rounded-[38px] md:rounded-[44px] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#D60032 0%,#FF4B3A 100%)', boxShadow: '0 24px 60px rgba(255,0,45,.45)' }}>
          <Globe size={58} strokeWidth={1.3} className="text-white md:hidden" />
          <Globe size={68} strokeWidth={1.3} className="text-white hidden md:block" />
        </div>
        <motion.div
          className="absolute inset-0 -z-10 rounded-[38px] md:rounded-[44px]"
          style={{ background: 'radial-gradient(circle, rgba(255,61,74,.35) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.25, 1], opacity: [.7, .35, .7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.p {...fadeT(0.1)} className="text-[13px] font-bold tracking-[3px] uppercase mb-2" style={{ color: '#FF4B3A' }}>
        Chào mừng đến
      </motion.p>
      <motion.h1 {...fadeT(0.18)} className="text-[40px] md:text-[52px] font-black tracking-tight leading-none mb-4">
        PROT <span style={{ color: '#FF4B3A' }}>LIFE</span>
      </motion.h1>
      <motion.p {...fadeT(0.26)} className="text-[17px] md:text-[19px] leading-relaxed max-w-[300px] md:max-w-[420px] mb-2" style={{ color: 'rgba(255,255,255,.78)' }}>
        Bộ Não Thứ Hai
      </motion.p>
      <motion.p {...fadeT(0.32)} className="text-[19px] md:text-[21px] leading-snug max-w-[300px] md:max-w-[420px] mb-10" style={{ color: 'rgba(255,255,255,.5)' }}>
        cho cuộc đời <span className="font-bold text-white">bạn</span>.
      </motion.p>

      <motion.div {...fadeT(0.4)} className="w-full max-w-[300px] md:max-w-[420px] space-y-3">
        <PrimaryButton onClick={onNext}>Bắt đầu hành trình</PrimaryButton>
        {onSkip && <GhostButton onClick={onSkip}>Bỏ qua — vào app ngay</GhostButton>}
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Màn 2 — Animation Node: Con người → Sự kiện → Ký ức → Cuộc đời
   ──────────────────────────────────────────────────────────────── */
const NODES = [
  { key: 'people', label: 'Con người', pct: 12, Icon: User },
  { key: 'event', label: 'Sự kiện', pct: 37, Icon: Target },
  { key: 'memory', label: 'Ký ức', pct: 63, Icon: Brain },
  { key: 'life', label: 'Cuộc đời', pct: 88, Icon: Sprout },
];

export function NodeAnimationScreen({ onNext }: ScreenProps) {
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);

  // Sequence: reveal each node, then auto-next.
  useEffect(() => {
    if (active >= NODES.length) {
      const t = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive(a => a + 1), 900);
    return () => clearTimeout(t);
  }, [active]);

  // Auto-advance to next screen once the whole chain has played.
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => onNext(), 700);
      return () => clearTimeout(t);
    }
  }, [done, onNext]);

  return (
    <div className="flex flex-col items-center text-center h-full md:py-4">
      <motion.p {...fadeUp} className="text-[14px] md:text-[15px] font-bold tracking-[.5px] uppercase mb-6" style={{ color: 'rgba(255,255,255,.5)' }}>
        Mỗi mối quan hệ kể một câu chuyện
      </motion.p>

      <div className="relative w-full max-w-[300px] md:max-w-[560px] h-[260px] md:h-[300px] mx-auto">
        {/* Horizontal flow line — nối từ tâm node đầu (12%) đến tâm node cuối (88%) */}
        <div className="absolute top-1/2 left-[12%] right-[12%] h-[2px] -translate-y-1/2" style={{ background: 'linear-gradient(90deg,rgba(255,0,45,.6),transparent)' }} />

        <AnimatePresence>
          {NODES.slice(0, active).map((n) => (
            <div key={n.key} className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
              style={{ left: `${n.pct}%`, transform: 'translateX(-50%)' }}>
              {/* motion.div bên trong để framer-motion không ghi đè translateX(-50%) của wrapper */}
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, x: 18, scale: .85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              >
                <motion.div
                  className="w-[48px] h-[48px] md:w-[58px] md:h-[58px] rounded-[14px] md:rounded-[16px] flex items-center justify-center"
                  style={{ background: 'rgba(230,0,45,.14)', border: '1px solid rgba(230,0,45,.35)', boxShadow: '0 8px 24px rgba(230,0,45,.2)' }}
                  animate={{ boxShadow: ['0 8px 24px rgba(230,0,45,.2)', '0 8px 34px rgba(255,0,45,.4)'] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
                >
                  <n.Icon size={24} strokeWidth={1.6} className="text-white md:w-7 md:h-7" />
                </motion.div>
                <span className="text-[12px] md:text-[13px] font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,.6)' }}>{n.label}</span>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      <motion.p {...fadeT(0.2)} className="text-[15px] mt-2 font-medium max-w-[280px] md:max-w-[420px]" style={{ color: 'rgba(255,255,255,.45)' }}>
        {active <= 1 ? 'Những con người' : active === 2 ? 'Những sự kiện' : active === 3 ? 'Những ký ức' : '...kết nối nên cuộc đời bạn'}
      </motion.p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Màn 3 — Tên của bạn?
   ──────────────────────────────────────────────────────────────── */
export function AskNameScreen({ onNext }: ScreenProps) {
  const set = useSettingsStore((s) => s.set);
  const [name, setName] = useState('');
  const ready = name.trim().length > 0;

  const submit = () => {
    set({ displayName: name.trim() });
    onNext({ name: name.trim() });
  };

  return (
    <div className="flex flex-col">
      <motion.h2 {...fadeUp} className="text-[15px] font-bold tracking-[.5px] uppercase mb-2" style={{ color: '#FF4B3A' }}>
        CHƯƠNG I · QUÁ KHỨ
      </motion.h2>
      <motion.h2 {...fadeUp} className="text-[26px] md:text-[30px] font-extrabold mb-1">Chúng mình bắt đầu với</motion.h2>
      <motion.div {...fadeT(0.08)} className="flex items-center justify-center gap-2 text-[22px] md:text-[24px] mb-9" style={{ color: '#FF4B3A' }}>
        <MessageSquare size={22} strokeWidth={1.8} /> Tên của bạn?
      </motion.div>

      <motion.div {...fadeT(0.16)} className="mb-10">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && ready) submit(); }}
          placeholder="Nhập tên của bạn..."
          className="w-full text-center text-[26px] font-bold bg-transparent border-none outline-none placeholder:text-white/20 text-white
            border-b-[2px] pb-3 tracking-wide"
          style={{ borderColor: ready ? '#E6002D' : 'rgba(255,255,255,.15)' }}
        />
      </motion.div>

      <motion.div {...fadeT(0.24)} className="w-full max-w-[300px] md:max-w-[420px] mx-auto mt-auto">
        <PrimaryButton onClick={submit} disabled={!ready}>Tiếp tục</PrimaryButton>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Màn 4 — Ngày sinh? → AI tự tạo Life Timeline
   ──────────────────────────────────────────────────────────────── */
export function AskDobScreen({ onNext, onBack }: ScreenProps & { onBack: () => void }) {
  const set = useSettingsStore((s) => s.set);
  const [dob, setDob] = useState('');
  const [input, setInput] = useState('');

  // Build dd/mm/yyyy as user types.
  const handleInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let out = digits;
    if (digits.length > 4) {
      out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setInput(out);
    setDob(out);
  };

  const validDob = useMemo(() => {
    const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    if (isNaN(d.getTime())) return null;
    // Local format — KHÔNG dùng toISOString (lệch -1 ngày ở GMT+7)
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }, [dob]);
  const ready = !!validDob;

  const age = validDob ? calculateAge(validDob) : 0;
  const stage = validDob ? calculateLifeStage(validDob, new Date().toISOString().slice(0, 10)) : '';

  const previewLife = useMemo(() => {
    if (!validDob || age <= 0) return null;
    const STAGE_ORDER = ['Infancy', 'Childhood', 'Secondary School', 'High School', 'University', 'Early Career', 'Mid Career', 'Mature Career', 'Retirement'];
    const chapters = [
      { Icon: Baby, label: 'Chào đời' },
      { Icon: Backpack, label: 'Đi học' },
      { Icon: GraduationCap, label: 'Đại học' },
      { Icon: Briefcase, label: 'Sự nghiệp' },
      { Icon: Rocket, label: 'Hiện tại' },
    ];
    const currentIdx = STAGE_ORDER.indexOf(stage);
    // Map chapters to STAGE_ORDER index thresholds:
    return chapters.map((c, i) => {
      const done = i === 0 ? currentIdx >= 1
        : i === 1 ? currentIdx >= 3
        : i === 2 ? currentIdx >= 4
        : i === 3 ? currentIdx >= 5
        : currentIdx >= 5;
      return { Icon: c.Icon, label: c.label, done };
    });
  }, [validDob, stage]);

  const submit = () => {
    if (validDob) {
      set({ dob: validDob });
      onNext({ dob: validDob });
    }
  };

  return (
    <div className="flex flex-col">
      <motion.h2 {...fadeUp} className="text-[15px] font-bold tracking-[.5px] uppercase mb-2" style={{ color: '#FF4B3A' }}>
        Cuốn tự truyện cần trang đầu tiên
      </motion.h2>
      <motion.div {...fadeUp} className="flex items-center justify-center gap-2 text-[26px] md:text-[30px] font-extrabold leading-tight mb-9">
        <Calendar size={26} strokeWidth={1.7} style={{ color: '#FF4B3A' }} /> Ngày&nbsp;sinh&nbsp;của&nbsp;bạn?
      </motion.div>

      <motion.div {...fadeT(0.12)} className="max-w-[380px] mx-auto w-full mb-8">
        <input
          autoFocus
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { if (ready) submit(); } }}
          inputMode="numeric"
          type="text"
          placeholder="DD/MM/YYYY"
          className="w-full text-center text-[24px] md:text-[28px] font-bold py-4 md:py-5 rounded-[16px] bg-white/5 border outline-none tracking-[1px] transition-colors"
          style={{ borderColor: ready ? '#FF4B3A' : 'rgba(255,255,255,.12)' }}
        />
        {ready && (
          <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center text-[13px] mt-2 font-semibold" style={{ color: '#FFB84A' }}>
            {age} tuổi · Giai đoạn hiện tại: <span className="text-white">{stage}</span>
          </motion.p>
        )}
      </motion.div>

      {/* Life timeline preview */}
      <AnimatePresence>
        {previewLife && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mb-9 overflow-hidden">
            <div className="max-w-[400px] mx-auto rounded-[18px] p-4" style={{ background: 'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles size={13} style={{color:'#FF4B3A'}}/>
                <span className="text-[11px] font-semibold tracking-[.3px] uppercase" style={{color:'rgba(255,255,255,.5)'}}>✦ Life Timeline của bạn</span>
              </div>
              <div className="relative pl-5 space-y-2.5">
                {previewLife.map((s, i) => (
                  <div key={i} className="relative">
                    <span className={`absolute -left-5 top-0.5 w-2 h-2 rounded-full ${s.done?'bg-[#FF4B3A]':'bg-white/12'}`} />
                    <div className={`flex items-center justify-between ${s.done?'':'opacity-45'}`}>
                      <span className="text-[13px] font-semibold flex items-center gap-1.5"><s.Icon size={15} strokeWidth={1.6} className="text-white/80" /> {s.label}</span>
                      {i === previewLife.length-1 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{background:'rgba(255,75,58,.15)', color:'#FF4B3A'}}>Bây giờ</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-[300px] md:max-w-[420px] mx-auto space-y-3 mt-auto">
        <PrimaryButton onClick={submit} disabled={!ready}>Tạo Life Timeline</PrimaryButton>
        {onBack && <GhostButton onClick={onBack}><ArrowLeft size={14} className="inline -mt-0.5 mr-1"/> Quay lại</GhostButton>}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Màn 5 — Thêm người đầu tiên (UI demo)
   ──────────────────────────────────────────────────────────────── */
const RELATIONS = [
  { id: 'Family', label: 'Gia đình', color: '#E6002D' },
  { id: 'Partner', label: 'Người yêu', color: '#FF4B3A' },
  { id: 'Friend', label: 'Bạn bè', color: '#007AFF' },
  { id: 'Colleague', label: 'Đồng nghiệp', color: '#FF9500' },
];

export function AddContactScreen({ onNext, onBack }: ScreenProps & { onBack: () => void }) {
  const [name, setName] = useState('');
  const [rel, setRel] = useState('Friend');
  const [added, setAdded] = useState(false);
  const ready = name.trim().length > 0;

  const submit = () => { setAdded(true); setTimeout(() => onNext({ name, rel }), 900); };

  return (
    <div className="flex flex-col">
      <motion.h2 {...fadeUp} className="text-[15px] font-bold tracking-[.5px] uppercase mb-2" style={{ color: '#FF4B3A' }}>
        CHƯƠNG II · HIỆN TẠI
      </motion.h2>
      <motion.p {...fadeUp} className="text-[22px] font-extrabold leading-tight mb-8">Cuộc sống gồm những mối quan hệ. Ai quan trọng với bạn?</motion.p>

      <motion.div {...fadeT(0.1)} className="mb-6">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tên người đầu tiên... (chỉ demo)"
          className="w-full text-[17px] font-semibold rounded-[13px] px-4 py-3.5 outline-none"
          style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.12)' }}
        />
      </motion.div>

      <motion.div {...fadeT(0.16)} className="mb-2">
        <div className="flex flex-wrap gap-2">
          {RELATIONS.map(r => (
            <button key={r.id} onClick={()=>setRel(r.id)}
              className="px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
              style={rel===r.id ? { background: r.color, color:'#fff' } : { background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.6)' }}>
              {r.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeT(0.22)} className="mt-auto w-full max-w-[300px] md:max-w-[420px] mx-auto space-y-3">
        {added ? (
          <motion.div initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} className="flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FF4B3A]"><Check size={22} strokeWidth={3}/></div>
            <p className="text-[13px] font-bold" style={{color:'#FF4B3A'}}>Đã thêm {name}</p>
          </motion.div>
        ) : (
          <PrimaryButton onClick={submit} disabled={!ready}>Thêm người này</PrimaryButton>
        )}
        <GhostButton onClick={onBack}><ArrowLeft size={14} className="inline mr-1"/> Quay lại</GhostButton>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Màn 6 — Thêm sự kiện đầu tiên (demo, gắn contact)
   ──────────────────────────────────────────────────────────────── */
export function AddEventScreen({ onNext, onBack, initial }: ScreenProps & { onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [added, setAdded] = useState(false);
  const contactName = initial?.name || '';
  const ready = title.trim().length > 0;
  const submit = () => { setAdded(true); setTimeout(()=>onNext({title}), 900); };

  return (
    <div className="flex flex-col">
      <motion.p {...fadeUp} className="text-[15px] font-bold tracking-[.5px] uppercase mb-2" style={{color:'#FF4B3A'}}>CHƯƠNG II · HIỆN TẠI</motion.p>
      <motion.div {...fadeUp} className="text-[20px] font-extrabold leading-tight mb-2">Mọi mối quan hệ tốt đẹp đều nhờ những <span style={{color:'#FF4B3A'}}>kỷ niệm</span>.<br/>Sự kiện đầu tiên của bạn?</motion.div>
      {contactName && <motion.p {...fadeT(0.06)} className="text-[12px] mb-7" style={{color:'rgba(255,255,255,.55)'}}>Gắn với <span className="text-white font-bold">{contactName}</span></motion.p>}

      <motion.div {...fadeT(0.12)} className="mb-3">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="VD: Cà phê lần đầu gặp mặt..."
          className="w-full text-[16px] font-semibold rounded-[13px] px-4 py-3.5 outline-none"
          style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.12)' }}
        />
      </motion.div>
      <motion.div {...fadeT(0.12)} className="mb-4 flex items-center gap-1.5 text-[12px]" style={{color:'rgba(255,255,255,.4)'}}>
        <Calendar size={13}/> Hôm nay · {new Date().toLocaleDateString('vi-VN',{day:'numeric',month:'long',year:'numeric'})}
      </motion.div>

      <div className="w-full max-w-[300px] md:max-w-[420px] mx-auto space-y-3 mt-auto">
        {added ? (
          <motion.div initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} className="flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#FF4800]"><Check size={22} strokeWidth={3}/></div>
            <p className="text-[13px] font-bold" style={{color:'#FF4B3A'}}>Đã thêm sự kiện</p>
          </motion.div>
        ) : (
          <PrimaryButton onClick={submit} disabled={!ready}>Lưu lại kỷ niệm</PrimaryButton>
        )}
        <GhostButton onClick={onBack}><ArrowLeft size={14} className="inline mr-1"/> Quay lại</GhostButton>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Màn 7 — Đánh dấu ký ức? Memory sinh từ Event
   ──────────────────────────────────────────────────────────────── */
export function MarkMemoryScreen({ onNext, onBack, initial }: ScreenProps & { onBack: () => void }) {
  const [mark, setMark] = useState<boolean | null>(null);

  return (
    <div className="flex flex-col">
      <motion.p {...fadeUp} className="text-[15px] font-bold tracking-[.5px] uppercase mb-2" style={{color:'#FF4B3A'}}>CHƯƠNG III · TƯƠNG LAI</motion.p>
      <motion.div {...fadeUp} className="text-[21px] font-extrabold leading-tight mb-6">
        {initial?.title ? (
          <>Lưu giữ <span style={{color:'#FF4B3A'}}>mối kỷ niệm</span> này làm <span style={{color:'#FF4B3A'}}>Ký ức</span>?</>
        ) : (
          <>Đánh dấu đây là <span style={{color:'#FF4B3A'}}>Ký ức</span>?</>
        )}
      </motion.div>

      <motion.div {...fadeT(0.1)} className="mb-8 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center" style={{background:'rgba(124,58,237,.16)',border:'1px solid rgba(124,58,237,.4)'}}>
          {initial?.title
            ? <Brain size={30} strokeWidth={1.5} className="text-violet-300" />
            : <Camera size={30} strokeWidth={1.5} className="text-violet-300" />}
        </div>
        <p className="text-[13px] max-w-[260px] text-center" style={{color:'rgba(255,255,255,.55)'}}>
          <i>Ký ức sinh ra từ sự kiện</i> — mỗi sự kiện gắn với từng con người.
        </p>
      </motion.div>

      <div className="w-full max-w-[300px] md:max-w-[420px] mx-auto space-y-3 mt-auto">
        <PrimaryButton onClick={()=>{setMark(true); setTimeout(()=>onNext({marked:true}),700);}} icon={false}><Heart size={16} fill="currentColor" strokeWidth={2}/> Có, đó là Ký ức</PrimaryButton>
        <GhostButton onClick={()=>onNext({marked:false})}>Không, chỉ là sự kiện</GhostButton>
        <GhostButton onClick={onBack}><ArrowLeft size={14} className="inline mr-1"/> Quay lại</GhostButton>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Màn 8 — 🎉 Chúc mừng
   ──────────────────────────────────────────────────────────────── */
export function CelebrateScreen({ onComplete, collected }: { onComplete: () => void; collected: any }) {
  const items = [
    { n: collected?.name ? 1 : 0, label: 'người bạn'},
    { n: collected?.title ? 1 : 0, label: 'sự kiện'},
    { n: collected?.marked === true ? 1 : 0, label: 'ký ức'},
  ].filter(i => i.n > 0);
  const total = items.length;

  const CONFETTI = [Sparkles, PartyPopper, Heart, Star, Balloon, Star];

  return (
    <div className="flex flex-col items-center text-center md:py-4">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:180,damping:12}} className="relative mb-6">
        <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-[40px] flex items-center justify-center" style={{background:'linear-gradient(135deg,#D60032,#FF4B3A)',boxShadow:'0 24px 60px rgba(255,0,45,.45)'}}>
          <PartyPopper size={54} strokeWidth={1.4} className="text-white" />
        </div>
        {CONFETTI.map((Icon, i) => (
          <motion.span key={i} className="absolute text-[18px]" style={{left:`${-10+i*22}px`,top:i%2?'-12px':'auto'}}
            initial={{opacity:0,y:0}} animate={{opacity:[0,1,0],y:-28}} transition={{duration:1.4,delay:i*.15}}>
            <Icon size={18} strokeWidth={1.6} className="text-white/90" />
          </motion.span>
        ))}
      </motion.div>

      <motion.h1 {...fadeUp} className="text-[30px] md:text-[36px] font-black tracking-tighter mb-2">Chúc mừng!</motion.h1>
      <motion.p {...fadeUp} className="text-[18px] font-semibold mb-1">PROT LIFE đã sẵn sàng.</motion.p>
      <motion.p {...fadeUp} className="text-[14px] mb-8" style={{color:'rgba(255,255,255,.5)'}}>
        Tự truyện số của bạn đã bắt đầu.
      </motion.p>

      {total > 0 && (
        <motion.div {...fadeUp} className="rounded-[14px] px-5 py-3 mb-8 flex items-center gap-3" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}>
          <Heart size={16} style={{color:'#FF4B3A'}}/>
          <span className="text-[13px] font-semibold" style={{color:'rgba(255,255,255,.7)'}}>
            Bạn đã lưu: {items.map(i=>`${i.n} ${i.label}`).join(' · ')}
          </span>
        </motion.div>
      )}

      <div className="w-full max-w-[300px] md:max-w-[420px]">
        <PrimaryButton onClick={onComplete} icon={false}>Vào Dashboard <ArrowRight size={17} strokeWidth={2.4} className="ml-1" /></PrimaryButton>
        <p className="text-[11px] mt-3" style={{color:'rgba(255,255,255,.3)'}}>Bạn có thể bổ sung chi tiết bất cứ lúc nào</p>
      </div>
    </div>
  );
}