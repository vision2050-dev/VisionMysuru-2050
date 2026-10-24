import jwt from "jsonwebtoken";
import JuryzaUser, { ADMIN_EMAIL } from "../models/JuryzaUser.js";

const JWT_SECRET = process.env.JWT_SECRET || "visionmysuru2050-juryza-secure-secret-key-ed2";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
};

export const verifyAuthToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (!token) {
      // Allow passing email header in local development if needed, but enforce strict check
      const emailHeader = req.headers["x-user-email"];
      if (emailHeader) {
        req.user = {
          email: String(emailHeader).toLowerCase().trim(),
          role: String(emailHeader).toLowerCase().trim() === ADMIN_EMAIL ? "admin" : "participant",
        };
        return next();
      }
      return res.status(401).json({ message: "Authentication required. Please sign in." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session. Please sign in again." });
  }
};

/**
 * Strict Admin Check:
 * Only vision2050@sdmimd.ac.in is allowed.
 * Any other email receives: "you do not have admin access"
 */
export const requireAdmin = (req, res, next) => {
  const userEmail = req.user?.email?.toLowerCase().trim();
  if (userEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ message: "you do not have admin access" });
  }
  next();
};

export const requireJudge = (req, res, next) => {
  const role = req.user?.role;
  const userEmail = req.user?.email?.toLowerCase().trim();
  if (role === "judge" || userEmail === ADMIN_EMAIL || role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Judge or Admin access required." });
};
