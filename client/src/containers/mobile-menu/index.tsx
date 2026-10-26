"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { type MouseEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LANGUAGE_TOGGLE_ACTIVE_SELECTOR,
  LanguageToggle,
  takeLanguageRefocus,
  wasLocaleSwitchedFromMenu,
} from "@/containers/mobile-menu/language-toggle";
import { MenuToggleIcon } from "@/containers/mobile-menu/menu-toggle-icon";
import {
  forgetMenuEntry,
  useMobileMenu,
} from "@/containers/mobile-menu/use-mobile-menu";
import { useNavigation } from "@/containers/top-bar/use-navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const FIRST_NAV_ITEM_SELECTOR = "[data-slot=mobile-menu-nav] a";

export function MobileMenu({ children }: Readonly<{ children: ReactNode }>) {
  const { isOpen, open, close } = useMobileMenu();

  return (
    <Dialog.Root
      modal={false}
      open={isOpen}
      onOpenChange={(nextOpen) => (nextOpen ? open() : close())}
    >
      {children}
    </Dialog.Root>
  );
}

export function MobileMenuTrigger() {
  const t = useTranslations("top-bar");
  const { isOpen } = useMobileMenu();

  return (
    <Dialog.Trigger asChild>
      <Button
        variant="ghost"
        size="icon"
        aria-label={isOpen ? t("close-menu") : t("open-menu")}
        className="lg:hidden"
      >
        <MenuToggleIcon isOpen={isOpen} />
      </Button>
    </Dialog.Trigger>
  );
}

export function MobileMenuArea({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { isOpen } = useMobileMenu();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div inert={isOpen} className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>
      <MobileMenuPanel />
    </div>
  );
}

function MobileMenuPanel() {
  const t = useTranslations();
  const items = useNavigation();
  const { close, closeInPlace } = useMobileMenu();
  const [skipEnterAnimation, setSkipEnterAnimation] = useState(
    wasLocaleSwitchedFromMenu,
  );

  const onItemClick = (
    event: MouseEvent<HTMLAnchorElement>,
    { href, isCurrent }: { href: string; isCurrent: boolean },
  ) => {
    if (isCurrent) {
      event.preventDefault();
      close();
    } else if (href === "#") {
      event.preventDefault();
      closeInPlace();
    } else {
      forgetMenuEntry();
    }
  };

  return (
    <Dialog.Content
      aria-describedby={undefined}
      onInteractOutside={(event) => event.preventDefault()}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        document
          .querySelector<HTMLElement>(
            takeLanguageRefocus()
              ? LANGUAGE_TOGGLE_ACTIVE_SELECTOR
              : FIRST_NAV_ITEM_SELECTOR,
          )
          ?.focus();
      }}
      onCloseAutoFocus={() => setSkipEnterAnimation(false)}
      className={cn(
        "absolute inset-0 z-20 flex flex-col bg-background outline-none duration-200 ease-out data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right motion-reduce:animate-none lg:hidden",
        !skipEnterAnimation &&
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
      )}
    >
      <Dialog.Title className="sr-only">{t("mobile-menu.title")}</Dialog.Title>
      <nav
        data-slot="mobile-menu-nav"
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-6 pb-2"
      >
        <ul className="flex flex-col gap-1">
          {items.map(({ id, href, isCurrent }) => (
            <li key={`mobile-menu-${id}`}>
              <Link
                href={href}
                replace
                aria-current={isCurrent ? "page" : undefined}
                onClick={(event) => onItemClick(event, { href, isCurrent })}
                className="flex h-12 items-center rounded-full px-4 py-2 font-bold text-foreground text-lg leading-7 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:bg-slate-100"
              >
                {t(`top-bar.navigation.${id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <LanguageToggle />
    </Dialog.Content>
  );
}
