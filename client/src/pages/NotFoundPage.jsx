import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";

const NotFoundPage = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] px-6 text-center overflow-hidden select-none">
      <motion.h1
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-[8rem] md:text-[10rem] leading-none font-extrabold tracking-tight oswald bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent"
      >
        404
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 mt-1 text-xl md:text-3xl font-semibold text-[var(--text)] dm-sans"
      >
        Oops! Page Not Found
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
        className="relative z-10 mt-3 max-w-md text-[var(--muted)] text-base md:text-lg dm-sans leading-relaxed"
      >
        The page you're looking for doesn't exist or may have been moved. Let's
        get you back on track.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
        className="relative z-10 mt-8"
      >
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--primary-soft)] transition-all duration-300 hover:bg-[var(--primary-hover)] hover:shadow-xl hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          <FiArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </motion.div>

      {/* Divider + secondary link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="relative z-10 mt-6 text-sm text-[var(--muted-2)] dm-sans"
      >
        Or{" "}
        <Link
          to="/submit"
          className="font-medium text-[var(--accent)] underline underline-offset-4 decoration-[var(--accent-soft)] transition-colors hover:text-[var(--primary)]"
        >
          submit your idea
        </Link>
      </motion.p>
    </div>
  );
};

export default NotFoundPage;
