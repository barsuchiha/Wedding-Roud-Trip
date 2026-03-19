import { z } from "zod";

export const transferOptions = ["need", "self"] as const;
export type TransferOption = (typeof transferOptions)[number];

export const drinkOptionIds = [
  "beer",
  "white_wine",
  "red_wine",
  "sparkling",
  "non_alcoholic",
] as const;
export type DrinkOptionId = (typeof drinkOptionIds)[number];

export function normalizeTelegramUsername(value: string) {
  const trimmedValue = value.trim();
  const withPrefix = trimmedValue.startsWith("@")
    ? trimmedValue
    : `@${trimmedValue}`;

  return withPrefix.toLowerCase();
}

export function getTelegramShortLink(username: string) {
  return `t.me/${normalizeTelegramUsername(username).slice(1)}`;
}

export const insertRsvpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Пожалуйста, введите ваше полное ФИО" })
    .max(200, { message: "ФИО не должно быть длиннее 200 символов" }),
  telegram: z
    .string()
    .trim()
    .regex(/^@?[a-zA-Z0-9_]{5,32}$/, {
      message: "Укажите корректный username в Telegram",
    })
    .transform(normalizeTelegramUsername),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, {
      message: "Укажите корректный номер телефона",
    }),
  transfer: z.enum(transferOptions, {
    required_error: "Выберите вариант трансфера",
  }),
  drinks: z.array(z.enum(drinkOptionIds)).min(1, {
    message: "Выберите хотя бы один напиток",
  }),
});

export type InsertRsvp = z.infer<typeof insertRsvpSchema>;

export const rsvpSubmissionSchema = insertRsvpSchema.extend({
  captchaToken: z.string().trim().optional(),
});

export type RsvpSubmission = z.infer<typeof rsvpSubmissionSchema>;

export interface StoredRsvp extends InsertRsvp {
  id: string;
  createdAt: string;
}
