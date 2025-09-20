// src/config/translations.ts
import { AppTranslations } from '../types/translations';

export const translations: AppTranslations = {
  // Navigation
  'nav.home': {
    fr: 'Accueil',
    en: 'Home',
    de: 'Startseite',
    es: 'Inicio',
    it: 'Home'
  },
  'nav.trips': {
    fr: 'Voyages',
    en: 'Trips',
    de: 'Reisen',
    es: 'Viajes',
    it: 'Viaggi'
  },
  'nav.search': {
    fr: 'Rechercher',
    en: 'Search',
    de: 'Suchen',
    es: 'Buscar',
    it: 'Cerca'
  },
  'nav.profile': {
    fr: 'Profil',
    en: 'Profile',
    de: 'Profil',
    es: 'Perfil',
    it: 'Profilo'
  },
  'nav.create_trip': {
    fr: 'Créer un voyage',
    en: 'Create trip',
    de: 'Reise erstellen',
    es: 'Crear viaje',
    it: 'Crea viaggio'
  },

  // Trip related
  'trip.from': {
    fr: 'Départ',
    en: 'From',
    de: 'Von',
    es: 'Desde',
    it: 'Da'
  },
  'trip.to': {
    fr: 'Arrivée',
    en: 'To',
    de: 'Nach',
    es: 'Hacia',
    it: 'A'
  },
  'trip.departure_date': {
    fr: 'Date de départ',
    en: 'Departure date',
    de: 'Abfahrtsdatum',
    es: 'Fecha de salida',
    it: 'Data di partenza'
  },
  'trip.arrival_date': {
    fr: 'Date d\'arrivée',
    en: 'Arrival date',
    de: 'Ankunftsdatum',
    es: 'Fecha de llegada',
    it: 'Data di arrivo'
  },
  'trip.price_per_kg': {
    fr: 'Prix par kg',
    en: 'Price per kg',
    de: 'Preis pro kg',
    es: 'Precio por kg',
    it: 'Prezzo per kg'
  },
  'trip.capacity': {
    fr: 'Capacité',
    en: 'Capacity',
    de: 'Kapazität',
    es: 'Capacidad',
    it: 'Capacità'
  },
  'trip.available_weight': {
    fr: 'Poids disponible',
    en: 'Available weight',
    de: 'Verfügbares Gewicht',
    es: 'Peso disponible',
    it: 'Peso disponibile'
  },
  'trip.book_now': {
    fr: 'Réserver maintenant',
    en: 'Book now',
    de: 'Jetzt buchen',
    es: 'Reservar ahora',
    it: 'Prenota ora'
  },
  'trip.transport_mode': {
    fr: 'Mode de transport',
    en: 'Transport mode',
    de: 'Transportmittel',
    es: 'Modo de transporte',
    it: 'Mezzo di trasporto'
  },

  // Transaction statuses
  'transaction.status.payment_pending': {
    fr: 'Paiement en attente',
    en: 'Payment pending',
    de: 'Zahlung ausstehend',
    es: 'Pago pendiente',
    it: 'Pagamento in attesa'
  },
  'transaction.status.payment_escrowed': {
    fr: 'Paiement séquestré',
    en: 'Payment escrowed',
    de: 'Zahlung hinterlegt',
    es: 'Pago en depósito',
    it: 'Pagamento depositato'
  },
  'transaction.status.package_picked_up': {
    fr: 'Colis récupéré',
    en: 'Package picked up',
    de: 'Paket abgeholt',
    es: 'Paquete recogido',
    it: 'Pacco ritirato'
  },
  'transaction.status.package_delivered': {
    fr: 'Colis livré',
    en: 'Package delivered',
    de: 'Paket zugestellt',
    es: 'Paquete entregado',
    it: 'Pacco consegnato'
  },
  'transaction.status.payment_released': {
    fr: 'Paiement libéré',
    en: 'Payment released',
    de: 'Zahlung freigegeben',
    es: 'Pago liberado',
    it: 'Pagamento rilasciato'
  },
  'transaction.status.cancelled': {
    fr: 'Annulé',
    en: 'Cancelled',
    de: 'Storniert',
    es: 'Cancelado',
    it: 'Annullato'
  },
  'transaction.status.disputed': {
    fr: 'En litige',
    en: 'Disputed',
    de: 'Streitig',
    es: 'En disputa',
    it: 'In disputa'
  },
  'transaction.status.refunded': {
    fr: 'Remboursé',
    en: 'Refunded',
    de: 'Erstattet',
    es: 'Reembolsado',
    it: 'Rimborsato'
  },

  // Package types
  'package.type.documents': {
    fr: 'Documents',
    en: 'Documents',
    de: 'Dokumente',
    es: 'Documentos',
    it: 'Documenti'
  },
  'package.type.clothes': {
    fr: 'Vêtements',
    en: 'Clothes',
    de: 'Kleidung',
    es: 'Ropa',
    it: 'Vestiti'
  },
  'package.type.electronics': {
    fr: 'Électronique',
    en: 'Electronics',
    de: 'Elektronik',
    es: 'Electrónicos',
    it: 'Elettronica'
  },
  'package.type.food': {
    fr: 'Nourriture',
    en: 'Food',
    de: 'Lebensmittel',
    es: 'Comida',
    it: 'Cibo'
  },
  'package.type.gifts': {
    fr: 'Cadeaux',
    en: 'Gifts',
    de: 'Geschenke',
    es: 'Regalos',
    it: 'Regali'
  },
  'package.type.books': {
    fr: 'Livres',
    en: 'Books',
    de: 'Bücher',
    es: 'Libros',
    it: 'Libri'
  },
  'package.type.other': {
    fr: 'Autre',
    en: 'Other',
    de: 'Andere',
    es: 'Otro',
    it: 'Altro'
  },

  // Transport modes
  'transport.car': {
    fr: 'Voiture',
    en: 'Car',
    de: 'Auto',
    es: 'Coche',
    it: 'Auto'
  },
  'transport.train': {
    fr: 'Train',
    en: 'Train',
    de: 'Zug',
    es: 'Tren',
    it: 'Treno'
  },
  'transport.plane': {
    fr: 'Avion',
    en: 'Plane',
    de: 'Flugzeug',
    es: 'Avión',
    it: 'Aereo'
  },
  'transport.bus': {
    fr: 'Bus',
    en: 'Bus',
    de: 'Bus',
    es: 'Autobús',
    it: 'Autobus'
  },

  // Trip statuses
  'trip.status.draft': {
    fr: 'Brouillon',
    en: 'Draft',
    de: 'Entwurf',
    es: 'Borrador',
    it: 'Bozza'
  },
  'trip.status.published': {
    fr: 'Publié',
    en: 'Published',
    de: 'Veröffentlicht',
    es: 'Publicado',
    it: 'Pubblicato'
  },
  'trip.status.full': {
    fr: 'Complet',
    en: 'Full',
    de: 'Voll',
    es: 'Completo',
    it: 'Completo'
  },
  'trip.status.in_progress': {
    fr: 'En cours',
    en: 'In progress',
    de: 'In Bearbeitung',
    es: 'En progreso',
    it: 'In corso'
  },
  'trip.status.completed': {
    fr: 'Terminé',
    en: 'Completed',
    de: 'Abgeschlossen',
    es: 'Completado',
    it: 'Completato'
  },
  'trip.status.cancelled': {
    fr: 'Annulé',
    en: 'Cancelled',
    de: 'Storniert',
    es: 'Cancelado',
    it: 'Annullato'
  },

  // Common actions
  'btn.save': {
    fr: 'Enregistrer',
    en: 'Save',
    de: 'Speichern',
    es: 'Guardar',
    it: 'Salva'
  },
  'btn.cancel': {
    fr: 'Annuler',
    en: 'Cancel',
    de: 'Abbrechen',
    es: 'Cancelar',
    it: 'Annulla'
  },
  'btn.confirm': {
    fr: 'Confirmer',
    en: 'Confirm',
    de: 'Bestätigen',
    es: 'Confirmar',
    it: 'Conferma'
  },
  'btn.edit': {
    fr: 'Modifier',
    en: 'Edit',
    de: 'Bearbeiten',
    es: 'Editar',
    it: 'Modifica'
  },
  'btn.delete': {
    fr: 'Supprimer',
    en: 'Delete',
    de: 'Löschen',
    es: 'Eliminar',
    it: 'Elimina'
  },
  'btn.view_details': {
    fr: 'Voir les détails',
    en: 'View details',
    de: 'Details anzeigen',
    es: 'Ver detalles',
    it: 'Vedi dettagli'
  },

  // Messages
  'msg.trip_created': {
    fr: 'Voyage créé avec succès',
    en: 'Trip created successfully',
    de: 'Reise erfolgreich erstellt',
    es: 'Viaje creado exitosamente',
    it: 'Viaggio creato con successo'
  },
  'msg.booking_confirmed': {
    fr: 'Réservation confirmée',
    en: 'Booking confirmed',
    de: 'Buchung bestätigt',
    es: 'Reserva confirmada',
    it: 'Prenotazione confermata'
  },
  'msg.package_picked_up': {
    fr: 'Colis récupéré avec succès',
    en: 'Package picked up successfully',
    de: 'Paket erfolgreich abgeholt',
    es: 'Paquete recogido exitosamente',
    it: 'Pacco ritirato con successo'
  },
  'msg.package_delivered': {
    fr: 'Colis livré avec succès',
    en: 'Package delivered successfully',
    de: 'Paket erfolgreich zugestellt',
    es: 'Paquete entregado exitosamente',
    it: 'Pacco consegnato con successo'
  },
  'msg.payment_released': {
    fr: 'Paiement libéré',
    en: 'Payment released',
    de: 'Zahlung freigegeben',
    es: 'Pago liberado',
    it: 'Pagamento rilasciato'
  },
  'msg.trips_loaded': {
    fr: 'Voyages chargés avec succès',
    en: 'Trips loaded successfully',
    de: 'Reisen erfolgreich geladen',
    es: 'Viajes cargados exitosamente',
    it: 'Viaggi caricati con successo'
  },
  'msg.error_loading_trips': {
    fr: 'Erreur lors du chargement des voyages',
    en: 'Error loading trips',
    de: 'Fehler beim Laden der Reisen',
    es: 'Error al cargar los viajes',
    it: 'Errore nel caricamento dei viaggi'
  },
  'msg.unauthorized': {
    fr: 'Non autorisé',
    en: 'Unauthorized',
    de: 'Nicht autorisiert',
    es: 'No autorizado',
    it: 'Non autorizzato'
  },
  'msg.error_creating_trip': {
    fr: 'Erreur lors de la création du voyage',
    en: 'Error creating trip',
    de: 'Fehler beim Erstellen der Reise',
    es: 'Error al crear el viaje',
    it: 'Errore nella creazione del viaggio'
  },
  'msg.trip_not_found': {
    fr: 'Voyage non trouvé',
    en: 'Trip not found',
    de: 'Reise nicht gefunden',
    es: 'Viaje no encontrado',
    it: 'Viaggio non trovato'
  },
  'msg.trip_loaded': {
    fr: 'Voyage chargé avec succès',
    en: 'Trip loaded successfully',
    de: 'Reise erfolgreich geladen',
    es: 'Viaje cargado exitosamente',
    it: 'Viaggio caricato con successo'
  },
  'msg.error_loading_trip': {
    fr: 'Erreur lors du chargement du voyage',
    en: 'Error loading trip',
    de: 'Fehler beim Laden der Reise',
    es: 'Error al cargar el viaje',
    it: 'Errore nel caricamento del viaggio'
  },
  'msg.transactions_loaded': {
    fr: 'Transactions chargées avec succès',
    en: 'Transactions loaded successfully',
    de: 'Transaktionen erfolgreich geladen',
    es: 'Transacciones cargadas exitosamente',
    it: 'Transazioni caricate con successo'
  },
  'msg.error_loading_transactions': {
    fr: 'Erreur lors du chargement des transactions',
    en: 'Error loading transactions',
    de: 'Fehler beim Laden der Transaktionen',
    es: 'Error al cargar las transacciones',
    it: 'Errore nel caricamento delle transazioni'
  },
  'msg.transaction_not_found': {
    fr: 'Transaction non trouvée',
    en: 'Transaction not found',
    de: 'Transaktion nicht gefunden',
    es: 'Transacción no encontrada',
    it: 'Transazione non trovata'
  },
  'msg.invalid_pickup_code': {
    fr: 'Code de récupération invalide',
    en: 'Invalid pickup code',
    de: 'Ungültiger Abholcode',
    es: 'Código de recogida inválido',
    it: 'Codice di ritiro non valido'
  },
  'msg.cannot_pickup_package': {
    fr: 'Impossible de récupérer le colis',
    en: 'Cannot pickup package',
    de: 'Paket kann nicht abgeholt werden',
    es: 'No se puede recoger el paquete',
    it: 'Impossibile ritirare il pacco'
  },
  'msg.error_confirming_pickup': {
    fr: 'Erreur lors de la confirmation de récupération',
    en: 'Error confirming pickup',
    de: 'Fehler bei der Abholbestätigung',
    es: 'Error al confirmar la recogida',
    it: 'Errore nella conferma del ritiro'
  },
  'msg.invalid_locale': {
    fr: 'Langue non supportée',
    en: 'Unsupported language',
    de: 'Nicht unterstützte Sprache',
    es: 'Idioma no soportado',
    it: 'Lingua non supportata'
  },
  'msg.identity_verification_required': {
    fr: 'Vérification d\'identité requise',
    en: 'Identity verification required',
    de: 'Identitätsprüfung erforderlich',
    es: 'Verificación de identidad requerida',
    it: 'Verifica identità richiesta'
  },
  'msg.error_creating_booking': {
    fr: 'Erreur lors de la création de la réservation',
    en: 'Error creating booking',
    de: 'Fehler beim Erstellen der Buchung',
    es: 'Error al crear la reserva',
    it: 'Errore nella creazione della prenotazione'
  },

  // Forms
  'form.package_description': {
    fr: 'Description du colis',
    en: 'Package description',
    de: 'Paketbeschreibung',
    es: 'Descripción del paquete',
    it: 'Descrizione del pacco'
  },
  'form.package_weight': {
    fr: 'Poids du colis (kg)',
    en: 'Package weight (kg)',
    de: 'Paketgewicht (kg)',
    es: 'Peso del paquete (kg)',
    it: 'Peso del pacco (kg)'
  },
  'form.pickup_address': {
    fr: 'Adresse de récupération',
    en: 'Pickup address',
    de: 'Abholadresse',
    es: 'Dirección de recogida',
    it: 'Indirizzo di ritiro'
  },
  'form.delivery_address': {
    fr: 'Adresse de livraison',
    en: 'Delivery address',
    de: 'Lieferadresse',
    es: 'Dirección de entrega',
    it: 'Indirizzo di consegna'
  },
  'form.pickup_notes': {
    fr: 'Notes de récupération',
    en: 'Pickup notes',
    de: 'Abholnotizen',
    es: 'Notas de recogida',
    it: 'Note di ritiro'
  },
  'form.delivery_notes': {
    fr: 'Notes de livraison',
    en: 'Delivery notes',
    de: 'Liefernotizen',
    es: 'Notas de entrega',
    it: 'Note di consegna'
  }
};