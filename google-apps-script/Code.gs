/**
 * ============================================================================
 * Vision Mysuru 2050 - Master Google Apps Script Webhook
 * ============================================================================
 * Handles:
 *  1. Updating & maintaining a single, live, official Master Google Sheet
 *     ("VisionMysuru_2050_Edition2_MasterData") in Google Drive without
 *     creating duplicate files on every registration.
 *  2. In-place sync for "VisionMysuru_2050_MasterState.json" and
 *     "VisionMysuru_2050_Edition2_MasterData.csv".
 *  3. File uploads (PDF proposals -> "Documents", Videos -> "Videos").
 *  4. 6-Digit Password Reset OTP Email delivery.
 *  5. Direct GET API for Admin and Jury portals to fetch all submissions.
 * ============================================================================
 */

var MASTER_FOLDER_ID = "1UKXUmqcMewEhw_KG7L1Fe740yCd6fX2e";
var MASTER_SHEET_NAME = "VisionMysuru_2050_Edition2_MasterData";
var MASTER_JSON_NAME = "VisionMysuru_2050_MasterState.json";
var MASTER_CSV_NAME = "VisionMysuru_2050_Edition2_MasterData.csv";

/**
 * Main POST handler
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ============================================================
    // 1. ACTION: Send 6-Digit Password Reset OTP via Email
    // ============================================================
    if (data.action === "send_otp") {
      var recipient = data.email;
      var otpCode = data.otp;
      var participantName = data.name || "Participant";

      if (!recipient || !otpCode) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "Recipient email and OTP code are required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var subject = "🔐 Vision Mysuru 2050 - Password Reset OTP: " + otpCode;
      var htmlBody = 
        '<div style="font-family: Arial, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">' +
          '<div style="text-align: center; margin-bottom: 20px;">' +
            '<h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800;">Vision Mysuru 2050</h2>' +
            '<p style="color: #64748b; font-size: 13px; margin-top: 4px;">Grand Challenge & Hackathon • SDMIMD</p>' +
          '</div>' +
          '<div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">' +
            '<p style="margin-top: 0; color: #1e293b; font-size: 14px;">Hello <strong>' + participantName + '</strong>,</p>' +
            '<p style="color: #475569; font-size: 14px; line-height: 1.5;">You requested to reset your password for the Vision Mysuru 2050 Participant Portal. Use the verification code below:</p>' +
            '<div style="text-align: center; margin: 24px 0;">' +
              '<div style="display: inline-block; padding: 12px 28px; background-color: #1e3a8a; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 6px; border-radius: 10px; font-family: monospace;">' +
                otpCode +
              '</div>' +
            '</div>' +
            '<p style="color: #64748b; font-size: 12px; margin-bottom: 0; text-align: center;">This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>' +
          '</div>' +
          '<div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 11px;">' +
            '<p style="margin: 0;">Vision Mysuru 2050 • SDMIMD, No. 1, Chamundi Hill Road, Mysuru</p>' +
          '</div>' +
        '</div>';

      MailApp.sendEmail({
        to: recipient,
        subject: subject,
        htmlBody: htmlBody
      });

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "OTP sent successfully to " + recipient
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var folder = DriveApp.getFolderById(MASTER_FOLDER_ID);

    // ============================================================
    // 2. ACTION: Register / Update Submission in Single Master Sheet
    // ============================================================
    if (data.action === "register_submission" || data.action === "update_submission") {
      var sub = data.submission;
      var user = data.user;

      if (!sub || !sub.teamId) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: "Submission with valid teamId is required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var sheetObj = getOrCreateMasterGoogleSheet(folder);
      var ss = sheetObj.spreadsheet;

      // 1. Update or append row in Master Google Sheet
      var row = updateOrAppendSubmissionInSheet(ss, sub);

      // 2. Update MasterState.json in place (merging without duplicates)
      var updatedState = updateMasterJsonInPlace(folder, sub, user);

      // 3. Update Master CSV in place
      updateMasterCsvInPlace(folder, ss);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Submission updated in master spreadsheet successfully.",
        teamId: sub.teamId,
        spreadsheetUrl: sheetObj.file.getUrl(),
        spreadsheetId: sheetObj.file.getId(),
        totalSubmissions: ss.getActiveSheet().getLastRow() - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ============================================================
    // 3. ACTION: Sync Master State (Full portal state from Admin)
    // ============================================================
    if (data.action === "sync_master_state") {
      var stateData = data.stateData || {};
      var sheetObj = getOrCreateMasterGoogleSheet(folder);
      var ss = sheetObj.spreadsheet;

      // Update JSON file in-place
      updateMasterJsonDirect(folder, stateData);

      // Synchronize rows into Master Sheet
      var subsList = stateData.submissions || [];
      for (var i = 0; i < subsList.length; i++) {
        updateOrAppendSubmissionInSheet(ss, subsList[i]);
      }

      // Update CSV in-place
      updateMasterCsvInPlace(folder, ss);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Master state synchronized across Sheet, JSON and CSV.",
        spreadsheetUrl: sheetObj.file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ============================================================
    // 4. ACTION: File Upload (PDFs, Videos, or Spreadsheets)
    // ============================================================
    var folderType = data.folderType || "Uploads";
    var targetFolder = getOrCreateSubfolder(folder, folderType);

    // If uploading to Spreadsheets folder, prevent duplicate file creation!
    if (folderType === "Spreadsheets") {
      var existing = targetFolder.getFilesByName(data.fileName);
      if (existing.hasNext()) {
        var existingFile = existing.next();
        var mime = String(data.mimeType || "");
        if (mime.indexOf("json") !== -1 || mime.indexOf("csv") !== -1 || mime.indexOf("text") !== -1) {
          var decodedText = Utilities.newBlob(Utilities.base64Decode(data.base64Data), data.mimeType).getDataAsString();
          existingFile.setContent(decodedText);
          while (existing.hasNext()) {
            existing.next().setTrashed(true);
          }
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            fileId: existingFile.getId(),
            webViewLink: existingFile.getUrl()
          })).setMimeType(ContentService.MimeType.JSON);
        } else {
          existingFile.setTrashed(true);
          while (existing.hasNext()) {
            existing.next().setTrashed(true);
          }
        }
      }
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(data.base64Data), data.mimeType, data.fileName);
    var file = targetFolder.createFile(blob);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      webViewLink: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main GET handler
 */
function doGet(e) {
  try {
    var folder = DriveApp.getFolderById(MASTER_FOLDER_ID);
    var sheetObj = getOrCreateMasterGoogleSheet(folder);
    var ss = sheetObj.spreadsheet;

    // Ensure all existing JSON/CSV data is represented in the master sheet
    reconcileMasterSheet(folder, ss);

    var action = (e && e.parameter && e.parameter.action) || "get_state";

    if (action === "get_sheet_url") {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        spreadsheetUrl: sheetObj.file.getUrl(),
        spreadsheetId: sheetObj.file.getId(),
        name: sheetObj.file.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "scan_uploads") {
      return scanAllUploads(folder);
    }

    // Default: Return complete consolidated master state
    var sheetSubs = readSubmissionsFromGoogleSheet(ss);

    // Read users and rich JSON data from MasterState.json
    var state = { submissions: [], users: [] };
    var spreadSheetFolder = getOrCreateSubfolder(folder, "Spreadsheets");
    var jsonFiles = spreadSheetFolder.getFilesByName(MASTER_JSON_NAME);
    if (jsonFiles.hasNext()) {
      try {
        state = JSON.parse(jsonFiles.next().getBlob().getDataAsString());
      } catch (err) {}
    }

    var mergedSubsMap = {};
    (state.submissions || []).forEach(function(s) {
      if (s && s.teamId) mergedSubsMap[String(s.teamId).toUpperCase()] = s;
    });

    sheetSubs.forEach(function(s) {
      var key = String(s.teamId).toUpperCase();
      if (!mergedSubsMap[key]) {
        mergedSubsMap[key] = s;
      } else {
        if (s.stage) mergedSubsMap[key].stage = s.stage;
        if (s.rubricAverage) mergedSubsMap[key].rubricAverage = s.rubricAverage;
        if (s.allotedJudges && s.allotedJudges.length > 0) mergedSubsMap[key].allotedJudges = s.allotedJudges;
      }
    });

    var finalSubmissions = Object.values(mergedSubsMap);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      lastUpdated: new Date().toISOString(),
      spreadsheetUrl: sheetObj.file.getUrl(),
      spreadsheetId: sheetObj.file.getId(),
      submissions: finalSubmissions,
      users: state.users || [],
      count: finalSubmissions.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getOrCreateSubfolder(parentFolder, subfolderName) {
  var subfolders = parentFolder.getFoldersByName(subfolderName);
  return subfolders.hasNext() ? subfolders.next() : parentFolder.createFolder(subfolderName);
}

function getOrCreateMasterGoogleSheet(folder) {
  var spreadSheetFolder = getOrCreateSubfolder(folder, "Spreadsheets");
  var files = spreadSheetFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
  var targetFile = null;

  while (files.hasNext()) {
    var f = files.next();
    if (f.getName() === MASTER_SHEET_NAME) {
      if (!targetFile) {
        targetFile = f;
      } else {
        f.setTrashed(true);
      }
    }
  }

  if (targetFile) {
    return {
      spreadsheet: SpreadsheetApp.openById(targetFile.getId()),
      file: targetFile
    };
  }

  var ss = SpreadsheetApp.create(MASTER_SHEET_NAME);
  var file = DriveApp.getFileById(ss.getId());

  try {
    file.moveTo(spreadSheetFolder);
  } catch (mErr) {
    spreadSheetFolder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }

  var sheet = ss.getActiveSheet();
  sheet.setName("Master Submissions");
  var headers = [
    "Sl No",
    "Team ID",
    "Team Name",
    "Category",
    "Focus Area / Theme",
    "Solution Name",
    "Leader Name",
    "Leader Email",
    "Leader Phone",
    "Institution",
    "Current Stage",
    "Alloted Judge(s)",
    "Rubric Average",
    "Pitch Video Drive URL",
    "Proposal PDF Drive URL",
    "All Team Members",
    "Registered At"
  ];
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1e3a8a");
  headerRange.setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  return { spreadsheet: ss, file: file };
}

function updateOrAppendSubmissionInSheet(ss, sub) {
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var teamId = (sub.teamId || "").toString().trim();
  if (!teamId) return null;

  var leader = (sub.members && sub.members.length > 0)
    ? (sub.members.find(function(m) { return m.isLeader; }) || sub.members[0])
    : {};

  var membersList = (sub.members || []).map(function(m) {
    var str = m.name || "Member";
    if (m.isLeader) str += " (Lead)";
    if (m.email) str += " <" + m.email + ">";
    if (m.phone) str += " [" + m.phone + "]";
    return str;
  }).join("; ");

  var videoUrl = (sub.video && (sub.video.url || sub.video.webViewLink)) || "";
  var docUrl = (sub.document && (sub.document.url || sub.document.webViewLink)) || "";
  var judges = Array.isArray(sub.allotedJudges) ? sub.allotedJudges.join(", ") : (sub.allotedJudges || "");
  var regAt = sub.createdAt ? new Date(sub.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toUpperCase() === teamId.toUpperCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    rowIndex > 0 ? data[rowIndex - 1][0] : Math.max(1, data.length),
    teamId,
    sub.teamName || (rowIndex > 0 ? data[rowIndex - 1][2] : ""),
    sub.category || (rowIndex > 0 ? data[rowIndex - 1][3] : ""),
    sub.theme || (rowIndex > 0 ? data[rowIndex - 1][4] : ""),
    sub.solutionName || (rowIndex > 0 ? data[rowIndex - 1][5] : ""),
    leader.name || sub.leadName || (rowIndex > 0 ? data[rowIndex - 1][6] : ""),
    leader.email || sub.participantEmail || (rowIndex > 0 ? data[rowIndex - 1][7] : ""),
    leader.phone || sub.leadPhone || (rowIndex > 0 ? data[rowIndex - 1][8] : ""),
    leader.college || (sub.organizationDetails && sub.organizationDetails.institution) || (rowIndex > 0 ? data[rowIndex - 1][9] : ""),
    sub.stage || (rowIndex > 0 ? data[rowIndex - 1][10] : "submitted"),
    judges || (rowIndex > 0 ? data[rowIndex - 1][11] : ""),
    sub.rubricAverage !== undefined ? sub.rubricAverage : (rowIndex > 0 ? data[rowIndex - 1][12] : 0),
    videoUrl || (rowIndex > 0 ? data[rowIndex - 1][13] : ""),
    docUrl || (rowIndex > 0 ? data[rowIndex - 1][14] : ""),
    membersList || (rowIndex > 0 ? data[rowIndex - 1][15] : ""),
    regAt || (rowIndex > 0 ? data[rowIndex - 1][16] : "")
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return rowData;
}

function readSubmissionsFromGoogleSheet(ss) {
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var submissions = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var teamId = String(row[1] || "").trim();
    if (!teamId) continue;

    var teamName = String(row[2] || "");
    var category = String(row[3] || "student");
    var theme = String(row[4] || "");
    var solutionName = String(row[5] || "");
    var leaderName = String(row[6] || "");
    var leaderEmail = String(row[7] || "");
    var leaderPhone = String(row[8] || "");
    var institution = String(row[9] || "");
    var stage = String(row[10] || "submitted");
    var allotedJudgesStr = String(row[11] || "");
    var rubricAverage = parseFloat(row[12]) || 0;
    var videoUrl = String(row[13] || "");
    var docUrl = String(row[14] || "");
    var allMembersStr = String(row[15] || "");
    var registeredAt = String(row[16] || "");

    var allotedJudges = allotedJudgesStr ? allotedJudgesStr.split(",").map(function(s){ return s.trim(); }).filter(Boolean) : [];

    submissions.push({
      _id: "sub-sheet-" + teamId,
      teamId: teamId,
      teamName: teamName,
      participantEmail: leaderEmail,
      category: category,
      city: "Mysuru",
      theme: theme,
      solutionName: solutionName,
      shortDescription: solutionName,
      detailedProposal: solutionName,
      video: {
        originalName: teamName + "_Video.mp4",
        size: 15000000,
        url: videoUrl,
        webViewLink: videoUrl,
      },
      document: {
        name: teamName + "_Proposal.pdf",
        originalName: teamName + "_Proposal.pdf",
        size: 2000000,
        url: docUrl,
        webViewLink: docUrl,
      },
      members: [
        {
          name: leaderName,
          email: leaderEmail,
          phone: leaderPhone,
          college: institution,
          isLeader: true,
        }
      ],
      organizationDetails: { institution: institution },
      stage: stage,
      allotedJudges: allotedJudges,
      allotedJudgeNames: [],
      rubricAverage: rubricAverage,
      eloRating: 1200,
      createdAt: registeredAt
    });
  }

  return submissions;
}

function updateMasterJsonInPlace(folder, sub, user) {
  var spreadSheetFolder = getOrCreateSubfolder(folder, "Spreadsheets");
  var files = spreadSheetFolder.getFilesByName(MASTER_JSON_NAME);
  var jsonFile = null;
  var state = { lastUpdated: new Date().toISOString(), submissions: [], users: [] };

  if (files.hasNext()) {
    jsonFile = files.next();
    try {
      state = JSON.parse(jsonFile.getBlob().getDataAsString());
      if (!Array.isArray(state.submissions)) state.submissions = [];
      if (!Array.isArray(state.users)) state.users = [];
    } catch (e) {
      state = { lastUpdated: new Date().toISOString(), submissions: [], users: [] };
    }
    while (files.hasNext()) {
      files.next().setTrashed(true);
    }
  }

  if (sub && sub.teamId) {
    var existingSubIdx = state.submissions.findIndex(function(s) {
      return String(s.teamId).toUpperCase() === String(sub.teamId).toUpperCase();
    });
    if (existingSubIdx !== -1) {
      var oldSub = state.submissions[existingSubIdx];
      state.submissions[existingSubIdx] = Object.assign({}, oldSub, sub, {
        video: Object.assign({}, oldSub.video || {}, sub.video || {}),
        document: Object.assign({}, oldSub.document || {}, sub.document || {}),
        updatedAt: new Date().toISOString()
      });
    } else {
      state.submissions.unshift(sub);
    }
  }

  if (user && user.email) {
    var cleanEmail = String(user.email).toLowerCase().trim();
    var existingUserIdx = state.users.findIndex(function(u) {
      return String(u.email || "").toLowerCase().trim() === cleanEmail;
    });
    if (existingUserIdx !== -1) {
      state.users[existingUserIdx] = Object.assign({}, state.users[existingUserIdx], user);
    } else {
      state.users.push(user);
    }
  }

  state.lastUpdated = new Date().toISOString();
  var jsonString = JSON.stringify(state, null, 2);

  if (jsonFile) {
    jsonFile.setContent(jsonString);
  } else {
    jsonFile = spreadSheetFolder.createFile(MASTER_JSON_NAME, jsonString, MimeType.PLAIN_TEXT);
  }

  return { state: state, file: jsonFile };
}

function updateMasterJsonDirect(folder, stateData) {
  var spreadSheetFolder = getOrCreateSubfolder(folder, "Spreadsheets");
  var files = spreadSheetFolder.getFilesByName(MASTER_JSON_NAME);
  var jsonFile = null;
  var jsonString = JSON.stringify(stateData, null, 2);

  if (files.hasNext()) {
    jsonFile = files.next();
    jsonFile.setContent(jsonString);
    while (files.hasNext()) {
      files.next().setTrashed(true);
    }
  } else {
    jsonFile = spreadSheetFolder.createFile(MASTER_JSON_NAME, jsonString, MimeType.PLAIN_TEXT);
  }

  return jsonFile;
}

function updateMasterCsvInPlace(folder, ss) {
  var spreadSheetFolder = getOrCreateSubfolder(folder, "Spreadsheets");
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) return null;

  var csvRows = data.map(function(row) {
    return row.map(function(cell) {
      var str = String(cell === null || cell === undefined ? "" : cell);
      if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1 || str.indexOf("\n") !== -1) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(",");
  });
  var csvText = csvRows.join("\n");

  var files = spreadSheetFolder.getFilesByName(MASTER_CSV_NAME);
  var csvFile = null;
  if (files.hasNext()) {
    csvFile = files.next();
    csvFile.setContent(csvText);
    while (files.hasNext()) {
      files.next().setTrashed(true);
    }
  } else {
    csvFile = spreadSheetFolder.createFile(MASTER_CSV_NAME, csvText, MimeType.CSV);
  }

  return csvFile;
}

function reconcileMasterSheet(folder, ss) {
  var spreadSheetFolder = getOrCreateSubfolder(folder, "Spreadsheets");
  var sheet = ss.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var existingTeamIds = {};
  for (var i = 1; i < data.length; i++) {
    var tid = String(data[i][1] || "").trim().toUpperCase();
    if (tid) existingTeamIds[tid] = true;
  }

  var jsonFiles = spreadSheetFolder.getFilesByName(MASTER_JSON_NAME);
  if (jsonFiles.hasNext()) {
    try {
      var content = jsonFiles.next().getBlob().getDataAsString();
      var state = JSON.parse(content);
      var subs = state.submissions || [];
      for (var s = 0; s < subs.length; s++) {
        var sub = subs[s];
        if (sub && sub.teamId && !existingTeamIds[String(sub.teamId).trim().toUpperCase()]) {
          updateOrAppendSubmissionInSheet(ss, sub);
          existingTeamIds[String(sub.teamId).trim().toUpperCase()] = true;
        }
      }
    } catch (e) {}
  }
}

function scanAllUploads(folder) {
  var summary = { documents: [], videos: [], spreadsheets: [] };

  ["Documents", "Videos", "Spreadsheets"].forEach(function(fname) {
    var key = fname.toLowerCase();
    var sfs = folder.getFoldersByName(fname);
    if (sfs.hasNext()) {
      var sf = sfs.next();
      var files = sf.getFiles();
      while (files.hasNext()) {
        var f = files.next();
        summary[key].push({
          name: f.getName(),
          id: f.getId(),
          url: f.getUrl(),
          size: f.getSize(),
          updated: f.getLastUpdated()
        });
      }
    }
  });

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    summary: summary
  })).setMimeType(ContentService.MimeType.JSON);
}
