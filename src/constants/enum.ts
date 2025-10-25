export const JobType = {
  SHORT: "short",
  MEDIUM: "medium",
  LONG: "long",
} as const;

export const JobStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const DocumentStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export const CommonDocumentTypes = {
  DRIVER_LICENSE: "driver_license", // Driver's license
  VEHICLE_REGISTRATION: "vehicle_registration", // Vehicle registration certificate
  INSURANCE: "insurance", // Vehicle insurance certificate
  CDL: "cdl", // Commercial Driver License
  MEDICAL_CARD: "medical_card", // Medical examiner's certificate
  HAZMAT_ENDORSEMENT: "hazmat_endorsement", // Hazardous materials endorsement
  TWIC_CARD: "twic_card", // Transportation Worker Identification Credential
  PASSPORT: "passport", // Passport for international travel
  ID_CARD: "id_card", // Government-issued ID card
  BUSINESS_LICENSE: "business_license", // Business operating license
  TAX_DOCUMENT: "tax_document", // Tax identification or clearance
  BANK_STATEMENT: "bank_statement", // Bank statement for verification
  ADDRESS_PROOF: "address_proof", // Proof of address (utility bill, lease agreement)
  BROKER_LICENSE: "broker_license", // Broker license (specific to brokers)
  CARGO_INSURANCE: "cargo_insurance", // Cargo insurance (specific to carriers)
  FUEL_TAX_EXEMPTION: "fuel_tax_exemption", // Fuel tax exemption (specific to carriers)
  SHIPPER_REGISTRATION: "shipper_registration", // Shipper registration (specific to shippers)
  DELIVERY_TERMS: "delivery_terms", // Delivery terms agreement (for shippers)
} as const;


export const UserVerificationStatus = {
  PENDING: "pending",
  PROFILE_COMPLETE: "profile_complete",
  DOCUMENTS_VERIFIED: "documents_verified",
  ADMIN_VERIFIED: "admin_verified",
  FULLY_VERIFIED: "fully_verified",
  SUSPENDED: "suspended",
  REJECTED: "rejected",
} as const;

export type UserVerificationStatusType = (typeof UserVerificationStatus)[keyof typeof UserVerificationStatus];
