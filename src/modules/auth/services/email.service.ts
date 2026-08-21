import nodemailer from "nodemailer";

export class EmailService {
  private transporter;

  constructor() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true"; // false for STARTTLS
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn("SMTP credentials not fully set. Email sending might fail.");
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string, name: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Password SIMPA</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f172a;
            padding: 32px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 32px;
            line-height: 1.6;
          }
          .greeting {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #0f172a;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            background-color: #f7a440;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(247, 164, 64, 0.2);
            transition: background-color 0.2s;
          }
          .button:hover {
            background-color: #e59333;
          }
          .footer {
            background-color: #f1f5f9;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
          .warning {
            font-size: 13px;
            color: #64748b;
            margin-top: 24px;
            border-top: 1px dashed #e2e8f0;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SIMPA HIPPA CIRENGIT</h1>
          </div>
          <div class="content">
            <div class="greeting">Assalamu'alaikum Wr. Wb. Rekan ${name},</div>
            <p>Kami menerima permintaan untuk mereset password akun SIMPA Anda. Silakan klik tombol di bawah ini untuk membuat password baru:</p>
            <div class="button-container">
              <a href="${resetLink}" class="button" target="_blank">Reset Password</a>
            </div>
            <p>Link ini hanya berlaku selama <strong>1 jam</strong>. Jika link tidak berfungsi, Anda dapat menyalin dan menempel tautan berikut ke browser Anda:</p>
            <p style="word-break: break-all; font-size: 14px; color: #f7a440;"><a href="${resetLink}" style="color: #f7a440;">${resetLink}</a></p>
            <div class="warning">
              Jika Anda tidak meminta perubahan kata sandi ini, abaikan email ini dengan aman. Password Anda akan tetap sama.
            </div>
          </div>
          <div class="footer">
            Sistem Informasi Manajemen Pengurus & Anggota (SIMPA)<br>
            HIPPA Cirengit &copy; ${new Date().getFullYear()}
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: `"SIMPA HIPPA Cirengit" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "[SIMPA] Permintaan Reset Password Akun",
      html: htmlContent,
    });
  }
}
