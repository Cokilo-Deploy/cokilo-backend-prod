//src/types/user.ts
export enum UserVerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING_VERIFICATION = 'pending',
  VERIFIED = 'verified',
  VERIFICATION_FAILED = 'failed',
  SUSPENDED = 'suspended'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}