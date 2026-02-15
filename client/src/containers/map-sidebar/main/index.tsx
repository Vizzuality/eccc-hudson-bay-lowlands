import { useTranslations } from "next-intl";

const Main = () => {
  const t = useTranslations("map");
  return (
    <header className="min-w-0">
      <h1>{t("title")}</h1>
      <p>
        Explore and combine geographical data overlays. Analyze your area of
        interest and get custom insights
      </p>
    </header>
  );
};

export default Main;
