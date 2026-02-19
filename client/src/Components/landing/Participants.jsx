import { Section } from "./Section.jsx";

const Participants = () => {
  const categories = [
    {
      title: "General Public",
      subtitle: "People Participation",
      image: "/general.jpg",
      who: "Citizens of Mysuru who want their city to change and grow.",
      why: [
        "To stop Bengaluru-fication of Mysuru",
        "Turn your coffee shop ideas into Government policy",
      ],
    },
    {
      title: "College Students",
      subtitle: "Innovation Challenge",
      image: "/students.jpg",
      who: "UG and PG students from engineering, management, arts, and science disciplines.",
      why: [
        'Recognition as "City Consultant" (certified by SDMIMD & partners)',
        "High-impact ideas may be adopted by the District Administration",
        "Mentorship from industry leaders at the Corporate Summit",
      ],
    },
    {
      title: "Corporate & Industry",
      subtitle: "Industry Solutions Track",
      image: "/startups.jpg",
      who: "Startups, MSMEs, and large enterprises operating in Mysuru.",
      why: [
        "Direct interface with city and district leadership",
        "Access to top student talent and innovators",
        "CSR alignment and long-term brand visibility",
      ],
    },
    {
      title: "NGOs & Associations",
      subtitle: "Civil Society Participation",
      image: "/NGO.jpg",
      who: "Resident Welfare Associations, trade bodies, and civil society organisations.",
      why: [
        "Formal inclusion of community-level civic issues",
        "Collaboration with academic institutions on solutions",
      ],
    },
  ];

  return (
    <Section
      id="participation"
      eyebrow="Participation"
      title="Who can participate in Vision Mysuru 2050?"
    >
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2
        sm:-mx-6 sm:px-6
        lg:mx-0 lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {categories.map((c) => {
          return (
            <div
              key={c.title}
              className="w-[85%] shrink-0 snap-start overflow-hidden rounded-xl 
              bg-[var(--surface)] transition hover:border-[var(--accent)]
              sm:w-[70%]
              md:w-[55%]
              lg:w-auto lg:shrink"
            >
              <div className="relative h-60">
                <img
                  src={c.image}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg)]" />
              </div>

              <div className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text)]">
                      {c.title}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">{c.subtitle}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Who can apply
                  </div>
                  <p className="mt-2 text-sm  text-[var(--muted)]">{c.who}</p>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-tight text-[var(--muted)]">
                    Why participate
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                    {c.why.map((p) => (
                      <li key={p} className="flex gap-2">
                        - <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

export default Participants;
