'use strict';
const nodemailer = require('nodemailer');

async function getTransporter() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass },
    });
  }
  // Yerel geliştirmede gerçek posta yerine Ethereal önizlemesi kullanılır.
  // Canlı kullanımda SMTP_* değişkenlerinin tanımlanması zorunludur.
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function sendPasswordResetEmail(to, code) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || '"Carriera Güvenlik" <noreply@carriera.com>',
    to,
    subject: 'Carriera şifre sıfırlama kodunuz',
    text: `Şifre sıfırlama kodunuz: ${code}. Kod 3 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayın.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#172554">
        <h1 style="color:#1a4fba;margin:0 0 8px">CARRIERA</h1>
        <h2 style="font-size:20px">Şifre sıfırlama isteği</h2>
        <p>Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki doğrulama kodunu girin:</p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px;color:#1d4ed8">${code}</div>
        <p style="margin-top:20px">Kod <strong>3 dakika</strong> geçerlidir ve tek kullanımlıktır.</p>
        <p style="color:#64748b;font-size:13px">Bu isteği siz yapmadıysanız hesabınız güvende; bu e-postayı yok sayabilirsiniz.</p>
      </div>`,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log('Test e-posta önizlemesi:', previewUrl);
  return { previewUrl };
}

module.exports = { sendPasswordResetEmail };
