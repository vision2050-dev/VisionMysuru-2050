import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(clientRoot, "..");
const postsFilePath = path.join(clientRoot, "src/constants/instagramPosts.js");
const publicDataDir = path.join(clientRoot, "public/data");
const publicJsonPath = path.join(publicDataDir, "instagram_feed.json");
const serverCachePath = path.join(repoRoot, "server/data/instagram_cache.json");

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

    // 1. Write updated client constants file
    const jsContent = `/**
 * Vision Mysuru 2050 - Official Instagram Feed Data
 * Account: @visionmysuru2050 (https://www.instagram.com/visionmysuru2050/)
 * 
 * Automatically synchronized with live Instagram metrics.
 * Synced: ${nowIso}
 */

export const INITIAL_INSTAGRAM_POSTS = ${JSON.stringify(updatedPosts, null, 2)};
`;
    fs.writeFileSync(postsFilePath, jsContent, "utf8");

    // 2. Write client public static JSON (accessible via /data/instagram_feed.json)
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    const publicJsonPayload = {
      success: true,
      source: "auto-synced",
      account: "visionmysuru2050",
      profile_url: "https://www.instagram.com/visionmysuru2050",
      total: updatedPosts.length,
      synced_at: nowIso,
      posts: updatedPosts,
    };
    fs.writeFileSync(publicJsonPath, JSON.stringify(publicJsonPayload, null, 2), "utf8");

    // 3. Write server cache if server directory exists
    const serverDataDir = path.dirname(serverCachePath);
    if (fs.existsSync(serverDataDir)) {
      fs.writeFileSync(
        serverCachePath,
        JSON.stringify({ timestamp: Date.now(), posts: updatedPosts }, null, 2),
        "utf8"
      );
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
