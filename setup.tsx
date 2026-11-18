import { useEffect, useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AuroraBackdrop, C, Field, FormModal, Icon, Pill, SectionTitle, StatCard, SubmitButton } from "@/components/saderatpro/ui";
import { businessIdForOpenId, loadSettings } from "@/lib/saderatpro-storage";
import { getUserInfo } from "@/lib/_core/auth";
import { trpc } from "@/lib/trpc";

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
type ModalName = "category" | "unit" | "supplier" | "tax" | null;

export default function SetupScreen() {
  const [businessId, setBusinessId] = useState("demo-business");
  const [serverReady, setServerReady] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [notice, setNotice] = useState("");
  const [businessName, setBusinessName] = useState("سادات پرو");
  const ensureMutation = trpc.saderatpro.business.ensure.useMutation();
  const categories = trpc.saderatpro.catalog.categories.list.useQuery({ businessId }, { enabled: serverReady, retry: false });
  const units = trpc.saderatpro.catalog.units.list.useQuery({ businessId }, { enabled: serverReady, retry: false });
  const suppliers = trpc.saderatpro.catalog.suppliers.list.useQuery({ businessId }, { enabled: serverReady, retry: false });
  const taxes = trpc.saderatpro.catalog.taxRates.list.useQuery({ businessId }, { enabled: serverReady, retry: false });
  const currencies = trpc.saderatpro.catalog.currencies.list.useQuery({ businessId }, { enabled: serverReady, retry: false });
  const settings = trpc.saderatpro.catalog.invoiceSettings.get.useQuery({ businessId }, { enabled: serverReady, retry: false });
  const createCategory = trpc.saderatpro.catalog.categories.create.useMutation();
  const createUnit = trpc.saderatpro.catalog.units.create.useMutation();
  const createSupplier = trpc.saderatpro.catalog.suppliers.create.useMutation();
  const createTax = trpc.saderatpro.catalog.taxRates.create.useMutation();
  const saveInvoiceSettings = trpc.saderatpro.catalog.invoiceSettings.upsert.useMutation();
  const [invoiceTitle, setInvoiceTitle] = useState("فاکتور فروش");

  useEffect(() => {
    void getUserInfo().then(async (user) => {
      const saved = await loadSettings();
      setBusinessName(saved.businessName || "سادات پرو");
      if (!user) return;
      const id = businessIdForOpenId(user.openId);
      setBusinessId(id);
      await ensureMutation.mutateAsync({ businessId: id, name: saved.businessName || "سادات پرو", baseCurrency: saved.baseCurrency || "AFN" });
      setServerReady(true);
    }).catch(() => setServerReady(false));
  }, [ensureMutation]);
  useEffect(() => { if (settings.data?.title) setTimeout(() => setInvoiceTitle(settings.data.title), 0); }, [settings.data?.title]);

  const refresh = () => { void Promise.all([categories.refetch(), units.refetch(), suppliers.refetch(), taxes.refetch(), currencies.refetch(), settings.refetch()]); };
  const saved = (message: string) => { setModal(null); setNotice(message); refresh(); setTimeout(() => setNotice(""), 2400); };
  const submitModal = (data: { name: string; code: string; phone: string; value: string }) => {
    if (!data.name.trim()) return;
    if (modal === "category") void createCategory.mutateAsync({ businessId, id: uid("category"), name: data.name.trim(), code: data.code }).then(() => saved("دسته‌بندی ذخیره شد"));
    if (modal === "unit") void createUnit.mutateAsync({ businessId, id: uid("unit"), name: data.name.trim(), code: data.code || data.name.trim().slice(0, 3), kind: "COUNT" }).then(() => saved("واحد ذخیره شد"));
    if (modal === "supplier") void createSupplier.mutateAsync({ businessId, id: uid("supplier"), name: data.name.trim(), phone: data.phone, address: "", currency: "AFN", openingAmount: "0" }).then(() => saved("تأمین‌کننده ذخیره شد"));
    if (modal === "tax") void createTax.mutateAsync({ businessId, id: uid("tax"), name: data.name.trim(), percentBasisPoints: String(Number(data.value || "0") * 100), accountCode: data.code, active: true }).then(() => saved("نرخ مالیات ذخیره شد"));
  };
  const saveSettingsNow = () => void saveInvoiceSettings.mutateAsync({ businessId, title: invoiceTitle.trim() || "فاکتور فروش", logoPath: "", headerText: "", footerText: "", paperWidth: "A4", showSku: true, showUnit: true, showDiscount: true, showTax: true, showCustomerPhone: true, columnOrder: ["ردیف", "نام", "تعداد", "قیمت", "تخفیف", "مالیات", "مجموع"] }).then(() => saved("تنظیمات فاکتور ذخیره شد"));

  return <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content" backgroundColor={C.bg} /><AuroraBackdrop /><View style={styles.app}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Icon name="arrow-forward" color={C.text} size={20} /></Pressable><View style={styles.flex}><Text style={styles.title}>تنظیمات تجارتی</Text><Text style={styles.subtitle}>{businessName} • کاتالوگ و اسناد</Text></View><View style={styles.logo}><Icon name="options-outline" color={C.bg} size={18} /></View></View><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{notice ? <View style={styles.notice}><Icon name="checkmark-circle" color={C.emerald} size={17} /><Text style={styles.noticeText}>{notice}</Text></View> : null}<View style={styles.stats}><StatCard label="دسته‌بندی" value={`${categories.data?.length ?? 0}`} icon="grid-outline" tone="green" /><StatCard label="تأمین‌کننده" value={`${suppliers.data?.length ?? 0}`} icon="business-outline" tone="saffron" /></View><SectionTitle title="اطلاعات پایه کاروبار" /><View style={styles.card}><SettingRow icon="pricetags-outline" title="دسته‌بندی اجناس" caption="گروه‌بندی برای گزارش و تغییر گروهی قیمت" count={categories.data?.length ?? 0} onPress={() => setModal("category")} /><SettingRow icon="resize-outline" title="واحدها" caption="تعداد، وزن، طول و واحد فرعی" count={units.data?.length ?? 0} onPress={() => setModal("unit")} /><SettingRow icon="people-outline" title="تأمین‌کنندگان" caption="دفتر خرید و حساب فروشنده" count={suppliers.data?.length ?? 0} onPress={() => setModal("supplier")} /><SettingRow icon="receipt-outline" title="مالیات" caption="نرخ فعال و کد حساب مالیاتی" count={taxes.data?.length ?? 0} onPress={() => setModal("tax")} /></View><SectionTitle title="چندارزی و اسناد" /><View style={styles.card}><View style={styles.currencyRow}><View style={styles.currencyIcon}><Icon name="cash-outline" color={C.emerald} size={20} /></View><View style={styles.flex}><Text style={styles.name}>ارزهای فعال</Text><Text style={styles.meta}>{currencies.data?.map((item) => item.code).join(" • ") || "AFN پایه • USD • PKR • IRR"}</Text></View><Pill label="AFN پایه" tone="green" /></View><View style={styles.invoiceBox}><Text style={styles.label}>عنوان فاکتور</Text><Field label="" value={invoiceTitle} onChangeText={setInvoiceTitle} placeholder="فاکتور فروش" /><Pressable onPress={saveSettingsNow} style={styles.saveButton}><Icon name="save-outline" color={C.bg} size={17} /><Text style={styles.saveText}>{saveInvoiceSettings.isPending ? "در حال ذخیره…" : "ذخیره تنظیمات فاکتور"}</Text></Pressable></View></View><View style={styles.tip}><Icon name="shield-checkmark-outline" color={C.blue} size={20} /><Text style={styles.tipText}>هر تغییر از مسیر احراز‌شده tRPC به business شما وصل می‌شود و برای عملیات حساس audit خواهد شد.</Text></View></ScrollView></View><SetupModal visible={modal !== null} type={modal} onClose={() => setModal(null)} onSave={submitModal} /></SafeAreaView>;
}

function SettingRow({ icon, title, caption, count, onPress }: { icon: string; title: string; caption: string; count: number; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.settingRow}><View style={styles.settingIcon}><Icon name={icon} color={C.saffron} size={20} /></View><View style={styles.flex}><Text style={styles.name}>{title}</Text><Text style={styles.meta}>{caption}</Text></View><View style={styles.count}><Text style={styles.countText}>{count}</Text><Icon name="add" color={C.muted} size={16} /></View></Pressable>; }
function SetupModal({ visible, type, onClose, onSave }: { visible: boolean; type: ModalName; onClose: () => void; onSave: (data: { name: string; code: string; phone: string; value: string }) => void }) { const [name, setName] = useState(""); const [code, setCode] = useState(""); const [phone, setPhone] = useState(""); const [value, setValue] = useState(""); const title = type === "category" ? "دسته‌بندی جدید" : type === "unit" ? "واحد جدید" : type === "supplier" ? "تأمین‌کننده جدید" : "نرخ مالیات جدید"; return <FormModal visible={visible} title={title} subtitle="این اطلاعات مستقیماً در کاتالوگ کاروبار شما ثبت می‌شود" onClose={onClose}><Field label="نام" value={name} onChangeText={setName} placeholder={type === "tax" ? "مالیات فروش" : "نام مورد"} /><Field label={type === "supplier" ? "شماره تماس" : "کد"} value={type === "supplier" ? phone : code} onChangeText={type === "supplier" ? setPhone : setCode} placeholder={type === "supplier" ? "07xx xxx xxx" : "کد اختیاری"} keyboardType={type === "supplier" ? "numeric" : "default"} />{type === "tax" ? <Field label="درصد مالیات" value={value} onChangeText={setValue} placeholder="مثلاً 5" keyboardType="numeric" /> : null}<SubmitButton label="ذخیره" onPress={() => onSave({ name, code, phone, value })} /></FormModal>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: C.bg }, app: { flex: 1, backgroundColor: "transparent" }, flex: { flex: 1 }, header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14 }, back: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }, logo: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.saffron, alignItems: "center", justifyContent: "center" }, title: { color: C.text, fontSize: 22, fontWeight: "900", textAlign: "right" }, subtitle: { color: C.muted, fontSize: 11, textAlign: "right", marginTop: 3 }, scroll: { paddingHorizontal: 18, paddingBottom: 35 }, stats: { flexDirection: "row", gap: 10, marginBottom: 19 }, card: { backgroundColor: "#0D2921CC", borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, marginBottom: 19 }, settingRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#28483B" }, settingIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#1A4031", alignItems: "center", justifyContent: "center" }, name: { color: C.text, fontSize: 13, fontWeight: "800", textAlign: "right" }, meta: { color: C.muted, fontSize: 10, textAlign: "right", marginTop: 4 }, count: { flexDirection: "row", alignItems: "center", gap: 7 }, countText: { color: C.emerald, fontWeight: "900" }, currencyRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 14 }, currencyIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#1A4031", alignItems: "center", justifyContent: "center" }, invoiceBox: { borderTopWidth: 1, borderTopColor: "#28483B", paddingTop: 14, paddingBottom: 15 }, label: { color: C.muted, fontSize: 11, textAlign: "right", marginBottom: 2 }, saveButton: { backgroundColor: C.saffron, borderRadius: 16, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }, saveText: { color: C.bg, fontWeight: "900", fontSize: 12 }, tip: { flexDirection: "row", gap: 8, alignItems: "center", padding: 14, borderRadius: 16, backgroundColor: "#12294A" }, tipText: { color: C.muted, flex: 1, fontSize: 11, textAlign: "right", lineHeight: 18 }, notice: { flexDirection: "row", gap: 7, alignItems: "center", backgroundColor: "#163B35", borderRadius: 13, padding: 10, marginBottom: 12 }, noticeText: { color: C.emerald, fontSize: 11, fontWeight: "800", flex: 1, textAlign: "right" } });
