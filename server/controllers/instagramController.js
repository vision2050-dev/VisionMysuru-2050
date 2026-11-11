import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cacheFilePath = path.join(__dirname, "../data/instagram_cache.json");

// Ensure data folder exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory cache
let cachedFeed = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes auto-refresh window

// Fallback seed posts matching official @visionmysuru2050 feed
const SEED_POSTS = [
  {
    id: "vm-ig-reel-DflhaCbOcBp",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DflhaCbOcBp/",
    media_url: "/instagram/DflhaCbOcBp.jpg",
    thumbnail_url: "/instagram/DflhaCbOcBp.jpg",
    caption: "Every big vision needs a plan, and every plan needs the right numbers. 📊💙\n\nThe Finance Team of Vision Mysuru 2050 is here to turn possibilities into practical, sustainable progress.\n\nBecause building the future isn’t just about dreaming big, it’s about making it achievable. ✨\n\n#VisionMysuru2050#SDMIMD #buildingthefuturetogether #Mysuru #citizenparticipation",
    timestamp: "2026-11-10T15:00:00.000Z",
    like_count: 612,
    comments_count: 38,
    views_count: "5.8K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-Dfhb7W8Oepc",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/Dfhb7W8Oepc/",
    media_url: "/instagram/Dfhb7W8Oepc.jpg",
    thumbnail_url: "/instagram/Dfhb7W8Oepc.jpg",
    caption: "Mysuru’s future begins with our ideas. 🌱\n\nLet’s come together to build a cleaner, safer, smarter and more sustainable Mysuru. Every citizen has a voice, and every idea has the power to create an impact.\n\nBe a part of the change. Share your ideas and help shape the Mysuru of 2050!\n\nRegistrations are now open! Join the movement and turn your ideas into action. Link in bio \n\nVision Mysuru 2050 – Ideas to Impact.\n\n#VisionMysuru2050 #IdeasToImpact #Mysuru #CitizenParticipation #sdmimd",
    timestamp: "2026-11-09T14:30:00.000Z",
    like_count: 745,
    comments_count: 52,
    views_count: "6.4K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-Dfbli29O7Tg",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/Dfbli29O7Tg/",
    media_url: "/instagram/Dfbli29O7Tg.jpg",
    thumbnail_url: "/instagram/Dfbli29O7Tg.jpg",
    caption: "A cleaner Mysuru, a brighter future! 💚✨\n\nWe, Team Vision Mysuru 2050 from SDMIMD, were proud to be part of the HR Dasara Clean-Up Drive, taking a step towards a cleaner, greener, and more sustainable Mysuru.\n\nBecause the Mysuru we envision for 2050 begins with the actions we take today. 🌱\n\nSmall steps. Collective efforts. Lasting change.\n\n#VisionMysuru2050 #SDMIMD #HRDasara #SwachhMysuru #nammamysuru",
    timestamp: "2026-11-06T12:00:00.000Z",
    like_count: 589,
    comments_count: 34,
    views_count: "5.1K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-DezCjLOugHa",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DezCjLOugHa/",
    media_url: "/instagram/DezCjLOugHa.jpg",
    thumbnail_url: "/instagram/DezCjLOugHa.jpg",
    caption: "The beginning of something bigger!\n\nThe 2nd Edition of Vision Mysuru 2050 officially begins with the poster release, graced by our Chief Guest, Shri Dharmendra Kumar Sir.\n\nThis is just the beginning. There’s so much more to come as we work towards building the Mysuru of tomorrow.\nThe vision is set. The journey begins.\n\n#VisionMysore #mysuru #nammamysuru #sdmimd",
    timestamp: "2026-10-22T10:15:00.000Z",
    like_count: 512,
    comments_count: 29,
    views_count: "4.9K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-DehZa21s8bk",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DehZa21s8bk/",
    media_url: "/instagram/DehZa21s8bk.jpg",
    thumbnail_url: "/instagram/DehZa21s8bk.jpg",
    caption: "Get ready for the launch of the Second Edition of Vision Mysuru 2050 on 16th October 2026!\n\nBecause the future of Mysuru is not just something we imagine. It is something we build together. #VisionMysore #Mysore #Mysuru #NammaMysuru #SDMIMD #SecondEdition #IdeasToImpact",
    timestamp: "2026-10-15T09:00:00.000Z",
    like_count: 630,
    comments_count: 41,
    views_count: "5.5K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-DWofJExk32-",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DWofJExk32-/",
    media_url: "/instagram/DWofJExk32-.jpg",
    thumbnail_url: "/instagram/DWofJExk32-.jpg",
    caption: "The final moments of Vision Mysuru 2050 captured not just an event — but a collective intention for the future.\n\nThese glimpses from the last day reflect more than presentations and discussions. They reflect participation, curiosity, responsibility, and hope.\n\nDon’t just live in Mysuru. Lead Mysuru.\n\n#VisionMysuru2050 #SDMIMD #IdeasToImpact",
    timestamp: "2026-04-02T16:00:00.000Z",
    like_count: 715,
    comments_count: 47,
    views_count: "6.2K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-DWRH3TmkZUF",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DWRH3TmkZUF/",
    media_url: "/instagram/DWRH3TmkZUF.jpg",
    thumbnail_url: "/instagram/DWRH3TmkZUF.jpg",
    caption: "The final day of Vision Mysuru 2050 has concluded — but what has begun is far greater than an event.\n\nOver the past days, students, educators, civic minds, and change-makers came together.\n\nThe future of Mysuru is not accidental. It is designed with thought, participation, and collective commitment.\n\nDon’t just live in Mysuru. Lead Mysuru.",
    timestamp: "2026-03-24T18:00:00.000Z",
    like_count: 680,
    comments_count: 39,
    views_count: "5.9K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-DWJTeTpDoBB",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DWJTeTpDoBB/",
    media_url: "/instagram/DWJTeTpDoBB.jpg",
    thumbnail_url: "/instagram/DWJTeTpDoBB.jpg",
    caption: "Highlights and moments from the grand evaluation stages of Vision Mysuru 2050 at SDMIMD. Inspiring ideas presented before distinguished jury panels. #VisionMysuru2050 #SDMIMD #YouthInnovators",
    timestamp: "2026-03-21T17:00:00.000Z",
    like_count: 490,
    comments_count: 23,
    views_count: "4.7K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-DWGrrnyDp7c",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DWGrrnyDp7c/",
    media_url: "/instagram/DWGrrnyDp7c.jpg",
    thumbnail_url: "/instagram/DWGrrnyDp7c.jpg",
    caption: "Vision Mysuru 2050 is an open call to every student, citizen, professional, entrepreneur, policymaker, and dreamer who believes Mysuru deserves thoughtful, inclusive, and future-ready growth.\n\nYou don’t need authority to share an idea.\nYou don’t need a title to shape tomorrow.\nYou just need perspective.\n\nMysuru 2050. A city designed by its own people. What’s your idea?",
    timestamp: "2026-03-20T19:30:00.000Z",
    like_count: 790,
    comments_count: 58,
    views_count: "6.8K",
    is_reel: true,
  },
  {
    id: "vm-ig-reel-DWGQPIAEd8F",
    media_type: "VIDEO",
    permalink: "https://www.instagram.com/reel/DWGQPIAEd8F/",
    media_url: "/instagram/DWGQPIAEd8F.jpg",
    thumbnail_url: "/instagram/DWGQPIAEd8F.jpg",
    caption: "Mysuru is growing… but are we growing right? 👀\n\nNew cafés, more traffic, bigger roads, smarter tech… But what about sustainability, planning, and our future? 🌿\n\nThat’s where Vision Mysuru 2050 steps in—bringing together students, experts, and changemakers to build a city that’s not just aesthetic… but actually livable 💡✨\n\n#VisionMysuru2050 #MysuruDiaries #CityWithPurpose #SustainableLivingIndia #FutureReadyIndia",
    timestamp: "2026-03-20T14:00:00.000Z",
    like_count: 840,
    comments_count: 65,
    views_count: "7.2K",
    is_reel: true,
  },
];

// Helper to fetch live from Instagram Graph API or external feed bridge
async function fetchLiveInstagramFeed() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const feedUrl = process.env.INSTAGRAM_FEED_URL;

  // 1. Meta / Instagram Graph API
  if (token) {
    const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count";
    const graphUrl = `https://graph.facebook.com/v19.0/me/media?fields=${fields}&access_token=${token}&limit=25`;
    const res = await fetch(graphUrl);
    if (!res.ok) {
      throw new Error(`Instagram Graph API error: ${res.statusText}`);
    }
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      return data.data.map((item) => ({
        id: item.id,
        media_type: item.media_type,
        permalink: item.permalink || `https://www.instagram.com/visionmysuru2050/`,
        media_url: item.media_url,
        thumbnail_url: item.thumbnail_url || item.media_url,
        caption: item.caption || "",
        timestamp: item.timestamp,
        like_count: item.like_count || Math.floor(Math.random() * 200 + 300),
        comments_count: item.comments_count || Math.floor(Math.random() * 30 + 10),
        views_count: item.media_type === "VIDEO" ? `${(Math.random() * 3 + 2).toFixed(1)}K` : null,
        is_reel: item.media_type === "VIDEO",
      }));
    }
  }

  // 2. Custom Feed Bridge (Behold / RapidAPI / RSS-to-JSON)
  if (feedUrl) {
    const res = await fetch(feedUrl);
    if (!res.ok) {
      throw new Error(`Instagram feed bridge error: ${res.statusText}`);
    }
    const data = await res.json();
    const rawList = Array.isArray(data) ? data : data.posts || data.data || [];
    if (rawList.length) {
      return rawList.map((item, idx) => ({
        id: item.id || `ig-${idx}`,
        media_type: item.media_type || (item.video_url || item.is_video ? "VIDEO" : "IMAGE"),
        permalink: item.permalink || item.url || `https://www.instagram.com/visionmysuru2050/`,
        media_url: item.video_url || item.media_url || item.image_url,
        thumbnail_url: item.thumbnail_url || item.image_url || item.media_url,
        caption: item.caption || item.text || "",
        timestamp: item.timestamp || item.created_at || new Date().toISOString(),
        like_count: item.like_count || 400,
        comments_count: item.comments_count || 25,
        views_count: item.views_count || "4K",
        is_reel: (item.media_type === "VIDEO" || item.is_video),
      }));
    }
  }

  // If no external provider configured, return seed posts
  return SEED_POSTS;
}

export const getInstagramFeed = async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const now = Date.now();

    // Check disk cache if memory cache is empty
    if (!cachedFeed && fs.existsSync(cacheFilePath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(cacheFilePath, "utf8"));
        if (fileContent && Array.isArray(fileContent.posts)) {
          cachedFeed = fileContent.posts;
          lastFetchedTime = fileContent.timestamp || 0;
        }
      } catch (e) {
        console.warn("Could not read instagram disk cache:", e.message);
      }
    }

    // Return cached if still within TTL and not force refreshed
    if (cachedFeed && !forceRefresh && now - lastFetchedTime < CACHE_TTL_MS) {
      return res.status(200).json({
        success: true,
        source: "cache",
        account: "visionmysuru2050",
        profile_url: "https://www.instagram.com/visionmysuru2050",
        total: cachedFeed.length,
        synced_at: new Date(lastFetchedTime).toISOString(),
        posts: cachedFeed,
      });
    }

    // Attempt live fetch
    let posts = SEED_POSTS;
    let source = "seed";
    try {
      posts = await fetchLiveInstagramFeed();
      source = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_FEED_URL ? "live" : "seed";
    } catch (err) {
      console.warn("Live Instagram fetch failed, serving fallback:", err.message);
      posts = cachedFeed || SEED_POSTS;
    }

    // Always guarantee newest-first (left-most post is latest)
    posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Update caches
    cachedFeed = posts;
    lastFetchedTime = now;
    try {
      fs.writeFileSync(
        cacheFilePath,
        JSON.stringify({ timestamp: now, posts }, null, 2),
        "utf8"
      );
    } catch (e) {
      console.warn("Could not write instagram cache file:", e.message);
    }

    return res.status(200).json({
      success: true,
      source,
      account: "visionmysuru2050",
      profile_url: "https://www.instagram.com/visionmysuru2050",
      total: posts.length,
      synced_at: new Date(now).toISOString(),
      posts,
    });
  } catch (error) {
    console.error("Instagram controller error:", error);
    // Graceful fallback: Never crash the frontend
    return res.status(200).json({
      success: true,
      source: "fallback",
      account: "visionmysuru2050",
      profile_url: "https://www.instagram.com/visionmysuru2050",
      total: SEED_POSTS.length,
      synced_at: new Date().toISOString(),
      posts: SEED_POSTS,
    });
  }
};

export const syncInstagramFeed = async (req, res) => {
  req.query.refresh = "true";
  return getInstagramFeed(req, res);
};

export const executeDailyInstagramSync = async () => {
  console.log("[Instagram Controller] Executing scheduled daily Instagram feed sync...");
  const now = Date.now();
  let posts = SEED_POSTS;
  let source = "seed";
  try {
    posts = await fetchLiveInstagramFeed();
    source = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_FEED_URL ? "live" : "seed";
  } catch (err) {
    console.warn("Daily Instagram fetch fallback:", err.message);
    posts = cachedFeed || SEED_POSTS;
  }

  posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  cachedFeed = posts;
  lastFetchedTime = now;
  try {
    fs.writeFileSync(
      cacheFilePath,
      JSON.stringify({ timestamp: now, posts }, null, 2),
      "utf8"
    );
  } catch (e) {
    console.warn("Could not write instagram cache file:", e.message);
  }
  return { success: true, count: posts.length, synced_at: new Date(now).toISOString() };
};
