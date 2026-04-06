"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface SlideItem {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  slides: SlideItem[];
  interval?: number;
  className?: string;
}

export function ImageCarousel({
  slides,
  interval = 4000,
  className = "",
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % slides.length) + slides.length) % slides.length),
    [slides.length]
  );

  useEffect(() => {
    if (isHovered) return;
    timerRef.current = setInterval(() => goTo(current + 1), interval);
    return () => clearInterval(timerRef.current);
  }, [current, interval, isHovered, goTo]);

  const handleDragStart = useRef(0);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={(e) => {
        handleDragStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const diff = handleDragStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
      }}
    >
      {/* 幻灯片容器 */}
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="relative w-full shrink-0">
            <div className="relative aspect-[3/2] w-full sm:aspect-[21/9]">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-deep-space/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-deep-space to-transparent" />
      </div>

      {/* 指示器 */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1 rounded-full transition-all duration-400 ${
              i === current
                ? "w-5 bg-cyber-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                : "w-1.5 bg-white/25 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
