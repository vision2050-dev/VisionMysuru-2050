import "dotenv/config";
import { syncAllStagedFilesToDrive, getDriveClient, TARGET_DRIVE_FOLDER_ID } from "./services/googleDriveService.js";

async function run() {
  console.log("=== Vision Mysuru 2050 - Google Drive Sync Utility ===");
  console.log(`Target Folder ID: ${TARGET_DRIVE_FOLDER_ID}`);
  console.log(`Target Folder URL: https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`);
  
  const client = getDriveClient();
  const hasAppsScript = Boolean(process.env.GOOGLE_APPS_SCRIPT_URL);

  if (!client && !hasAppsScript) {
    console.log("\n⚠️  No Google Drive Credentials Detected!");
    console.log("To allow automated cloud uploads, choose one of the two options below:\n");
    console.log("Option 1 (Recommended): Google Service Account Key");
    console.log("  1. Place your 'service-account.json' inside the 'server/' folder.");
    console.log(`  2. In Google Drive, share folder '${TARGET_DRIVE_FOLDER_ID}' with the Service Account email as 'Editor'.`);
    console.log("\nOption 2: Google Apps Script Webhook");
    console.log("  1. Add GOOGLE_APPS_SCRIPT_URL=<your-web-app-url> to 'server/.env'.\n");
    process.exit(1);
  }

  console.log("\n🚀 Starting sync of all locally staged submission files...");
  try {
    const results = await syncAllStagedFilesToDrive();
    console.log("\nSync Results Summary:");
    results.forEach((r) => {
      console.log(`- [${r.category}] ${r.file}: ${r.synced ? "✅ Synced (" + r.fileId + ")" : "❌ " + (r.message || r.error)}`);
    });
    console.log("\nSync complete!");
  } catch (err) {
    console.error("Sync error:", err.message);
  }
}

run();
