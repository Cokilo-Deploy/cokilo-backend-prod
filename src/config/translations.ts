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

  // Messages existants (gardés tels quels)
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

  // Messages d'erreur de transaction
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

  // Messages de succès de paiement
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

  // Messages de transaction
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

  // Messages de voyage (update/delete)
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

  // Messages d'erreur additionnels
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

  // Messages d'autorisation et permissions
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

  // Messages pour codes de validation
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

  // Messages pour statuts de livraison
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

  // Messages pour validation
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

  // Messages pour capacité
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

  // Messages génériques
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

  // Forms (existants, gardés tels quels)
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
  },

  // NOUVELLES CLÉS pour CreateTrip - à ajouter à votre interface AppTranslations
  'createTrip': {
    fr: 'Créer un voyage',
    en: 'Create Trip',
    de: 'Reise erstellen',
    es: 'Crear viaje',
    it: 'Crea viaggio'
  },
  'proposeYourBaggageSpace': {
    fr: 'Proposez votre espace de baggage',
    en: 'Offer your baggage space',
    de: 'Bieten Sie Ihren Gepäckraum an',
    es: 'Ofrece tu espacio de equipaje',
    it: 'Offri il tuo spazio bagagli'
  },
  'verificationRequired': {
    fr: 'Vérification requise',
    en: 'Verification Required',
    de: 'Verifizierung erforderlich',
    es: 'Verificación requerida',
    it: 'Verifica richiesta'
  },
  'verificationRequiredMessage': {
    fr: 'Vous devez vérifier votre identité pour créer des voyages.',
    en: 'You must verify your identity to create trips.',
    de: 'Sie müssen Ihre Identität verifizieren, um Reisen zu erstellen.',
    es: 'Debes verificar tu identidad para crear viajes.',
    it: 'Devi verificare la tua identità per creare viaggi.'
  },
  'verifyNow': {
    fr: 'Vérifier maintenant',
    en: 'Verify now',
    de: 'Jetzt verifizieren',
    es: 'Verificar ahora',
    it: 'Verifica ora'
  },
  'back': {
    fr: 'Retour',
    en: 'Back',
    de: 'Zurück',
    es: 'Atrás',
    it: 'Indietro'
  },
  'checkingStatus': {
    fr: 'Vérification de votre statut...',
    en: 'Checking your status...',
    de: 'Status wird überprüft...',
    es: 'Verificando tu estado...',
    it: 'Verifica del tuo stato...'
  },
  'tripTitle': {
    fr: 'Titre du voyage',
    en: 'Trip title',
    de: 'Reisetitel',
    es: 'Título del viaje',
    it: 'Titolo del viaggio'
  },
  'tripTitlePlaceholder': {
    fr: 'Ex: Paris → Londres en Eurostar',
    en: 'Ex: Paris → London by Eurostar',
    de: 'Z.B.: Paris → London mit Eurostar',
    es: 'Ej: París → Londres en Eurostar',
    it: 'Es: Parigi → Londra in Eurostar'
  },
  'tripDescription': {
    fr: 'Description *',
    en: 'Description *',
    de: 'Beschreibung *',
    es: 'Descripción *',
    it: 'Descrizione *'
  },
  'tripDescriptionPlaceholder': {
    fr: 'Décrivez votre voyage, vos conditions, etc...',
    en: 'Describe your trip, conditions, etc...',
    de: 'Beschreiben Sie Ihre Reise, Bedingungen usw...',
    es: 'Describe tu viaje, condiciones, etc...',
    it: 'Descrivi il tuo viaggio, condizioni, ecc...'
  },
  'departure': {
    fr: 'Départ',
    en: 'Departure',
    de: 'Abfahrt',
    es: 'Salida',
    it: 'Partenza'
  },
  'arrival': {
    fr: 'Arrivée',
    en: 'Arrival',
    de: 'Ankunft',
    es: 'Llegada',
    it: 'Arrivo'
  },
  'country': {
    fr: 'Pays *',
    en: 'Country *',
    de: 'Land *',
    es: 'País *',
    it: 'Paese *'
  },
  'city': {
    fr: 'Ville *',
    en: 'City *',
    de: 'Stadt *',
    es: 'Ciudad *',
    it: 'Città *'
  },
  'chooseCountry': {
    fr: 'Choisir un pays',
    en: 'Choose a country',
    de: 'Land wählen',
    es: 'Elegir país',
    it: 'Scegli paese'
  },
  'chooseCity': {
    fr: 'Choisir une ville',
    en: 'Choose a city',
    de: 'Stadt wählen',
    es: 'Elegir ciudad',
    it: 'Scegli città'
  },
  'departureDate': {
    fr: 'Date de départ *',
    en: 'Departure date *',
    de: 'Abfahrtsdatum *',
    es: 'Fecha de salida *',
    it: 'Data di partenza *'
  },
  'departureTime': {
    fr: 'Heure de départ *',
    en: 'Departure time *',
    de: 'Abfahrtszeit *',
    es: 'Hora de salida *',
    it: 'Ora di partenza *'
  },
  'arrivalDate': {
    fr: 'Date d\'arrivée *',
    en: 'Arrival date *',
    de: 'Ankunftsdatum *',
    es: 'Fecha de llegada *',
    it: 'Data di arrivo *'
  },
  'arrivalTime': {
    fr: 'Heure d\'arrivée *',
    en: 'Arrival time *',
    de: 'Ankunftszeit *',
    es: 'Hora de llegada *',
    it: 'Ora di arrivo *'
  },
  'transport': {
    fr: 'Transport',
    en: 'Transport',
    de: 'Transport',
    es: 'Transporte',
    it: 'Trasporto'
  },
  'car': {
    fr: 'Voiture',
    en: 'Car',
    de: 'Auto',
    es: 'Coche',
    it: 'Auto'
  },
  'train': {
    fr: 'Train',
    en: 'Train',
    de: 'Zug',
    es: 'Tren',
    it: 'Treno'
  },
  'plane': {
    fr: 'Avion',
    en: 'Plane',
    de: 'Flugzeug',
    es: 'Avión',
    it: 'Aereo'
  },
  'bus': {
    fr: 'Bus',
    en: 'Bus',
    de: 'Bus',
    es: 'Autobús',
    it: 'Autobus'
  },
  'availableSpace': {
    fr: 'Espace disponible',
    en: 'Available space',
    de: 'Verfügbarer Platz',
    es: 'Espacio disponible',
    it: 'Spazio disponibile'
  },
  'weightKg': {
    fr: 'Poids (kg) *',
    en: 'Weight (kg) *',
    de: 'Gewicht (kg) *',
    es: 'Peso (kg) *',
    it: 'Peso (kg) *'
  },
  'pricePerKg': {
    fr: 'Prix/kg (€) *',
    en: 'Price/kg (€) *',
    de: 'Preis/kg (€) *',
    es: 'Precio/kg (€) *',
    it: 'Prezzo/kg (€) *'
  },
  'maxItemSize': {
    fr: 'Taille max des objets',
    en: 'Max item size',
    de: 'Max. Objektgröße',
    es: 'Tamaño máx. objetos',
    it: 'Dimensione max oggetti'
  },
  'maxItemSizePlaceholder': {
    fr: '50x40x20 cm',
    en: '50x40x20 cm',
    de: '50x40x20 cm',
    es: '50x40x20 cm',
    it: '50x40x20 cm'
  },
  'estimatedRevenue': {
    fr: 'Revenus estimés',
    en: 'Estimated revenue',
    de: 'Geschätzter Erlös',
    es: 'Ingresos estimados',
    it: 'Ricavi stimati'
  },
  'preview': {
    fr: 'Aperçu:',
    en: 'Preview:',
    de: 'Vorschau:',
    es: 'Vista previa:',
    it: 'Anteprima:'
  },
  'departure2': {
    fr: 'Départ:',
    en: 'Departure:',
    de: 'Abfahrt:',
    es: 'Salida:',
    it: 'Partenza:'
  },
  'arrival2': {
    fr: 'Arrivée:',
    en: 'Arrival:',
    de: 'Ankunft:',
    es: 'Llegada:',
    it: 'Arrivo:'
  },
  'createTrip2': {
    fr: 'Créer le voyage',
    en: 'Create trip',
    de: 'Reise erstellen',
    es: 'Crear viaje',
    it: 'Crea viaggio'
  },
  'creating': {
    fr: 'Création...',
    en: 'Creating...',
    de: 'Wird erstellt...',
    es: 'Creando...',
    it: 'Creando...'
  },
  'titleRequired': {
    fr: 'Le titre est obligatoire',
    en: 'Title is required',
    de: 'Titel ist erforderlich',
    es: 'El título es obligatorio',
    it: 'Il titolo è obbligatorio'
  },
  'descriptionTooShort': {
    fr: 'La description doit contenir au moins 20 caractères',
    en: 'Description must contain at least 20 characters',
    de: 'Beschreibung muss mindestens 20 Zeichen enthalten',
    es: 'La descripción debe tener al menos 20 caracteres',
    it: 'La descrizione deve contenere almeno 20 caratteri'
  },
  'departureRequired': {
    fr: 'Le pays et la ville de départ sont obligatoires',
    en: 'Departure country and city are required',
    de: 'Abfahrtsland und -stadt sind erforderlich',
    es: 'País y ciudad de salida son obligatorios',
    it: 'Paese e città di partenza sono obbligatori'
  },
  'arrivalRequired': {
    fr: 'Le pays et la ville d\'arrivée sont obligatoires',
    en: 'Arrival country and city are required',
    de: 'Ankunftsland und -stadt sind erforderlich',
    es: 'País y ciudad de llegada son obligatorios',
    it: 'Paese e città di arrivo sono obbligatori'
  },
  'weightRequired': {
    fr: 'Le poids disponible doit être supérieur à 0',
    en: 'Available weight must be greater than 0',
    de: 'Verfügbares Gewicht muss größer als 0 sein',
    es: 'El peso disponible debe ser mayor que 0',
    it: 'Il peso disponibile deve essere maggiore di 0'
  },
  'priceRequired': {
    fr: 'Le prix par kg doit être supérieur à 0',
    en: 'Price per kg must be greater than 0',
    de: 'Preis pro kg muss größer als 0 sein',
    es: 'El precio por kg debe ser mayor que 0',
    it: 'Il prezzo per kg deve essere maggiore di 0'
  },
  'departureDateInFuture': {
    fr: 'La date de départ doit être dans le futur',
    en: 'Departure date must be in the future',
    de: 'Abfahrtsdatum muss in der Zukunft liegen',
    es: 'La fecha de salida debe ser futura',
    it: 'La data di partenza deve essere futura'
  },
  'arrivalDateAfterDeparture': {
    fr: 'La date d\'arrivée doit être après le départ',
    en: 'Arrival date must be after departure',
    de: 'Ankunftsdatum muss nach der Abfahrt liegen',
    es: 'La fecha de llegada debe ser después de la salida',
    it: 'La data di arrivo deve essere dopo la partenza'
  },
  'tripCreated': {
    fr: 'Voyage créé !',
    en: 'Trip created!',
    de: 'Reise erstellt!',
    es: '¡Viaje creado!',
    it: 'Viaggio creato!'
  },
  'tripCreatedMessage': {
    fr: 'Votre annonce de voyage a été créée avec succès.',
    en: 'Your trip listing has been created successfully.',
    de: 'Ihre Reiseanzeige wurde erfolgreich erstellt.',
    es: 'Tu anuncio de viaje se ha creado con éxito.',
    it: 'Il tuo annuncio di viaggio è stato creato con successo.'
  },
  'charactersOf': {
    fr: 'sur',
    en: 'of',
    de: 'von',
    es: 'de',
    it: 'di'
  },
  'at': {
    fr: 'à',
    en: 'at',
    de: 'um',
    es: 'a las',
    it: 'alle'
  },
  // HomeScreen - Header
  'home.title': {
    fr: 'CoKilo',
    en: 'CoKilo',
    de: 'CoKilo',
    es: 'CoKilo',
    it: 'CoKilo'
  },
  'home.subtitle': {
    fr: 'Transportez et expédiez en toute confiance',
    en: 'Transport and ship with confidence',
    de: 'Transportieren und versenden Sie mit Vertrauen',
    es: 'Transporta y envía con confianza',
    it: 'Trasporta e spedisci con fiducia'
  },

  // HomeScreen - Quick Actions
  'home.search_trip': {
    fr: 'Rechercher un voyage',
    en: 'Search for a trip',
    de: 'Nach einer Reise suchen',
    es: 'Buscar un viaje',
    it: 'Cerca un viaggio'
  },
  'home.search_trip_desc': {
    fr: 'Trouvez quelqu\'un qui peut transporter vos colis',
    en: 'Find someone who can transport your packages',
    de: 'Finden Sie jemanden, der Ihre Pakete transportieren kann',
    es: 'Encuentra a alguien que pueda transportar tus paquetes',
    it: 'Trova qualcuno che possa trasportare i tuoi pacchi'
  },
  'home.create_trip': {
    fr: 'Créer un voyage',
    en: 'Create a trip',
    de: 'Reise erstellen',
    es: 'Crear un viaje',
    it: 'Crea un viaggio'
  },
  'home.create_trip_desc': {
    fr: 'Proposez votre espace de baggage disponible',
    en: 'Offer your available baggage space',
    de: 'Bieten Sie Ihren verfügbaren Gepäckraum an',
    es: 'Ofrece tu espacio de equipaje disponible',
    it: 'Offri il tuo spazio bagagli disponibile'
  },

  // HomeScreen - Stats Section
  'home.your_stats': {
    fr: 'Vos statistiques',
    en: 'Your statistics',
    de: 'Ihre Statistiken',
    es: 'Tus estadísticas',
    it: 'Le tue statistiche'
  },
  'home.trips_created': {
    fr: 'Voyages créés',
    en: 'Trips created',
    de: 'Erstellte Reisen',
    es: 'Viajes creados',
    it: 'Viaggi creati'
  },
  'home.packages_sent': {
    fr: 'Colis envoyés',
    en: 'Packages sent',
    de: 'Versendete Pakete',
    es: 'Paquetes enviados',
    it: 'Pacchi inviati'
  },
  'home.loading': {
    fr: '...',
    en: '...',
    de: '...',
    es: '...',
    it: '...'
  }
};