import { Section } from "./Section.jsx";
import { GROUPS } from "../../constants/content.js";

const LogoCard = ({ name, src }) => {
  return (
    <div className="flex items-center  justify-center ">
      <img
        src={src}
        alt={name}
        loading="lazy"
        className="h-18 w-auto   object-contain"
      />
    </div>
  );
};

const Sponsors = () => {
  return (
    <Section
      id="sponsors"
      eyebrow="In Collaboration with"
      title="Sponsors & Partners"
    >
      <div className="overflow-hidden">
        <div className="marquee">
          <div className="marquee__track">
            {[...GROUPS, ...GROUPS].map((group, idx) => (
              <div
                key={`${group.title}-${idx}`}
                className="flex flex-col items-center gap-6 pr-16"
              >
                <div className="text-sm font-semibold text-[var(--text)] whitespace-nowrap">
                  {group.title}
                </div>

                <div className="flex items-center gap-4">
                  {group.items.map((item) => (
                    <LogoCard
                      key={`${group.title}-${item.name}-${idx}`}
                      name={item.name}
                      src={item.src}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Sponsors;
