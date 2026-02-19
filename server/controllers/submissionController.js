import fs from "fs";
import Student from "../models/Student.js";
import NGO from "../models/NGO.js";
import Corporate from "../models/Corporate.js";
import Citizen from "../models/Citizen.js";
import { uploadToCloudinary } from "../cloudinary.js";
import { randomUUID } from "crypto";
import sendSubmissionEmail from "../emailService.js";

const createSubmission = async (req, res) => {
  try {
    const {
      category,
      teamName,
      organizationName,
      companyName,
      industry,
      city,
      members,
      theme,
      solutionName,
      shortDescription,
      institution,
      department,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    let parsedMembers;
    if (typeof members === "string") {
      try {
        parsedMembers = JSON.parse(members);
      } catch {
        return res.status(400).json({ message: "Invalid members format" });
      }
    } else if (Array.isArray(members)) {
      parsedMembers = members;
    } else {
      return res.status(400).json({ message: "Invalid members format" });
    }

    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary(req.file.path, "submissions");
    } finally {
      fs.unlink(req.file.path, () => {});
    }

    const idea_document = {
      name: req.file.originalname,
      public_url: uploadResult.url,
      public_id: uploadResult.public_id,
    };

    const basePayload = {
      teamId: `${
        category === "student"
          ? "ST"
          : category === "corporate"
            ? "CO"
            : category === "ngo"
              ? "NG"
              : category === "citizens"
                ? "CT"
                : "NA"
      }-${randomUUID().slice(0, 6).toUpperCase()}`,
      teamName,
      city,
      members: parsedMembers,
      theme,
      solutionName,
      shortDescription,
      idea_document,
      status: "Pending",
    };

    let submission;

    switch (category) {
      case "student":
        submission = new Student({
          ...basePayload,
          institution,
          department,
        });
        break;

      case "corporate":
        submission = new Corporate({
          ...basePayload,
          companyName: companyName || organizationName,
          industry,
        });
        break;

      case "ngo":
        submission = new NGO({
          ...basePayload,
          organizationName,
        });
        break;

      case "citizens":
        submission = new Citizen({
          ...basePayload,
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid category" });
    }

    await submission.save();

    // Send confirmation email
    const leader = parsedMembers.find((m) => m.isLeader) || parsedMembers[0];
    if (leader && leader.email) {
      sendSubmissionEmail({
        leaderEmail: leader.email,
        leaderName: leader.name,
        teamId: submission.teamId,
        teamName: submission.teamName,
        solutionName: submission.solutionName,
        organizationName:
          submission.organizationName ||
          submission.institution ||
          submission.companyName,
      });
    }

    res.status(201).json({
      message: "Submission created successfully",
      submission,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

//get winner
const getWinners = async (req, res) => {
  try {
    const students = await Student.find({ status: "winner" });
    const corporates = await Corporate.find({ status: "winner" });
    const ngos = await NGO.find({ status: "winner" });
    const citizens = await Citizen.find({ status: "winner" });

    //combine all winners
    const totalWinners = [...students, ...corporates, ...ngos, ...citizens];

    res.status(200).json({ totalWinners });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { createSubmission, getWinners };
