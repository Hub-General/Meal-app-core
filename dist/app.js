"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const mealRoutes_1 = __importDefault(require("./routes/mealRoutes"));
const menuRoutes_1 = __importDefault(require("./routes/menuRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const selectionRoutes_1 = __importDefault(require("./routes/selectionRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/roles", roleRoutes_1.default);
app.use("/meals", mealRoutes_1.default);
app.use("/menus", menuRoutes_1.default);
app.use("/users", userRoutes_1.default);
app.use("/meal-selections", selectionRoutes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map