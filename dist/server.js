"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const cronJobs_1 = require("./jobs/cronJobs");
const port = Number(process.env.PORT ?? 5000);
const server = app_1.default.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    (0, cronJobs_1.startBiWeeklyCron)();
    (0, cronJobs_1.startWeeklyCron)();
});
server.on("close", () => {
    console.log("HTTP SERVER CLOSED");
});
server.on("error", (err) => {
    console.log("SERVER ERROR", err);
});
process.on("beforeExit", () => {
    console.log("NODE BEFORE EXIT");
});
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION");
    console.error(err);
});
process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION");
    console.error(err);
});
process.on("exit", () => {
    console.log("NODE EXIT");
});
//# sourceMappingURL=server.js.map