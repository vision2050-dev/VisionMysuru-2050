import { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Section } from "./Section";

const IMAGES = [
  { src: "/smart_city.jpg", alt: "Smart City & Governance" },
  { src: "/urbaninfra.jpg", alt: "Urban Infrastructure" },
  { src: "/envsus.jpg", alt: "Environmental Sustainability" },
  { src: "/eduhea.jpg", alt: "Education & Health" },
  { src: "/hericon.jpg", alt: "Heritage & Tourism" },
  { src: "/sociainclu.jpg", alt: "Social Inclusion" },
];

const Gallery = () => {
  const scrollRef = useRef(null);

  return (
    <Section id="gallery" eyebrow="Gallery" title="Glimpses of Vision Mysuru">
      <div className="group relative mx-auto w-full">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
        >
          {IMAGES.map(({ src, alt }) => (
            <div
              key={src}
              className="flex-none w-[90%] sm:w-[60%] md:w-[45%] lg:w-[40%] aspect-video snap-center overflow-hidden rounded-2xl bg-[var(--surface-active)] shadow-sm"
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Gallery;
