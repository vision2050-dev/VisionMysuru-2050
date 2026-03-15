import { useState } from "react";
import { updates } from "../../constants/updates.js";
import { Section } from "./Section.jsx";

const DESCRIPTION_LIMIT = 260;

const UpdateDescription = ({ description, isExpanded, onToggle }) => {
  const shouldTruncate = description.length > DESCRIPTION_LIMIT;
  const visibleText =
    shouldTruncate && !isExpanded
      ? `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}...`
      : description;

  return (
    <>
      <p className="mt-2 text-sm text-[var(--muted)]">{visibleText}</p>
      {shouldTruncate ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-3 text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--primary)]"
        >
          {isExpanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </>
  );
};

export const Updates = () => {
  const [expandedCards, setExpandedCards] = useState({});

  const toggleDescription = (id) => {
    setExpandedCards((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <Section
      id="updates"
      eyebrow="Latest updates"
      title="What is happening around Vision Mysuru 2050"
    >
      <div className="max-w-2xl">
        <p className="text-sm  text-[var(--muted)]">
          Follow announcements, event moments, and important milestones as the
          initiative moves forward.
        </p>
      </div>
      <div className="flex flex-row overflow-auto">
        {updates.length ? (
          <div className="relative mt-4">
            <div className="-mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-2 scroll-smooth">
              {updates.map((item) => (
                <article
                  key={item.id}
                  data-update-card
                  className="group flex h-[31rem] w-[88%] shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--accent)] md:w-[24rem]"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.imageLink}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="rounded-full self-start inline-flex flex items-center mt-3 bg-[var(--accent-soft)]  px-4  mx-4 py-1 text-xs font-semibold text-[var(--accent)]">
                    {item.time}
                  </div>

                  <div className="flex flex-1 flex-col space-y-2 px-4 py-5 sm:px-4 sm:py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="max-w-xl text-md font-semibold leading-tight tracking-tight text-black md:text-xl">
                          {item.title}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`${
                        expandedCards[item.id]
                          ? "max-h-[10.5rem] overflow-y-auto pr-1"
                          : "overflow-hidden"
                      }`}
                    >
                      <UpdateDescription
                        description={item.description}
                        isExpanded={Boolean(expandedCards[item.id])}
                        onToggle={() => toggleDescription(item.id)}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-5 py-8 text-sm text-[var(--muted)]">
            Updates will appear here as new announcements are published.
          </div>
        )}
      </div>
    </Section>
  );
};
