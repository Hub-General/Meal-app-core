import "dotenv/config";

import app from "./app";

const port = Number(process.env.PORT ?? 5000);

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
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

process.on("exit", () => {
    console.log("NODE EXIT");
});