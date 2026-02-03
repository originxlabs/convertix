export type Tier = 'free' | 'pro' | 'premium';

export type LicenseStatus = {
  tier: Tier;
  isOffline: boolean;
  graceExpired: boolean;
  lastValidatedAtMs?: number;
};
