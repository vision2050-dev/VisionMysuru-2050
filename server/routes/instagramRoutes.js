import express from "express";
import {
  getInstagramFeed,
  syncInstagramFeed,
} from "../controllers/instagramController.js";

const router = express.Router();

// GET /api/v1/instagram/feed — Returns cached or live posts, latest first
router.get("/feed", getInstagramFeed);

// POST /api/v1/instagram/sync — Force refresh from Instagram Graph API
router.post("/sync", syncInstagramFeed);

export default router;
