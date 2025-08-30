"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageType = exports.TransactionStatus = void 0;
//src/types/transaction.ts
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PAYMENT_PENDING"] = "payment_pending";
    TransactionStatus["PAYMENT_ESCROWED"] = "payment_escrowed";
    TransactionStatus["PACKAGE_PICKED_UP"] = "package_picked_up";
    TransactionStatus["PACKAGE_DELIVERED"] = "package_delivered";
    TransactionStatus["PAYMENT_RELEASED"] = "payment_released";
    TransactionStatus["CANCELLED"] = "cancelled";
    TransactionStatus["DISPUTED"] = "disputed";
    TransactionStatus["REFUNDED"] = "refunded";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var PackageType;
(function (PackageType) {
    PackageType["DOCUMENTS"] = "documents";
    PackageType["CLOTHES"] = "clothes";
    PackageType["ELECTRONICS"] = "electronics";
    PackageType["FOOD"] = "food";
    PackageType["GIFTS"] = "gifts";
    PackageType["BOOKS"] = "books";
    PackageType["OTHER"] = "other";
})(PackageType || (exports.PackageType = PackageType = {}));
