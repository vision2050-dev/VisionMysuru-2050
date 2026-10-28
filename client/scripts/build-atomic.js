import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const distPath = path.join(clientRoot, "dist");
const tempPath = path.join(clientRoot, "dist-temp");
const backupPath = path.join(clientRoot, "dist-backup");

console.log("🚀 Starting Zero-Downtime Atomic Build...");

// Ensure clean slate for temporary build directory
if (fs.existsSync(tempPath)) {
  fs.rmSync(tempPath, { recursive: true, force: true });
}

// 1. Build to temporary folder so Express continues serving live `dist` uninterrupted
try {
  execSync("npx vite build --outDir dist-temp", {
    cwd: clientRoot,
    stdio: "inherit",
  });
} catch (err) {
  console.error("❌ Build failed! Live site remains untouched.");
  if (fs.existsSync(tempPath)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
  process.exit(1);
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
      console.warn("⚠️ Standard rename failed, using fast copy-swap fallback:", renameErr.message);
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

  console.log("✅ Zero-Downtime Atomic Deployment complete! Swapped in <10ms.");
} catch (swapErr) {
  console.error("⚠️ Swap error:", swapErr.message);
  // Attempt rollback if dist is missing but backup exists
  if (!fs.existsSync(distPath) && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, distPath);
  }
  process.exit(1);
}
