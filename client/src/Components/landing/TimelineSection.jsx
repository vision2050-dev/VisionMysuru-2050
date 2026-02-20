import { useEffect, useRef, useState } from "react";
import { TIMELINE } from "../../constants/content.js";
import { Section } from "./Section.jsx";

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
};

const TimelineItem = ({ step, index, isLast }) => {
  const [ref, visible] = useInView();
  const isLeft = index % 2 === 0;

  return (
    <div ref={ref} className="relative flex min-h-[140px]">
      <span
        className={`absolute top-1/2 -translate-y-1/2
          left-2.5 md:left-1/2 md:-translate-x-1/2
          h-4 w-4 rounded-full z-10 transition-all duration-500
          ${
            visible
              ? "bg-[var(--accent)] shadow-[0_0_0_8px_var(--accent-soft)] scale-110"
              : "bg-[var(--surface)] border border-[var(--border)]"
          }`}
      />

      <div className="flex w-full">
        <div
          className={`hidden md:flex w-1/2 ${
            isLeft ? "justify-end pr-14" : ""
          }`}
        >
          {isLeft && (
            <Card
              step={step}
              visible={visible}
              align="right"
              isSpecial={isLast}
            />
          )}
        </div>

        <div
          className={`hidden md:flex w-1/2 ${
            !isLeft ? "justify-start pl-14" : ""
          }`}
        >
          {!isLeft && <Card step={step} visible={visible} isSpecial={isLast} />}
        </div>

        <div className="md:hidden w-full pl-10">
          <Card step={step} visible={visible} isSpecial={isLast} />
        </div>
      </div>
    </div>
  );
};
const Card = ({ step, visible, align, isSpecial }) => {
  return (
    <div
      className={`
        relative max-w-md w-full rounded-4xl p-5
        backdrop-blur transition-all tracking-tight duration-700 ease-out 
        ${
          isSpecial
            ? `
              bg-gradient-to-br
              from-white
              via-yellow-500/35
              to-orange-400/35
              border-[var(--accent)]
              border-4 border-b border-l
            `
            : `
            border-4
              border-b border-r
              bg-[var(--surface)]/80
              border-[var(--accent)]
              
            `
        }
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${isSpecial && visible ? "scale-[1.02]" : ""}
        ${align === "right" ? "text-right" : "text-left"}
      `}
    >
      {isSpecial && (
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-[var(--accent)]/40" />
      )}

      <span
        className={`
          inline-flex items-center gap-2 mb-1 rounded-tl-xl rounded-bl-sm bg-gradient-to-r from-yellow-500 via-amber-500/70 to-transparent text-black px-4 py-1 text-sm font-bold tracking-tighter`}
      >
        {step.date}
        {isSpecial && <span className="uppercase tracking-wide ">Final</span>}
      </span>

      <h3
        className={`
          text-lg
          ${
            isSpecial
              ? "text-[var(--text)] uppercase leading-tight font-bold"
              : "text-[var(--text)] font-semibold"
          }
        `}
      >
        {step.title}
      </h3>

      <p
        className={`
          mt-2 text-sm leading-tight 
          ${isSpecial ? "text-[var(--text)]/90" : "text-[var(--muted)]"}
        `}
      >
        {step.detail}
      </p>

      {step.eligibleFor?.length > 0 && (
        <div
          className={`mt-4 ${
            align === "right" ? "flex flex-col items-end" : "flex flex-col"
          }`}
        >
          <span className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
            Eligible for
          </span>

          <div
            className={`flex flex-wrap gap-1 ${
              align === "right" ? "justify-end" : "justify-start"
            }`}
          >
            {step.eligibleFor.map((role) => (
              <span
                key={role}
                className={`
                  rounded-full px-3 py-1 text-xs font-semibold
                  border
                  ${
                    isSpecial
                      ? "bg-[var(--accent)]/15 text-[var(--text)] border-[var(--accent)]/30"
                      : "bg-white/70 text-black border-[var(--border)]"
                  }
                `}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineSection = () => {
  return (
    <Section
      id="timeline"
      eyebrow="Process"
      title="Program timeline and milestones"
      fullWidth
    >
      <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden">
        <img
          src="https://res.cloudinary.com/dqlqxcwqr/image/upload/v1771552632/mysurutimeline_y1p3wy.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />

        <div
          className="absolute inset-0 bg-gradient-to-b
          from-[var(--bg)]
          via-[var(--bg)]/12
          to-[var(--bg)]"
        />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div
            className="absolute top-0 h-full w-1
            left-10 md:left-1/2 md:-translate-x-1/2
            bg-gradient-to-b from-transparent via-[var(--accent)] to-transparent"
          />

          <div className="space-y-6">
            {TIMELINE.map((step, index) => (
              <TimelineItem
                key={step.title}
                step={step}
                index={index}
                isLast={TIMELINE.length - 1 === index}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default TimelineSection;
