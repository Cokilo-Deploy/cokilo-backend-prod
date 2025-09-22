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

router.post('/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message, userAgent }: ContactFormData = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'email invalide'
      });
    }

    // Email pour l'équipe support
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Nouveau message de support - CoKilo</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Détails du contact
          </h3>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Nom:</td>
              <td style="padding: 8px 0; color: #333;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 8px 0; color: #333;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Plateforme:</td>
              <td style="padding: 8px 0; color: #333;">${userAgent || 'Non spécifié'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td>
              <td style="padding: 8px 0; color: #333;">${new Date().toLocaleString('fr-FR')}</td>
            </tr>
          </table>
          
          <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Message
          </h3>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
            <p style="margin: 0; line-height: 1.6; color: #333;">
              ${message.replace(/\n/g, '<br>')}
            </p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 8px; border-left: 4px solid #007bff;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            <strong>Note:</strong> Ce message a été envoyé depuis l'application mobile CoKilo.
            Répondez directement à cet email pour contacter l'utilisateur.
          </p>
        </div>
      </div>
    `;

    // Envoyer l'email à l'équipe support
    await emailTransporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'CoKilo Support'}" <${process.env.SMTP_USER}>`,
      to: process.env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Support CoKilo] ${subject}`,
      html: emailContent,
    });

    // Email de confirmation à l'utilisateur
    const confirmationEmail = {
      from: `"${process.env.SMTP_FROM_NAME || 'CoKilo Support'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Votre message a été reçu - CoKilo Support',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #007bff; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">CoKilo</h1>
          </div>
          
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #333;">Bonjour ${name},</h2>
            
            <p style="color: #555; line-height: 1.6;">
              Nous avons bien reçu votre message concernant : <strong>"${subject}"</strong>
            </p>
            
            <p style="color: #555; line-height: 1.6;">
              Notre équipe support va examiner votre demande et vous répondra dans les plus brefs délais, 
              généralement sous 24 heures.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #555;">
                <strong>Votre message :</strong><br>
                ${message.replace(/\n/g, '<br>')}
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              En attendant, n'hésitez pas à consulter notre section d'aide dans l'application 
              ou à nous contacter à nouveau si vous avez d'autres questions.
            </p>
            
            <p style="color: #555; line-height: 1.6;">
              Merci de votre confiance,<br>
              <strong>L'équipe CoKilo</strong>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 0;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
            </p>
          </div>
        </div>
      `,
    };

    // Envoyer l'email de confirmation
    try {
      await emailTransporter.sendMail(confirmationEmail);
    } catch (confirmError) {
      console.error('Erreur envoi email de confirmation:', confirmError);
      // Ne pas faire échouer la requête si l'email de confirmation échoue
    }

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