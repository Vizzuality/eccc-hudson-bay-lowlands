"use client";

import { GlobeIcon } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { type Locale, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LanguageSelect = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations("language");

  const [isPending, startTransition] = useTransition();
  const onLocaleChange = (value: Locale) => {
    startTransition(() => {
      router.replace(
        {
          pathname,
          // @ts-expect-error -- TypeScript will validate that only known `params`
          // are used in combination with a given `pathname`. Since the two will
          // always match for the current route, we can skip runtime checks.
          params,
          query: Object.fromEntries(searchParams.entries()), // Ensure searchParams are maintained
        },
        { locale: value },
      );
    });
  };

  return (
    <Select value={locale} onValueChange={onLocaleChange} disabled={isPending}>
      <SelectTrigger
        className="px-3 py-1.5 border-none shadow-none cursor-pointer text-muted-foreground hover:text-accent focus:text-accent-foreground data-[state=open]:text-accent-foreground group"
        hideChevronIcon
      >
        <GlobeIcon className="group-hover:text-accent-foreground group-focus:text-accent-foreground group-data-[state=open]:text-accent-foreground transition-colors" />
        <span className="text-xs font-semibold uppercase">{locale}</span>
      </SelectTrigger>
      <SelectContent position="popper">
        {routing.locales.map((locale) => (
          <SelectItem value={locale} key={locale}>
            <span className="text-sm">{t(locale)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelect;
