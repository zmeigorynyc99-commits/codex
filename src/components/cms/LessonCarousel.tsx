'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface LessonCardData {
  slug: string;
  title: string;
  summary: string;
  coverImage: string | null;
  difficulty: string;
  distribution: string;
  categoryName: string | null;
  dateLabel: string | null;
  minutes: number;
}

/**
 * A horizontal "corridor of lessons": a single ordered, de-duplicated sequence
 * the user can swipe (touch), drag (mouse), trackpad-scroll, arrow-click or
 * keyboard through. Cards snap into place; a progress indicator shows position.
 * Each lesson is rendered exactly once and the whole card is a link, so a plain
 * click always opens the lesson — drag only kicks in after real movement.
 */
export function LessonCarousel({ lessons }: { lessons: LessonCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const total = lessons.length;

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(index, total - 1));
      const child = track.children[clamped] as HTMLElement | undefined;
      if (child) track.scrollTo({ left: child.offsetLeft, behavior });
    },
    [total],
  );

  const syncCurrent = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft } = track;
    let nearest = 0;
    let min = Infinity;
    for (let i = 0; i < track.children.length; i += 1) {
      const child = track.children[i] as HTMLElement;
      const dist = Math.abs(child.offsetLeft - scrollLeft);
      if (dist < min) {
        min = dist;
        nearest = i;
      }
    }
    setCurrent(nearest);
  }, []);

  const currentRef = useRef(0);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // Always start the corridor at Lesson 1.
  useEffect(() => {
    const track = trackRef.current;
    if (track) {
      track.scrollLeft = 0;
      setCurrent(0);
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncCurrent);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [syncCurrent]);

  const go = useCallback(
    (delta: number) => {
      const next = (current + delta + total) % total;
      scrollToIndex(next);
    },
    [current, total, scrollToIndex],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      scrollToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      scrollToIndex(total - 1);
    }
  };

  // Mouse drag-to-scroll that is click-safe: we only treat it as a drag once the
  // pointer has actually moved past a small threshold, and only then capture the
  // pointer. A plain click is never intercepted, so the card link opens normally.
  const drag = useRef({ down: false, dragging: false, startX: 0, startScroll: 0 });
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return; // touch/pen use native scrolling
    const track = trackRef.current;
    if (!track) return;
    drag.current = { down: true, dragging: false, startX: e.clientX, startScroll: track.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.down) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.dragging) {
      if (Math.abs(dx) < 6) return; // not a drag yet
      drag.current.dragging = true;
      track.style.scrollBehavior = 'auto';
      track.setPointerCapture(e.pointerId);
    }
    track.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = (e: React.PointerEvent) => {
    const wasDragging = drag.current.dragging;
    const track = trackRef.current;
    if (track && drag.current.dragging) {
      if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
      track.style.scrollBehavior = '';
    }
    drag.current.down = false;
    drag.current.dragging = false;
    if (wasDragging) {
      suppressClick.current = true; // swallow the click that follows a drag
      syncCurrent();
      requestAnimationFrame(() => scrollToIndex(currentRef.current));
    }
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  if (total === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        No lessons match your filters.
      </p>
    );
  }

  const progress = total > 1 ? (current / (total - 1)) * 100 : 100;

  return (
    <section aria-roledescription="carousel" aria-label="Course lessons" className="relative">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200" aria-live="polite">
            Lesson {current + 1} of {total}
          </p>
          <div className="mt-1 h-1.5 w-40 max-w-[40vw] overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous lesson"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next lesson"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous lesson"
          className="absolute left-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl text-slate-700 shadow-md backdrop-blur transition hover:bg-white md:inline-flex dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next lesson"
          className="absolute right-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl text-slate-700 shadow-md backdrop-blur transition hover:bg-white md:inline-flex dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100"
        >
          <span aria-hidden="true">›</span>
        </button>

        <div
          ref={trackRef}
          role="group"
          aria-label="Lessons, use arrow keys to navigate"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          className="scrollbar-hide relative flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {lessons.map((lesson, i) => (
            <Link
              key={lesson.slug}
              href={`/linux-tutorials/${lesson.slug}`}
              draggable={false}
              aria-roledescription="slide"
              aria-label={`Lesson ${i + 1} of ${total}: ${lesson.title}`}
              className="card group flex shrink-0 basis-[88%] snap-start flex-col overflow-hidden p-0 no-underline transition hover:ring-2 hover:ring-brand-500/40 sm:basis-[58%] lg:basis-[42%] xl:basis-[32%]"
            >
              {lesson.coverImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={lesson.coverImage}
                  alt=""
                  draggable={false}
                  className="aspect-[16/9] w-full object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span className={`badge badge-difficulty-${lesson.difficulty.toLowerCase()}`}>
                    {lesson.difficulty}
                  </span>
                  <span className="badge badge-distro">{lesson.distribution}</span>
                  {lesson.categoryName && <span className="badge badge-neutral">{lesson.categoryName}</span>}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                  {lesson.title}
                </h3>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {lesson.summary}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  {lesson.dateLabel && <span>{lesson.dateLabel}</span>}
                  {lesson.dateLabel && <span aria-hidden="true">·</span>}
                  <span>{lesson.minutes} min read</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
