import nodemailer from 'nodemailer';
import dotenv from 'dotenv'
// const nodemailer = require("nodemailer");
dotenv.config()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  if (!token) {
    console.error("Error: Verification token is undefined!");
    return;
  }

  // const verificationUrl = `${process.env.BACKEND_URL}/user/verify-email?token=${token}`; // directly call the backend


  const verificationUrl = `${process.env.CLIENT_URL}/user/verify-email?token=${token}`;
  console.log("Verification URL:", verificationUrl);

  const mailOptions = {
    from: `"Full Stack Project" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Email Verification",
    html: `
      <h3>Email Verification</h3>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}" target="_blank">Verify Email</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// module.exports = sendVerificationEmail;
export default sendVerificationEmail;
