import { Sparkles, BookHeart } from "lucide-react";

export function Header() {
  return (
    <header className="mx-auto max-w-6xl px-5 pt-16 md:pt-24">
      {/* eyebrow */}
      <div className="flex items-center justify-center gap-2 text-white/55">
        <span className="h-px w-10 bg-white/25" />
        <Sparkles className="h-4 w-4" strokeWidth={1.5} />
        <span className="font-viet text-[11px] uppercase tracking-[0.35em]">
          A list for the daughters not yet born
        </span>
        <Sparkles className="h-4 w-4" strokeWidth={1.5} />
        <span className="h-px w-10 bg-white/25" />
      </div>

      {/* title */}
      <h1 className="mt-6 text-center font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-white text-balance">
        Người tình kiếp trước
      </h1>
      <p className="mt-3 text-center font-display text-lg md:text-xl italic text-white/50">
        The lover from a previous life
      </p>

      {/* glassmorphic intro card */}
      <div className="relative mx-auto mt-10 max-w-3xl">
        <div
          className="glass-strong ring-1 ring-white/12 ring-hairline inner-soft rounded-3xl p-7 md:p-9 fade-rise"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-start gap-4">
            <div className="hidden sm:grid h-11 w-11 shrink-0 place-items-center rounded-2xl glass ring-1 ring-white/15">
              <BookHeart className="h-5 w-5 text-white/80" strokeWidth={1.4} />
            </div>
            <p className="font-viet text-[15px] md:text-base leading-relaxed text-white/75 text-balance">
              Some names arrive before the people who will carry them. This is a
              quiet collection of twenty-four names — kept like letters, waiting
              for the daughters who may one day wear them. Each holds a season, a
              stone, a light. Choose slowly. They are meant to be lived with.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
