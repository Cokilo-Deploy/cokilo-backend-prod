// src/config/translations.ts - Version complète
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

  // Messages existants
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

  // NOUVELLES CLÉS - Messages d'erreur de transaction
  'msg.invalid_transaction_id': {
    fr: 'ID de transaction invalide',
    en: 'Invalid transaction ID',
    de: 'Ungültige Transaktions-ID',
    es: 'ID de transacción inválido',
    it: 'ID transazione non valido'
  },
  'msg.transaction_already_processed': {
    fr: 'Cette transaction a déjà été traitée',
    en: 'This transaction has already been processed',
    de: 'Diese Transaktion wurde bereits bearbeitet',
    es: 'Esta transacción ya ha sido procesada',
    it: 'Questa transazione è già stata elaborata'
  },
  'msg.description_too_short': {
    fr: 'La description doit contenir au moins 10 caractères',
    en: 'Description must contain at least 10 characters',
    de: 'Die Beschreibung muss mindestens 10 Zeichen enthalten',
    es: 'La descripción debe contener al menos 10 caracteres',
    it: 'La descrizione deve contenere almeno 10 caratteri'
  },
  'msg.insufficient_capacity': {
    fr: 'Capacité insuffisante pour ce voyage',
    en: 'Insufficient capacity for this trip',
    de: 'Unzureichende Kapazität für diese Reise',
    es: 'Capacidad insuficiente para este viaje',
    it: 'Capacità insufficiente per questo viaggio'
  },
  'msg.no_payment_intent': {
    fr: 'Aucun payment intent associé',
    en: 'No payment intent associated',
    de: 'Keine Zahlungsabsicht zugeordnet',
    es: 'No hay intención de pago asociada',
    it: 'Nessuna intenzione di pagamento associata'
  },
  'msg.cannot_cancel_paid_transaction': {
    fr: 'Cette réservation ne peut plus être annulée car le paiement a été effectué',
    en: 'This booking can no longer be cancelled as payment has been made',
    de: 'Diese Buchung kann nicht mehr storniert werden, da die Zahlung erfolgt ist',
    es: 'Esta reserva ya no se puede cancelar ya que se ha realizado el pago',
    it: 'Questa prenotazione non può più essere cancellata poiché il pagamento è stato effettuato'
  },

  // NOUVELLES CLÉS - Messages de succès de paiement
  'msg.payment_intent_created': {
    fr: 'Intention de paiement créée avec succès',
    en: 'Payment intent created successfully',
    de: 'Zahlungsabsicht erfolgreich erstellt',
    es: 'Intención de pago creada exitosamente',
    it: 'Intenzione di pagamento creata con successo'
  },
  'msg.payment_intent_retrieved': {
    fr: 'Intention de paiement récupérée',
    en: 'Payment intent retrieved',
    de: 'Zahlungsabsicht abgerufen',
    es: 'Intención de pago recuperada',
    it: 'Intenzione di pagamento recuperata'
  },
  'msg.payment_confirmed': {
    fr: 'Paiement confirmé avec succès',
    en: 'Payment confirmed successfully',
    de: 'Zahlung erfolgreich bestätigt',
    es: 'Pago confirmado exitosamente',
    it: 'Pagamento confermato con successo'
  },
  'msg.error_creating_payment': {
    fr: 'Erreur lors de la création du paiement',
    en: 'Error creating payment',
    de: 'Fehler beim Erstellen der Zahlung',
    es: 'Error al crear el pago',
    it: 'Errore nella creazione del pagamento'
  },
  'msg.error_confirming_payment': {
    fr: 'Erreur lors de la confirmation du paiement',
    en: 'Error confirming payment',
    de: 'Fehler bei der Zahlungsbestätigung',
    es: 'Error al confirmar el pago',
    it: 'Errore nella conferma del pagamento'
  },

  // NOUVELLES CLÉS - Messages de transaction
  'msg.transaction_loaded': {
    fr: 'Transaction chargée avec succès',
    en: 'Transaction loaded successfully',
    de: 'Transaktion erfolgreich geladen',
    es: 'Transacción cargada exitosamente',
    it: 'Transazione caricata con successo'
  },
  'msg.transaction_cancelled': {
    fr: 'Réservation annulée avec succès',
    en: 'Booking cancelled successfully',
    de: 'Buchung erfolgreich storniert',
    es: 'Reserva cancelada exitosamente',
    it: 'Prenotazione cancellata con successo'
  },

  // NOUVELLES CLÉS - Messages de voyage (update/delete)
  'msg.trip_updated': {
    fr: 'Voyage mis à jour avec succès',
    en: 'Trip updated successfully',
    de: 'Reise erfolgreich aktualisiert',
    es: 'Viaje actualizado exitosamente',
    it: 'Viaggio aggiornato con successo'
  },
  'msg.trip_deleted': {
    fr: 'Voyage supprimé avec succès',
    en: 'Trip deleted successfully',
    de: 'Reise erfolgreich gelöscht',
    es: 'Viaje eliminado exitosamente',
    it: 'Viaggio eliminato con successo'
  },

  // NOUVELLES CLÉS - Messages d'erreur additionnels
  'msg.error_loading_transaction': {
    fr: 'Erreur lors du chargement de la transaction',
    en: 'Error loading transaction',
    de: 'Fehler beim Laden der Transaktion',
    es: 'Error al cargar la transacción',
    it: 'Errore nel caricamento della transazione'
  },
  'msg.error_updating_trip': {
    fr: 'Erreur lors de la mise à jour du voyage',
    en: 'Error updating trip',
    de: 'Fehler beim Aktualisieren der Reise',
    es: 'Error al actualizar el viaje',
    it: 'Errore nell\'aggiornamento del viaggio'
  },
  'msg.error_deleting_trip': {
    fr: 'Erreur lors de la suppression du voyage',
    en: 'Error deleting trip',
    de: 'Fehler beim Löschen der Reise',
    es: 'Error al eliminar el viaje',
    it: 'Errore nell\'eliminazione del viaggio'
  },

  // NOUVELLES CLÉS - Messages d'autorisation et permissions
  'msg.permission_denied': {
    fr: 'Permission refusée',
    en: 'Permission denied',
    de: 'Berechtigung verweigert',
    es: 'Permiso denegado',
    it: 'Permesso negato'
  },
  'msg.access_forbidden': {
    fr: 'Accès interdit',
    en: 'Access forbidden',
    de: 'Zugriff verboten',
    es: 'Acceso prohibido',
    it: 'Accesso vietato'
  },

  // NOUVELLES CLÉS - Messages pour codes de validation
  'msg.invalid_delivery_code': {
    fr: 'Code de livraison invalide',
    en: 'Invalid delivery code',
    de: 'Ungültiger Liefercode',
    es: 'Código de entrega inválido',
    it: 'Codice di consegna non valido'
  },
  'msg.code_verification_failed': {
    fr: 'Échec de la vérification du code',
    en: 'Code verification failed',
    de: 'Code-Verifizierung fehlgeschlagen',
    es: 'Falló la verificación del código',
    it: 'Verifica del codice fallita'
  },

  // NOUVELLES CLÉS - Messages pour statuts de livraison
  'msg.delivery_confirmed': {
    fr: 'Livraison confirmée avec succès',
    en: 'Delivery confirmed successfully',
    de: 'Lieferung erfolgreich bestätigt',
    es: 'Entrega confirmada exitosamente',
    it: 'Consegna confermata con successo'
  },
  'msg.pickup_confirmed': {
    fr: 'Récupération confirmée avec succès',
    en: 'Pickup confirmed successfully',
    de: 'Abholung erfolgreich bestätigt',
    es: 'Recogida confirmada exitosamente',
    it: 'Ritiro confermato con successo'
  },

  // NOUVELLES CLÉS - Messages pour validation
  'msg.invalid_data': {
    fr: 'Données invalides',
    en: 'Invalid data',
    de: 'Ungültige Daten',
    es: 'Datos inválidos',
    it: 'Dati non validi'
  },
  'msg.missing_required_fields': {
    fr: 'Champs obligatoires manquants',
    en: 'Missing required fields',
    de: 'Fehlende Pflichtfelder',
    es: 'Campos obligatorios faltantes',
    it: 'Campi obbligatori mancanti'
  },

  // NOUVELLES CLÉS - Messages pour capacité
  'msg.capacity_updated': {
    fr: 'Capacité mise à jour',
    en: 'Capacity updated',
    de: 'Kapazität aktualisiert',
    es: 'Capacidad actualizada',
    it: 'Capacità aggiornata'
  },
  'msg.capacity_exceeded': {
    fr: 'Capacité dépassée',
    en: 'Capacity exceeded',
    de: 'Kapazität überschritten',
    es: 'Capacidad excedida',
    it: 'Capacità superata'
  },

  // NOUVELLES CLÉS - Messages génériques
  'msg.operation_successful': {
    fr: 'Opération réussie',
    en: 'Operation successful',
    de: 'Operation erfolgreich',
    es: 'Operación exitosa',
    it: 'Operazione riuscita'
  },
  'msg.operation_failed': {
    fr: 'Échec de l\'opération',
    en: 'Operation failed',
    de: 'Operation fehlgeschlagen',
    es: 'Operación fallida',
    it: 'Operazione fallita'
  },
  'msg.data_not_found': {
    fr: 'Données non trouvées',
    en: 'Data not found',
    de: 'Daten nicht gefunden',
    es: 'Datos no encontrados',
    it: 'Dati non trovati'
  },
  'msg.server_error': {
    fr: 'Erreur serveur',
    en: 'Server error',
    de: 'Serverfehler',
    es: 'Error del servidor',
    it: 'Errore del server'
  },

  'msg.language_updated': {
  fr: 'Langue mise à jour avec succès',
  en: 'Language updated successfully',
  de: 'Sprache erfolgreich aktualisiert',
  es: 'Idioma actualizado exitosamente',
  it: 'Lingua aggiornata con successo'
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