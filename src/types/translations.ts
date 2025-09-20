// src/types/translations.ts - Interface complète à remplacer
export interface TranslationKey {
  fr: string;
  en: string;
  de: string;
  es: string;
  it: string;
}

export interface AppTranslations {
  // Navigation
  'nav.home': TranslationKey;
  'nav.trips': TranslationKey;
  'nav.search': TranslationKey;
  'nav.profile': TranslationKey;
  'nav.create_trip': TranslationKey;
  
  // Trip related
  'trip.from': TranslationKey;
  'trip.to': TranslationKey;
  'trip.departure_date': TranslationKey;
  'trip.arrival_date': TranslationKey;
  'trip.price_per_kg': TranslationKey;
  'trip.capacity': TranslationKey;
  'trip.available_weight': TranslationKey;
  'trip.book_now': TranslationKey;
  'trip.transport_mode': TranslationKey;
  
  // Transaction statuses
  'transaction.status.payment_pending': TranslationKey;
  'transaction.status.payment_escrowed': TranslationKey;
  'transaction.status.package_picked_up': TranslationKey;
  'transaction.status.package_delivered': TranslationKey;
  'transaction.status.payment_released': TranslationKey;
  'transaction.status.cancelled': TranslationKey;
  'transaction.status.disputed': TranslationKey;
  'transaction.status.refunded': TranslationKey;
  
  // Package types
  'package.type.documents': TranslationKey;
  'package.type.clothes': TranslationKey;
  'package.type.electronics': TranslationKey;
  'package.type.food': TranslationKey;
  'package.type.gifts': TranslationKey;
  'package.type.books': TranslationKey;
  'package.type.other': TranslationKey;
  
  // Transport modes
  'transport.car': TranslationKey;
  'transport.train': TranslationKey;
  'transport.plane': TranslationKey;
  'transport.bus': TranslationKey;
  
  // Trip statuses
  'trip.status.draft': TranslationKey;
  'trip.status.published': TranslationKey;
  'trip.status.full': TranslationKey;
  'trip.status.in_progress': TranslationKey;
  'trip.status.completed': TranslationKey;
  'trip.status.cancelled': TranslationKey;
  
  // Common actions
  'btn.save': TranslationKey;
  'btn.cancel': TranslationKey;
  'btn.confirm': TranslationKey;
  'btn.edit': TranslationKey;
  'btn.delete': TranslationKey;
  'btn.view_details': TranslationKey;
  
  // Messages existants
  'msg.trip_created': TranslationKey;
  'msg.booking_confirmed': TranslationKey;
  'msg.package_picked_up': TranslationKey;
  'msg.package_delivered': TranslationKey;
  'msg.payment_released': TranslationKey;
  'msg.trips_loaded': TranslationKey;
  'msg.error_loading_trips': TranslationKey;
  'msg.unauthorized': TranslationKey;
  'msg.error_creating_trip': TranslationKey;
  'msg.trip_not_found': TranslationKey;
  'msg.trip_loaded': TranslationKey;
  'msg.error_loading_trip': TranslationKey;
  'msg.transactions_loaded': TranslationKey;
  'msg.error_loading_transactions': TranslationKey;
  'msg.transaction_not_found': TranslationKey;
  'msg.invalid_pickup_code': TranslationKey;
  'msg.cannot_pickup_package': TranslationKey;
  'msg.error_confirming_pickup': TranslationKey;
  'msg.invalid_locale': TranslationKey;
  'msg.identity_verification_required': TranslationKey;
  'msg.error_creating_booking': TranslationKey;
  
  // NOUVELLES CLÉS - Messages d'erreur de transaction
  'msg.invalid_transaction_id': TranslationKey;
  'msg.transaction_already_processed': TranslationKey;
  'msg.description_too_short': TranslationKey;
  'msg.insufficient_capacity': TranslationKey;
  'msg.no_payment_intent': TranslationKey;
  'msg.cannot_cancel_paid_transaction': TranslationKey;
  
  // NOUVELLES CLÉS - Messages de succès de paiement
  'msg.payment_intent_created': TranslationKey;
  'msg.payment_intent_retrieved': TranslationKey;
  'msg.payment_confirmed': TranslationKey;
  'msg.error_creating_payment': TranslationKey;
  'msg.error_confirming_payment': TranslationKey;
  
  // NOUVELLES CLÉS - Messages de transaction
  'msg.transaction_loaded': TranslationKey;
  'msg.transaction_cancelled': TranslationKey;
  
  // NOUVELLES CLÉS - Messages de voyage (update/delete)
  'msg.trip_updated': TranslationKey;
  'msg.trip_deleted': TranslationKey;
  
  // NOUVELLES CLÉS - Messages d'erreur additionnels
  'msg.error_loading_transaction': TranslationKey;
  'msg.error_updating_trip': TranslationKey;
  'msg.error_deleting_trip': TranslationKey;
  
  // NOUVELLES CLÉS - Messages d'autorisation et permissions
  'msg.permission_denied': TranslationKey;
  'msg.access_forbidden': TranslationKey;
  
  // NOUVELLES CLÉS - Messages pour codes de validation
  'msg.invalid_delivery_code': TranslationKey;
  'msg.code_verification_failed': TranslationKey;
  
  // NOUVELLES CLÉS - Messages pour statuts de livraison
  'msg.delivery_confirmed': TranslationKey;
  'msg.pickup_confirmed': TranslationKey;
  
  // NOUVELLES CLÉS - Messages pour validation
  'msg.invalid_data': TranslationKey;
  'msg.missing_required_fields': TranslationKey;
  
  // NOUVELLES CLÉS - Messages pour capacité
  'msg.capacity_updated': TranslationKey;
  'msg.capacity_exceeded': TranslationKey;
  
  // NOUVELLES CLÉS - Messages génériques
  'msg.operation_successful': TranslationKey;
  'msg.operation_failed': TranslationKey;
  'msg.data_not_found': TranslationKey;
  'msg.server_error': TranslationKey;
  
  // Forms
  'form.package_description': TranslationKey;
  'form.package_weight': TranslationKey;
  'form.pickup_address': TranslationKey;
  'form.delivery_address': TranslationKey;
  'form.pickup_notes': TranslationKey;
  'form.delivery_notes': TranslationKey;
}

