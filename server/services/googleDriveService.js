import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target Google Drive folder provided by the user for VisionMysuru 2050 Edition 2
export const TARGET_DRIVE_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e";

// Local staging root directory for direct file staging & offline/local testing
export const LOCAL_SYNC_DIR = path.join(
  __dirname,
  "../uploads/drive_sync",
  TARGET_DRIVE_FOLDER_ID,
);

export const VIDEOS_SUBDIR = path.join(LOCAL_SYNC_DIR, "Videos");
export const DOCUMENTS_SUBDIR = path.join(LOCAL_SYNC_DIR, "Documents");
export const SPREADSHEETS_SUBDIR = path.join(LOCAL_SYNC_DIR, "Spreadsheets");

// Ensure dedicated subfolders exist
[LOCAL_SYNC_DIR, VIDEOS_SUBDIR, DOCUMENTS_SUBDIR, SPREADSHEETS_SUBDIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Initialize Google Drive API Client
 * Supports Service Account Key file / JSON string, or OAuth2 Refresh Token
 */
export const getDriveClient = () => {
  try {
    // 1. Service Account Key JSON provided via env
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      let credentials;
      try {
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      } catch {
        if (fs.existsSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)) {
          credentials = JSON.parse(
            fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "utf-8"),
          );
        }
      }
      if (credentials) {
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/drive"],
        });
        return google.drive({ version: "v3", auth });
      }
    }

    // 2. OAuth2 Refresh Token provided via env
    if (
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN
    ) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
      return google.drive({ version: "v3", auth: oauth2Client });
    }

    return null;
  } catch (error) {
    console.warn("Google Drive API Auth Warning:", error.message);
    return null;
  }
};

/**
 * Finds or creates a subfolder in Google Drive (e.g. 'Videos', 'Documents', 'Spreadsheets')
 */
export const getOrCreateDriveSubfolder = async (folderName, parentFolderId = TARGET_DRIVE_FOLDER_ID) => {
  const drive = getDriveClient();
  if (!drive) {
    return { folderId: `local-${folderName.toLowerCase()}`, folderName };
  }

  try {
    const query = `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const existing = await drive.files.list({
      q: query,
      fields: "files(id, name)",
    });

    if (existing.data.files && existing.data.files.length > 0) {
      return { folderId: existing.data.files[0].id, folderName };
    }

    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: "id, name",
    });

    return { folderId: folder.data.id, folderName };
  } catch (error) {
    console.warn(`[Drive] Could not get/create remote subfolder ${folderName}:`, error.message);
    return { folderId: `local-${folderName.toLowerCase()}`, folderName };
  }
};

/**
 * Upload a file directly to Google Drive under a specific subfolder (e.g. Videos, Documents, Spreadsheets)
 */
export const uploadToGoogleDrive = async ({
  filePath,
  fileName,
  mimeType,
  folderType = "Videos", // "Videos" | "Documents" | "Spreadsheets"
  parentFolderId = TARGET_DRIVE_FOLDER_ID,
}) => {
  const drive = getDriveClient();
  if (!drive) {
    return {
      synced: false,
      message: `Drive API credentials not set. File safely stored in local sync folder (${folderType}).`,
      driveFolderId: parentFolderId,
    };
  }

  try {
    // Resolve subfolder in Drive
    const subfolder = await getOrCreateDriveSubfolder(folderType, parentFolderId);
    const targetParentId = subfolder.folderId.startsWith("local-") ? parentFolderId : subfolder.folderId;

    const fileMetadata = {
      name: fileName,
      parents: [targetParentId],
    };
    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink",
    });

    return {
      synced: true,
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      driveFolderId: targetParentId,
    };
  } catch (error) {
    console.error("Google Drive Upload Error:", error.message);
    return {
      synced: false,
      error: error.message,
      driveFolderId: parentFolderId,
    };
  }
};

/**
 * HTTP 206 Partial Content Video Range Streamer
 * Allows smooth seeking, scrub, and fast start for judges in the Juryza Hub
 */
export const streamVideoFile = (filePath, req, res) => {
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Video file not found on server" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
      "Access-Control-Allow-Origin": "*",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};
