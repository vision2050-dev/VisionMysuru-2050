import { TOPICS } from "../../constants/content.js";
import { Section } from "./Section.jsx";

const topicImages = {
  "Urban Infrastructure & Mobility": "/urbaninfra.jpg",
  "Environmental Sustainability": "/envsus.jpg",
  "Economic Development": "/ecodev.jpg",
  "Education & Healthcare": "/eduhea.jpg",
  "Heritage Conservation": "/hericon.jpg",
  "Social Equity & Inclusion": "/sociainclu.jpg",
  "Disaster Resilience": "/disresi.jpg",
  "Digital Governance & Smart City": "/smart_city.jpg",
  "Tourism & Culture": "/tourism.jpg",
};

const TopicsSection = () => {
  return (
    <Section
      id="topics"
      eyebrow="Focus areas"
      title="Thematic priorities for proposal submission"
    >
      <div className="grid gap-5 md:grid-cols-2 px-2 lg:grid-cols-3">
        {TOPICS.map((t, idx) => (
          <div
            key={idx}
            className="group overflow-hidden rounded-xl 
            bg-[var(--surface)] transition hover:border-[var(--accent)]"
          >
            <div className="relative h-56 overflow-hidden">
              <img
                src={topicImages[t.title] ?? "/mysuru2.jpeg"}
                alt=""
                aria-hidden
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500
                group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/10 to-transparent" />
            </div>

            <div className="px-4 mt-2 pb-8">
              <h3 className="text-base font-semibold text-[var(--text)]">
                {t.title}
              </h3>

              <ul className="mt-2  text-sm leading-relaxed text-[var(--muted)]">
                {t.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    - <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default TopicsSection;
