import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { CUSTOMER_VIDEOS, JOGAD_LOGO } from '../data/seedData';
import type { Product, ProductVariant } from '../types';
import { discountPercent, formatNaira } from '../utils/format';
import { ResilientImage } from './ResilientImage';

interface CustomerVideoGalleryProps {
  products: Product[];
  onLearnMore: (product: Product, variant: ProductVariant) => void;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
}

const FOCAL_POSITIONS: Record<string, string> = {};

export function CustomerVideoGallery({
  products,
  onLearnMore,
  onAddToCart,
}: CustomerVideoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justAddedSku, setJustAddedSku] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const total = CUSTOMER_VIDEOS.length;
  const activeVideo = CUSTOMER_VIDEOS[activeIndex];

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
    }
    return map;
  }, [products]);

  const activeProduct = productById.get(activeVideo.productId) || products[0];

  const selectIndex = (nextIdx: number) => {
    const normalized = ((nextIdx % total) + total) % total;
    setActiveIndex(normalized);
    setIsPlayingInline(false);
    setIsPaused(false);
    setElapsedSec(0);
  };

  const handlePlayCenter = () => {
    setIsPlayingInline(true);
    setIsPaused(false);
  };

  // Playback progress timer when playing inline (custom canvas reels)
  useEffect(() => {
    if (!isPlayingInline || isPaused || activeVideo.youtubeId) return;
    const timer = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 0.1;
        return next >= activeVideo.durationSeconds ? 0 : next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [isPlayingInline, isPaused, activeVideo.durationSeconds, activeVideo.youtubeId]);

  // Render smooth Ken Burns motion onto canvas stream feeding <video>
  useEffect(() => {
    if (!isPlayingInline || activeVideo.youtubeId) return;
    const canvas = canvasRef.current;
    const videoEl = videoRef.current;
    if (!canvas || !videoEl) return;

    let cancelled = false;
    let rafId = 0;
    let stream: MediaStream | null = null;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeVideo.posterImage;

    const startTime = performance.now();

    const drawFrame = (now: number) => {
      if (cancelled || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = '#111315';
      ctx.fillRect(0, 0, w, h);

      if (img.complete && img.naturalWidth > 0) {
        const t = ((now - startTime) / 1000) % activeVideo.durationSeconds;
        const progress = t / activeVideo.durationSeconds;
        const zoom = !isPaused ? 1.0 + 0.08 * Math.sin(progress * Math.PI) : 1.03;
        const panX = !isPaused ? Math.sin(progress * Math.PI * 2) * 14 : 0;
        const panY = !isPaused ? Math.cos(progress * Math.PI) * 10 : 0;

        // Focus vertically near the subject center (roughly 48% down portrait frame)
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = w / h;
        let drawW = w;
        let drawH = h;
        if (imgAspect > canvasAspect) {
          drawH = h * zoom;
          drawW = drawH * imgAspect;
        } else {
          drawW = w * zoom;
          drawH = drawW / imgAspect;
        }
        const dx = (w - drawW) / 2 + panX;
        const dy = (h - drawH) * 0.45 + panY;
        ctx.drawImage(img, dx, dy, drawW, drawH);

        const bottomGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
        bottomGrad.addColorStop(0, 'rgba(17,19,21,0)');
        bottomGrad.addColorStop(1, 'rgba(17,19,21,0.88)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
      }

      rafId = window.requestAnimationFrame(drawFrame);
    };

    rafId = window.requestAnimationFrame(drawFrame);

    try {
      const captureFn = (
        canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }
      ).captureStream;
      if (typeof captureFn === 'function') {
        stream = captureFn.call(canvas, 30);
        videoEl.srcObject = stream;
        videoEl.muted = isMuted;
        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }
    } catch {
      // Fallback to CSS animated poster image
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [isPlayingInline, isPaused, isMuted, activeVideo]);

  const currentCaption = useMemo(() => {
    const match = activeVideo.captions.find(
      (c) => elapsedSec >= c.startSec && elapsedSec <= c.endSec
    );
    return match ? match.text : activeVideo.captions[0]?.text || '';
  }, [activeVideo, elapsedSec]);

  const progressPct = Math.min(
    100,
    Math.max(0, (elapsedSec / activeVideo.durationSeconds) * 100)
  );

  const handleShareVideo = (id: string) => {
    const shareUrl = `${window.location.origin}/#customer-video-gallery`;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <section
      id="customer-video-gallery"
      className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-12 pb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-4 mb-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#4D8A00]">
            Verified Customers · {total} Video Stories
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#111315] mt-0.5">
            Jogad in Real Life: Customer Video Gallery
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Flip through {total} featured Jogad showcase and customer films across Nigeria.
          </p>
        </div>

        <span className="font-mono text-xs font-medium tabular-nums text-zinc-500 shrink-0">
          {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} Customer Films
        </span>
      </div>

      {/* 3D Stacked Coverflow Carousel Stage */}
      <div className="relative mx-auto max-w-[1160px] h-[340px] sm:h-[420px] md:h-[470px] flex items-center justify-center overflow-hidden select-none">
        {CUSTOMER_VIDEOS.map((video, idx) => {
          // Circular relative offset in [-2, -1, 0, +1, +2]
          let offset = (idx - activeIndex + total) % total;
          if (offset > Math.floor(total / 2)) {
            offset -= total;
          }

          const isCenter = offset === 0;
          const absOffset = Math.abs(offset);

          let translatePct = '0%';
          let scaleVal = 1;
          let zClass = 'z-30';
          let visualFilter = 'blur-0 opacity-100';

          if (offset === -1) {
            translatePct = '-42%';
            scaleVal = 0.84;
            zClass = 'z-20';
            visualFilter = 'blur-[2px] opacity-90 hover:opacity-100';
          } else if (offset === 1) {
            translatePct = '42%';
            scaleVal = 0.84;
            zClass = 'z-20';
            visualFilter = 'blur-[2px] opacity-90 hover:opacity-100';
          } else if (offset === -2) {
            translatePct = '-72%';
            scaleVal = 0.70;
            zClass = 'z-10 hidden sm:block';
            visualFilter = 'blur-[4px] opacity-75 hover:opacity-95';
          } else if (offset === 2) {
            translatePct = '72%';
            scaleVal = 0.70;
            zClass = 'z-10 hidden sm:block';
            visualFilter = 'blur-[4px] opacity-75 hover:opacity-95';
          } else if (absOffset > 2) {
            translatePct = '0%';
            scaleVal = 0.55;
            zClass = 'z-0 pointer-events-none';
            visualFilter = 'opacity-0';
          }

          const focalClass = FOCAL_POSITIONS[video.id] || 'object-center';
          const linkedProduct = productById.get(video.productId);

          return (
            <div
              key={video.id}
              style={{
                transform: `translateX(${translatePct}) scale(${scaleVal})`,
                transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease, filter 280ms ease',
              }}
              onClick={() => {
                if (!isCenter) selectIndex(idx);
              }}
              className={`absolute w-[88%] sm:w-[66%] md:w-[58%] max-w-[660px] bg-white rounded-xl overflow-hidden border border-zinc-200/80 ${
                isCenter
                  ? 'shadow-[0_24px_60px_-14px_rgba(0,0,0,0.28)]'
                  : 'shadow-lg cursor-pointer'
              } ${zClass} ${visualFilter}`}
              aria-hidden={absOffset > 2}
            >
              {/* Video Viewport */}
              <div className="relative aspect-[16/10] bg-[#111315] overflow-hidden">
                {isCenter && isPlayingInline && video.youtubeId ? (
                  <div className="relative w-full h-full bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlayingInline(false);
                      }}
                      aria-label="Close YouTube player"
                      className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : isCenter && isPlayingInline ? (
                  <>
                    {/* Fallback animated backdrop behind canvas video */}
                    <ResilientImage
                      src={video.posterImage}
                      alt={video.title}
                      className={`absolute inset-0 w-full h-full object-cover ${focalClass} transition-transform duration-700 ${
                        !isPaused ? 'scale-105' : 'scale-100'
                      }`}
                    />
                    <canvas
                      ref={canvasRef}
                      width={960}
                      height={600}
                      className="hidden"
                      aria-hidden="true"
                    />
                    <video
                      ref={videoRef}
                      playsInline
                      muted={isMuted}
                      autoPlay
                      className="relative z-10 w-full h-full object-cover"
                    />

                    {/* Top Playing Controls */}
                    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow">
                          <img
                            src={JOGAD_LOGO}
                            alt="Jogad"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </span>
                        <span className="text-xs font-semibold text-white truncate drop-shadow">
                          {video.customerName} · {video.city}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted((prev) => !prev);
                          }}
                          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/15 transition-colors"
                        >
                          {isMuted ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPlayingInline(false);
                            setIsPaused(false);
                            setElapsedSec(0);
                          }}
                          aria-label="Stop video playback"
                          className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white border border-white/15 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Captions & Timeline Scrubber */}
                    <div className="absolute bottom-0 inset-x-0 z-20 p-3.5 bg-gradient-to-t from-black/95 via-black/75 to-transparent space-y-2.5">
                      <div className="bg-black/60 border border-white/15 rounded px-3 py-1.5 text-xs text-white leading-snug">
                        {currentCaption}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsPaused((prev) => !prev);
                          }}
                          aria-label={isPaused ? 'Resume video' : 'Pause video'}
                          className="p-1.5 rounded-md bg-[#82E600] text-[#111315] hover:bg-[#73C900] transition-colors shrink-0"
                        >
                          {isPaused ? (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Pause className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          aria-label="Seek timeline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const ratio = Math.min(
                              1,
                              Math.max(0, (e.clientX - rect.left) / rect.width)
                            );
                            setElapsedSec(ratio * video.durationSeconds);
                          }}
                          className="flex-1 h-2 bg-white/25 rounded-sm overflow-hidden cursor-pointer"
                        >
                          <div
                            className="h-full bg-[#82E600] transition-all duration-100"
                            style={{ width: `${progressPct}%` }}
                          />
                        </button>

                        <span className="font-mono text-[11px] tabular-nums text-zinc-200 shrink-0">
                          0:{String(Math.floor(elapsedSec)).padStart(2, '0')} / {video.duration}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Poster Thumbnail */}
                    <ResilientImage
                      src={video.posterImage}
                      alt={`${video.title} — ${video.customerName}`}
                      className={`w-full h-full object-cover ${focalClass}`}
                    />

                    {/* Subtle Top & Bottom Scrims */}
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/70"
                      aria-hidden="true"
                    />

                    {/* Top Left Avatar + Title + Subtitle (matching reference screenshot) */}
                    <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-full bg-white p-1 flex items-center justify-center shrink-0 shadow">
                        <img
                          src={JOGAD_LOGO}
                          alt="Jogad"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-white leading-tight truncate drop-shadow">
                          {video.title} | Jogad Film
                        </div>
                        <div className="text-[11px] text-zinc-200 truncate">
                          {video.customerName} · {video.city}
                        </div>
                      </div>
                    </div>

                    {/* Center Red Rounded-Rect Video Play Button on Active Card */}
                    {isCenter && (
                      <button
                        type="button"
                        onClick={handlePlayCenter}
                        aria-label={`Play customer video: ${video.title}`}
                        className="absolute inset-0 z-10 flex items-center justify-center group cursor-pointer"
                      >
                        <span className="w-16 h-11 rounded-xl bg-[#FF0000] group-hover:bg-[#DC0000] text-white shadow-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </span>
                      </button>
                    )}

                    {/* Bottom Left Quick Icons + Bottom Right Action Tag on Active Card */}
                    {isCenter && (
                      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareVideo(video.id);
                            }}
                            aria-label="Copy link to customer video"
                            title="Copy video link"
                            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors"
                          >
                            {copiedId === video.id ? (
                              <Check className="w-3.5 h-3.5 text-[#82E600]" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {linkedProduct && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLearnMore(linkedProduct, linkedProduct.variants[0]);
                              }}
                              aria-label={`Inspect ${linkedProduct.name}`}
                              title={`View ${linkedProduct.name}`}
                              className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {video.youtubeUrl ? (
                          <a
                            href={video.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/75 hover:bg-black/95 text-white text-xs font-semibold transition-colors"
                          >
                            <span>Watch on</span>
                            <span className="font-bold tracking-tight text-white">YouTube</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayCenter();
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/70 hover:bg-black/90 text-white text-xs font-semibold transition-colors"
                          >
                            <span>Watch Customer Reel</span>
                            <span className="font-mono text-[11px] tabular-nums text-[#82E600]">
                              {video.duration}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Clean White Footer Caption Bar (matching reference card footer) */}
              <div className="bg-white px-4 sm:px-6 py-3.5 text-center border-t border-zinc-100">
                <div className="font-display font-bold text-xs sm:text-sm text-[#111315] truncate">
                  {video.title} | Jogad Customer Film
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating Left & Right Circular Navigation Arrows */}
        <button
          type="button"
          onClick={() => selectIndex(activeIndex - 1)}
          aria-label="Previous customer video"
          className="absolute left-2 sm:left-[12%] md:left-[17%] z-40 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => selectIndex(activeIndex + 1)}
          aria-label="Next customer video"
          className="absolute right-2 sm:right-[12%] md:right-[17%] z-40 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Carousel Indicators + Featured Product Purchase Strip */}
      <div className="max-w-[660px] mx-auto mt-4 space-y-4">
        {/* 5 Slide Switchers */}
        <div className="flex items-center justify-center gap-2">
          {CUSTOMER_VIDEOS.map((vid, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={vid.id}
                type="button"
                onClick={() => selectIndex(idx)}
                aria-label={`Select customer video ${idx + 1}: ${vid.customerName}`}
                className={`h-1.5 rounded-sm transition-all ${
                  active ? 'w-10 bg-[#111315]' : 'w-4 bg-zinc-300 hover:bg-zinc-400'
                }`}
              />
            );
          })}
        </div>

        {/* Shop the Featured Gadget in Current Video */}
        {activeProduct && (
          <div className="bg-white border border-zinc-200 rounded-md p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded bg-[#F5F5F4] border border-zinc-100 overflow-hidden shrink-0">
                <ResilientImage
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Featured Gear · {activeVideo.customerName} ({activeVideo.city})
                </div>
                <div className="font-display font-bold text-sm text-[#111315] truncate">
                  {activeProduct.name}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-sm font-bold tabular-nums text-[#111315]">
                    {formatNaira(activeProduct.price)}
                  </span>
                  {activeProduct.originalPrice > activeProduct.price && (
                    <>
                      <span className="font-mono text-xs text-zinc-400 line-through tabular-nums">
                        {formatNaira(activeProduct.originalPrice)}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#4D8A00]">
                        -{discountPercent(activeProduct.price, activeProduct.originalPrice)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onLearnMore(activeProduct, activeProduct.variants[0])}
                className="px-3 py-2 text-xs font-semibold text-[#111315] bg-white border border-zinc-300 hover:border-[#111315] rounded-md transition-colors whitespace-nowrap"
              >
                View Specs
              </button>
              <button
                type="button"
                onClick={() => {
                  const variant = activeProduct.variants[0];
                  onAddToCart(activeProduct, variant);
                  setJustAddedSku(variant.sku);
                  window.setTimeout(() => setJustAddedSku(null), 1200);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
                  justAddedSku === activeProduct.variants[0]?.sku
                    ? 'bg-[#111315] text-[#82E600]'
                    : 'bg-[#82E600] hover:bg-[#73C900] text-[#111315]'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>
                  {justAddedSku === activeProduct.variants[0]?.sku ? 'Added' : 'Add to Cart'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
