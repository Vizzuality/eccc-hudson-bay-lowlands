import { WavesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";
import RichText from "@/components/ui/rich-text";
import MoreInfoTooltip from "@/containers/more-info-tooltip";
import { WidgetCard, WidgetCardIcon } from "@/containers/widgets/card";
import type { WidgetCardBaseProps } from "@/containers/widgets/types";

const FloodSusceptibility: FC<WidgetCardBaseProps> = ({ id }) => {
  const t = useTranslations("widgets.flood-susceptibility");

  return (
    <WidgetCard
      id={id}
      title={t("title")}
      description={
        <RichText>
          {(tags) =>
            t.rich("description", {
              ...tags,
              fsi_avg: 50,
              fsi_low_perc: 20,
              fsi_moderate_perc: 30,
              fsi_high_perc: 50,
            })
          }
        </RichText>
      }
      icon={
        <WidgetCardIcon
          icon={<WavesIcon className="size-5 text-red-500" />}
          backgroundColor="#EF4444"
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

export default FloodSusceptibility;
