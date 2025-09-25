// src/services/EmailVerificationService.ts
import nodemailer = require ('nodemailer');

export class EmailVerificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static getCodeExpiration(): Date {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 15); // Expire dans 15 minutes
    return expiration;
  }

  static async sendVerificationCode(
    email: string,
    firstName: string,
    code: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"CoKilo" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Vérifiez votre compte CoKilo',
        html: `
          <h2>Bienvenue ${firstName} !</h2>
          <p>Votre code de vérification est :</p>
          <h1 style="color: #007bff; font-size: 32px;">${code}</h1>
          <p>Ce code expire dans 15 minutes.</p>
        `,
      });
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  static isCodeValid(receivedCode: string, storedCode: string, expirationDate: Date): boolean {
    if (receivedCode !== storedCode) return false;
    if (new Date() > expirationDate) return false;
    return true;
  }
}