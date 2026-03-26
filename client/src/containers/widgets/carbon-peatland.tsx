import { AtomIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

const CarbonPeatland: FC<WidgetCardBaseProps> = ({ id }) => {
  const t = useTranslations("widgets.carbon-peatlands");

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      description={
        <RichText>
          {(tags) =>
            t.rich("description", {
              ...tags,
              peat_depth_avg: 242,
              peat_depth_max: 680,
              carbon_total: 48.2,
              carbon_density: 38.7,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<AtomIcon className="size-5 text-yellow-600" />}
          backgroundColor="#CA8A04"
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

export default CarbonPeatland;
