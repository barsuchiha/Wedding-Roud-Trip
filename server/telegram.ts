import type { StoredRsvp } from "@shared/rsvp";

const TELEGRAM_API_BASE = "https://api.telegram.org";

function getTelegramConfig() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const messageThreadId = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();

  return {
    enabled: Boolean(botToken && chatId),
    botToken,
    chatId,
    messageThreadId:
      messageThreadId && Number.isFinite(Number(messageThreadId))
        ? Number(messageThreadId)
        : undefined,
  };
}

function formatTransfer(transfer: StoredRsvp["transfer"]) {
  return transfer === "need" ? "Нужен трансфер" : "Доберется самостоятельно";
}

function formatDrinks(drinks: StoredRsvp["drinks"]) {
  const drinkLabels: Record<StoredRsvp["drinks"][number], string> = {
    beer: "Пиво",
    white_wine: "Белое вино",
    red_wine: "Красное вино",
    sparkling: "Игристое",
    non_alcoholic: "Безалкогольное",
  };

  return drinks.map((drink) => drinkLabels[drink] ?? drink).join(", ");
}

function buildRsvpMessage(rsvp: StoredRsvp) {
  const submittedAt = new Date(rsvp.createdAt).toLocaleString("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "Новое подтверждение брони",
    "",
    `ФИО: ${rsvp.fullName}`,
    `Telegram: ${rsvp.telegram}`,
    `Телефон: ${rsvp.phone}`,
    `Трансфер: ${formatTransfer(rsvp.transfer)}`,
    `Напитки: ${formatDrinks(rsvp.drinks)}`,
    `Отправлено: ${submittedAt}`,
  ].join("\n");
}

export async function sendTelegramRsvpNotification(rsvp: StoredRsvp) {
  const config = getTelegramConfig();

  if (!config.enabled || !config.botToken || !config.chatId) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const body: {
    chat_id: string;
    text: string;
    disable_web_page_preview: boolean;
    message_thread_id?: number;
  } = {
    chat_id: config.chatId,
    text: buildRsvpMessage(rsvp),
    disable_web_page_preview: true,
  };

  if (config.messageThreadId !== undefined) {
    body.message_thread_id = config.messageThreadId;
  }

  const response = await fetch(
    `${TELEGRAM_API_BASE}/bot${config.botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Telegram notification failed with ${response.status}: ${errorText}`,
    );
  }

  const payload = (await response.json()) as { ok?: boolean; description?: string };

  if (!payload.ok) {
    throw new Error(
      payload.description || "Telegram notification failed with an unknown error",
    );
  }

  return { sent: true as const };
}
