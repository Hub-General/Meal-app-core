import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import roleRoutes from "./routes/roleRoutes";
import mealRoutes from "./routes/mealRoutes";
import menuRoutes from "./routes/menuRoutes";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import presetRoutes from "./routes/presetRoutes";
import selectionRoutes from "./routes/selectionRoutes";
import foodLibraryRoutes from "./routes/foodLibraryRoutes"
import tasteProfileRoutes from "./routes/tasteProfileRoutes";
import cronRoutes from "./routes/cronRoutes";
import weekMenuScheduleRoutes from "./routes/weekMenuScheduleRoutes";
import holidayRoutes from "./routes/holidayRoutes";

const app = express();

const envOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://meal-selection.vercel.app",
  "https://meal-selection-omega.vercel.app",
  "https://meal-selection-omega-dev.vercel.app",
  ...envOrigins,
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/$/, "");

    if (defaultAllowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie",
  ],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/cron", cronRoutes)
app.use("/roles", roleRoutes);
app.use("/meals", mealRoutes);
app.use("/menus", menuRoutes);
app.use("/users", userRoutes);
app.use("/users/taste-profiles", tasteProfileRoutes)
app.use("/week-menu-schedules", weekMenuScheduleRoutes);
app.use("/meal-selections", selectionRoutes);
app.use("/presets", presetRoutes);
app.use("/food-library", foodLibraryRoutes);
app.use("/holidays", holidayRoutes);


export default app;
