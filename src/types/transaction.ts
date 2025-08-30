//src/types/transaction.ts
export enum TransactionStatus {
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_ESCROWED = 'payment_escrowed',
  PACKAGE_PICKED_UP = 'package_picked_up',
  PACKAGE_DELIVERED = 'package_delivered',
  PAYMENT_RELEASED = 'payment_released',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded'
}

export enum PackageType {
  DOCUMENTS = 'documents',
  CLOTHES = 'clothes',
  ELECTRONICS = 'electronics',
  FOOD = 'food',
  GIFTS = 'gifts',
  BOOKS = 'books',
  OTHER = 'other'
}