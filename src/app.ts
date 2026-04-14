import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import multer from "multer";
import path from "path";
import applyRoutes from "./routes/applyRoutes";
import assistantRoutes from "./routes/assistantRoutes";
import { env } from "./config/env";
import contactRoutes from "./routes/contactRoutes";
import jobsRoutes from "./routes/jobsRoutes";
import statusRoutes from "./routes/statusRoutes";
import teamRoutes from "./routes/teamRoutes";
import mediaRoutes from "./routes/mediaRoutes";

const app = express();

function isLocalDevOrigin(origin: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin
        || env.allowedOrigins.includes(origin)
        || isLocalDevOrigin(origin)
        || isVercelPreviewOrigin(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());
const uploadsDir = path.resolve(__dirname, "..", "uploads");
const uploadsStatic = express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Disposition", "inline");
  },
});
app.use(
  "/uploads",
  uploadsStatic,
);
app.use("/api/uploads", uploadsStatic);

app.post("/submit", (request: Request, response: Response) => {
  const { name, message } = request.body ?? {};

  if (!name || !message) {
    response.status(400).json({ message: "name and message are required" });
    return;
  }

  console.log("/submit payload:", { name, message });
  response.status(200).json({ message: "Data received successfully" });
});

app.get("/", (_request: Request, response: Response) => {
  response.json({
    name: "Aselea Network API",
    message: "Backend is running.",
  });
});

app.use("/api", contactRoutes);
app.use("/api", applyRoutes);
app.use("/api", assistantRoutes);
app.use("/api", jobsRoutes);
app.use("/api", statusRoutes);
app.use("/api", teamRoutes);
app.use("/api", mediaRoutes);

app.use((_request: Request, response: Response) => {
  response.status(404).json({ message: "Route not found" });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  if (error.message.startsWith("CORS blocked for origin:")) {
    response.status(403).json({ message: error.message });
    return;
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    response.status(413).json({ message: "Resume file is too large. Maximum allowed size is 10MB." });
    return;
  }

  console.error("Unhandled error:", error);
  response.status(500).json({ message: "Internal server error" });
});

export default app;
