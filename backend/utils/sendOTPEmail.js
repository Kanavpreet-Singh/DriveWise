const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (toEmail, otp, options = {}) => {
  const subject = options.subject || "OTP Verification";
  const messageText = options.messageText || "Your OTP is";
  const expiryText = options.expiryText || "It is valid for 5 minutes.";
  const fromEmail = "DriveWise <onboarding@resend.dev>";
  const replyToEmail = process.env.EMAIL_USER;

  const result = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject,
    html: `<p>${messageText} <strong>${otp}</strong>. ${expiryText}</p>`,
    ...(replyToEmail ? { replyTo: replyToEmail } : {}),
  });

  if (result?.error) {
    throw new Error(`Resend error (${result.error.statusCode}): ${result.error.message}`);
  }

  return result;
};

module.exports = sendOTPEmail;
