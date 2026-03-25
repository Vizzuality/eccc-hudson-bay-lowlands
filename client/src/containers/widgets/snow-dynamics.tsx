import { SnowflakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import RichText from "@/components/ui/rich-text";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";

const Description = () => {
  const t = useTranslations("widgets.snow-dynamics");
  return (
    <RichText>
      {(tags) =>
        t.rich("description", {
          ...tags,
          selected_winter: 2021,
          lengthT_mean: 100,
          endL_mean_date: 2021,
        })
      }
    </RichText>
  );
};

const SnowDynamics = () => {
  const t = useTranslations("widgets.snow-dynamics");

  return (
    <WidgetCard
      title={t("title")}
      description={<Description />}
      icon={
        <WidgetCardIcon
          icon={<SnowflakeIcon className="size-5 text-indigo-700" />}
          backgroundColor="#4F46E5"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    ></WidgetCard>
  );
};

export default SnowDynamics;
