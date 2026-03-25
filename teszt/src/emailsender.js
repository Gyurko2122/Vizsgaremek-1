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

function sendMessageNotification(recipientEmail, senderUsername, productName) {
  console.log("=== MESSAGE NOTIFICATION EMAIL ===");
  console.log("TO:", recipientEmail);
  console.log("FROM USER:", senderUsername);
  console.log("PRODUCT:", productName);
  console.log("==================================");

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #e5e7eb; padding: 2rem; border-radius: 12px;">
      <h1 style="color: #f5f5f5; font-size: 1.8rem; margin-bottom: 1rem;">PiacTer - Új üzenet érkezett!</h1>
      <div style="background-color: #1a2332; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; margin: 1rem 0;">
        <p style="color: #cbd5e1; margin: 0 0 0.5rem 0;"><strong style="color: #f5f5f5;">Feladó:</strong> ${senderUsername}</p>
        <p style="color: #cbd5e1; margin: 0;"><strong style="color: #f5f5f5;">Tárgy:</strong> Érdeklődés: ${productName}</p>
      </div>
      <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 1.5rem;">Jelentkezz be a PiacTér oldalra az üzenet megtekintéséhez és válaszoláshoz.</p>
      <hr style="border: none; border-top: 1px solid #334155; margin: 1.5rem 0;" />
      <p style="color: #64748b; font-size: 0.8rem; text-align: center;">© PiacTer - Minden jog fenntartva</p>
    </div>
  `;

  const mailConfig = {
    from: {
      email: process.env.Email_PiacTer,
      name: "PiacTer",
    },
    to: recipientEmail,
    subject: `Új üzenet: ${senderUsername} érdeklődik - ${productName}`,
    html: htmlContent,
  };

  sgMail
    .send(mailConfig)
    .then((response) => {
      console.log("Message notification email sent successfully");
      console.log("SendGrid Response Status:", response[0].statusCode);
      return true;
    })
    .catch((error) => {
      console.log("Message notification email failed:", error.message);
      return false;
    });
}

module.exports = {
  sendEmail,
  sendMessageNotification,
};
