import nodemailer from "nodemailer";
import { smtpPassword, smtpUsername } from "../../secret.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: smtpUsername,
    pass: smtpPassword,
  },
});

const emailWithNodeMailer = async (emailData) => {
  try {
    const emailOptions = {
      from: smtpUsername, // sender address
      to: emailData.email, // list of receivers
      subject: emailData.subject, // Subject line
      html: emailData.html, // html body
    };

    const info = await transporter.sendMail(emailOptions);

    console.log("Message sent: %s", info?.envelope?.to[0]);
  } catch (error) {
    console.log("Error occurred while sending message", error);
    throw error;
  }
};

export { emailWithNodeMailer };
