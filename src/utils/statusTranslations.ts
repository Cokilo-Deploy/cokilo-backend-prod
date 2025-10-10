export const translateVerificationStatus = (status: string, language: string = 'fr'): string => {
  const translations: { [key: string]: { [lang: string]: string } } = {
    unverified: {
      fr: 'Non vérifié',
      en: 'Unverified',
      de: 'Nicht verifiziert',
      es: 'No verificado',
      it: 'Non verificato'
    },
    pending: {
      fr: 'En attente',
      en: 'Pending',
      de: 'Ausstehend',
      es: 'Pendiente',
      it: 'In attesa'
    },
    pending_verification: {
      fr: 'Vérification en cours',
      en: 'Verification in progress',
      de: 'Verifizierung läuft',
      es: 'Verificación en curso',
      it: 'Verifica in corso'
    },
    verified: {
      fr: 'Vérifié',
      en: 'Verified',
      de: 'Verifiziert',
      es: 'Verificado',
      it: 'Verificato'
    },
    verification_failed: {
      fr: 'Échec de la vérification',
      en: 'Verification Failed',
      de: 'Verifizierung fehlgeschlagen',
      es: 'Verificación fallida',
      it: 'Verifica fallita'
    },
    suspended: {
      fr: 'Suspendu',
      en: 'Suspended',
      de: 'Gesperrt',
      es: 'Suspendido',
      it: 'Sospeso'
    }
  };

  return translations[status]?.[language] || status;
};