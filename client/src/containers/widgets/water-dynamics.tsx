import { DropletsIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

const WaterDynamics: FC<WidgetCardBaseProps> = ({ id }) => {
  const t = useTranslations("widgets.water-dynamics");

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      description={
        <RichText>
          {(tags) =>
            t.rich("description", {
              ...tags,
              water_perm_perc: 8.3,
              water_ephemeral_perc: 23.5,
              land_perm_perc: 68.2,
              freq_mean: 14.7,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<DropletsIcon className="size-5 text-sky-500" />}
          backgroundColor="#0EA5E9"
        />
      }
      onDowloadButtonClick={() => {}}
      onInfoButtonClick={() => {}}
      onAddToMapButtonClick={() => {}}
    >
      <MoreInfoTooltip title={t("more-info.title")}>
        {t("more-info.description")}
      </MoreInfoTooltip>
      <RichText className="text-muted-foreground text-sm font-medium leading-5">
        {(tags) =>
          t.rich("description-2", {
            ...tags,
            trend_wetter_perc: 10,
            trend_drier_perc: 20,
            trend_stable_perc: 70,
          })
        }
      </RichText>
    </WidgetCard>
  );
};

export default WaterDynamics;
