import nodemailer from "nodemailer"


console.log("Creating transporter");


export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Reuse connections so bulk sends don't hit the provider's limits
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
  // Fail fast instead of hanging the request
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
  logger: true,
  debug: true
});

mailTransporter.verify().then(()=>console.log("SMTP READY")).catch(err=> console.error("SMTP VERIFY ERROR", err))

console.log("Transporter created");