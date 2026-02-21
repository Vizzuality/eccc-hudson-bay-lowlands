import { NextIntlClientProvider } from "next-intl";
import messages from "@/i18n/messages/en.json";

export function withIntl<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedWithIntl(props: P) {
    return (
      <NextIntlClientProvider locale="en" messages={messages}>
        <Component {...props} />
      </NextIntlClientProvider>
    );
  };
}
