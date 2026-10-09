import dayjs from "dayjs";
import { Nunito, Tinos } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import ClientProviders from "@/app/[locale]/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import BetaBanner from "@/containers/beta-banner";
import { COOKIE_NAME, COOLDOWN_DAYS } from "@/containers/beta-banner/constants";
import IntroModal from "@/containers/intro-modal";
import { COOKIE_NAME as INTRO_COOKIE_NAME } from "@/containers/intro-modal/constants";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const tinos = Tinos({
  variable: "--font-tinos",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const cookieStore = await cookies();
  const dismissed = cookieStore.get(COOKIE_NAME)?.value;
  const showBanner =
    !dismissed ||
    dayjs().diff(dayjs(Number(dismissed)), "day") >= COOLDOWN_DAYS;
  const showIntro = !cookieStore.has(INTRO_COOKIE_NAME);

  return (
    <html lang={locale}>
      <body className={`${nunito.variable} ${tinos.variable} antialiased`}>
        <NextIntlClientProvider>
          <NuqsAdapter>
            <TooltipProvider>
              <ClientProviders>
                <div className="flex h-screen flex-col overflow-hidden">
                  {showBanner && <BetaBanner hideOnMobile={showIntro} />}
                  {showIntro && <IntroModal />}
                  {children}
                </div>
              </ClientProviders>
            </TooltipProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
