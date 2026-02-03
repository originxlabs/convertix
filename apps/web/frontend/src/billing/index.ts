export type ActivationPayload = {
  activationKey: string;
  plan: 'free' | 'pro' | 'premium';
  deviceId: string;
};
