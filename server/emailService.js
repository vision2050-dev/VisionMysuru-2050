import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendSubmissionEmail = async ({
  leaderEmail,
  leaderName,
  teamId,
  teamName,
  solutionName,
  organizationName,
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Gmail credentials not set. Email skipped.");
    return { success: false, reason: "missing_credentials" };
  }

  if (!leaderEmail) {
    console.warn("Leader email missing. Email skipped.");
    return { success: false, reason: "missing_recipient" };
  }

  const htmlContent = `
    <div style="max-width:620px;margin:auto;font-family:Arial,Helvetica,sans-serif;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:linear-gradient(135deg,#fafaf9,#fef3c7);padding:22px 26px;border-bottom:1px solid #fde68a;">
        <h2 style="margin:0;font-size:22px;color:#111827;">
          Submission Received Successfully ✨
        </h2>
        <p style="margin-top:6px;font-size:14px;color:#374151;">
          Vision Mysuru 2050 — Shaping the Future of Our Heritage City
        </p>
      </div>

      <div style="padding:26px;color:#111827;font-size:14px;line-height:1.6;">
        <p>Dear <strong>${leaderName}</strong>,</p>

        <p>
          Thank you for submitting your idea as part of
          <strong>Vision Mysuru 2050</strong>. We are pleased to confirm that your
          submission has been received successfully.
        </p>

        <div style="padding:14px;margin:22px 0;border-radius:10px;border:3px solid #fde68a;background:#fffbeb;">
          <p style="font-size:12px;color:#92400e;margin:0;">Team ID</p>
          <p style="font-size:26px;font-weight:bold;color:#7c2d12;margin:4px 0;">
            ${teamId}
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#374151;"><strong>Team Name</strong></td>
            <td style="padding:6px 0;">${teamName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#374151;"><strong>Project Title</strong></td>
            <td style="padding:6px 0;">${solutionName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#374151;"><strong>Organization</strong></td>
            <td style="padding:6px 0;">${organizationName ?? "N/A"}</td>
          </tr>
        </table>

        <p style="margin-top:22px;">
          All further communication, including evaluation outcomes and next
          steps, will be shared through official correspondence.
        </p>

        <a
          href="https://www.visionmysuru2050.in"
          style="display:inline-block;margin-top:14px;padding:10px 18px;background:#f59e0b;color:#111827;text-decoration:none;border-radius:6px;font-weight:bold;"
        >
          Visit Official Website
        </a>

        <div style="margin-top:26px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#374151;">
          📩 For queries, contact
          <a href="mailto:visionmysuru2050@sdmimd.ac.in" style="color:#b45309;text-decoration:none;">
            visionmysuru2050@sdmimd.ac.in
          </a>
        </div>

        <p style="margin-top:24px;">
          Regards,<br />
          <strong>Vision Mysuru 2050 Team</strong>
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Vision Mysuru 2050" <${process.env.EMAIL_USER}>`,
      to: leaderEmail,
      subject: `Submission Successful – Vision Mysuru 2050 (Team ID: ${teamId})`,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Unexpected email failure:", err);
    return { success: false, error: err };
  }
};

export default sendSubmissionEmail;
