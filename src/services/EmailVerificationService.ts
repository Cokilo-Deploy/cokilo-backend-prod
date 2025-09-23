// src/services/EmailVerificationService.ts
const nodemailer = require('nodemailer');

export class EmailVerificationService {
  private static emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Générer un code à 6 chiffres
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Envoyer le code de vérification par email
  static async sendVerificationCode(email: string, firstName: string, code: string): Promise<boolean> {
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #007bff; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">CoKilo</h1>
          </div>
          
          <div style="padding: 40px; background-color: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Bienvenue ${firstName} !</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              Merci de vous être inscrit sur CoKilo. Pour finaliser votre inscription, 
              veuillez confirmer votre adresse email en saisissant le code de vérification ci-dessous :
            </p>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">Code de vérification</h3>
              <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: monospace;">
                ${code}
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 15px;">
                Ce code expire dans 15 minutes
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              Si vous n'avez pas demandé cette vérification, vous pouvez ignorer cet email.
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-top: 30px;">
              À bientôt sur CoKilo !<br>
              <strong>L'équipe CoKilo</strong>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 0;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
            </p>
          </div>
        </div>
      `;

      await this.emailTransporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'CoKilo'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Vérifiez votre adresse email - CoKilo',
        html: emailContent,
      });

      return true;
    } catch (error) {
      console.error('Erreur envoi code vérification:', error);
      return false;
    }
  }

  // Vérifier si le code est valide
  static isCodeValid(userCode: string, storedCode: string, expiresAt: Date): boolean {
    if (!userCode || !storedCode || !expiresAt) {
      return false;
    }

    // Vérifier si le code n'a pas expiré
    if (new Date() > expiresAt) {
      return false;
    }

    // Vérifier si le code correspond
    return userCode.trim() === storedCode.trim();
  }

  // Calculer l'expiration (15 minutes)
  static getCodeExpiration(): Date {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15);
    return expiration;
  }
}