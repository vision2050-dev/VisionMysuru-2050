import { rateLimit, ipKeyGenerator } from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts!",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests!",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
});
