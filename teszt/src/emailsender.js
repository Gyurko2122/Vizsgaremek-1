const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");
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
    html: fs.readFileSync(path.join("./layout/layout.html"), "utf8"),
    attachments: [
      {
        content: fs
          .readFileSync(path.join("./layout/welcome.png"))
          .toString("base64"),
        filename: "welcome.png",
        type: "image/png",
        disposition: "inline",
        content_id: "piacterimg",
      },
    ],
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
};
