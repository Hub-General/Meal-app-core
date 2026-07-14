import nodemailer from "nodemailer"


console.log("Creating transporter");


export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  pool: true,
  maxConnections:1,
  maxMessages:Infinity,
  logger: true,
  debug: true
});

console.log("Transporter created");