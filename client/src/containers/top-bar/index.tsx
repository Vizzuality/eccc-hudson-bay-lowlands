"use client";
import Image from "next/image";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import LanguageSelect from "@/containers/language-select";
import { MobileMenuTrigger } from "@/containers/mobile-menu";
import { useNavigation } from "@/containers/top-bar/use-navigation";
import { Link } from "@/i18n/navigation";

const TopBar = () => {
  const t = useTranslations("top-bar");
  const items = useNavigation();
  return (
    <header className="flex justify-between items-center p-4 max-lg:h-16 max-lg:border-white max-lg:border-b max-lg:bg-white/80 max-lg:px-5 max-lg:py-3">
      <Link href="/" aria-label={t("title")}>
        <Image
          src="/logo.svg"
          alt={t("title")}
          width={126}
          height={37}
          className="max-lg:h-auto max-lg:w-30"
        />
      </Link>
      <section className="flex items-center gap-4 max-lg:hidden">
        <nav className="border-slate-200 border-r">
          <ul className="flex gap-4">
            {items.map(({ id, href, isCurrent }) => (
              <li key={`top-bar-navigation-${id}`}>
                <Button
                  variant="menuItem"
                  aria-current={isCurrent ? "page" : undefined}
                  asChild
                >
                  <NextLink href={href}>{t(`navigation.${id}`)}</NextLink>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <LanguageSelect />
      </section>
      <MobileMenuTrigger />
    </header>
  );
};

export default TopBar;
