import express, { type Request, type Response } from "express";
import cors from "cors";

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

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/roles", roleRoutes);
app.use("/meals", mealRoutes);
app.use("/menus", menuRoutes);
app.use("/users", userRoutes);
app.use("/users/taste-profiles", tasteProfileRoutes)
app.use("/week-menu-schedules", weekMenuScheduleRoutes);
app.use("/meal-selections", selectionRoutes);
app.use("/presets", presetRoutes);
app.use("/food-library", foodLibraryRoutes);

app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
        console.log(
            middleware.route.path,
            middleware.route.methods
        );
    } else if (middleware.name === "router") {
        middleware.handle.stack.forEach((handler: any) => {
            if(handler.route){
                console.log(
                    handler.route.path,
                    handler.route.methods
                );
            }
        })
    }
});


export default app;
