import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export const C = {
  bg: "#04100D",
  surface: "#0D2921",
  surface2: "#16382D",
  border: "#456255",
  text: "#EEFBF5",
  muted: "#9BB7AA",
  saffron: "#4ADE9B",
  emerald: "#A7F36B",
  coral: "#FF7A86",
  blue: "#71CBD0",
  white: "#FFFFFF",
};

export function Icon({ name, size = 20, color = C.text }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={name as any} size={size} color={color} />;
}

export function AuroraBackdrop() {
  return <View pointerEvents="none" style={styles.aurora}><View style={[styles.blob, styles.blobOne]} /><View style={[styles.blob, styles.blobTwo]} /><View style={[styles.blob, styles.blobThree]} /><View style={styles.grain} /></View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      {action ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : <View />}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function Pill({ label, tone = "muted" }: { label: string; tone?: "muted" | "green" | "coral" | "saffron" | "blue" }) {
  const palette = tone === "green" ? { bg: "#163B35", color: C.emerald } : tone === "coral" ? { bg: "#452A34", color: C.coral } : tone === "saffron" ? { bg: "#473B20", color: C.saffron } : tone === "blue" ? { bg: "#292C56", color: C.blue } : { bg: "#2A3157", color: C.muted };
  return <View style={[styles.pill, { backgroundColor: palette.bg }]}><Text style={[styles.pillText, { color: palette.color }]}>{label}</Text></View>;
}

export function StatCard({ label, value, icon, tone = "blue", sub }: { label: string; value: string; icon: string; tone?: "blue" | "green" | "coral" | "saffron"; sub?: string }) {
  const color = tone === "green" ? C.emerald : tone === "coral" ? C.coral : tone === "saffron" ? C.saffron : C.blue;
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: `${color}22` }]}><Icon name={icon} size={18} color={color} /></View><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text>{sub ? <Text style={styles.statSub}>{sub}</Text> : null}</View>;
}

export function ActionCard({ title, caption, icon, tone, onPress }: { title: string; caption: string; icon: string; tone: "saffron" | "green" | "blue" | "coral"; onPress: () => void }) {
  const color = tone === "saffron" ? C.saffron : tone === "green" ? C.emerald : tone === "coral" ? C.coral : C.blue;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { borderColor: `${color}45` }, pressed && { opacity: 0.78, transform: [{ scale: 0.98 }] }]}><View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}><Icon name={icon} color={color} size={22} /></View><View style={styles.flex}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionCaption}>{caption}</Text></View><Icon name="chevron-back" size={18} color={C.muted} /></Pressable>;
}

export function ActivityRow({ title, amount, detail, positive, icon }: { title: string; amount: string; detail: string; positive?: boolean; icon: string }) {
  const color = positive ? C.emerald : C.coral;
  return <View style={styles.activityRow}><View style={[styles.activityIcon, { backgroundColor: `${color}20` }]}><Icon name={icon} size={18} color={color} /></View><View style={styles.flex}><Text style={styles.activityTitle}>{title}</Text><Text style={styles.activityDetail}>{detail}</Text></View><Text style={[styles.activityAmount, { color }]}>{positive ? "+" : "−"}{amount}</Text></View>;
}

export function FormModal({ visible, title, subtitle, onClose, children }: { visible: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHandle} /><View style={styles.modalHeader}><Pressable onPress={onClose} style={styles.closeButton}><Icon name="close" size={20} color={C.muted} /></Pressable><View style={styles.flex}><Text style={styles.modalTitle}>{title}</Text>{subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}</View></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>{children}</ScrollView></View></View></Modal>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, secureTextEntry = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: "default" | "numeric"; multiline?: boolean; secureTextEntry?: boolean }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#677096" keyboardType={keyboardType} multiline={multiline} secureTextEntry={secureTextEntry} style={[styles.input, multiline && { minHeight: 80, textAlignVertical: "top" }]} /></View>;
}

export function SubmitButton({ label, onPress, tone = "saffron" }: { label: string; onPress: () => void; tone?: "saffron" | "green" }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.submitButton, { backgroundColor: tone === "green" ? C.emerald : C.saffron }, pressed && { opacity: 0.8 }]}><Text style={styles.submitText}>{label}</Text><Icon name="arrow-back" color={C.bg} size={18} /></Pressable>;
}

export const styles = StyleSheet.create({
  aurora: { ...StyleSheet.absoluteFill, overflow: "hidden" }, blob: { position: "absolute", borderRadius: 999, opacity: 0.22 }, blobOne: { width: 270, height: 270, backgroundColor: "#0B8F63", top: -95, right: -78 }, blobTwo: { width: 230, height: 230, backgroundColor: "#1D6F8F", bottom: 75, left: -105 }, blobThree: { width: 190, height: 190, backgroundColor: "#6F4FD8", top: "40%", right: "24%", opacity: 0.12 }, grain: { ...StyleSheet.absoluteFill, opacity: 0.035, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, sectionTitle: { color: C.text, fontSize: 17, fontWeight: "800", textAlign: "right" }, sectionAction: { color: C.saffron, fontSize: 12, fontWeight: "700" }, statCard: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, minWidth: 140, marginLeft: 10 }, statIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 }, statLabel: { color: C.muted, fontSize: 11, textAlign: "right" }, statValue: { color: C.text, fontSize: 16, fontWeight: "800", marginTop: 5, textAlign: "right" }, statSub: { color: C.muted, fontSize: 10, marginTop: 4, textAlign: "right" }, pill: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 }, pillText: { fontSize: 10, fontWeight: "800" }, actionCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10 }, actionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, actionTitle: { color: C.text, fontWeight: "800", fontSize: 14, textAlign: "right" }, actionCaption: { color: C.muted, fontSize: 11, marginTop: 4, textAlign: "right" }, activityRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#28483B" }, activityIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" }, activityTitle: { color: C.text, fontSize: 13, fontWeight: "700", textAlign: "right" }, activityDetail: { color: C.muted, fontSize: 10, marginTop: 3, textAlign: "right" }, activityAmount: { fontSize: 12, fontWeight: "800" }, modalBackdrop: { flex: 1, backgroundColor: "#04100DCC", justifyContent: "flex-end" }, modalCard: { maxHeight: "92%", backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 18, borderWidth: 1, borderColor: C.border }, modalHandle: { width: 44, height: 4, borderRadius: 4, backgroundColor: C.border, alignSelf: "center", marginBottom: 17 }, modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }, modalTitle: { color: C.text, fontSize: 21, fontWeight: "900", textAlign: "right" }, modalSubtitle: { color: C.muted, fontSize: 11, marginTop: 4, textAlign: "right" }, closeButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }, formContent: { paddingBottom: 25 }, field: { marginTop: 13 }, fieldLabel: { color: C.muted, fontSize: 12, fontWeight: "700", textAlign: "right", marginBottom: 7 }, input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, color: C.text, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, textAlign: "right" }, submitButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, borderRadius: 16, paddingVertical: 15, marginTop: 21 }, submitText: { color: C.bg, fontWeight: "900", fontSize: 14 },
});
