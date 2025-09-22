// config/emailConfig.ts - Validation des variables d'environnement
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  supportEmail: string;
  confirmationSubject: string;
}

// Validation et export de la configuration email
export const getEmailConfig = (): EmailConfig => {
  const requiredVars = [
    'SMTP_HOST',
    'SMTP_USER', 
    'SMTP_PASS',
    'SUPPORT_EMAIL'
  ];

  // Vérifier que toutes les variables requises sont présentes
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
  }

  return {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    fromName: process.env.SMTP_FROM_NAME || 'CoKilo Support',
    supportEmail: process.env.SUPPORT_EMAIL!,
    confirmationSubject: process.env.SUPPORT_CONFIRMATION_SUBJECT || 'Votre message a été reçu - CoKilo Support'
  };
};

// Valider la configuration au démarrage
export const validateEmailConfig = (): void => {
  try {
    const config = getEmailConfig();
    console.log('✅ Configuration email validée:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      fromName: config.fromName,
      supportEmail: config.supportEmail
    });
  } catch (error) {
    console.error('❌ Erreur de configuration email:', error);
    process.exit(1);
  }
};