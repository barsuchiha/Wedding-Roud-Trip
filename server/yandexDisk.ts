import { getTelegramShortLink, type StoredRsvp } from "@shared/rsvp";
import * as XLSX from "xlsx";

const YANDEX_DISK_API_BASE = "https://cloud-api.yandex.net/v1/disk";
let yandexDiskSyncQueue: Promise<void> = Promise.resolve();
const DEFAULT_YANDEX_DISK_FILE_PATH = "disk:/Wedding RSVP/rsvps.xlsx";
const RSVP_EXPORT_HEADERS = [
  "guest_number",
  "created_at",
  "full_name",
  "telegram",
  "telegram_link",
  "phone",
  "transfer",
  "drinks",
] as const;

function getYandexDiskConfig() {
  const oauthToken = process.env.YANDEX_DISK_OAUTH_TOKEN?.trim();
  const filePath =
    process.env.YANDEX_DISK_FILE_PATH?.trim() ||
    DEFAULT_YANDEX_DISK_FILE_PATH;

  return {
    enabled: Boolean(oauthToken),
    oauthToken,
    filePath,
  };
}

function getAuthorizationHeaders(oauthToken: string) {
  return {
    Authorization: `OAuth ${oauthToken}`,
  };
}

function getParentPath(filePath: string) {
  const lastSlashIndex = filePath.lastIndexOf("/");

  if (lastSlashIndex === -1) {
    return null;
  }

  const parentPath = filePath.slice(0, lastSlashIndex);
  return parentPath === "disk:" || parentPath === "app:" ? null : parentPath;
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function getExportFormat(filePath: string) {
  return filePath.toLowerCase().endsWith(".csv") ? "csv" : "xlsx";
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

function buildExportRows(rsvps: StoredRsvp[]) {
  return rsvps.map((rsvp, index) => [
    index + 1,
    rsvp.createdAt,
    rsvp.fullName,
    rsvp.telegram,
    getTelegramShortLink(rsvp.telegram),
    rsvp.phone,
    formatTransfer(rsvp.transfer),
    formatDrinks(rsvp.drinks),
  ]);
}

function buildCsvRow(row: Array<string | number>) {
  return row.map((value) => escapeCsvCell(String(value))).join(",");
}

function buildCsvContent(rsvps: StoredRsvp[]) {
  const rows = buildExportRows(rsvps);
  const header = RSVP_EXPORT_HEADERS.join(",");
  const csvRows = rows.map(buildCsvRow);
  return `${[header, ...csvRows].join("\n")}\n`;
}

function buildXlsxContent(rsvps: StoredRsvp[]) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    [...RSVP_EXPORT_HEADERS],
    ...buildExportRows(rsvps),
  ]);

  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 24 },
    { wch: 32 },
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 28 },
    { wch: 32 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "RSVP");

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });
}

async function getUploadPayload(filePath: string, rsvps: StoredRsvp[]) {
  if (getExportFormat(filePath) === "csv") {
    return {
      contentType: "text/csv; charset=utf-8",
      body: buildCsvContent(rsvps),
    };
  }

  return {
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: buildXlsxContent(rsvps),
  };
}

async function ensureFolderExists(oauthToken: string, filePath: string) {
  const parentPath = getParentPath(filePath);

  if (!parentPath) {
    return;
  }

  const response = await fetch(
    `${YANDEX_DISK_API_BASE}/resources?path=${encodeURIComponent(parentPath)}`,
    {
      method: "PUT",
      headers: getAuthorizationHeaders(oauthToken),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (response.status === 201 || response.status === 409) {
    return;
  }

  if (!response.ok) {
    throw new Error(
      `Yandex Disk folder creation failed with ${response.status}: ${await response.text()}`,
    );
  }
}

async function getUploadUrl(oauthToken: string, filePath: string) {
  const response = await fetch(
    `${YANDEX_DISK_API_BASE}/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`,
    {
      headers: getAuthorizationHeaders(oauthToken),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Yandex Disk upload URL request failed with ${response.status}: ${await response.text()}`,
    );
  }

  const payload = (await response.json()) as { href?: string };

  if (!payload.href) {
    throw new Error("Yandex Disk upload URL is missing in response");
  }

  return payload.href;
}

async function uploadFile(
  oauthToken: string,
  filePath: string,
  payload: {
    contentType: string;
    body: string | Buffer;
  },
) {
  const uploadUrl = await getUploadUrl(oauthToken, filePath);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": payload.contentType,
    },
    body: payload.body,
    signal: AbortSignal.timeout(15_000),
  });

  if (response.status === 201 || response.status === 202) {
    return;
  }

  if (!response.ok) {
    throw new Error(
      `Yandex Disk file upload failed with ${response.status}: ${await response.text()}`,
    );
  }
}

export async function syncRsvpToYandexDisk(rsvp: StoredRsvp) {
  return syncAllRsvpsToYandexDisk([rsvp]);
}

export async function syncAllRsvpsToYandexDisk(rsvps: StoredRsvp[]) {
  const config = getYandexDiskConfig();

  if (!config.enabled || !config.oauthToken) {
    return { synced: false as const, reason: "not_configured" as const };
  }

  await ensureFolderExists(config.oauthToken, config.filePath);
  const payload = await getUploadPayload(config.filePath, rsvps);
  await uploadFile(config.oauthToken, config.filePath, payload);

  return { synced: true as const };
}

export async function enqueueRsvpSyncToYandexDisk(
  loadRsvps: () => Promise<StoredRsvp[]>,
) {
  const nextSync = yandexDiskSyncQueue.then(
    async () => syncAllRsvpsToYandexDisk(await loadRsvps()),
    async () => syncAllRsvpsToYandexDisk(await loadRsvps()),
  );

  yandexDiskSyncQueue = nextSync.then(
    () => undefined,
    () => undefined,
  );

  return nextSync;
}
