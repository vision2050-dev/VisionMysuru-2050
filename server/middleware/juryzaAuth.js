import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "visionmysuru2050_edition2_secret_key";
export const ADMIN_EMAIL = "visionmysuru2050@sdmimd.ac.in";

export const extractUser = (req, res, next) => {
  const authHeader = req.header("Authorization") || req.header("x-auth-token");
  const fallbackEmail = req.header("x-user-email") || req.query.userEmail;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch {
      // Token invalid or expired, continue to fallback
    }
  }

  if (fallbackEmail) {
    const email = String(fallbackEmail).toLowerCase().trim();
    req.user = {
      email,
      name: email.split("@")[0],
      role: email === ADMIN_EMAIL.toLowerCase() ? "admin" : "participant",
    };
  }

  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      message: "Authentication required. Please sign in with your Gmail ID.",
    });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      message: "Authentication required. Please sign in with visionmysuru2050@sdmimd.ac.in.",
    });
  }

  if (req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      message: `Access Denied: The Admin Portal is strictly restricted to ${ADMIN_EMAIL}.`,
    });
  }

  next();
};

export const requireJudgeOrAdmin = (req, res, next) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      message: "Authentication required. Please sign in with your Jury Gmail ID.",
    });
  }

  if (req.user.role !== "judge" && req.user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      message: "Access Denied: You do not have jury privileges for this section.",
    });
  }

  next();
};
