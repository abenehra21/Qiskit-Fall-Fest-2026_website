"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * The intro: a video scrubbed by the page's own scroll position, shown once.
 *
 * The section is a real block of scroll height with the video stuck to the top
 * of it, so scrubbing is just a function of how far through that section you
 * are. This is deliberately *not* scroll hijacking. An earlier version
 * swallowed `wheel` and `touchmove` with preventDefault, synthesised its own
 * motion, and froze the body for 2.5s when the video ended — which is why the
 * page ignored you at the handoff until you lifted off the trackpad and swiped
 * again: the browser had already consumed that gesture and will not resume one
 * mid-flight after `overflow` is toggled. Riding real scroll means there is no
 * handoff to get wrong.
 *
 * Once you scroll past the end — or press Skip — the section unmounts and the
 * page keeps the scroll position it would have had without it, so there is
 * nothing above the hero to scroll back into. The intro is over.
 *
 * SCRUB_VH is the one knob for pacing: how much *scrolling* the video is
 * mapped onto. The section is a viewport taller than that, because the sticky
 * child occupies the first 100vh and only the remainder is travel — get this
 * wrong and a 140vh section yields just 40vh of scrubbing.
 */
const SCRUB_VH = 120;

/** Extra scroll past the last frame before the intro gives way to the page. */
const EXIT_SLACK_PX = 40;

export function ScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [done, setDone] = useState(false);

  /**
   * Drop the intro and keep the reader where they were relative to the rest of
   * the page. Subtracting the section's own height does double duty: from the
   * end of the scrub it resolves to 0, the top of the hero, and from a restored
   * mid-page scroll on reload it leaves that position untouched.
   */
  const landingRef = useRef(0);

  const dismiss = () => {
    const height = sectionRef.current?.offsetHeight ?? 0;
    landingRef.current = Math.max(0, window.scrollY - height);
    setDone(true);
  };

  // Runs after the section has left the DOM but before the browser paints, so
  // the reader never sees the page jump as the document shortens. A layout
  // effect rather than rAF: the scroll must land in the same frame as the
  // unmount, and a throttled rAF would let a wrong position paint first.
  useLayoutEffect(() => {
    if (!done) return;
    window.scrollTo({
      top: landingRef.current,
      behavior: "instant" as ScrollBehavior,
    });
  }, [done]);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video || done) return;
    // The section is display:none under reduced motion; don't drive it either.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number | undefined;

    const update = () => {
      frame = undefined;
      const scrollable = section.offsetHeight - window.innerHeight;
      if (scrollable <= 0 || !Number.isFinite(video.duration)) return;

      // Past the last frame, plus a nudge: the intro has served its purpose.
      // This also covers a reload that restored a scroll position below it.
      if (window.scrollY > scrollable + EXIT_SLACK_PX) {
        dismiss();
        return;
      }

      const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
      // Mapped straight across, no easing: the scroll itself is already
      // smoothed by the platform, and easing on top only adds lag.
      video.currentTime = progress * video.duration;
      if (hintRef.current) {
        hintRef.current.style.opacity = progress > 0.02 ? "0" : "1";
      }
    };

    const schedule = () => {
      frame ??= window.requestAnimationFrame(update);
    };

    // Scheduled rather than called: keeps setState out of the effect body.
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    video.addEventListener("loadedmetadata", schedule);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      video.removeEventListener("loadedmetadata", schedule);
    };
  }, [done]);

  if (done) return null;

  return (
    <section
      ref={sectionRef}
      aria-label="Intro"
      className="relative motion-reduce:hidden"
      style={{ height: `${SCRUB_VH + 100}vh` }}
    >
      {/* z above the nav so the island does not sit over the video; it goes
          with the section when the intro is dismissed. */}
      <div className="sticky top-0 z-[100] h-screen w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          src="/optimized_video.mp4"
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          aria-hidden
          onLoadedMetadata={() => {
            // Nudge off zero so the first frame actually paints.
            if (videoRef.current) videoRef.current.currentTime = 0.01;
          }}
        />

        <p
          ref={hintRef}
          className="pointer-events-none absolute inset-x-0 bottom-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 transition-opacity duration-700"
        >
          Scroll down
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="group absolute bottom-8 right-8 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-white backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/10"
        >
          Skip Intro
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
