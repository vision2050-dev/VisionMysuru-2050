import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_UPLOAD_DIR = path.join(__dirname, "../uploads/temp");
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "videoFile") {
    // Accept standard video types
    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime", // .mov
      "video/x-matroska", // .mkv
      "video/avi",
      "video/x-msvideo",
    ];
    if (
      allowedVideoTypes.includes(file.mimetype) ||
      file.originalname.match(/\.(mp4|mov|webm|mkv|avi)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only video files (.mp4, .mov, .webm, .mkv) are allowed for the pitch video."));
    }
  } else if (file.fieldname === "documentFile") {
    // Accept PDF, Word, PowerPoint
    if (
      file.mimetype.includes("pdf") ||
      file.mimetype.includes("word") ||
      file.mimetype.includes("presentation") ||
      file.originalname.match(/\.(pdf|docx|doc|pptx|ppt)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Supplementary document must be a PDF, DOCX, or PPTX file."));
    }
  } else {
    cb(null, true);
  }
};

export const submissionUpload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max for pitch videos
  },
  fileFilter,
}).fields([
  { name: "videoFile", maxCount: 1 },
  { name: "documentFile", maxCount: 1 },
]);
