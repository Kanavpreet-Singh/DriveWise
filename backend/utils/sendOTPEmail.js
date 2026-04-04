const { BrevoClient } = require("@getbrevo/brevo");

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendOTPEmail = async (toEmail, otp, options = {}) => {
  const subject = options.subject || "OTP Verification";
  const messageText = options.messageText || "Your OTP is";
  const expiryText = options.expiryText || "It is valid for 5 minutes.";
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
  const senderName = process.env.BREVO_SENDER_NAME || "DriveWise";

  if (!senderEmail) {
    throw new Error("Brevo sender email is missing. Set BREVO_SENDER_EMAIL in backend env.");
  }

  const result = await brevo.transactionalEmails.sendTransacEmail({
    sender: { email: senderEmail, name: senderName },
    to: [{ email: toEmail }],
    subject,
    htmlContent: `<p>${messageText} <strong>${otp}</strong>. ${expiryText}</p>`,
  });

  return result;
};

module.exports = sendOTPEmail;
