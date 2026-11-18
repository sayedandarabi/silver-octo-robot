export type ProviderChannel = "TELEGRAM" | "WHATSAPP";
export type ProviderResult = { providerMessageId: string };

export async function sendProviderMessage(input: { channel: ProviderChannel; recipient: string; text: string }): Promise<ProviderResult> {
  if (input.channel === "TELEGRAM") {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("telegram_not_configured");
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: input.recipient, text: input.text }) });
    const data = await response.json() as { ok?: boolean; result?: { message_id?: number }; description?: string };
    if (!response.ok || !data.ok) throw new Error(data.description || "telegram_delivery_failed");
    return { providerMessageId: String(data.result?.message_id ?? "") };
  }
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) throw new Error("whatsapp_not_configured");
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v20.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: input.recipient, type: "text", text: { body: input.text } }) });
  const data = await response.json() as { messages?: Array<{ id?: string }>; error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || "whatsapp_delivery_failed");
  return { providerMessageId: data.messages?.[0]?.id ?? "" };
}
