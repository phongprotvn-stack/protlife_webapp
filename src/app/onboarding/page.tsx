'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { ChapterProgress } from '@/components/onboarding/chapter-progress';
import {
  WelcomeScreen,
  NodeAnimationScreen,
  AskNameScreen,
  AskDobScreen,
  AddContactScreen,
  AddEventScreen,
  MarkMemoryScreen,
  CelebrateScreen,
} from '@/components/onboarding/screens';

const TOTAL_STEPS = 8;

export default function OnboardingPage() {
  const router = useRouter();
  const set = useSettingsStore((s) => s.set);

  const [step, setStep] = useState(0);
  const [collected, setCollected] = useState<any>({});

  // Fold collected data from each screen into a single object.
  const capture = useCallback((data?: any) => {
    if (!data) return;
    setCollected((prev: any) => ({ ...prev, ...data }));
  }, []);

  const next = useCallback((data?: any) => {
    capture(data);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, [capture]);

  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  // Skip → mark onboarded and go to dashboard. Name/dob optional (kept if given).
  const skip = useCallback(() => {
    set({ onboarded: true, onboardedAt: new Date().toISOString() });
    router.replace('/dashboard');
  }, [set, router]);

  // Finish → mark onboarded, ensure name/dob stored, go to dashboard.
  const complete = useCallback(() => {
    const state = useSettingsStore.getState();
    set({
      onboarded: true,
      onboardedAt: new Date().toISOString(),
      displayName: (state.displayName || '').trim() || collected?.name || state.displayName,
      dob: state.dob || collected?.dob || '',
    });
    router.replace('/dashboard');
  }, [set, router, collected]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center overflow-hidden relative"
      style={{
        background: [
          'radial-gradient(1000px 500px at 50% -10%, rgba(230,0,45,.16), transparent 55%)',
          'radial-gradient(700px 400px at 85% 100%, rgba(124,58,237,.14), transparent 60%)',
          '#0A0A0F',
        ].join(','),
      }}
    >
      {/* Soft top glow */}
      <div className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(230,0,45,.18), transparent)' }} />

      {/* Top bar: skip + progress */}
      <div className="w-full max-w-[420px] md:max-w-[620px] px-6 md:px-10 pt-6 pb-2 relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-[9px] flex items-center justify-center text-[13px] md:text-[14px] font-black text-white"
              style={{ background: 'linear-gradient(135deg,#D60032,#FF4B3A)' }}>P</div>
            <span className="text-[13px] md:text-[14px] font-extrabold tracking-[-.2px]">PROT LIFE</span>
          </div>
          <button onClick={skip} className="flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-semibold transition-colors"
            style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)' }}>
            <X size={13} /> Bỏ qua
          </button>
        </div>
        <ChapterProgress step={step} total={TOTAL_STEPS} />
      </div>

      {/* Screen body */}
      <div className="flex-1 w-full max-w-[420px] md:max-w-[620px] px-8 md:px-10 pb-10 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -26 }}
            transition={{ duration: .35, ease: 'easeOut' }}
            className="w-full"
          >
            {step === 0 && <WelcomeScreen onNext={() => next()} onSkip={skip} />}
            {step === 1 && <NodeAnimationScreen onNext={() => next()} />}
            {step === 2 && <AskNameScreen onNext={next} />}
            {step === 3 && <AskDobScreen onNext={next} onBack={back} />}
            {step === 4 && <AddContactScreen onNext={next} onBack={back} />}
            {step === 5 && <AddEventScreen onNext={next} onBack={back} initial={collected} />}
            {step === 6 && <MarkMemoryScreen onNext={next} onBack={back} initial={collected} />}
            {step === 7 && <CelebrateScreen onComplete={complete} collected={collected} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}