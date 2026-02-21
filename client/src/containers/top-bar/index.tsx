"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import LanguageSelect from "@/containers/language-select";
import { NAVIGATION } from "@/containers/top-bar/constants";
import { usePathname } from "@/i18n/navigation";

const TopBar = () => {
  const t = useTranslations("top-bar");
  const pathname = usePathname();
  return (
    <header className="flex justify-between items-center p-4">
      <p>{t("title")}</p>
      <section className="flex items-center gap-4">
        <nav className="border-slate-200 border-r">
          <ul className="flex gap-4">
            {NAVIGATION.map(({ id, href }) => (
              <li key={`top-bar-navigation-${id}`}>
                <Button
                  variant="menuItem"
                  aria-current={pathname.startsWith(href) ? "page" : undefined}
                  asChild
                >
                  <Link href={href}>{t(`navigation.${id}`)}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <LanguageSelect />
      </section>
    </header>
  );
};

export default TopBar;
