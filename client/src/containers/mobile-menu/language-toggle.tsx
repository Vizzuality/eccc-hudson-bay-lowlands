"use client";

import { type Locale, useLocale, useTranslations } from "next-intl";
import { ToggleGroup } from "radix-ui";
import { useId } from "react";
import { useChangeLocale } from "@/containers/language-select/use-change-locale";
import { forgetMenuEntry } from "@/containers/mobile-menu/use-mobile-menu";
import { routing } from "@/i18n/routing";

export const LANGUAGE_TOGGLE_ACTIVE_SELECTOR =
  "[data-slot=language-toggle] [data-state=on]";

let switchedFromMenu = false;

export function wasLocaleSwitchedFromMenu() {
  return switchedFromMenu;
}

export function takeLanguageRefocus() {
  const shouldRefocus = switchedFromMenu;
  switchedFromMenu = false;
  return shouldRefocus;
}

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations();
  const labelId = useId();
  const { changeLocale, isPending } = useChangeLocale();

  const onValueChange = (value: string) => {
    if (!value) return;
    switchedFromMenu = true;
    forgetMenuEntry();
    changeLocale(value as Locale);
  };

  return (
    <div className="flex items-center justify-between border-input border-t px-5 pt-5 pb-10">
      <span
        id={labelId}
        className="font-bold text-muted-foreground text-xs uppercase leading-4 tracking-[1.2px]"
      >
        {t("mobile-menu.language")}
      </span>
      <ToggleGroup.Root
        data-slot="language-toggle"
        type="single"
        value={locale}
        onValueChange={onValueChange}
        disabled={isPending}
        aria-labelledby={labelId}
        className="flex gap-1 rounded-full bg-slate-100 p-1"
      >
        {routing.locales.map((item) => (
          <ToggleGroup.Item
            key={item}
            value={item}
            aria-label={t(`language.${item}`)}
            className="flex h-10 w-[72px] cursor-pointer items-center justify-center rounded-full font-bold text-foreground text-xs uppercase leading-5 tracking-[3px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {item}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}
