import express, { Request, Response } from 'express';
const nodemailer = require('nodemailer');

const router = express.Router();

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  userAgent?: string;
}

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  throw new Error('Variables SMTP manquantes');
}

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post('/support/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message, userAgent }: ContactFormData = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    const emailContent = `
      <h2>Nouveau message de support - CoKilo</h2>
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;

    await emailTransporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'CoKilo Support'}" <${process.env.SMTP_USER}>`,
      to: process.env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Support CoKilo] ${subject}`,
      html: emailContent,
    });

    res.json({
      success: true,
      message: 'Message envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur envoi email support:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du message'
    });
  }
});

export default router;