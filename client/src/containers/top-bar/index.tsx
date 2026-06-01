"use client";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import LanguageSelect from "@/containers/language-select";
import { NAVIGATION } from "@/containers/top-bar/constants";
import { Link, usePathname } from "@/i18n/navigation";

const TopBar = () => {
  const t = useTranslations("top-bar");
  const pathname = usePathname();
  return (
    <header className="flex justify-between items-center p-4">
      <Link href="/" aria-label={t("title")}>
        <Image src="/logo.svg" alt={t("title")} width={126} height={37} />
      </Link>
      <section className="flex items-center gap-4">
        <nav className="border-slate-200 border-r">
          <ul className="flex gap-4">
            {NAVIGATION.map(({ id, href }) => {
              const isAnalysis = id === "analysis";
              if (isAnalysis && !pathname.startsWith("/analysis")) return null;
              return (
                <li key={`top-bar-navigation-${id}`}>
                  <Button
                    variant="menuItem"
                    aria-current={
                      (
                        href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(href)
                      )
                        ? "page"
                        : undefined
                    }
                    asChild
                  >
                    <NextLink href={isAnalysis ? pathname : href}>
                      {t(`navigation.${id}`)}
                    </NextLink>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
        <LanguageSelect />
      </section>
    </header>
  );
};

export default TopBar;
