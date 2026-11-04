export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  BUSINESS_OWNER: "BUSINESS_OWNER",
  STAFF: "STAFF",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
