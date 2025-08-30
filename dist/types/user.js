"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGender = exports.UserRole = exports.UserVerificationStatus = void 0;
//src/types/user.ts
var UserVerificationStatus;
(function (UserVerificationStatus) {
    UserVerificationStatus["UNVERIFIED"] = "unverified";
    UserVerificationStatus["PENDING_VERIFICATION"] = "pending";
    UserVerificationStatus["VERIFIED"] = "verified";
    UserVerificationStatus["VERIFICATION_FAILED"] = "failed";
    UserVerificationStatus["SUSPENDED"] = "suspended";
})(UserVerificationStatus || (exports.UserVerificationStatus = UserVerificationStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserGender;
(function (UserGender) {
    UserGender["MALE"] = "male";
    UserGender["FEMALE"] = "female";
    UserGender["OTHER"] = "other";
    UserGender["PREFER_NOT_TO_SAY"] = "prefer_not_to_say";
})(UserGender || (exports.UserGender = UserGender = {}));
