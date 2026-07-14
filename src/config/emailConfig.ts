import nodemailer from "nodemailer"


console.log("Creating transporter");


export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  logger: true,
  debug: true
});

mailTransporter.verify().then(()=>console.log("SMTP READY")).catch(err=> console.error("SMTP VERIFY ERROR", err))

console.log("Transporter created");