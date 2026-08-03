import { useState } from "react";
import { Heart } from "lucide-react";
import type { NameEntry } from "./names-data";

type Props = {
  entry: NameEntry;
  index: number;
};

export function NameCard({ entry, index }: Props) {
  const [pinned, setPinned] = useState(false);
  const Icon = entry.icon;

  return (
    <article
      className={`card-pull fade-rise group relative flex flex-col justify-between overflow-hidden rounded-3xl glass ring-1 ring-white/10 ring-hairline inner-soft ${entry.span}`}
      style={{
        animationDelay: `${Math.min(index * 60, 900)}ms`,
        // dynamic accent glow tied to the name's color psychology
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.18), inset 0 0 28px rgba(255,255,255,0.04), 0 18px 40px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
      tabIndex={0}
      aria-label={`${entry.name} — ${entry.meaning}`}
    >
      {/* pastel gradient wash */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${entry.gradient}`}
        aria-hidden
      />
      {/* moving shimmer sweep */}
      <div className="shimmer-sweep pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      {/* accent corner glow */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100 opacity-60"
        style={{ background: entry.accent }}
        aria-hidden
      />

      {/* Pin / Heart */}
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        aria-pressed={pinned}
        aria-label={pinned ? "Unpin this name" : "Pin this name"}
        className="absolute top-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full glass ring-1 ring-white/20 pin-pop hover:scale-110 focus-visible:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Heart
          className={`h-4 w-4 transition-colors duration-300 ${
            pinned ? "fill-rose-400 text-rose-400" : "text-white/70"
          }`}
          strokeWidth={1.75}
        />
      </button>

      {/* Icon */}
      <div className="relative z-10 p-6">
        <div
          className="float-slow grid h-12 w-12 place-items-center rounded-2xl glass-strong ring-1 ring-white/15"
          style={{ boxShadow: `0 0 24px -6px ${entry.accent}` }}
        >
          <Icon
            className="h-6 w-6"
            strokeWidth={1.25}
            style={{ color: "rgba(255,255,255,0.92)" }}
          />
        </div>
      </div>

      {/* Name + meaning */}
      <div className="relative z-10 px-6 pb-6">
        <h3 className="font-display text-2xl md:text-[1.7rem] leading-tight text-white text-balance">
          {entry.name}
        </h3>
        <p className="mt-2 font-viet text-[13px] leading-relaxed text-white/65 text-balance">
          {entry.meaning}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full glass ring-1 ring-white/10 px-2.5 py-1 text-[11px] font-viet tracking-wide text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* hairline bottom accent */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-2/3 -translate-x-1/2"
        style={{ background: `linear-gradient(90deg, transparent, ${entry.accent}, transparent)` }}
        aria-hidden
      />
    </article>
  );
}
