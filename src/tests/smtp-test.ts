// smtp-test.ts

import net from "net";

const socket = net.createConnection({
  host: "live.smtp.mailtrap.io",
  port: 587,
});

socket.on("connect", () => {
  console.log("CONNECTED TO SMTP");
  socket.destroy();
});

socket.on("error", (err) => {
  console.error("SMTP CONNECTION FAILED");
  console.error(err);
});

socket.setTimeout(15000);

socket.on("timeout", () => {
  console.error("SMTP TIMEOUT");
  socket.destroy();
});