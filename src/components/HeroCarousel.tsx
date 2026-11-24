import { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { HERO_SLIDES } from '../data/seedData';
import type { HeroSlide } from '../types';
import { ResilientImage } from './ResilientImage';

interface HeroCarouselProps {
  onSelectHeroAction: (slide: HeroSlide) => void;
}

export function HeroCarousel({ onSelectHeroAction }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[activeIndex];

  return (
    <section aria-label="Featured Campaigns" className="relative bg-[#111315] overflow-hidden">
      <div className="relative max-w-[1440px] mx-auto min-h-[440px] sm:min-h-[500px] lg:min-h-[540px] flex items-center">
        {/* Background Campaign Image */}
        <div className="absolute inset-0">
          <ResilientImage
            src={slide.image}
            alt={slide.headline}
            className="w-full h-full object-cover object-right sm:object-center transition-opacity duration-500"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(90deg,#111315_0%,#111315_36%,rgba(17,19,21,0.88)_58%,rgba(17,19,21,0.22)_100%)]"
            aria-hidden="true"
          />
        </div>

        {/* Left Foreground Typography */}
        <div className="relative z-10 w-full max-w-[1320px] mx-auto px-4 sm:px-6 pt-12 pb-20 sm:py-20">
          <div className="max-w-xl space-y-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#82E600]">
              {slide.kicker}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[52px] font-bold tracking-tight text-white leading-[1.08] [text-wrap:balance]">
              {slide.headline}
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-lg">
              {slide.subcopy}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onSelectHeroAction(slide)}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#82E600] hover:bg-[#73C900] text-[#111315] font-display text-sm font-bold rounded-md transition-colors whitespace-nowrap"
              >
                <span>{slide.ctaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-medium text-zinc-300 border-l border-zinc-700 pl-4">
                {slide.offerTag}
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="absolute bottom-4 left-0 right-0 z-10">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              <span className="font-mono text-xs font-semibold tabular-nums text-zinc-300 shrink-0">
                {String(activeIndex + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1.5">
                {HERO_SLIDES.map((s, idx) => {
                  const shortLabel =
                    idx === 0
                      ? 'Best Selling'
                      : idx === 1
                      ? 'New Stock'
                      : idx === 2
                      ? 'Audio'
                      : idx === 3
                      ? 'Power'
                      : idx === 4
                      ? 'Gaming'
                      : 'Creator';
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`View slide ${idx + 1}: ${s.kicker}`}
                      className={`group flex flex-col items-start text-left px-2 py-1 transition-colors shrink-0 ${
                        isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className={`block h-1 rounded-sm transition-all mb-1.5 ${
                          isActive ? 'w-12 bg-[#82E600]' : 'w-6 bg-white/30 group-hover:bg-white/55'
                        }`}
                      />
                      <span className="hidden sm:inline text-[11px] font-semibold tracking-wide whitespace-nowrap">
                        {shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                }
                aria-label="Previous campaign slide"
                className="p-2 rounded-md bg-black/50 hover:bg-black/75 text-white border border-white/15 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length)}
                aria-label="Next campaign slide"
                className="p-2 rounded-md bg-black/50 hover:bg-black/75 text-white border border-white/15 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
