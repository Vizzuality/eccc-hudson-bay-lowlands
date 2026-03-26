import { SnowflakeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

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

const SnowDynamics: FC<WidgetCardBaseProps> = ({ id }) => {
  const t = useTranslations("widgets.snow-dynamics");

  return (
    <WidgetCard
      id={id}
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
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
    </WidgetCard>
  );
};

export default SnowDynamics;
