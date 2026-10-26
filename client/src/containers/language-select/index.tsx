"use client";

import { GlobeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useChangeLocale } from "@/containers/language-select/use-change-locale";
import { routing } from "@/i18n/routing";

const LanguageSelect = () => {
  const locale = useLocale();
  const t = useTranslations("language");
  const { changeLocale, isPending } = useChangeLocale();

  return (
    <Select value={locale} onValueChange={changeLocale} disabled={isPending}>
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
