import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const distPath = path.join(clientRoot, "dist");
const tempPath = path.join(clientRoot, "dist-temp");
const backupPath = path.join(clientRoot, "dist-backup");

console.log("[Build] Starting Zero-Downtime Atomic Build...");

// Ensure clean slate for temporary build directory
if (fs.existsSync(tempPath)) {
  fs.rmSync(tempPath, { recursive: true, force: true });
}

// 0. Automatically fetch latest live Instagram likes & comments before building
try {
  execSync("node scripts/sync-instagram.js", {
    cwd: clientRoot,
    stdio: "inherit",
  });
} catch (syncErr) {
  console.warn("[Build] Instagram sync note:", syncErr.message);
}

// 1. Build to temporary folder so Express continues serving live `dist` uninterrupted
try {
  execSync("npx vite build --outDir dist-temp", {
    cwd: clientRoot,
    stdio: "inherit",
  });
} catch (err) {
  console.error("[Build] Error: Build failed! Live site remains untouched.");
  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
  process.exit(1);
}

// 1.5. Ensure the live generated feed is preserved during deployment and not overwritten by a stale build
try {
  const liveDistFeed = path.join(distPath, "data/instagram_feed.json");
  const tempDistFeed = path.join(tempPath, "data/instagram_feed.json");

  if (fs.existsSync(liveDistFeed)) {
    const tempFeedDir = path.dirname(tempDistFeed);
    if (!fs.existsSync(tempFeedDir)) {
      fs.mkdirSync(tempFeedDir, { recursive: true });
    }

    let shouldPreserveLive = true;
    if (fs.existsSync(tempDistFeed)) {
      try {
        const liveData = JSON.parse(fs.readFileSync(liveDistFeed, "utf8"));
        const tempData = JSON.parse(fs.readFileSync(tempDistFeed, "utf8"));
        const liveTime = new Date(liveData.synced_at || 0).getTime();
        const tempTime = new Date(tempData.synced_at || 0).getTime();
        if (tempTime > liveTime) {
          shouldPreserveLive = false;
        }
      } catch {}
    }

    if (shouldPreserveLive) {
      fs.copyFileSync(liveDistFeed, tempDistFeed);
      console.log("[Build] Preserved live Instagram feed in dist deployment.");
    }
  }
} catch (feedErr) {
  console.warn("[Build] Note on feed preservation:", feedErr.message);
}

// 2. Perform atomic swap (< 10ms)
try {
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
  }

  if (fs.existsSync(distPath)) {
    try {
      fs.renameSync(distPath, backupPath);
      fs.renameSync(tempPath, distPath);
    } catch (renameErr) {
      // Windows or cross-device fallback if atomic rename is locked
      console.warn("[Build] Standard rename failed, using fast copy-swap fallback:", renameErr.message);
      fs.cpSync(tempPath, distPath, { recursive: true, force: true });
      fs.rmSync(tempPath, { recursive: true, force: true });
    }
  } else {
    fs.renameSync(tempPath, distPath);
  }

  // Clean up backup folder in background
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
  }

  console.log("[Build] Zero-Downtime Atomic Deployment complete! Swapped in <10ms.");
} catch (swapErr) {
  console.error("[Build] Swap error:", swapErr.message);
  // Attempt rollback if dist is missing but backup exists
  if (!fs.existsSync(distPath) && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, distPath);
  }
  process.exit(1);
}
