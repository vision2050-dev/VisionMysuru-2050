import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(clientRoot, "..");

// Runtime directories (ignored by Git)
const serverRuntimeDir = path.join(repoRoot, "server/runtime");
const serverRuntimeCachePath = path.join(serverRuntimeDir, "instagram_cache.json");
const distDataDir = path.join(clientRoot, "dist/data");
const distTempDataDir = path.join(clientRoot, "dist-temp/data");

// Strip emojis to guarantee text compliance
const stripEmojis = (str) =>
  (str || "").replace(
    /[\u{10000}-\u{10ffff}\u{2600}-\u{27bf}\u{2300}-\u{23ff}\u{2b50}-\u{2b55}\u{3030}\u{303d}\u{fe0f}]/gu,
    ""
  );

async function scrapePostMetrics(permalink) {
  const codeMatch = permalink.match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  const code = codeMatch ? codeMatch[1] : null;
  if (!code) return null;

  const urlsToTry = [
    `https://www.instagram.com/reel/${code}/`,
    `https://www.instagram.com/p/${code}/`,
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "curl/7.88.1",
          Accept: "*/*",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const html = await res.text();
        const match = html.match(/([0-9,]+)\s+likes?,\s+([0-9,]+)\s+comments?/i);
        if (match) {
          const likes = parseInt(match[1].replace(/,/g, ""), 10);
          const comments = parseInt(match[2].replace(/,/g, ""), 10);
          return { likes, comments };
        }
      }
    } catch {
      // Continue to next URL fallback if timeout or error
    }
  }

  return null;
}

export async function syncInstagram() {
  const startTime = Date.now();
  console.log("[Instagram Sync] Fetching live interaction counts from official feed...");

  try {
    const { INITIAL_INSTAGRAM_POSTS } = await import(
      `../src/constants/instagramPosts.js?update=${Date.now()}`
    );

    if (!Array.isArray(INITIAL_INSTAGRAM_POSTS) || INITIAL_INSTAGRAM_POSTS.length === 0) {
      console.warn("[Instagram Sync] No existing posts found to synchronize.");
      return;
    }

    const updatedPosts = await Promise.all(
      INITIAL_INSTAGRAM_POSTS.map(async (post) => {
        const metrics = await scrapePostMetrics(post.permalink);
        if (metrics) {
          return {
            ...post,
            like_count: metrics.likes,
            comments_count: metrics.comments,
            views_count: null,
            caption: stripEmojis(post.caption),
          };
        }
        return {
          ...post,
          views_count: null,
          caption: stripEmojis(post.caption),
        };
      })
    );

    const nowIso = new Date().toISOString();
    const publicJsonPayload = {
      success: true,
      source: "auto-synced",
      account: "visionmysuru2050",
      profile_url: "https://www.instagram.com/visionmysuru2050",
      total: updatedPosts.length,
      synced_at: nowIso,
      posts: updatedPosts,
    };
    const jsonString = JSON.stringify(publicJsonPayload, null, 2);

    // 1. Write server runtime cache (strictly outside Git repository)
    if (!fs.existsSync(serverRuntimeDir)) {
      try {
        fs.mkdirSync(serverRuntimeDir, { recursive: true });
      } catch {}
    }
    try {
      fs.writeFileSync(
        serverRuntimeCachePath,
        JSON.stringify({ timestamp: Date.now(), posts: updatedPosts }, null, 2),
        "utf8"
      );
    } catch (cacheErr) {
      console.warn("[Instagram Sync] Note on server runtime cache:", cacheErr.message);
    }

    // 2. Write directly to dist/ runtime data (serving path for Express / IIS)
    if (fs.existsSync(path.join(clientRoot, "dist"))) {
      if (!fs.existsSync(distDataDir)) {
        try {
          fs.mkdirSync(distDataDir, { recursive: true });
        } catch {}
      }
      try {
        fs.writeFileSync(path.join(distDataDir, "instagram_feed.json"), jsonString, "utf8");
      } catch {}
    }

    // 3. Also write to dist-temp if currently running during an atomic build
    if (fs.existsSync(path.join(clientRoot, "dist-temp"))) {
      if (!fs.existsSync(distTempDataDir)) {
        try {
          fs.mkdirSync(distTempDataDir, { recursive: true });
        } catch {}
      }
      try {
        fs.writeFileSync(path.join(distTempDataDir, "instagram_feed.json"), jsonString, "utf8");
      } catch {}
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[Instagram Sync] Successfully synchronized ${updatedPosts.length} posts with live Instagram counts in ${elapsed}ms.`
    );
  } catch (err) {
    console.warn("[Instagram Sync] Graceful fallback, retaining existing data:", err.message);
  }
}

// Execute directly if run as CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncInstagram();
}
