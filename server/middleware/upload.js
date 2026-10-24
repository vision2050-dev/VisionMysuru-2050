import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  VIDEOS_SUBDIR,
  DOCUMENTS_SUBDIR,
} from "../services/googleDriveService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_UPLOAD_DIR = path.join(__dirname, "../uploads/temp");
[TEMP_UPLOAD_DIR, VIDEOS_SUBDIR, DOCUMENTS_SUBDIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "videoFile") {
      cb(null, VIDEOS_SUBDIR);
    } else if (file.fieldname === "documentFile") {
      cb(null, DOCUMENTS_SUBDIR);
    } else {
      cb(null, TEMP_UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${file.fieldname}-${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "videoFile") {
    // Strictly .mp4 as specified by user
    const isMp4 =
      file.mimetype === "video/mp4" ||
      file.originalname.toLowerCase().endsWith(".mp4");
    if (isMp4) {
      cb(null, true);
    } else {
      cb(new Error("Pitch video must strictly be an .mp4 file (Maximum 50 MB)."));
    }
  } else if (file.fieldname === "documentFile") {
    // Strictly .pdf as specified by user
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error("Supplementary proposal must strictly be a .pdf file (Maximum 5 MB)."));
    }
  } else {
    cb(null, true);
  }
};

const multerUploader = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB upper ceiling
  },
  fileFilter,
}).fields([
  { name: "videoFile", maxCount: 1 },
  { name: "documentFile", maxCount: 1 },
]);

/**
 * Middleware wrapper enforcing:
 * 1. Both files must be present (compulsory)
 * 2. .mp4 <= 50 MB
 * 3. .pdf <= 5 MB
 */
export const submissionUpload = (req, res, next) => {
  multerUploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message:
            "File size limit exceeded. Pitch video must be ≤ 50 MB and PDF proposal must be ≤ 5 MB.",
        });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    // Both files are strictly compulsory for participants
    if (!req.files || !req.files.videoFile || !req.files.videoFile[0]) {
      return res.status(400).json({
        message:
          "Pitch video (.mp4, maximum 50 MB) is compulsory to complete registration.",
      });
    }

    if (!req.files || !req.files.documentFile || !req.files.documentFile[0]) {
      return res.status(400).json({
        message:
          "Proposal document (.pdf, maximum 5 MB) is compulsory to complete registration.",
      });
    }

    const video = req.files.videoFile[0];
    const doc = req.files.documentFile[0];

    // Enforce 50 MB limit on .mp4
    if (video.size > 50 * 1024 * 1024) {
      try {
        fs.unlinkSync(video.path);
      } catch {}
      return res.status(400).json({
        message: `Pitch video exceeds the 50 MB limit (Current: ${(
          video.size /
          (1024 * 1024)
        ).toFixed(1)} MB). Please compress or trim your video.`,
      });
    }

    // Enforce 5 MB limit on .pdf
    if (doc.size > 5 * 1024 * 1024) {
      try {
        fs.unlinkSync(doc.path);
      } catch {}
      return res.status(400).json({
        message: `Proposal PDF exceeds the 5 MB limit (Current: ${(
          doc.size /
          (1024 * 1024)
        ).toFixed(1)} MB). Maximum allowed size is 5 MB.`,
      });
    }

    next();
  });
};
