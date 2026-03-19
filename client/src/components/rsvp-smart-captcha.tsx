import { SmartCaptcha } from "@yandex/smart-captcha";

interface RsvpSmartCaptchaProps {
  errorMessage?: string | null;
  instanceKey: number;
  siteKey: string;
  onJavascriptError?: () => void;
  onNetworkError?: () => void;
  onSuccess: (token: string) => void;
  onTokenExpired?: () => void;
}

export function RsvpSmartCaptcha({
  errorMessage,
  instanceKey,
  siteKey,
  onJavascriptError,
  onNetworkError,
  onSuccess,
  onTokenExpired,
}: RsvpSmartCaptchaProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-4">
      <div>
        <p className="text-base text-foreground">Подтвердите, что вы не робот *</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Это защищает RSVP-форму от автоматических отправок.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <SmartCaptcha
          key={instanceKey}
          language="ru"
          sitekey={siteKey}
          onJavascriptError={onJavascriptError}
          onNetworkError={onNetworkError}
          onSuccess={onSuccess}
          onTokenExpired={onTokenExpired}
        />
      </div>

      {errorMessage ? (
        <p className="text-sm font-medium text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
