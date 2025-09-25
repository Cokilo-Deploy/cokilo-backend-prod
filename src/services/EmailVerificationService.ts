// src/services/EmailVerificationService.ts
const nodemailer = require('nodemailer');

export class EmailVerificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
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
    expiration.setMinutes(expiration.getMinutes() + 15);
    return expiration;
  }

  static async sendVerificationCode(
    email: string,
    firstName: string,
    code: string
  ): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'CoKilo'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Vérifiez votre compte CoKilo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #007bff; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">CoKilo</h1>
            </div>
            
            <div style="padding: 30px; background-color: white;">
              <h2 style="color: #333;">Bienvenue ${firstName} !</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Pour activer votre compte CoKilo, veuillez saisir ce code de vérification :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f8f9fa; padding: 20px 30px; border-radius: 10px; border: 2px solid #007bff;">
                  <h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
                </div>
              </div>
              
              <p style="color: #555; line-height: 1.6;">
                Ce code expire dans 15 minutes.
              </p>
              
              <p style="color: #555; line-height: 1.6;">
                Si vous n'avez pas créé de compte CoKilo, ignorez cet email.
              </p>
              
              <p style="color: #555; line-height: 1.6;">
                Merci,<br>
                <strong>L'équipe CoKilo</strong>
              </p>
            </div>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Erreur envoi email vérification:', error);
      return false;
    }
  }

  static isCodeValid(receivedCode: string, storedCode: string, expirationDate: Date): boolean {
    if (receivedCode !== storedCode) return false;
    if (new Date() > expirationDate) return false;
    return true;
  }
}