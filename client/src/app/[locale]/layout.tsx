import { Sofia_Sans, Tinos } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ClientProviders } from "@/app/[locale]/providers";
// import "mapbox-gl/dist/mapbox-gl.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const sofiaSans = Sofia_Sans({
  variable: "--font-sofia-sans",
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

  return (
    <html lang={locale}>
      <body className={`${sofiaSans.variable} ${tinos.variable} antialiased`}>
        <NextIntlClientProvider>
          <NuqsAdapter>
            <TooltipProvider>
              <ClientProviders>{children}</ClientProviders>
            </TooltipProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
