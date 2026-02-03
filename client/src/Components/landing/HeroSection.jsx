import { Link } from "react-router-dom";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative min-h-[92vh] overflow-hidden">
      <div className="absolute border-b-6 border-[var(--accent)] inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          src="https://res.cloudinary.com/dqlqxcwqr/image/upload/f_auto,q_auto/v1768013750/mysuru2_daz3p4.jpg"
          alt="Future vision of Mysuru city"
          className="h-full w-full scale-x-[-1] object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-black/10 to-red-600/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <div className="max-w-2xl  text-start">
          <div>
            <img
              src="/logo_final.png"
              alt="Vision Mysuru 2050 Logo"
              className="h-17 rounded-full  w-auto mb-4"
            />
          </div>
          <h1 className="flex flex-col gap-2 font-bold oswald uppercase tracking-tighter text-white text-4xl leading-tight md:text-6xl">
            <span className="inline-block w-fit  bg-white px-3  text-[var(--accent)]">
              Vision Mysuru 2050
            </span>
            <span className="text-3xl md:text-5xl">
              Build the future of Mysuru
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/90 leading-tight">
            Mission Statement: A city-wide strategic initiative to draft the
            development blueprint for Mysuru's next 25 years
          </p>

          <div className="mt-20 md:mt-20 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Submit your idea
              <FiArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#timeline"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              View timeline <FiCalendar />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
