import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { getUserInfo } from "@/lib/_core/auth";
import { loadSettings } from "@/lib/saderatpro-storage";
import { C } from "@/components/saderatpro/ui";

export default function IndexRoute() {
  const authQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  useEffect(() => { let active = true; if (!authQuery.isFetched) return () => { active = false; }; void Promise.all([getUserInfo(), loadSettings()]).then(([localUser, settings]) => { if (!active) return; if (!authQuery.data && !localUser && !(settings.onboardingComplete && settings.businessId === "offline-business")) { router.replace("/login"); return; } if (authQuery.data || localUser) router.replace(settings.onboardingComplete ? "/(tabs)" : "/onboarding"); else router.replace("/(tabs)"); }); return () => { active = false; }; }, [authQuery.data, authQuery.isFetched]);
  return <View style={styles.page}><ActivityIndicator color={C.saffron} size="large" /><Text style={styles.text}>در حال آماده‌سازی سادات پرو...</Text></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", gap: 14 }, text: { color: C.muted, fontSize: 12 } });
