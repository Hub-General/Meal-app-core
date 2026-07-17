import "dotenv/config";

import app from "./app";
import { startBiWeeklyCron, startWeeklyCron } from "./jobs/cronJobs";

const port = Number(process.env.PORT ?? 5000);

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    startBiWeeklyCron();
    startWeeklyCron();
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