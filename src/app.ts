import express from "express";
import cors from "cors";

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

const app = express();

app.use(cors());
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


export default app;
