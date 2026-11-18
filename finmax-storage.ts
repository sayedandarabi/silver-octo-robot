import AsyncStorage from "@react-native-async-storage/async-storage";

export type StoredSettings = {
  language: "dari" | "pashto" | "en";
  level: "simple" | "business" | "pro";
  theme: "dark" | "light" | "system";
  businessName: string;
  businessId: string;
  baseCurrency: string;
  lockEnabled: boolean;
  onboardingComplete: boolean;
};

const SETTINGS_KEY = "finmax.settings.v1";
const SNAPSHOT_KEY = "finmax.snapshot.v1";
export const defaultSettings: StoredSettings = { language: "dari", level: "business", theme: "light", businessName: "Fin MaX", businessId: "demo-business", baseCurrency: "AFN", lockEnabled: false, onboardingComplete: false };

export async function loadSettings(): Promise<StoredSettings> { try { const raw = await AsyncStorage.getItem(SETTINGS_KEY); return raw ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<StoredSettings>) } : defaultSettings; } catch { return defaultSettings; } }
export async function saveSettings(settings: StoredSettings) { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
export async function saveSnapshot<T>(snapshot: T) { await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)); }
export async function loadSnapshot<T>(): Promise<T | null> { try { const raw = await AsyncStorage.getItem(SNAPSHOT_KEY); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; } }
export async function clearLocalSnapshot() { await AsyncStorage.removeItem(SNAPSHOT_KEY); }

export function businessIdForOpenId(openId: string) { const safe = openId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "local"; return `business-${safe}`; }
