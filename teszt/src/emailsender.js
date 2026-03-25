const sgMail = require("@sendgrid/mail");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function sendEmail(email) {
  console.log("=== EMAIL CONFIGURATION DEBUG ===");
  console.log("FROM EMAIL:", process.env.Email_PiacTer);
  console.log("TO EMAIL:", email);
  console.log("SENDGRID_API_KEY set:", !!process.env.SENDGRID_API_KEY);
  console.log("=====================================");

  const mailConfig = {
    from: {
      email: process.env.Email_PiacTer,
      name: "PiacTer",
    },
    to: email,
    subject: "Email Verification - PiacTer",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Welcome to PiacTer!</h2>
        <p>Thank you for signing up. To complete your registration and start enjoying our services, please verify your email address using one of the methods below. Both options are valid for 10 minutes.</p>
        
       
        
        
        <p style="color: #666; font-size: 14px;">If you didn't create an account with PiacTer, please ignore this email.</p>
        
        <p>Thank you for joining us!</p>
        <p>Best regards,<br>The PiacTer Team</p>
        </div>`,
  };

  sgMail
    .send(mailConfig)
    .then((response) => {
      console.log("Email sent successfully via SendGrid");
      console.log("SendGrid Response Status:", response[0].statusCode);
      console.log("SendGrid Message ID:", response[0].headers["x-message-id"]);
      return true;
    })
    .catch((error) => {
      console.log("Email sending failed:", error.message);
      console.log("Full error:", JSON.stringify(error, null, 2));
      return false;
    });
}

module.exports = {
  sendEmail,
  upload,
  readDatabase,
  writeDatabase,
};
