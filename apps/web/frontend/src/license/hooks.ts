import { tauriApi } from "../api/tauri";
import type { Tier } from "./index";

export const getTier = async (): Promise<Tier> => {
  const tier = await tauriApi.getTier();
  return tier as Tier;
};

export const activateLicense = async (params: {
  userId: string;
  activationKey: string;
  deviceId: string;
  plan: Tier;
  authToken: string;
}): Promise<{ tier: Tier; expires_at_ms?: number | null }> => {
  const raw = await tauriApi.activateLicense(
    params.userId,
    params.activationKey,
    params.deviceId,
    params.plan,
    params.authToken
  );
  return JSON.parse(raw) as { tier: Tier; expires_at_ms?: number | null };
};

export const getUsage = async (): Promise<Record<string, unknown>> => {
  const raw = await tauriApi.getUsage();
  return JSON.parse(raw) as Record<string, unknown>;
};
