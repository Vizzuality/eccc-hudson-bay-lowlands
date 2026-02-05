import Link from "next/link";
import { useTranslations } from "next-intl";
import { NAVIGATION } from "@/containers/top-bar/constants";

const TopBar = () => {
  const t = useTranslations("top-bar");
  return (
    <header className="flex justify-between items-center p-4">
      <p>{t("title")}</p>
      <nav>
        <ul className="flex gap-4">
          {NAVIGATION.map(({ id, href }) => (
            <li key={`top-bar-navigation-${id}`}>
              <Link href={href}>{t(`navigation.${id}`)}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default TopBar;
