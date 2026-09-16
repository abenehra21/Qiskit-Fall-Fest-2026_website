"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

/**
 * The intro: a video scrubbed by the page's own scroll position.
 *
 * The section is `INTRO_VH` tall and the video sticks to the top of it, so
 * scrubbing is just a function of how far through that section you are. This
 * is deliberately *not* scroll hijacking. The previous version swallowed
 * `wheel` and `touchmove` with preventDefault, synthesised its own motion, and
 * then froze the body for 2.5s when the video ended — which is why the page
 * ignored you at the handoff until you lifted off the trackpad and swiped
 * again: the browser had already consumed that gesture and will not resume one
 * mid-flight after `overflow` is toggled. Riding real scroll means there is no
 * handoff to get wrong, and momentum carries straight through into the hero.
 *
 * SCRUB_VH is the one knob for pacing: how much *scrolling* the 10s video is
 * mapped onto. The section is a viewport taller than that, because the sticky
 * child occupies the first 100vh and only the remainder is travel — get this
 * wrong and a 140vh section gives just 40vh of scrubbing. The old wheel maths
 * needed ~3,300px of accumulated delta, roughly 15-30 trackpad swipes; 120vh
 * is about a third of that.
 */
const SCRUB_VH = 120;

export function ScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;
    // The section is display:none under reduced motion; don't drive it either.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number | undefined;

    const update = () => {
      frame = undefined;
      const scrollable = section.offsetHeight - window.innerHeight;
      if (scrollable <= 0 || !Number.isFinite(video.duration)) return;

      const progress = Math.min(
        Math.max(-section.getBoundingClientRect().top / scrollable, 0),
        1,
      );
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

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    video.addEventListener("loadedmetadata", update);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      video.removeEventListener("loadedmetadata", update);
    };
  }, []);

  /** Jump to the far end of the intro — i.e. the top of the hero. */
  const skip = () => {
    const section = sectionRef.current;
    if (!section) return;
    window.scrollTo({
      top: section.offsetTop + section.offsetHeight - window.innerHeight,
      behavior: "instant" as ScrollBehavior,
    });
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Intro"
      className="relative motion-reduce:hidden"
      style={{ height: `${SCRUB_VH + 100}vh` }}
    >
      {/* z above the nav so the island does not sit over the video; it scrolls
          away with the section, and the nav comes back on its own. */}
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
          onClick={skip}
          className="group absolute bottom-8 right-8 z-50 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-white backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/10"
        >
          Skip Intro
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
