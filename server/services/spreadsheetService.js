import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import {
  TARGET_DRIVE_FOLDER_ID,
  uploadToGoogleDrive,
} from "./googleDriveService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base Drive sync directories
export const SPREADSHEETS_DIR = path.join(
  __dirname,
  "../uploads/drive_sync",
  TARGET_DRIVE_FOLDER_ID,
  "Spreadsheets",
);
export const VIDEOS_DIR = path.join(
  __dirname,
  "../uploads/drive_sync",
  TARGET_DRIVE_FOLDER_ID,
  "Videos",
);
export const DOCUMENTS_DIR = path.join(
  __dirname,
  "../uploads/drive_sync",
  TARGET_DRIVE_FOLDER_ID,
  "Documents",
);

// Ensure directories exist
[SPREADSHEETS_DIR, VIDEOS_DIR, DOCUMENTS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const SPREADSHEET_FILE_NAME = "VisionMysuru_2050_Edition2_MasterData.xlsx";
export const SPREADSHEET_CSV_NAME = "VisionMysuru_2050_Edition2_MasterData.csv";

export const getSpreadsheetFilePath = () =>
  path.join(SPREADSHEETS_DIR, SPREADSHEET_FILE_NAME);

export const getSpreadsheetCsvPath = () =>
  path.join(SPREADSHEETS_DIR, SPREADSHEET_CSV_NAME);

/**
 * Generates and updates the master event spreadsheet containing:
 * 1. Sheet 1: "Submissions_Teams" (Team details, Gmail IDs, Video & Doc names, Stage, Alloted Judges, Scores, Registration Time)
 * 2. Sheet 2: "Judges_Roster" (Judge Name, Gmail ID, Assigned Domain, Alloted Teams, Registered Time)
 */
export const updateMasterSpreadsheet = async ({ submissions = [], judges = [] }) => {
  try {
    // 1. Prepare Submissions Data
    const submissionsData = submissions.map((sub, idx) => {
      const leader = sub.members?.find((m) => m.isLeader) || sub.members?.[0] || {};
      const otherMembers = (sub.members || [])
        .filter((m) => !m.isLeader)
        .map((m) => `${m.name} (${m.email})`)
        .join("; ");

      return {
        "Sl No": idx + 1,
        "Team ID": sub.teamId || "N/A",
        "Team Name": sub.teamName || "Untitled Team",
        "Category": sub.category || "General",
        "Theme / Focus Area": sub.theme || "General",
        "Solution Name": sub.solutionName || "N/A",
        "Leader Name": leader.name || sub.leadName || "N/A",
        "Leader Gmail": leader.email || sub.leadEmail || sub.participantEmail || "N/A",
        "Leader Phone": leader.phone || sub.leadPhone || "N/A",
        "College / Institution":
          leader.college || sub.organizationDetails?.institution || "N/A",
        "Other Members": otherMembers || "None",
        "Pitch Video (.mp4)": sub.video?.originalName || (sub.video?.localPath ? path.basename(sub.video.localPath) : "Uploaded"),
        "Pitch Proposal (.pdf)": sub.document?.name || (sub.document?.localPath ? path.basename(sub.document.localPath) : "Uploaded"),
        "Registration Timestamp": sub.createdAt
          ? new Date(sub.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
          : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        "Current Stage": sub.stage || sub.status || "submitted",
        "Alloted Judge(s)": Array.isArray(sub.allotedJudges) && sub.allotedJudges.length > 0
          ? sub.allotedJudges.join(", ")
          : "Unalloted",
        "Rubric Score": typeof sub.rubricAverage === "number" ? sub.rubricAverage.toFixed(1) : "Pending",
        "Duel Elo Rating": sub.eloRating || 1200,
        "Drive Stored Folder": `https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`,
      };
    });

    // 2. Prepare Judges Data
    const judgesData = judges.map((judge, idx) => {
      const allotedCount = Array.isArray(judge.allotedTeams) ? judge.allotedTeams.length : 0;
      return {
        "Sl No": idx + 1,
        "Judge Name": judge.name || "N/A",
        "Judge Gmail": judge.email || "N/A",
        "Organization": judge.organization || "SDMIMD Panel",
        "Assigned Domain / Specialization": judge.specialization || judge.assignedDomain || "All Tracks",
        "Registration Timestamp": judge.createdAt
          ? new Date(judge.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
          : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        "Alloted Teams Count": allotedCount,
        "Alloted Team IDs": Array.isArray(judge.allotedTeams) ? judge.allotedTeams.join(", ") : "None",
        "Role": judge.role || "judge",
      };
    });

    // 3. Create Workbook
    const workbook = XLSX.utils.book_new();

    const subSheet = XLSX.utils.json_to_sheet(
      submissionsData.length > 0
        ? submissionsData
        : [
            {
              "Message": "No submissions recorded yet",
              "Status": "Waiting for team registrations",
            },
          ],
    );

    const judgeSheet = XLSX.utils.json_to_sheet(
      judgesData.length > 0
        ? judgesData
        : [
            {
              "Message": "No judges registered yet",
              "Status": "Waiting for judge signups",
            },
          ],
    );

    // Auto-fit column widths
    const setColWidths = (sheet, data) => {
      if (!data || data.length === 0) return;
      const keys = Object.keys(data[0]);
      sheet["!cols"] = keys.map((key) => {
        let maxLen = key.length;
        data.forEach((row) => {
          const val = row[key] ? String(row[key]) : "";
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
      });
    };

    setColWidths(subSheet, submissionsData);
    setColWidths(judgeSheet, judgesData);

    XLSX.utils.book_append_sheet(workbook, subSheet, "Submissions_Teams");
    XLSX.utils.book_append_sheet(workbook, judgeSheet, "Judges_Roster");

    // Write Excel file
    const excelPath = getSpreadsheetFilePath();
    XLSX.writeFile(workbook, excelPath);

    // Write CSV file (Submissions sheet)
    const csvPath = getSpreadsheetCsvPath();
    const csvContent = XLSX.utils.sheet_to_csv(subSheet);
    fs.writeFileSync(csvPath, csvContent, "utf-8");

    console.log(`[Spreadsheet] Successfully updated master spreadsheet at: ${excelPath}`);

    // Sync to Google Drive if credentials available
    try {
      await uploadToGoogleDrive({
        filePath: excelPath,
        fileName: SPREADSHEET_FILE_NAME,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        parentFolderId: TARGET_DRIVE_FOLDER_ID,
      });
    } catch (driveErr) {
      console.warn("[Spreadsheet] Drive sync note:", driveErr.message);
    }

    return {
      success: true,
      excelPath,
      csvPath,
      submissionsCount: submissionsData.length,
      judgesCount: judgesData.length,
    };
  } catch (error) {
    console.error("[Spreadsheet Error]:", error);
    return { success: false, error: error.message };
  }
};
