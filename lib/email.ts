import nodemailer from "nodemailer";
import type { Submission } from "./db";
import { PACKAGES } from "./db";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendConfirmationEmail(
  submission: Submission
): Promise<void> {
  // Skip sending if SMTP credentials are not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "[email] SMTP_USER / SMTP_PASS not set – skipping email notification"
    );
    return;
  }

  const pkg = PACKAGES.find((p) => p.id === submission.packageId);
  const packageLabel = pkg ? pkg.label : submission.packageId;
  const packagePrice = pkg ? `$${pkg.price.toLocaleString()}` : "";

  const to = process.env.NOTIFICATION_EMAIL || "dferguson@buyblazer.com";
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const textBody = [
    "New 2027 Calendar Sponsorship Submission",
    "=========================================",
    "",
    `Company Name  : ${submission.companyName}`,
    `Contact Person: ${submission.contactName}`,
    `Email         : ${submission.email}`,
    `Phone         : ${submission.phone || "(not provided)"}`,
    "",
    `Package       : ${packageLabel}`,
    `Price         : ${packagePrice}`,
    "",
    `Submitted At  : ${submission.submittedAt}`,
  ].join("\n");

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="color:#1d4ed8;">New 2027 Calendar Sponsorship Submission</h2>
  <table style="width:100%;border-collapse:collapse;margin-top:16px;">
    <tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;width:40%;">Company Name</th><td style="padding:8px 12px;">${escapeHtml(submission.companyName)}</td></tr>
    <tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;">Contact Person</th><td style="padding:8px 12px;">${escapeHtml(submission.contactName)}</td></tr>
    <tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;">Email</th><td style="padding:8px 12px;">${escapeHtml(submission.email)}</td></tr>
    <tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;">Phone</th><td style="padding:8px 12px;">${escapeHtml(submission.phone || "(not provided)")}</td></tr>
    <tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;">Package</th><td style="padding:8px 12px;font-weight:bold;">${escapeHtml(packageLabel)}</td></tr>
    <tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;">Price</th><td style="padding:8px 12px;">${escapeHtml(packagePrice)}</td></tr>
    <tr><th style="text-align:left;padding:8px 12px;background:#f3f4f6;">Submitted At</th><td style="padding:8px 12px;">${escapeHtml(submission.submittedAt)}</td></tr>
  </table>
</body>
</html>`;

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to,
    subject: `[2027 Calendar] New Sponsorship Claim – ${submission.companyName}`,
    text: textBody,
    html: htmlBody,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
