import express, { type Request, type Response } from "express";

import roleRoutes from "./routes/roleRoutes";
import mealRoutes from "./routes/mealRoutes";
import menuRoutes from "./routes/menuRoutes";
import userRoutes from "./routes/userRoutes";
import weekMenuScheduleRoutes from "./routes/weekMenuScheduleRoutes";
import selectionRoutes from "./routes/selectionRoutes";
import presetRoutes from "./routes/presetRoutes";
import tasteProfileRoutes from "./routes/tasteProfileRoutes";
import authRoutes from "./routes/authRoutes";
import foodLibraryRoutes from "./routes/foodLibraryRoutes"

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/roles", roleRoutes);
app.use("/meals", mealRoutes);
app.use("/menus", menuRoutes);
app.use("/users", userRoutes);
app.use("/week-menu-schedules", weekMenuScheduleRoutes);
app.use("/users/taste-profiles", tasteProfileRoutes)
app.use("/meal-selections", selectionRoutes);
app.use("/presets", presetRoutes);
app.use("/food-library", foodLibraryRoutes)

export default app;
