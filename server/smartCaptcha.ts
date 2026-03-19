const SMART_CAPTCHA_VALIDATE_URL = "https://smartcaptcha.cloud.yandex.ru/validate";

interface SmartCaptchaValidateResponse {
  status?: string;
  message?: string;
}

export class SmartCaptchaValidationUnavailableError extends Error {
  constructor(message = "SmartCaptcha validation is unavailable") {
    super(message);
    this.name = "SmartCaptchaValidationUnavailableError";
  }
}

export function isSmartCaptchaEnabled() {
  return Boolean(process.env.YANDEX_SMARTCAPTCHA_SERVER_KEY?.trim());
}

export async function verifySmartCaptchaToken(options: {
  token: string;
  ip?: string;
}): Promise<boolean> {
  const secret = process.env.YANDEX_SMARTCAPTCHA_SERVER_KEY?.trim();

  if (!secret) {
    return true;
  }

  const body = new URLSearchParams({
    secret,
    token: options.token,
  });

  if (options.ip) {
    body.set("ip", options.ip);
  }

  let response: Response;

  try {
    response = await fetch(SMART_CAPTCHA_VALIDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } catch (error) {
    throw new SmartCaptchaValidationUnavailableError(
      error instanceof Error ? error.message : "Failed to reach SmartCaptcha",
    );
  }

  if (!response.ok) {
    throw new SmartCaptchaValidationUnavailableError(
      `SmartCaptcha responded with ${response.status}`,
    );
  }

  let payload: SmartCaptchaValidateResponse;

  try {
    payload = (await response.json()) as SmartCaptchaValidateResponse;
  } catch {
    throw new SmartCaptchaValidationUnavailableError(
      "SmartCaptcha returned an invalid response",
    );
  }

  return payload.status === "ok";
}
