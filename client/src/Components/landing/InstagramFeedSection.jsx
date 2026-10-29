import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInstagram,
  FiChevronLeft,
  FiChevronRight,
  FiPlay,
  FiHeart,
  FiMessageCircle,
  FiExternalLink,
  FiRefreshCw,
  FiVideo,
  FiImage,
} from "react-icons/fi";
import { INITIAL_INSTAGRAM_POSTS } from "../../constants/instagramPosts.js";

// Format relative date nicely
const formatRelativeTime = (isoString) => {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recent";
  }
};

const InstagramCard = ({ post, index }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const isVideo = post.media_type === "VIDEO" || post.is_reel;

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked by browser policy without user gesture
            setIsPlaying(false);
          });
      }
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleClick = () => {
    const targetUrl = post.permalink || "https://www.instagram.com/visionmysuru2050";
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      data-ig-card
      tabIndex={0}
      role="link"
      aria-label={`Open Instagram ${isVideo ? "reel" : "post"} by @visionmysuru2050: ${post.caption?.slice(0, 50)}...`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex h-[28rem] w-[18.5rem] sm:w-[20rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-2xl hover:shadow-pink-500/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
    >
      {/* Outer Subtle Instagram Gradient Border on Hover */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-tr from-[#833ab4]/30 via-[#fd1d1d]/30 to-[#fcb045]/30 opacity-0 blur-[2px] transition-opacity duration-300 group-hover:opacity-100" />

      {/* Media Canvas */}
      <div className="relative h-[68%] w-full overflow-hidden bg-black/90">
        {/* Background Poster Image */}
        <img
          src={post.thumbnail_url || post.media_url}
          alt="Vision Mysuru 2050 Instagram media"
          loading="lazy"
          className={`h-full w-full object-cover transition-all duration-500 ${
            isPlaying ? "scale-105 opacity-0" : "scale-100 opacity-100 group-hover:scale-105"
          }`}
        />

        {/* Video Player for Reels (Plays on Hover) */}
        {isVideo && post.media_url && (
          <video
            ref={videoRef}
            src={post.media_url}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              isPlaying ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Dark Top and Bottom Vignettes for High Contrast Readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/75 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />

        {/* Top Floating Badge Bar */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10 font-semibold tracking-wide">
            {isVideo ? (
              <>
                <FiVideo className="h-3.5 w-3.5 text-pink-400" />
                <span>Reel</span>
              </>
            ) : (
              <>
                <FiImage className="h-3.5 w-3.5 text-amber-400" />
                <span>Post</span>
              </>
            )}
          </div>

          {/* Views or Likes indicator */}
          <div className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white/90">
            {isVideo && post.views_count ? (
              <>
                <FiPlay className="h-3 w-3 fill-current text-white/80" />
                <span>{post.views_count}</span>
              </>
            ) : (
              <>
                <FiHeart className="h-3 w-3 fill-pink-500 text-pink-500" />
                <span>{post.like_count || 450}</span>
              </>
            )}
          </div>
        </div>

        {/* Hover Center Indicator for Reels */}
        {isVideo && (
          <div
            className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              isPlaying ? "opacity-0" : "opacity-90 group-hover:opacity-100"
            }`}
          >
            <div className="flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
              <FiPlay className="h-3.5 w-3.5 fill-white text-white" />
              <span>Hover to play</span>
            </div>
          </div>
        )}

        {/* Playing Status Pill (Shows when hovered and playing) */}
        {isVideo && isPlaying && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-pink-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-md">
            <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-white" />
            <span>PREVIEWING</span>
          </div>
        )}

        {/* Instagram Watermark Icon */}
        <div className="pointer-events-none absolute bottom-3 left-3 text-white/80">
          <FiInstagram className="h-4 w-4 drop-shadow" />
        </div>
      </div>

      {/* Card Content & Caption */}
      <div className="flex flex-1 flex-col justify-between p-4 bg-[var(--surface)]">
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
            <span className="font-semibold text-[var(--accent)] tracking-tight">
              @visionmysuru2050
            </span>
            <span>{formatRelativeTime(post.timestamp)}</span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-[var(--text)] line-clamp-3">
            {post.caption || "Vision Mysuru 2050 Edition 2: Ideas to Impact."}
          </p>
        </div>

        {/* Footer Meta & Direct Link Action */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1">
              <FiHeart className="h-3.5 w-3.5 text-pink-500" />
              {post.like_count || 320}
            </span>
            <span className="flex items-center gap-1">
              <FiMessageCircle className="h-3.5 w-3.5 text-sky-500" />
              {post.comments_count || 24}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] transition-colors group-hover:text-[var(--primary)] group-hover:underline">
            <span>View post</span>
            <FiExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
};

export const InstagramFeedSection = () => {
  const scrollContainerRef = useRef(null);
  const [posts, setPosts] = useState(INITIAL_INSTAGRAM_POSTS);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Connected");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch live feed from local or production backend
  const fetchFeed = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      // Determine API URL based on origin or dev server
      const endpoint = "/api/v1/instagram/feed" + (isManualRefresh ? "?refresh=true" : "");
      const res = await fetch(endpoint, {
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.posts) && data.posts.length > 0) {
          // Sort newest first so the latest post is the left-most post
          const sorted = [...data.posts].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setPosts(sorted);
          setLastUpdated(new Date(data.synced_at || Date.now()));
          setSyncStatus(data.source === "live" ? "Live Graph API" : "Auto-Synced");
        }
      }
    } catch (err) {
      // Gracefully retain current / seed posts without interrupting user experience
      console.warn("Instagram feed background sync fallback:", err.message);
    } finally {
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and automatic background polling every 4 minutes
  useEffect(() => {
    fetchFeed();
    const interval = setInterval(() => {
      fetchFeed();
    }, 4 * 60 * 1000); // Poll every 4 minutes for new posts
    return () => clearInterval(interval);
  }, [fetchFeed]);

  // Update navigation button states on scroll
  const handleScrollUpdate = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  // Circular scroll navigation
  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cardWidth = 340; // Card width + gap
    const { scrollLeft, scrollWidth, clientWidth } = container;

    if (direction === "next") {
      // If reached the end, smoothly wrap circularly to the start
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: cardWidth, behavior: "smooth" });
      }
    } else {
      // If at the beginning, smoothly wrap circularly to the end
      if (scrollLeft <= 20) {
        container.scrollTo({ left: scrollWidth, behavior: "smooth" });
      } else {
        container.scrollBy({ left: -cardWidth, behavior: "smooth" });
      }
    }
  };

  return (
    <section
      id="social"
      className="scroll-mt-24 py-16 sm:py-20 border-t border-[var(--border)] bg-gradient-to-b from-transparent via-[var(--surface)]/30 to-transparent"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            {/* Suitable Eyebrow for Edition 2 */}
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Social Sphere &bull; Instagram Live
              </p>
            </div>

            {/* Section Name tailored to Edition 2 ("Ideas to Impact") */}
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl oswald uppercase">
              The Movement in Motion: Live on Instagram
            </h2>

            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              Real-time reels, student innovations, and behind-the-scenes moments from{" "}
              <a
                href="https://www.instagram.com/visionmysuru2050"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--text)] underline decoration-pink-500 underline-offset-4 hover:text-pink-500 transition-colors"
              >
                @visionmysuru2050
              </a>
              . Hover over any reel to preview the energy.
            </p>
          </div>

          {/* Social Stats & Direct Instagram Action Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-Sync Live Status Pill */}
            <button
              type="button"
              onClick={() => fetchFeed(true)}
              title="Click to force refresh latest Instagram posts"
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all shadow-sm"
            >
              <FiRefreshCw
                className={`h-3 w-3 ${isRefreshing ? "animate-spin text-[var(--accent)]" : "text-emerald-500"}`}
              />
              <span>{isRefreshing ? "Syncing..." : syncStatus}</span>
            </button>

            {/* Official Follow Button with Instagram Gradient */}
            <a
              href="https://www.instagram.com/visionmysuru2050"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-110 hover:shadow-lg transition-all"
            >
              <FiInstagram className="h-4 w-4" />
              <span>Follow @visionmysuru2050</span>
              <FiExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          </div>
        </div>

        {/* Carousel Container with Circular Navigation Buttons */}
        <div className="relative mt-10">
          {/* Circular Left Arrow Button */}
          <button
            type="button"
            onClick={() => scroll("prev")}
            aria-label="Scroll left or jump to last post in circular list"
            className="absolute -left-3 sm:-left-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 p-3 text-[var(--text)] shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-[var(--surface-2)] hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>

          {/* Circular Right Arrow Button */}
          <button
            type="button"
            onClick={() => scroll("next")}
            aria-label="Scroll right or wrap to first post in circular list"
            className="absolute -right-3 sm:-right-5 top-1/2 z-20 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 p-3 text-[var(--text)] shadow-xl backdrop-blur-md transition-all hover:scale-110 hover:bg-[var(--surface-2)] hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>

          {/* Horizontally Scrollable Track */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScrollUpdate}
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-2 py-4 scroll-smooth scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]"
          >
            {posts.map((post, idx) => (
              <InstagramCard key={post.id || idx} post={post} index={idx} />
            ))}
          </div>

          {/* Circular Track Helper Note & Swipe Cue */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--muted)] px-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span>
                Sorted <strong>newest first</strong> (latest post on the left) &bull; Circular scroll enabled
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Showing {posts.length} posts & reels</span>
              <span>&bull;</span>
              <span>Auto-refreshes every 4 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeedSection;
