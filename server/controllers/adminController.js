import Student from "../models/Student.js";
import Corporate from "../models/Corporate.js";
import NGO from "../models/NGO.js";
import Citizen from "../models/Citizen.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const registerAdmin = async (req, res) => {
  try {
    const { username, password, adminSecret } = req.body;

    if (!username || !password || !adminSecret) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const ADMIN_CREATION_SECRET = process.env.ADMIN_CREATION_SECRET;

    if (adminSecret !== ADMIN_CREATION_SECRET) {
      return res
        .status(403)
        .json({ message: "Forbidden: Invalid admin creation secret" });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      username,
      password: hashedPassword,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Register admin error:", error);
    res.status(500).json({
      message: "Failed to register admin",
      error: error.message,
    });
  }
};
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    );

    return res.status(200).json({ token, username: admin.username });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Login failed", error: err.message });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    const students = await Student.find().lean();
    const corporates = await Corporate.find().lean();
    const ngos = await NGO.find().lean();
    const citizens = await Citizen.find().lean();

    const formattedStudents = students.map((s) => ({
      ...s,
      category: "students",
    }));
    const formattedCorporates = corporates.map((s) => ({
      ...s,
      category: "corporates",
    }));
    const formattedNgos = ngos.map((s) => ({ ...s, category: "ngos" }));
    const formattedCitizens = citizens.map((s) => ({
      ...s,
      category: "citizens",
    }));

    const allSubmissions = [
      ...formattedStudents,
      ...formattedCorporates,
      ...formattedNgos,
      ...formattedCitizens,
    ];

    // Sort by createdAt desc
    allSubmissions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    res.status(200).json(allSubmissions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch submissions", error });
  }
};

export const updateSubmissionStatus = async (req, res) => {
  const { id } = req.params;
  const { status, category } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    let updatedSubmission;

    // Determine which collection to update
    if (category === "students") {
      updatedSubmission = await Student.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" },
      );
    } else if (category === "corporates") {
      updatedSubmission = await Corporate.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" },
      );
    } else if (category === "ngos") {
      updatedSubmission = await NGO.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" },
      );
    } else if (category === "citizens") {
      updatedSubmission = await Citizen.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" },
      );
    } else {
      // Fallback: Try to find by ID in all (inefficient but safe)
      updatedSubmission = await Student.findByIdAndUpdate(
        id,
        { status },
        { returnDocument: "after" },
      );
      if (!updatedSubmission) {
        updatedSubmission = await Corporate.findByIdAndUpdate(
          id,
          { status },
          { returnDocument: "after" },
        );
      }
      if (!updatedSubmission) {
        updatedSubmission = await NGO.findByIdAndUpdate(
          id,
          { status },
          { returnDocument: "after" },
        );
      }
      if (!updatedSubmission) {
        updatedSubmission = await Citizen.findByIdAndUpdate(
          id,
          { status },
          { returnDocument: "after" },
        );
      }
    }

    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res
      .status(200)
      .json({ message: "Status updated", submission: updatedSubmission });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status", error });
  }
};

export const getShortlist = async (req, res) => {
  const { round } = req.query;

  const roundStatusMap = {
    // 1: "round_1_shortlisted",
    // 2: "round_2_shortlisted",
    // 2.1: "track_2_shortlisted",
    3: "round_3_shortlisted",
    // finale: "grand_finale_shortlisted",
  };

  const status = roundStatusMap[round];
  if (!status) {
    return res.status(400).json({ message: "Invalid round." });
  }

  const baseSelect =
    "teamId teamName theme members.name members.email members.phone members.isLeader";

  try {
    const [students, corporates, ngos, citizens] = await Promise.all([
      Student.find({ status }).select(baseSelect).lean(),
      Corporate.find({ status }).select(baseSelect).lean(),
      NGO.find({ status }).select(baseSelect).lean(),
      Citizen.find({ status }).select(baseSelect).lean(),
    ]);

    const tag = (arr, category) => arr.map((doc) => ({ ...doc, category }));

    const shortlist = [
      ...tag(students, "students"),
      ...tag(corporates, "corporates"),
      ...tag(ngos, "ngos"),
      ...tag(citizens, "citizens"),
    ];

    res.status(200).json({ round, total: shortlist.length, data: shortlist });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch shortlist", error: error.message });
  }
};
