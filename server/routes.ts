import { rsvpSubmissionSchema } from "@shared/rsvp";
import type { Express, Request } from "express";
import type { Server } from "http";
import {
  isSmartCaptchaEnabled,
  SmartCaptchaValidationUnavailableError,
  verifySmartCaptchaToken,
} from "./smartCaptcha";
import { DuplicateTelegramRsvpError, storage } from "./storage";
import { sendTelegramRsvpNotification } from "./telegram";
import { enqueueRsvpSyncToYandexDisk } from "./yandexDisk";

const duplicateTelegramMessage =
  "Похоже, RSVP с таким Telegram уже есть. Если нужно внести изменения, пожалуйста, обратитесь к организаторам.";
const captchaRequiredMessage = "Подтвердите, что вы не робот.";
const captchaFailedMessage =
  "Не удалось подтвердить, что вы не робот. Пожалуйста, пройдите капчу еще раз.";
const captchaUnavailableMessage =
  "Капча временно недоступна. Попробуйте отправить форму чуть позже.";

function getClientIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];
  const rawIp = forwardedIp ?? req.ip ?? req.socket.remoteAddress;

  if (!rawIp) {
    return undefined;
  }

  return rawIp.trim().replace(/^::ffff:/, "");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/rsvps", async (req, res, next) => {
    const parsedRsvp = rsvpSubmissionSchema.safeParse(req.body);

    if (!parsedRsvp.success) {
      return res.status(400).json({
        message:
          parsedRsvp.error.issues[0]?.message ??
          "Пожалуйста, проверьте заполнение формы.",
        code: "validation_error",
      });
    }

    const { captchaToken, ...rsvpData } = parsedRsvp.data;

    if (isSmartCaptchaEnabled()) {
      if (!captchaToken) {
        return res.status(400).json({
          message: captchaRequiredMessage,
          code: "captcha_required",
          field: "captcha",
        });
      }

      try {
        const isCaptchaValid = await verifySmartCaptchaToken({
          token: captchaToken,
          ip: getClientIp(req),
        });

        if (!isCaptchaValid) {
          return res.status(403).json({
            message: captchaFailedMessage,
            code: "captcha_failed",
            field: "captcha",
          });
        }
      } catch (error) {
        if (error instanceof SmartCaptchaValidationUnavailableError) {
          console.error("SmartCaptcha validation failed:", error);

          return res.status(502).json({
            message: captchaUnavailableMessage,
            code: "captcha_unavailable",
            field: "captcha",
          });
        }

        return next(error);
      }
    }

    try {
      const savedRsvp = await storage.createRsvp(rsvpData);

      try {
        await enqueueRsvpSyncToYandexDisk(() => storage.listRsvps());
      } catch (yandexDiskError) {
        console.error("Failed to sync RSVP to Yandex Disk:", yandexDiskError);
      }

      try {
        await sendTelegramRsvpNotification(savedRsvp);
      } catch (notificationError) {
        console.error("Failed to send Telegram RSVP notification:", notificationError);
      }

      return res.status(201).json({ success: true });
    } catch (error) {
      if (error instanceof DuplicateTelegramRsvpError) {
        return res.status(409).json({
          message: duplicateTelegramMessage,
          code: "duplicate_telegram",
          field: "telegram",
        });
      }

      return next(error);
    }
  });

  return httpServer;
}
